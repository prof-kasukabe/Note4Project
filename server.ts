import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { INITIAL_DOCS } from './src/utils/seedData.ts';
import { DocItem } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

interface ClientInfo {
  ws: WebSocket;
  userId: string;
  name: string;
  color: string;
  docId: string;
  cursor?: { blockIndex?: number; text?: string };
}

const clients = new Map<WebSocket, ClientInfo>();

// Canonical Server-Side Document Store for instantaneous cross-device synchronization
let canonicalDocs: DocItem[] = [...INITIAL_DOCS];

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
    });
  });

  // Get canonical documents
  app.get('/api/docs', (_req, res) => {
    res.json({
      docs: canonicalDocs,
      timestamp: Date.now(),
    });
  });

  // Sync / bulk update documents across devices
  app.post('/api/docs/sync', (req, res) => {
    try {
      const { docs, mutation } = req.body;
      if (Array.isArray(docs)) {
        canonicalDocs = docs;
        broadcastAll({
          type: 'workspace_full_sync',
          docs: canonicalDocs,
          timestamp: Date.now(),
        });
      } else if (mutation) {
        if (mutation.type === 'upsert' && mutation.doc) {
          const idx = canonicalDocs.findIndex((d) => d.id === mutation.doc.id);
          if (idx >= 0) {
            canonicalDocs[idx] = { ...canonicalDocs[idx], ...mutation.doc };
          } else {
            canonicalDocs.unshift(mutation.doc);
          }
          broadcastAll({
            type: 'workspace_doc_updated',
            doc: mutation.doc,
          });
        } else if (mutation.type === 'delete' && mutation.docId) {
          canonicalDocs = canonicalDocs.filter(
            (d) => d.id !== mutation.docId && d.parentId !== mutation.docId
          );
          broadcastAll({
            type: 'workspace_doc_deleted',
            docId: mutation.docId,
          });
        }
      }
      res.json({ success: true, count: canonicalDocs.length });
    } catch (err) {
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
            }));
            break;
          }

          case 'join': {
            currentClient.userId = message.userId || currentClient.userId;
            currentClient.name = message.name || currentClient.name;
            currentClient.color = message.color || currentClient.color;
            currentClient.docId = message.docId || '';

            // Send presence list
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
            // Update canonical state
            const target = canonicalDocs.find((d) => d.id === message.docId);
            if (target && typeof message.change === 'string') {
              target.content = message.change;
              target.updatedAt = Date.now();
            }

            // Broadcast real-time delta immediately to other devices
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
              const idx = canonicalDocs.findIndex((d) => d.id === message.doc.id);
              if (idx >= 0) {
                canonicalDocs[idx] = { ...canonicalDocs[idx], ...message.doc };
              } else {
                canonicalDocs.unshift(message.doc);
              }

              // Broadcast update to all other devices
              broadcastAll({
                type: 'workspace_doc_updated',
                doc: message.doc,
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
