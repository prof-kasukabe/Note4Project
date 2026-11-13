export type DocStatus = 'not_started' | 'in_progress' | 'completed' | 'archived';
export type DocPriority = 'low' | 'medium' | 'high';
export type ThemeMode = 'light' | 'dark' | 'oled' | 'sepia';
export type Language = 'id' | 'en';
export type ActiveView = 'overview' | 'editor' | 'database_table' | 'database_board' | 'database_calendar' | 'analytics' | 'trash' | 'project_web' | 'project_mobile' | 'project_design' | 'evaluasi';

export interface EvaluationProject {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completedTasks: number;
  totalTasks: number;
  budget: number; // in IDR
  realization: number; // in IDR
  evaluationNote: string;
  linkedDocId?: string;
}

export interface EvaluationIssue {
  id: string;
  code: string;
  title: string;
  projectName: string;
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
  actionPlan: string;
  owner: string;
  targetDate: string;
  status: 'Terbuka' | 'Selesai';
}

export interface EvaluationLearning {
  id: string;
  tag: string;
  title: string;
  description: string;
}

export interface EvaluationData {
  period: string;
  updatedLabel: string;
  attentionHighlight: string;
  attentionSummary: string;
  weeklyFocus: string;
  projects: EvaluationProject[];
  issues: EvaluationIssue[];
  learnings: EvaluationLearning[];
}

export interface ContentBlock {
  id: string;
  type: 'paragraph' | 'h1' | 'h2' | 'h3' | 'todo' | 'bullet' | 'numbered' | 'quote' | 'code' | 'callout' | 'divider';
  content: string;
  checked?: boolean; // for todo
  language?: string; // for code block
}

export interface ProjectTask {
  id: string;
  title: string;
  assignee: string;
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
  dueDate: string;
  completed: boolean;
}

export interface ProjectDiscussion {
  id: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
}

export interface ProjectToolLink {
  id: string;
  name: string;
  description: string;
  url: string;
}

export interface ProjectGoalItem {
  id: string;
  text: string;
  done?: boolean;
}

export interface ProjectDocLink {
  id: string;
  title: string;
  source: string;
  updatedLabel: string;
  category: string;
  description?: string;
  linkedDocId?: string;
}

export interface ProjectDesignSwatch {
  id: string;
  name: string;
  hex: string;
  role: string;
}

export interface ProjectMobileFeature {
  id: string;
  name: string;
  schedule: string;
  streak: number;
  doneToday: boolean;
  reminderOn: boolean;
}

export interface ProjectWebSection {
  id: string;
  title: string;
  subtitle: string;
  tag?: string;
}

export interface ProjectDetailData {
  categoryLabel?: string;
  tagline?: string;
  aboutText?: string;
  focusObjective?: string;
  ownerName?: string;
  collaboratorsText?: string;
  visibilityLabel?: string;
  deadlineLabel?: string;
  priorityLabel?: 'Tinggi' | 'Sedang' | 'Rendah';
  statusLabel: string;
  teamNote: string;
  baseCompletedTasks: number;
  baseTotalTasks: number;
  tasks: ProjectTask[];
  discussions: ProjectDiscussion[];
  toolLinks: ProjectToolLink[];
  goals?: ProjectGoalItem[];
  projectDocs?: ProjectDocLink[];
  designPalette?: ProjectDesignSwatch[];
  mobileFeatures?: ProjectMobileFeature[];
  webSections?: ProjectWebSection[];
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
  evaluationData?: EvaluationData;
  projectData?: ProjectDetailData;
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
