import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

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
  cursor?: { blockId: string; offset: number };
}

const clients = new Map<WebSocket, ClientInfo>();

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

  app.use(express.json({ limit: '20mb' }));

  // API endpoints
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      activePeers: clients.size,
    });
  });

  // Real-time WebSocket management
  wss.on('connection', (ws: WebSocket) => {
    let currentClient: ClientInfo = {
      ws,
      userId: `user_${Math.random().toString(36).substring(2, 9)}`,
      name: 'Collaborator',
      color: '#6366F1',
      docId: '',
    };
    clients.set(ws, currentClient);

    const broadcastToRoom = (docId: string, payload: unknown, excludeSelf = true) => {
      const data = JSON.stringify(payload);
      clients.forEach((client, clientWs) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          if (excludeSelf && clientWs === ws) return;
          if (client.docId === docId || !docId) {
            clientWs.send(data);
          }
        }
      });
    };

    const getRoomPresence = (docId: string) => {
      const list: Array<{ userId: string; name: string; color: string; docId: string }> = [];
      clients.forEach((c) => {
        if (c.docId === docId || !docId) {
          list.push({ userId: c.userId, name: c.name, color: c.color, docId: c.docId });
        }
      });
      return list;
    };

    ws.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        switch (message.type) {
          case 'join': {
            currentClient.userId = message.userId || currentClient.userId;
            currentClient.name = message.name || currentClient.name;
            currentClient.color = message.color || currentClient.color;
            currentClient.docId = message.docId || '';

            // Send presence list back to joiner
            ws.send(JSON.stringify({
              type: 'presence_list',
              docId: currentClient.docId,
              users: getRoomPresence(currentClient.docId),
            }));

            // Broadcast join to others in doc
            broadcastToRoom(currentClient.docId, {
              type: 'user_joined',
              user: {
                userId: currentClient.userId,
                name: currentClient.name,
                color: currentClient.color,
                docId: currentClient.docId,
              },
            });
            break;
          }

          case 'leave': {
            const oldDoc = currentClient.docId;
            currentClient.docId = '';
            broadcastToRoom(oldDoc, {
              type: 'user_left',
              userId: currentClient.userId,
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
            });
            break;
          }

          case 'doc_change': {
            // Broadcast document delta / block update to peers
            broadcastToRoom(message.docId, {
              type: 'doc_change',
              docId: message.docId,
              change: message.change,
              userId: currentClient.userId,
              timestamp: Date.now(),
            });
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
      const { docId, userId } = currentClient;
      clients.delete(ws);
      if (docId) {
        broadcastToRoom(docId, {
          type: 'user_left',
          userId,
        });
      }
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
