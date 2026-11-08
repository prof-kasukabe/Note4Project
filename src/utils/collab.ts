import { Collaborator, DocItem } from '../types';

export interface CollabEventCallbacks {
  onPresenceChange?: (users: Collaborator[]) => void;
  onDocChange?: (docId: string, change: unknown, userId: string) => void;
  onCursorChange?: (userId: string, name: string, color: string, cursor: { blockIndex?: number; text?: string }) => void;
  onStatusChange?: (connected: boolean) => void;
  onWorkspaceSync?: (docs: DocItem[]) => void;
  onDocUpdated?: (doc: DocItem, userId?: string) => void;
  onDocDeleted?: (docId: string, userId?: string) => void;
}

export class CollabManager {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private callbacks: CollabEventCallbacks = {};
  private currentDocId = '';
  private userProfile: { userId: string; name: string; color: string };
  private presenceList: Collaborator[] = [];

  constructor(userProfile: { userId: string; name: string; color: string }) {
    this.userProfile = userProfile;
    this.connect();
  }

  public setCallbacks(cbs: CollabEventCallbacks) {
    this.callbacks = { ...this.callbacks, ...cbs };
  }

  public setDoc(docId: string) {
    this.currentDocId = docId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'join',
        docId,
        userId: this.userProfile.userId,
        name: this.userProfile.name,
        color: this.userProfile.color,
      }));
    }
  }

  public requestInitialSync() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'init_sync' }));
    }
  }

  public sendDocChange(docId: string, change: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'doc_change',
        docId,
        change,
      }));
    }
  }

  public sendDocUpsert(doc: DocItem) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'doc_upsert',
        doc,
      }));
    }
  }

  public sendDocDelete(docId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'doc_delete',
        docId,
      }));
    }
  }

  public sendCursorMove(cursor: { blockIndex?: number; text?: string }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'cursor_move',
        cursor,
      }));
    }
  }

  private connect() {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.callbacks.onStatusChange?.(true);

        // Join current document room and request full canonical sync
        this.ws?.send(JSON.stringify({
          type: 'join',
          docId: this.currentDocId,
          userId: this.userProfile.userId,
          name: this.userProfile.name,
          color: this.userProfile.color,
        }));

        this.requestInitialSync();

        // Start ping heartbeat
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = window.setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'workspace_full_sync':
              if (Array.isArray(msg.docs)) {
                this.callbacks.onWorkspaceSync?.(msg.docs);
              }
              if (Array.isArray(msg.presence)) {
                this.presenceList = msg.presence;
                this.callbacks.onPresenceChange?.(this.presenceList);
              }
              break;

            case 'workspace_doc_updated':
              if (msg.doc && msg.userId !== this.userProfile.userId) {
                this.callbacks.onDocUpdated?.(msg.doc, msg.userId);
              }
              break;

            case 'workspace_doc_deleted':
              if (msg.docId && msg.userId !== this.userProfile.userId) {
                this.callbacks.onDocDeleted?.(msg.docId, msg.userId);
              }
              break;

            case 'presence_list':
              this.presenceList = msg.users || [];
              this.callbacks.onPresenceChange?.(this.presenceList);
              break;

            case 'user_joined':
              if (msg.user && !this.presenceList.some(u => u.userId === msg.user.userId)) {
                this.presenceList.push(msg.user);
                this.callbacks.onPresenceChange?.([...this.presenceList]);
              }
              break;

            case 'user_left':
              this.presenceList = this.presenceList.filter(u => u.userId !== msg.userId);
              this.callbacks.onPresenceChange?.([...this.presenceList]);
              break;

            case 'doc_change':
              if (msg.userId !== this.userProfile.userId) {
                this.callbacks.onDocChange?.(msg.docId, msg.change, msg.userId);
              }
              break;

            case 'cursor_update':
              if (msg.userId !== this.userProfile.userId) {
                this.callbacks.onCursorChange?.(msg.userId, msg.name, msg.color, msg.cursor);
              }
              break;
          }
        } catch (err) {
          console.error('WS message parse error:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.callbacks.onStatusChange?.(false);
        if (this.pingTimer) clearInterval(this.pingTimer);
        // Retry connection in 2.5 seconds
        if (!this.reconnectTimer) {
          this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 2500);
        }
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (e) {
      console.warn('WebSocket connection not supported or failed:', e);
    }
  }

  public disconnect() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
