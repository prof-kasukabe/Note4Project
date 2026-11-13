import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { INITIAL_DOCS } from './src/utils/seedData.ts';
import type { DocItem } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE_PATH = path.resolve(__dirname, 'workspace-db.json');

interface ClientInfo {
  ws: WebSocket;
  userId: string;
  name: string;
  color: string;
  docId: string;
  cursor?: { blockIndex?: number; text?: string };
}

const clients = new Map<WebSocket, ClientInfo>();

function normalizeServerDoc(doc: DocItem): DocItem {
  if (doc.id === '__workspace_evaluasi__') {
    return { ...doc, id: 'doc-workspace-evaluasi' };
  }
  return doc;
}

// Load persistent database from disk or initialize with default seed
function loadDatabaseFromDisk(): DocItem[] {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`> Loaded ${parsed.length} documents from persistent disk database`);
        return parsed.map(normalizeServerDoc);
      }
    }
  } catch (err) {
    console.error('Error loading database from disk:', err);
  }
  saveDatabaseToDisk(INITIAL_DOCS);
  return [...INITIAL_DOCS];
}

function saveDatabaseToDisk(docs: DocItem[]) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(docs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database to disk:', err);
  }
}

// Authoritative Database state
let canonicalDocs: DocItem[] = loadDatabaseFromDisk();
let databaseRevision = 1;
let lastDatabaseUpdate = Date.now();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    } catch {
      socket.destroy();
    }
  });

  app.use(express.json({ limit: '50mb' }));

  // Broadcast helper to all connected devices/clients
  const broadcastAll = (payload: unknown, excludeWs?: WebSocket) => {
    const data = JSON.stringify(payload);
    clients.forEach((_info, clientWs) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        if (excludeWs && clientWs === excludeWs) return;
        clientWs.send(data);
      }
    });
  };

  // Broadcast to peers in specific document room
  const broadcastToRoom = (docId: string, payload: unknown, excludeWs?: WebSocket) => {
    const data = JSON.stringify(payload);
    clients.forEach((client, clientWs) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        if (excludeWs && clientWs === excludeWs) return;
        if (client.docId === docId || !docId) {
          clientWs.send(data);
        }
      }
    });
  };

  const getPresenceList = () => {
    const list: Array<{ userId: string; name: string; color: string; docId: string }> = [];
    clients.forEach((c) => {
      list.push({ userId: c.userId, name: c.name, color: c.color, docId: c.docId });
    });
    return list;
  };

  // REST API Endpoints for cross-device sync & offline reconciliation
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      activePeers: clients.size,
      totalDocs: canonicalDocs.length,
      revision: databaseRevision,
      lastUpdated: lastDatabaseUpdate,
    });
  });

  // Get canonical documents
  app.get('/api/docs', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
      docs: canonicalDocs,
      revision: databaseRevision,
      lastUpdated: lastDatabaseUpdate,
    });
  });

  // Sync / bulk update documents across devices
  app.post('/api/docs/sync', (req, res) => {
    try {
      const { docs, mutation, replaceFull } = req.body;
      let hasChanged = false;

      if (Array.isArray(docs)) {
        const sanitizedDocs = docs.map(normalizeServerDoc);
        if (replaceFull || sanitizedDocs.length > 0) {
          canonicalDocs = sanitizedDocs;
          hasChanged = true;
        } else {
          // Fallback map merge
          const map = new Map<string, DocItem>();
          canonicalDocs.forEach((d) => map.set(d.id, d));
          sanitizedDocs.forEach((incoming: DocItem) => {
            map.set(incoming.id, incoming);
          });
          canonicalDocs = Array.from(map.values());
          hasChanged = true;
        }
      } else if (mutation) {
        if (mutation.type === 'upsert' && mutation.doc) {
          const safeMutationDoc = normalizeServerDoc(mutation.doc);
          const idx = canonicalDocs.findIndex((d) => d.id === safeMutationDoc.id);
          if (idx >= 0) {
            canonicalDocs[idx] = { ...canonicalDocs[idx], ...safeMutationDoc, updatedAt: safeMutationDoc.updatedAt || Date.now() };
          } else {
            canonicalDocs.unshift({ ...safeMutationDoc, updatedAt: safeMutationDoc.updatedAt || Date.now() });
          }
          hasChanged = true;
          broadcastAll({
            type: 'workspace_doc_updated',
            doc: canonicalDocs[idx >= 0 ? idx : 0],
          });
        } else if (mutation.type === 'delete' && mutation.docId) {
          canonicalDocs = canonicalDocs.filter(
            (d) => d.id !== mutation.docId && d.parentId !== mutation.docId
          );
          hasChanged = true;
          broadcastAll({
            type: 'workspace_doc_deleted',
            docId: mutation.docId,
          });
        }
      }

      if (hasChanged) {
        databaseRevision++;
        lastDatabaseUpdate = Date.now();
        saveDatabaseToDisk(canonicalDocs);
        broadcastAll({
          type: 'workspace_full_sync',
          docs: canonicalDocs,
          revision: databaseRevision,
          lastUpdated: lastDatabaseUpdate,
        });
      }

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json({
        success: true,
        count: canonicalDocs.length,
        revision: databaseRevision,
        lastUpdated: lastDatabaseUpdate,
        docs: canonicalDocs,
      });
    } catch (err) {
      console.error('Sync error:', err);
      res.status(500).json({ error: 'Sync failed' });
    }
  });

  // Real-time WebSocket management
  wss.on('connection', (ws: WebSocket) => {
    const currentClient: ClientInfo = {
      ws,
      userId: `user_${Math.random().toString(36).substring(2, 9)}`,
      name: 'Collaborator',
      color: '#6366F1',
      docId: '',
    };
    clients.set(ws, currentClient);

    // Send immediate initial sync of all documents & presence to new device
    ws.send(JSON.stringify({
      type: 'workspace_full_sync',
      docs: canonicalDocs,
      revision: databaseRevision,
      presence: getPresenceList(),
    }));

    ws.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        switch (message.type) {
          case 'init_sync': {
            ws.send(JSON.stringify({
              type: 'workspace_full_sync',
              docs: canonicalDocs,
              revision: databaseRevision,
            }));
            break;
          }

          case 'join': {
            currentClient.userId = message.userId || currentClient.userId;
            currentClient.name = message.name || currentClient.name;
            currentClient.color = message.color || currentClient.color;
            currentClient.docId = message.docId || '';

            broadcastAll({
              type: 'presence_list',
              users: getPresenceList(),
            });
            break;
          }

          case 'leave': {
            currentClient.docId = '';
            broadcastAll({
              type: 'presence_list',
              users: getPresenceList(),
            });
            break;
          }

          case 'cursor_move': {
            currentClient.cursor = message.cursor;
            broadcastToRoom(currentClient.docId, {
              type: 'cursor_update',
              userId: currentClient.userId,
              name: currentClient.name,
              color: currentClient.color,
              cursor: message.cursor,
            }, ws);
            break;
          }

          case 'doc_change': {
            const target = canonicalDocs.find((d) => d.id === message.docId);
            if (target && typeof message.change === 'string') {
              target.content = message.change;
              target.updatedAt = Date.now();
              databaseRevision++;
              lastDatabaseUpdate = Date.now();
              saveDatabaseToDisk(canonicalDocs);
            }

            broadcastAll({
              type: 'doc_change',
              docId: message.docId,
              change: message.change,
              userId: currentClient.userId,
              timestamp: Date.now(),
            }, ws);
            break;
          }

          case 'doc_upsert': {
            if (message.doc && message.doc.id) {
              const normalizedDoc = normalizeServerDoc(message.doc);
              const idx = canonicalDocs.findIndex((d) => d.id === normalizedDoc.id);
              if (idx >= 0) {
                canonicalDocs[idx] = { ...canonicalDocs[idx], ...normalizedDoc, updatedAt: Date.now() };
              } else {
                canonicalDocs.unshift({ ...normalizedDoc, updatedAt: Date.now() });
              }

              databaseRevision++;
              lastDatabaseUpdate = Date.now();
              saveDatabaseToDisk(canonicalDocs);

              broadcastAll({
                type: 'workspace_doc_updated',
                doc: canonicalDocs[idx >= 0 ? idx : 0],
                userId: currentClient.userId,
              }, ws);
            }
            break;
          }

          case 'doc_delete': {
            if (message.docId) {
              canonicalDocs = canonicalDocs.filter(
                (d) => d.id !== message.docId && d.parentId !== message.docId
              );
              databaseRevision++;
              lastDatabaseUpdate = Date.now();
              saveDatabaseToDisk(canonicalDocs);

              broadcastAll({
                type: 'workspace_doc_deleted',
                docId: message.docId,
                userId: currentClient.userId,
              }, ws);
            }
            break;
          }

          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          }
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      broadcastAll({
        type: 'presence_list',
        users: getPresenceList(),
      });
    });
  });

  // Setup Vite middleware in dev or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`> Noverse Workspace server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
