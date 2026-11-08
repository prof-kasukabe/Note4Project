import { DocItem } from '../types';

const STORAGE_KEY_DOCS = 'noverse_docs_v1';
const STORAGE_KEY_ACTIVE = 'noverse_active_doc_v1';
const STORAGE_KEY_THEME = 'noverse_theme_v1';
const STORAGE_KEY_LANG = 'noverse_lang_v1';
const STORAGE_KEY_QUEUE = 'noverse_sync_queue_v1';
const STORAGE_KEY_USER = 'noverse_user_profile_v1';

export interface PendingMutation {
  id: string;
  type: 'upsert' | 'delete';
  docId: string;
  data?: Partial<DocItem>;
  timestamp: number;
}

// Cross-tab broadcast channel for local multi-tab sync
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('noverse_cross_tab_sync') 
  : null;

export function loadStoredDocs(): DocItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading stored docs:', err);
    return null;
  }
}

export function saveStoredDocs(docs: DocItem[], notifyOthers = true): void {
  try {
    localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(docs));
    if (notifyOthers && syncChannel) {
      syncChannel.postMessage({ type: 'docs_updated', timestamp: Date.now() });
    }
  } catch (err) {
    console.error('Error saving docs to localStorage:', err);
  }
}

export function loadActiveDocId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE);
  } catch {
    return null;
  }
}

export function saveActiveDocId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE, id);
  } catch {}
}

export function loadSyncQueue(): PendingMutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToSyncQueue(mutation: Omit<PendingMutation, 'id' | 'timestamp'>): void {
  try {
    const queue = loadSyncQueue();
    queue.push({
      ...mutation,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
  } catch {}
}

export function clearSyncQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_QUEUE);
  } catch {}
}

export function subscribeToCrossTab(callback: (msg: unknown) => void): () => void {
  if (!syncChannel) return () => {};
  const handler = (e: MessageEvent) => callback(e.data);
  syncChannel.addEventListener('message', handler);
  return () => syncChannel.removeEventListener('message', handler);
}

export function getUserProfile(): { userId: string; name: string; color: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw);
  } catch {}

  const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];
  const profile = {
    userId: 'u_' + Math.random().toString(36).substring(2, 8),
    name: 'Anda (' + (navigator.language.startsWith('id') ? 'Pengguna' : 'Member') + ')',
    color: colors[Math.floor(Math.random() * colors.length)],
  };
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
  } catch {}
  return profile;
}
