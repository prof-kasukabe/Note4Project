export type DocStatus = 'not_started' | 'in_progress' | 'completed' | 'archived';
export type DocPriority = 'low' | 'medium' | 'high';
export type ThemeMode = 'light' | 'dark' | 'oled' | 'sepia';
export type Language = 'id' | 'en';
export type ActiveView = 'editor' | 'database_table' | 'database_board' | 'database_calendar' | 'analytics' | 'trash';

export interface ContentBlock {
  id: string;
  type: 'paragraph' | 'h1' | 'h2' | 'h3' | 'todo' | 'bullet' | 'numbered' | 'quote' | 'code' | 'callout' | 'divider';
  content: string;
  checked?: boolean; // for todo
  language?: string; // for code block
}

export interface DocItem {
  id: string;
  title: string;
  icon: string;
  coverImage?: string;
  parentId: string | null;
  content: string; // raw markdown
  blocks?: ContentBlock[];
  tags: string[];
  status: DocStatus;
  priority: DocPriority;
  deadline?: string; // YYYY-MM-DD or ISO
  reminderTime?: string; // ISO string
  reminderNotified?: boolean;
  isEncrypted?: boolean;
  encryptedPayload?: {
    ciphertext: string;
    iv: string;
    salt: string;
  };
  createdAt: number;
  updatedAt?: number;
  isFavorite?: boolean;
  isDatabase?: boolean; // whether this doc acts as a database container
  lastModifiedBy?: {
    userId: string;
    name: string;
    color: string;
    timestamp: number;
    action?: string;
  };
  statusHistory?: StatusChangeLog[];
}

export interface StatusChangeLog {
  id: string;
  fromStatus: DocStatus;
  toStatus: DocStatus;
  changedBy: {
    userId: string;
    name: string;
    color: string;
  };
  timestamp: number;
}

export interface Collaborator {
  userId: string;
  name: string;
  color: string;
  docId: string;
  cursor?: {
    blockIndex?: number;
    text?: string;
  };
}

export interface ReminderNotification {
  id: string;
  docId: string;
  title: string;
  scheduledTime: string;
  triggered: boolean;
  dismissed: boolean;
  priority: DocPriority;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: number;
}
