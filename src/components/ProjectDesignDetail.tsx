import React, { useState, useMemo } from 'react';
import {
  Star,
  Plus,
  Check,
  ArrowUpRight,
  Send,
  X,
  Palette,
  Pencil,
  Copy,
  Trash2,
  SlidersHorizontal,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  DocItem,
  DocStatus,
  DocPriority,
  ProjectTask,
  ProjectDiscussion,
  ProjectDetailData,
  ProjectGoalItem,
  ProjectDocLink,
  ProjectToolLink,
  ProjectDesignSwatch,
} from '../types';
import {
  DESIGN_PROJECT_DOC_ID,
  DEFAULT_DESIGN_PROJECT_DATA,
  createDefaultDesignProjectDoc,
  formatProjectDeadline,
  formatProjectDeadlineLong,
  buildProjectMarkdownContent,
} from '../utils/seedData';
import { formatTimeAgo } from '../utils/formatTime';
import {
  ProjectOverviewEditModal,
  ProjectTaskEditorModal,
  ProjectToolsEditorModal,
  ProjectDocEditorModal,
} from './ProjectEditModals';

interface ProjectDesignDetailProps {
  docs: DocItem[];
  userProfile: { userId: string; name: string; color: string };
  onSelectDoc: (id: string) => void;
  onSaveDesignDoc: (updatedDoc: DocItem) => void;
  onCreateDoc: (parentId?: string | null) => void;
}

const PRIORITY_TO_LABEL: Record<DocPriority, 'Tinggi' | 'Sedang' | 'Rendah'> = {
  high: 'Tinggi',
  medium: 'Sedang',
  low: 'Rendah',
};

const getBrandMonogram = (title: string): string => {
  const words = title
    .replace(/^identitas\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 'DS';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

export const ProjectDesignDetail: React.FC<ProjectDesignDetailProps> = ({
  docs,
  userProfile,
  onSelectDoc,
  onSaveDesignDoc,
  onCreateDoc,
}) => {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'tugas' | 'dokumen' | 'diskusi'>('ringkasan');

  const designDoc = useMemo(() => {
    return (
      docs.find((d) => d.id === DESIGN_PROJECT_DOC_ID) ||
      docs.find((d) => d.title?.toLowerCase().includes('kopi sore')) ||
      createDefaultDesignProjectDoc()
    );
  }, [docs]);

  const projectData: ProjectDetailData = useMemo(() => {
    const raw = designDoc.projectData;
    return {
      ...DEFAULT_DESIGN_PROJECT_DATA,
      ...(raw || {}),
      tasks: raw?.tasks ?? DEFAULT_DESIGN_PROJECT_DATA.tasks,
      discussions: raw?.discussions ?? DEFAULT_DESIGN_PROJECT_DATA.discussions,
      toolLinks: raw?.toolLinks ?? DEFAULT_DESIGN_PROJECT_DATA.toolLinks,
      goals: raw?.goals ?? DEFAULT_DESIGN_PROJECT_DATA.goals,
      projectDocs: raw?.projectDocs ?? DEFAULT_DESIGN_PROJECT_DATA.projectDocs,
      designPalette: raw?.designPalette ?? DEFAULT_DESIGN_PROJECT_DATA.designPalette,
    };
  }, [designDoc]);

  const tasks = projectData.tasks;
  const discussions = projectData.discussions;
  const toolLinks = projectData.toolLinks;
  const goals = projectData.goals || [];
  const projectDocs = projectData.projectDocs || [];
  const designPalette = projectData.designPalette || [];
  const isFavorite = designDoc.isFavorite ?? true;

  // Modals & local UI states
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [logoVariant, setLogoVariant] = useState<'color' | 'mono'>('color');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [isEditingPalette, setIsEditingPalette] = useState(false);
  const [newSwatchName, setNewSwatchName] = useState('');
  const [newSwatchHex, setNewSwatchHex] = useState('#567561');
  const [newSwatchRole, setNewSwatchRole] = useState('Aksen komponen');

  const [showToolsModal, setShowToolsModal] = useState(false);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

  const [showDocModal, setShowDocModal] = useState(false);
  const [editingProjectDoc, setEditingProjectDoc] = useState<ProjectDocLink | null>(null);

  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [draftAbout, setDraftAbout] = useState(projectData.aboutText || '');
  const [draftFocus, setDraftFocus] = useState(projectData.focusObjective || '');

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState(projectData.teamNote);

  const [newGoalText, setNewGoalText] = useState('');
  const [showAddGoal, setShowAddGoal] = useState(false);

  const [newComment, setNewComment] = useState('');

  // Dynamic progress
  const totalTasks = tasks.length + projectData.baseTotalTasks;
  const completedCount = tasks.filter((t) => t.completed).length + projectData.baseCompletedTasks;
  const progressPercent = totalTasks > 0 ? Math.min(100, Math.round((completedCount / totalTasks) * 100)) : 0;

  const persistProjectChange = (
    nextData: ProjectDetailData,
    actionText: string,
    extraDocFields?: Partial<DocItem>
  ) => {
    const now = Date.now();
    const nextTitle = extraDocFields?.title ?? designDoc.title ?? 'Identitas Kopi Sore';
    const nextDeadline =
      extraDocFields && 'deadline' in extraDocFields ? extraDocFields.deadline : designDoc.deadline;
    const updatedDoc: DocItem = {
      ...designDoc,
      ...extraDocFields,
      id: designDoc.id || DESIGN_PROJECT_DOC_ID,
      title: nextTitle,
      projectData: nextData,
      content: buildProjectMarkdownContent(nextTitle, designDoc.icon || '🎨', nextDeadline, nextData),
      updatedAt: now,
      lastModifiedBy: {
        userId: userProfile.userId,
        name: userProfile.name,
        color: userProfile.color,
        timestamp: now,
        action: actionText,
      },
    };
    onSaveDesignDoc(updatedDoc);
  };

  const handleToggleFavorite = () => {
    const nextFav = !isFavorite;
    persistProjectChange(
      projectData,
      nextFav
        ? `Menambahkan ${designDoc.title} ke favorit`
        : `Menghapus ${designDoc.title} dari favorit`,
      { isFavorite: nextFav }
    );
  };

  const handleCycleStatus = () => {
    const order: Array<{ status: DocStatus; label: string }> = [
      { status: 'in_progress', label: 'Dikerjakan' },
      { status: 'completed', label: 'Selesai' },
      { status: 'not_started', label: 'Belum mulai' },
    ];
    const currentIdx = order.findIndex((o) => o.label === projectData.statusLabel);
    const next = order[(currentIdx + 1) % order.length];
    persistProjectChange(
      { ...projectData, statusLabel: next.label },
      `Mengubah status ${designDoc.title} menjadi ${next.label}`,
      { status: next.status }
    );
  };

  const handleSaveOverview = (payload: {
    title: string;
    status: DocStatus;
    priority: DocPriority;
    deadline?: string;
    projectDataPatch: Partial<ProjectDetailData>;
  }) => {
    const nextData: ProjectDetailData = {
      ...projectData,
      ...payload.projectDataPatch,
      deadlineLabel: payload.deadline
        ? formatProjectDeadline(payload.deadline, projectData.deadlineLabel)
        : projectData.deadlineLabel,
    };
    persistProjectChange(nextData, `Memperbarui detail & fokus ${payload.title}`, {
      title: payload.title,
      status: payload.status,
      priority: payload.priority,
      deadline: payload.deadline,
      tags: payload.projectDataPatch.categoryLabel
        ? [payload.projectDataPatch.categoryLabel.split('·')[0].trim(), 'Desain']
        : designDoc.tags,
    });
  };

  const handleSaveAbout = () => {
    persistProjectChange(
      {
        ...projectData,
        aboutText: draftAbout.trim() || projectData.aboutText,
        focusObjective: draftFocus.trim(),
      },
      `Memperbarui deskripsi & fokus ${designDoc.title}`
    );
    setIsEditingAbout(false);
  };

  const handleToggleTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    persistProjectChange(
      { ...projectData, tasks: updatedTasks },
      `Memperbarui tugas "${target?.title || designDoc.title}"`
    );
  };

  const handleSaveTask = (payload: {
    id?: string;
    title: string;
    assignee: string;
    priority: 'Tinggi' | 'Sedang' | 'Rendah';
    dueDate: string;
  }) => {
    if (payload.id) {
      const updated = tasks.map((t) =>
        t.id === payload.id
          ? {
              ...t,
              title: payload.title,
              assignee: payload.assignee,
              priority: payload.priority,
              dueDate: payload.dueDate,
            }
          : t
      );
      persistProjectChange({ ...projectData, tasks: updated }, `Menyunting tugas "${payload.title}"`);
    } else {
      const created: ProjectTask = {
        id: `task-ks-${Date.now()}`,
        title: payload.title,
        assignee: payload.assignee,
        priority: payload.priority,
        dueDate: payload.dueDate,
        completed: false,
      };
      persistProjectChange(
        { ...projectData, tasks: [created, ...tasks] },
        `Menambahkan tugas "${created.title}" pada ${designDoc.title}`
      );
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    persistProjectChange(
      { ...projectData, tasks: tasks.filter((t) => t.id !== taskId) },
      `Menghapus tugas "${target?.title || ''}"`
    );
  };

  const handleSaveTools = (nextTools: ProjectToolLink[]) => {
    persistProjectChange(
      { ...projectData, toolLinks: nextTools },
      `Memperbarui alat kerja ${designDoc.title}`
    );
  };

  const handleSaveProjectDoc = (item: ProjectDocLink) => {
    const exists = projectDocs.some((d) => d.id === item.id);
    const updated = exists
      ? projectDocs.map((d) => (d.id === item.id ? item : d))
      : [...projectDocs, item];
    persistProjectChange(
      { ...projectData, projectDocs: updated },
      `Memperbarui dokumen proyek "${item.title}"`
    );
  };

  const handleDeleteProjectDoc = (id: string) => {
    persistProjectChange(
      { ...projectData, projectDocs: projectDocs.filter((d) => d.id !== id) },
      `Menghapus item dokumen proyek pada ${designDoc.title}`
    );
  };

  const handleToggleGoal = (goalId: string) => {
    const nextGoals = goals.map((g) => (g.id === goalId ? { ...g, done: !g.done } : g));
    persistProjectChange(
      { ...projectData, goals: nextGoals },
      `Memperbarui target pada ${designDoc.title}`
    );
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    const item: ProjectGoalItem = {
      id: `goal-ks-${Date.now()}`,
      text: newGoalText.trim(),
      done: false,
    };
    persistProjectChange(
      { ...projectData, goals: [...goals, item] },
      `Menambahkan target "${item.text}"`
    );
    setNewGoalText('');
    setShowAddGoal(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    persistProjectChange(
      { ...projectData, goals: goals.filter((g) => g.id !== goalId) },
      `Menghapus target pada ${designDoc.title}`
    );
  };

  const handleSaveTeamNote = () => {
    const cleaned = draftNote.trim();
    if (cleaned) {
      persistProjectChange(
        { ...projectData, teamNote: cleaned },
        `Memperbarui catatan tim ${designDoc.title}`
      );
    }
    setIsEditingNote(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment: ProjectDiscussion = {
      id: `disc-ks-${Date.now()}`,
      userName: userProfile.name || 'Nadia Putri',
      userColor: userProfile.color || '#EC4899',
      text: newComment.trim(),
      timestamp: Date.now(),
    };
    persistProjectChange(
      { ...projectData, discussions: [...discussions, comment] },
      `Mengirim pesan diskusi di ${designDoc.title}`
    );
    setNewComment('');
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const handleUpdateSwatch = (id: string, patch: Partial<ProjectDesignSwatch>) => {
    const nextPalette = designPalette.map((s) => (s.id === id ? { ...s, ...patch } : s));
    persistProjectChange(
      { ...projectData, designPalette: nextPalette },
      `Memperbarui palet warna ${designDoc.title}`
    );
  };

  const handleAddSwatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSwatchName.trim()) return;
    const swatch: ProjectDesignSwatch = {
      id: `pal-${Date.now()}`,
      name: newSwatchName.trim(),
      hex: newSwatchHex,
      role: newSwatchRole.trim() || 'Token warna',
    };
    persistProjectChange(
      { ...projectData, designPalette: [...designPalette, swatch] },
      `Menambahkan warna "${swatch.name}" ke sistem desain`
    );
    setNewSwatchName('');
  };

  const handleDeleteSwatch = (id: string) => {
    persistProjectChange(
      { ...projectData, designPalette: designPalette.filter((s) => s.id !== id) },
      `Menghapus token warna pada ${designDoc.title}`
    );
  };

  const statusBadgeColors =
    projectData.statusLabel === 'Selesai'
      ? 'bg-[#ECF2ED] dark:bg-[#1D2B22] text-[#567561] dark:text-[#7DA88C]'
      : projectData.statusLabel === 'Belum mulai'
      ? 'bg-[#F1F1ED] dark:bg-[#232320] text-[#777973] dark:text-[#A1A29B]'
      : 'bg-[#EBF0F5] dark:bg-[#1B252E] text-[#5D748B] dark:text-[#88A6C4]';

  const deadlineShort = formatProjectDeadline(designDoc.deadline, projectData.deadlineLabel || '20 Nov 2026');
  const deadlineLong = formatProjectDeadlineLong(designDoc.deadline, '20 November 2026');
  const priorityLabel = projectData.priorityLabel || PRIORITY_TO_LABEL[designDoc.priority || 'medium'];
  const monogram = getBrandMonogram(designDoc.title || 'KS');
  const accentColor = designPalette[1]?.hex || designPalette[0]?.hex || '#8B6935';
  const primaryColor = designPalette[0]?.hex || '#282925';

  return (
    <div className="flex-1 overflow-y-auto h-full bg-white dark:bg-[#121211] select-text">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-8 py-8 md:py-10 flex flex-col gap-7">
        {/* ========================================================= */}
        {/* 1. Judul proyek (Header)                                  */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium tracking-wide text-[#777973] dark:text-[#A1A29B] uppercase">
              {projectData.categoryLabel || 'DESAIN · IDENTITAS MEREK'}
            </span>

            <h1 className="text-[28px] sm:text-[34px] font-normal leading-[1.3] text-[#282925] dark:text-[#EDEDE8] tracking-tight">
              {designDoc.title}
            </h1>

            <p className="text-[13px] text-[#777973] dark:text-[#A1A29B] max-w-[620px] leading-relaxed">
              {projectData.tagline || 'Identitas yang hangat untuk menemani setiap cerita di sore hari.'}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={handleCycleStatus}
                title="Klik untuk mengubah status proyek"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-medium cursor-pointer transition-opacity hover:opacity-85 ${statusBadgeColors}`}
              >
                <span>• {projectData.statusLabel}</span>
              </button>

              <span className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                {isFavorite ? 'Ditambahkan ke favorit' : 'Tersimpan di daftar proyek'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 md:pt-6">
            <button
              onClick={() => setShowOverviewModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-[5px] border border-[#E6E7E1] dark:border-[#2B2B28] bg-white dark:bg-[#1E1E1C] text-[#282925] dark:text-[#EDEDE8] text-xs font-medium hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors cursor-pointer"
            >
              <SlidersHorizontal size={13} />
              <span>Edit Desain</span>
            </button>

            <button
              onClick={handleToggleFavorite}
              className="flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-[5px] border border-[#E6E7E1] dark:border-[#2B2B28] bg-white dark:bg-[#1E1E1C] text-[#282925] dark:text-[#EDEDE8] text-xs font-medium hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors cursor-pointer"
            >
              <Star
                size={13}
                className={
                  isFavorite
                    ? 'fill-[#282925] text-[#282925] dark:fill-[#EDEDE8] dark:text-[#EDEDE8]'
                    : 'text-[#777973]'
                }
              />
              <span>{isFavorite ? 'Favorit' : '☆ Favorit'}</span>
            </button>

            <button
              onClick={() => setShowDesignModal(true)}
              className="flex items-center justify-center gap-2 px-4 h-9 rounded-[5px] bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#282925] text-xs font-medium hover:bg-[#3D3E3A] dark:hover:bg-white transition-colors shadow-xs cursor-pointer"
            >
              <span>Buka desain</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. Ringkasan progres (4 KPI columns + sage bar)           */}
        {/* ========================================================= */}
        <div className="border-y border-[#E6E7E1] dark:border-[#2B2B28] py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#E6E7E1] dark:divide-[#2B2B28]">
            <div className="flex flex-col gap-1.5 md:pr-4">
              <span className="text-xs text-[#777973] dark:text-[#A1A29B]">Progres proyek</span>
              <div className="flex items-center gap-3">
                <span className="text-[26px] font-normal leading-none text-[#282925] dark:text-[#EDEDE8]">
                  {progressPercent}%
                </span>
                <div className="flex-1 max-w-[180px] h-1 bg-[#E6E7E1] dark:bg-[#2B2B28] rounded-[2px] overflow-hidden">
                  <div
                    className="h-full bg-[#87A88E] rounded-[2px] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                {completedCount} dari {totalTasks} tugas
              </span>
            </div>

            <div className="flex flex-col gap-1.5 pt-4 md:pt-0 md:px-6">
              <span className="text-xs text-[#777973] dark:text-[#A1A29B]">Tenggat proyek</span>
              <span className="text-[17px] font-normal text-[#282925] dark:text-[#EDEDE8]">
                {deadlineShort}
              </span>
              <span className="text-[11px] text-[#777973] dark:text-[#A1A29B] mt-auto">
                Target penyelesaian
              </span>
            </div>

            <div className="flex flex-col gap-1.5 pt-4 md:pt-0 md:px-6">
              <span className="text-xs text-[#777973] dark:text-[#A1A29B]">Kolaborator</span>
              <span className="text-[17px] font-normal text-[#282925] dark:text-[#EDEDE8] truncate">
                {projectData.collaboratorsText || 'Nadia, Salsa'}
              </span>
              <span className="text-[11px] text-[#777973] dark:text-[#A1A29B] mt-auto">
                Bekerja bersama
              </span>
            </div>

            <div className="flex flex-col gap-1.5 pt-4 md:pt-0 md:pl-6">
              <span className="text-xs text-[#777973] dark:text-[#A1A29B]">Prioritas</span>
              <span className="text-[17px] font-normal text-[#282925] dark:text-[#EDEDE8]">
                {priorityLabel}
              </span>
              <span className="text-[11px] text-[#777973] dark:text-[#A1A29B] mt-auto">
                Tetap sesuai rencana
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. Navigasi proyek (Tabs)                                 */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between border-b border-[#E6E7E1] dark:border-[#2B2B28] -mt-1">
          <div className="flex items-center gap-8 sm:gap-12 text-[13px] overflow-x-auto">
            <button
              onClick={() => setActiveTab('ringkasan')}
              className={`pb-3 transition-colors relative whitespace-nowrap cursor-pointer ${
                activeTab === 'ringkasan'
                  ? 'text-[#282925] dark:text-[#EDEDE8] font-semibold'
                  : 'text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] font-normal'
              }`}
            >
              Ringkasan
              {activeTab === 'ringkasan' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#282925] dark:bg-[#EDEDE8]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('tugas')}
              className={`pb-3 transition-colors relative whitespace-nowrap cursor-pointer ${
                activeTab === 'tugas'
                  ? 'text-[#282925] dark:text-[#EDEDE8] font-semibold'
                  : 'text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] font-normal'
              }`}
            >
              Papan tugas
              {activeTab === 'tugas' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#282925] dark:bg-[#EDEDE8]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('dokumen')}
              className={`pb-3 transition-colors relative whitespace-nowrap cursor-pointer ${
                activeTab === 'dokumen'
                  ? 'text-[#282925] dark:text-[#EDEDE8] font-semibold'
                  : 'text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] font-normal'
              }`}
            >
              Dokumen {projectDocs.length}
              {activeTab === 'dokumen' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#282925] dark:bg-[#EDEDE8]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('diskusi')}
              className={`pb-3 transition-colors relative whitespace-nowrap cursor-pointer ${
                activeTab === 'diskusi'
                  ? 'text-[#282925] dark:text-[#EDEDE8] font-semibold'
                  : 'text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] font-normal'
              }`}
            >
              Diskusi{discussions.length > 0 ? ` (${discussions.length})` : ''}
              {activeTab === 'diskusi' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#282925] dark:bg-[#EDEDE8]" />
              )}
            </button>
          </div>

          <div className="hidden sm:block text-[11px] text-[#777973] dark:text-[#A1A29B] pb-3 shrink-0">
            Terakhir diperbarui hari ini
            {designDoc.lastModifiedBy?.name ? ` · ${designDoc.lastModifiedBy.name}` : ''}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. Tab Content: Ringkasan                                 */}
        {/* ========================================================= */}
        {activeTab === 'ringkasan' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 flex flex-col gap-9">
              {/* Tentang proyek & Fokus Desain */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[17px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    Tentang proyek &amp; Fokus desain
                  </h2>
                  {!isEditingAbout && (
                    <button
                      onClick={() => {
                        setDraftAbout(projectData.aboutText || '');
                        setDraftFocus(projectData.focusObjective || '');
                        setIsEditingAbout(true);
                      }}
                      className="text-[11px] text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil size={11} />
                      <span>Sunting fokus</span>
                    </button>
                  )}
                </div>

                {isEditingAbout ? (
                  <div className="p-3.5 rounded-[6px] border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#1B1B18] flex flex-col gap-2.5">
                    <div>
                      <label className="block text-[10px] font-medium text-[#777973] mb-1">
                        Fokus Desain / Sistem Visual yang Mau Dibuat
                      </label>
                      <input
                        type="text"
                        value={draftFocus}
                        onChange={(e) => setDraftFocus(e.target.value)}
                        placeholder="Misal: Sistem desain UI web & kemasan produk ramah lingkungan"
                        className="w-full px-2.5 py-1.5 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#121211] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-[#777973] mb-1">
                        Penjelasan Proyek
                      </label>
                      <textarea
                        rows={3}
                        value={draftAbout}
                        onChange={(e) => setDraftAbout(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#121211] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingAbout(false)}
                        className="px-2.5 py-1 text-[11px] text-[#777973] cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAbout}
                        className="px-3 py-1 rounded bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#282925] text-[11px] font-medium cursor-pointer"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {projectData.focusObjective && (
                      <div className="px-3.5 py-2.5 rounded-[5px] bg-[#EEF2EB]/70 dark:bg-[#1E2720]/70 border border-[#DCE4D8] dark:border-[#2D3930] flex items-start gap-2">
                        <Target size={14} className="text-[#567561] dark:text-[#8CA796] shrink-0 mt-0.5" />
                        <div className="text-xs text-[#282925] dark:text-[#EDEDE8] leading-relaxed">
                          <span className="font-medium text-[#567561] dark:text-[#8CA796]">Fokus desain: </span>
                          {projectData.focusObjective}
                        </div>
                      </div>
                    )}
                    <p className="text-[13px] text-[#777973] dark:text-[#A1A29B] leading-[1.55]">
                      {projectData.aboutText}
                    </p>
                  </>
                )}
              </div>

              {/* Tugas terdekat */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-[17px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                      Tugas terdekat
                    </h2>
                    <span className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                      {completedCount}/{totalTasks} selesai
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setEditingTask(null);
                      setShowTaskModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 h-[34px] rounded-[4px] border border-[#E6E7E1] dark:border-[#2B2B28] bg-white dark:bg-[#1E1E1C] text-[11px] font-medium text-[#282925] dark:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Tambah tugas</span>
                  </button>
                </div>

                <div className="flex flex-col divide-y divide-[#E6E7E1] dark:divide-[#2B2B28] border-t border-b border-[#E6E7E1] dark:border-[#2B2B28]">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="min-h-[60px] py-3 flex items-center justify-between gap-4 hover:bg-[#FAFAF8] dark:hover:bg-[#181816] px-1 rounded transition-colors group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          aria-label={`Tandai tugas ${task.title}`}
                          className={`w-[15px] h-[15px] rounded-[3px] flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            task.completed
                              ? 'bg-[#89A58F] text-white border-0'
                              : 'bg-white dark:bg-[#1E1E1C] border border-[#C8CBC1] dark:border-[#444] hover:border-[#89A58F]'
                          }`}
                        >
                          {task.completed && <Check size={11} strokeWidth={3} />}
                        </button>

                        <div
                          onClick={() => {
                            setEditingTask(task);
                            setShowTaskModal(true);
                          }}
                          className="flex flex-col min-w-0 cursor-pointer"
                        >
                          <span
                            className={`text-xs font-medium truncate group-hover:underline ${
                              task.completed
                                ? 'line-through font-normal text-[#777973] dark:text-[#777973]'
                                : 'text-[#282925] dark:text-[#EDEDE8]'
                            }`}
                          >
                            {task.title}
                          </span>
                          <span className="text-[10px] text-[#777973] dark:text-[#A1A29B] mt-0.5">
                            {task.assignee}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-8 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTask(task);
                            setShowTaskModal(true);
                          }}
                          title="Sunting tugas"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#777973] hover:text-[#282925] dark:hover:text-white transition-opacity cursor-pointer"
                        >
                          <Pencil size={11} />
                        </button>

                        {!task.completed ? (
                          <div
                            className={`w-[65px] h-[22px] rounded-[4px] flex items-center justify-center text-[10px] font-normal ${
                              task.priority === 'Tinggi'
                                ? 'bg-[#F5EEE2] dark:bg-[#2D2418] text-[#8B6935] dark:text-[#D1A667]'
                                : 'bg-[#F1F2ED] dark:bg-[#22241F] text-[#777973] dark:text-[#A1A29B]'
                            }`}
                          >
                            {task.priority}
                          </div>
                        ) : (
                          <div className="w-[65px]" />
                        )}

                        <span
                          className={`text-[11px] w-14 text-right ${
                            task.completed
                              ? 'text-[#567561] dark:text-[#7DA88C]'
                              : 'text-[#777973] dark:text-[#A1A29B]'
                          }`}
                        >
                          {task.completed ? 'Selesai' : task.dueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveTab('tugas')}
                  className="text-[11px] text-[#777973] dark:text-[#A1A29B] hover:text-[#282925] dark:hover:text-[#EDEDE8] flex items-center gap-1 pt-0.5 self-start transition-colors cursor-pointer"
                >
                  <span>Lihat semua tugas ↗</span>
                </button>
              </div>

              {/* Dokumen proyek */}
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-[17px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    Dokumen proyek
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setEditingProjectDoc(null);
                        setShowDocModal(true);
                      }}
                      className="text-[11px] text-[#567561] dark:text-[#8CA796] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={11} />
                      <span>Tambah</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('dokumen')}
                      className="text-[11px] text-[#777973] dark:text-[#A1A29B] hover:text-[#282925] dark:hover:text-[#EDEDE8] transition-colors cursor-pointer"
                    >
                      Lihat semua ({projectDocs.length}) ↗
                    </button>
                  </div>
                </div>

                <div className="flex flex-col divide-y divide-[#E6E7E1] dark:divide-[#2B2B28] border-b border-[#E6E7E1] dark:border-[#2B2B28]">
                  {projectDocs.map((pdoc) => (
                    <div
                      key={pdoc.id}
                      onClick={() => {
                        if (pdoc.linkedDocId) {
                          onSelectDoc(pdoc.linkedDocId);
                        } else {
                          setEditingProjectDoc(pdoc);
                          setShowDocModal(true);
                        }
                      }}
                      className="h-[55px] flex items-center justify-between gap-4 group cursor-pointer hover:bg-[#FAFAF8] dark:hover:bg-[#181816] px-1 rounded transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-[30px] h-[35px] rounded-[4px] bg-[#F2F3EE] dark:bg-[#252822] flex items-center justify-center text-[#777973] text-sm shrink-0">
                          ↗
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] group-hover:underline truncate">
                            {pdoc.title}
                          </span>
                          <span className="text-[10px] text-[#777973] dark:text-[#A1A29B] truncate">
                            {pdoc.source} · {pdoc.updatedLabel}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProjectDoc(pdoc);
                            setShowDocModal(true);
                          }}
                          title="Sunting dokumen"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#777973] hover:text-[#282925] dark:hover:text-white transition-opacity cursor-pointer"
                        >
                          <Pencil size={11} />
                        </button>
                        <span className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                          {pdoc.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Catatan untuk tim */}
              <div className="bg-[#F8F8F6] dark:bg-[#1B1B18] rounded-[6px] p-4 flex flex-col gap-1.5 border border-[#EAEAE5] dark:border-[#2B2B28]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    Catatan untuk tim
                  </span>
                  {!isEditingNote && (
                    <button
                      onClick={() => {
                        setDraftNote(projectData.teamNote);
                        setIsEditingNote(true);
                      }}
                      className="text-[10px] text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil size={10} />
                      <span>Sunting</span>
                    </button>
                  )}
                </div>

                {isEditingNote ? (
                  <div className="flex flex-col gap-2 pt-1">
                    <textarea
                      rows={2}
                      value={draftNote}
                      onChange={(e) => setDraftNote(e.target.value)}
                      className="w-full px-2.5 py-2 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#121211] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingNote(false)}
                        className="px-2.5 py-1 text-[11px] text-[#777973] cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveTeamNote}
                        className="px-3 py-1 rounded bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#282925] text-[11px] font-medium cursor-pointer"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#777973] dark:text-[#A1A29B] leading-relaxed">
                    {projectData.teamNote}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-4 lg:border-l lg:border-[#E6E7E1] dark:lg:border-[#2B2B28] lg:pl-6 flex flex-col gap-8">
              {/* Detail proyek */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    Detail proyek
                  </h3>
                  <button
                    onClick={() => setShowOverviewModal(true)}
                    className="text-[10px] text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil size={10} />
                    <span>Ubah</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3.5 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777973] dark:text-[#A1A29B]">Kategori</span>
                    <span className="font-medium text-[#282925] dark:text-[#EDEDE8] text-right">
                      {projectData.categoryLabel?.split('·')[0]?.trim() || 'Desain identitas'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777973] dark:text-[#A1A29B]">Penanggung jawab</span>
                    <span className="font-medium text-[#282925] dark:text-[#EDEDE8] text-right">
                      {projectData.ownerName || 'Nadia Putri'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777973] dark:text-[#A1A29B]">Tenggat</span>
                    <span className="font-medium text-[#282925] dark:text-[#EDEDE8] text-right">
                      {deadlineLong}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777973] dark:text-[#A1A29B]">Visibilitas</span>
                    <span className="font-medium text-[#282925] dark:text-[#EDEDE8] text-right">
                      {projectData.visibilityLabel || 'Anggota workspace'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alat kerja proyek */}
              <div className="bg-[#F8F8F6] dark:bg-[#1B1B18] rounded-[6px] p-4 flex flex-col gap-3 border border-[#EAEAE5] dark:border-[#2B2B28]">
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    Alat kerja
                  </h4>
                  <span className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                    Sesuai kebutuhan proyek ini.
                  </span>
                </div>

                {toolLinks.map((tool) => (
                  <a
                    key={tool.id}
                    href={tool.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white dark:bg-[#252522] border border-[#E6E7E1] dark:border-[#333] rounded-[5px] p-3 flex items-center justify-between hover:border-[#282925] dark:hover:border-[#777973] transition-colors group"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] truncate">
                        {tool.name}
                      </span>
                      <span className="text-[10px] text-[#777973] dark:text-[#A1A29B] truncate">
                        {tool.description}
                      </span>
                    </div>
                    <ArrowUpRight
                      size={14}
                      className="text-[#777973] group-hover:text-[#282925] dark:group-hover:text-white shrink-0"
                    />
                  </a>
                ))}

                <button
                  onClick={() => setShowToolsModal(true)}
                  className="text-[11px] text-[#777973] dark:text-[#A1A29B] hover:text-[#282925] dark:hover:text-[#EDEDE8] flex items-center gap-1 pt-1 transition-colors self-start cursor-pointer"
                >
                  <span>Kelola tautan alat ↗</span>
                </button>
              </div>

              {/* Hasil yang dituju */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    Hasil yang dituju
                  </h4>
                  <button
                    onClick={() => setShowAddGoal(!showAddGoal)}
                    className="text-[11px] text-[#567561] dark:text-[#8CA796] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus size={11} />
                    <span>Target</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {goals.map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between gap-2 group">
                      <button
                        type="button"
                        onClick={() => handleToggleGoal(goal.id)}
                        className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <span
                          className={`w-[7px] h-[7px] rounded-[2px] shrink-0 transition-colors ${
                            goal.done ? 'bg-[#567561]' : 'bg-[#87A88E]/50'
                          }`}
                        />
                        <span
                          className={`text-xs truncate ${
                            goal.done
                              ? 'line-through text-[#A1A29B]'
                              : 'text-[#777973] dark:text-[#A1A29B]'
                          }`}
                        >
                          {goal.text}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#A1A29B] hover:text-rose-500 p-0.5 cursor-pointer"
                        title="Hapus target"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>

                {showAddGoal && (
                  <form onSubmit={handleAddGoal} className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newGoalText}
                      onChange={(e) => setNewGoalText(e.target.value)}
                      placeholder="Target desain baru..."
                      className="flex-1 px-2.5 py-1 text-xs rounded border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#181816] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-[#282925] text-white text-[11px] cursor-pointer"
                    >
                      +
                    </button>
                  </form>
                )}
              </div>

              {/* Petunjuk favorit */}
              <div className="bg-[#EEF2EB] dark:bg-[#1E2720] rounded-[6px] p-3.5 flex flex-col gap-1 border border-[#DCE4D8] dark:border-[#2D3930]">
                <span className="text-xs font-medium text-[#567561] dark:text-[#88A68F]">
                  Selalu dekat dengan yang penting.
                </span>
                <p className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                  {isFavorite
                    ? 'Proyek ini tersimpan di menu Favorit dan tersinkron ke seluruh workspace.'
                    : 'Klik tombol Favorit untuk menyematkan di menu samping.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. Tab Content: Papan tugas                               */}
        {/* ========================================================= */}
        {activeTab === 'tugas' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  Papan Tugas · {designDoc.title}
                </h2>
                <p className="text-xs text-[#777973] dark:text-[#A1A29B]">
                  Kelola tugas desain agar terarah sesuai fokus: {projectData.focusObjective || designDoc.title}.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 h-9 rounded-[5px] bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#282925] text-xs font-medium hover:bg-[#3E403B] transition-colors cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span>Tambah tugas</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Prioritas Tinggi */}
              <div className="flex flex-col gap-3 bg-[#F8F8F6] dark:bg-[#181816] p-4 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#777973]">
                  <span>PRIORITAS TINGGI</span>
                  <span className="text-[11px]">
                    {tasks.filter((t) => !t.completed && t.priority === 'Tinggi').length}
                  </span>
                </div>
                {tasks
                  .filter((t) => !t.completed && t.priority === 'Tinggi')
                  .map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className="bg-white dark:bg-[#20201D] p-3 rounded border border-[#E6E7E1] dark:border-[#333] shadow-2xs flex flex-col gap-2 cursor-pointer hover:border-[#87A88E] transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                          {task.title}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                            setShowTaskModal(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[#777973] hover:text-[#282925]"
                        >
                          <Pencil size={11} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#777973]">{task.assignee} · {task.dueDate}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#F5EEE2] text-[#8B6935]">
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Sedang Dikerjakan */}
              <div className="flex flex-col gap-3 bg-[#F8F8F6] dark:bg-[#181816] p-4 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#777973]">
                  <span>SEDANG DIKERJAKAN</span>
                  <span className="text-[11px]">
                    {tasks.filter((t) => !t.completed && t.priority !== 'Tinggi').length}
                  </span>
                </div>
                {tasks
                  .filter((t) => !t.completed && t.priority !== 'Tinggi')
                  .map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className="bg-white dark:bg-[#20201D] p-3 rounded border border-[#E6E7E1] dark:border-[#333] shadow-2xs flex flex-col gap-2 cursor-pointer hover:border-[#87A88E] transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                          {task.title}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                            setShowTaskModal(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[#777973] hover:text-[#282925]"
                        >
                          <Pencil size={11} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#777973]">{task.assignee} · {task.dueDate}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#F1F2ED] text-[#777973]">
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Selesai */}
              <div className="flex flex-col gap-3 bg-[#F8F8F6] dark:bg-[#181816] p-4 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#777973]">
                  <span>SELESAI</span>
                  <span className="text-[11px]">{tasks.filter((t) => t.completed).length}</span>
                </div>
                {tasks
                  .filter((t) => t.completed)
                  .map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className="bg-white dark:bg-[#20201D] p-3 rounded border border-[#E6E7E1] dark:border-[#333] shadow-2xs flex flex-col gap-2 cursor-pointer opacity-80"
                    >
                      <span className="text-xs text-[#777973] line-through">{task.title}</span>
                      <div className="flex items-center justify-between text-[10px] text-[#567561]">
                        <span>{task.assignee}</span>
                        <span>✓ Selesai</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. Tab Content: Dokumen                                   */}
        {/* ========================================================= */}
        {activeTab === 'dokumen' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  Dokumen Proyek ({projectDocs.length})
                </h2>
                <p className="text-xs text-[#777973] dark:text-[#A1A29B]">
                  Moodboard arah visual, eksplorasi logo, palet warna, dan panduan {designDoc.title}.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingProjectDoc(null);
                  setShowDocModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 h-9 rounded-[5px] bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#282925] text-xs font-medium cursor-pointer"
              >
                <Plus size={13} />
                <span>Tambah dokumen</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectDocs.map((pdoc) => (
                <div
                  key={pdoc.id}
                  onClick={() => {
                    if (pdoc.linkedDocId) onSelectDoc(pdoc.linkedDocId);
                    else {
                      setEditingProjectDoc(pdoc);
                      setShowDocModal(true);
                    }
                  }}
                  className="p-4 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28] hover:border-[#282925] transition-colors cursor-pointer bg-white dark:bg-[#1A1A18] flex flex-col gap-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8] truncate">
                      {pdoc.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProjectDoc(pdoc);
                          setShowDocModal(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#777973] hover:text-[#282925]"
                      >
                        <Pencil size={12} />
                      </button>
                      <ArrowUpRight size={14} className="text-[#777973]" />
                    </div>
                  </div>
                  <p className="text-xs text-[#777973]">
                    {pdoc.description || 'Panduan dan referensi sistem desain.'}
                  </p>
                  <span className="text-[10px] text-[#A1A29B] mt-2">
                    {pdoc.source} · {pdoc.updatedLabel}
                  </span>
                </div>
              ))}

              <div
                onClick={() => onCreateDoc(designDoc.id)}
                className="p-4 rounded-lg border border-dashed border-[#C8CBC1] dark:border-[#444] hover:border-[#282925] transition-colors cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center min-h-[110px]"
              >
                <Plus size={18} className="text-[#777973]" />
                <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                  Buat Sub-Halaman Catatan Baru
                </span>
                <span className="text-[10px] text-[#777973]">
                  Terhubung langsung ke editor catatan Noverse
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. Tab Content: Diskusi                                   */}
        {/* ========================================================= */}
        {activeTab === 'diskusi' && (
          <div className="flex flex-col gap-6 max-w-[740px]">
            <div>
              <h2 className="text-lg font-semibold text-[#282925] dark:text-[#EDEDE8]">
                Diskusi Tim · {designDoc.title}
              </h2>
              <p className="text-xs text-[#777973] dark:text-[#A1A29B]">
                Umpan balik desain dan review identitas tersinkronisasi real-time lewat Cloud Firestore.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {discussions.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-lg bg-[#F8F8F6] dark:bg-[#181816] border border-[#E6E7E1] dark:border-[#2B2B28] flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        style={{ backgroundColor: msg.userColor }}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      >
                        {msg.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">
                        {msg.userName}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#777973]">
                      {formatTimeAgo(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-[#777973] dark:text-[#A1A29B] pl-7 leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Tulis catatan review desain atau panduan..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-[5px] border border-[#E6E7E1] dark:border-[#2B2B28] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8] placeholder-[#777973] focus:outline-none focus:border-[#282925]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-[5px] bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#282925] text-xs font-medium hover:bg-[#3E403B] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={13} />
                <span>Kirim</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* Modal 1: Papan Desain & Editor Palet (Buka desain ↗)      */}
      {/* ========================================================= */}
      {showDesignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#181816] w-full max-w-4xl rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[#E6E7E1] dark:border-[#2B2B28] max-h-[90vh]">
            <div className="h-12 px-5 border-b border-[#E6E7E1] dark:border-[#2B2B28] flex items-center justify-between bg-[#F8F8F6] dark:bg-[#131311] gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Palette size={15} className="text-[#8B6935] shrink-0" />
                <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8] truncate">
                  Papan Desain · {designDoc.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPalette(!isEditingPalette)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                    isEditingPalette
                      ? 'bg-[#282925] text-white border-[#282925]'
                      : 'bg-white dark:bg-[#1E1E1C] text-[#282925] dark:text-[#EDEDE8] border-[#E6E7E1] dark:border-[#333]'
                  }`}
                >
                  {isEditingPalette ? 'Selesai Edit Palet' : 'Edit Palet Warna'}
                </button>

                <div className="hidden sm:flex items-center gap-1 bg-[#EAEAE5] dark:bg-[#252522] p-0.5 rounded text-[11px]">
                  <button
                    onClick={() => setLogoVariant('color')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${
                      logoVariant === 'color'
                        ? 'bg-white dark:bg-[#181816] text-[#282925] dark:text-white font-medium shadow-2xs'
                        : 'text-[#777973]'
                    }`}
                  >
                    Warna Utama
                  </button>
                  <button
                    onClick={() => setLogoVariant('mono')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${
                      logoVariant === 'mono'
                        ? 'bg-white dark:bg-[#181816] text-[#282925] dark:text-white font-medium shadow-2xs'
                        : 'text-[#777973]'
                    }`}
                  >
                    Monokrom
                  </button>
                </div>

                <button
                  onClick={() => setShowDesignModal(false)}
                  className="p-1 rounded text-[#777973] hover:text-[#282925] dark:hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {/* Brand & Identity Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-6 rounded-lg border flex flex-col items-center justify-center gap-3 min-h-[170px] ${
                    logoVariant === 'color'
                      ? 'bg-[#F8F8F6] border-[#E6E7E1] text-[#282925]'
                      : 'bg-[#282925] border-[#282925] text-white'
                  }`}
                >
                  <div
                    style={{
                      backgroundColor: logoVariant === 'color' ? accentColor : '#FFFFFF',
                      color: logoVariant === 'color' ? '#FFFFFF' : primaryColor,
                    }}
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                  >
                    <Sparkles size={20} />
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold tracking-tight">{designDoc.title}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        logoVariant === 'color' ? 'text-[#777973]' : 'text-[#A1A29B]'
                      }`}
                    >
                      {projectData.categoryLabel || 'DESAIN · SISTEM IDENTITAS'}
                    </div>
                  </div>
                </div>

                {/* Spec Preview Card */}
                <div className="p-5 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28] bg-[#EEF2EB] dark:bg-[#1E2720] flex flex-col justify-between min-h-[170px]">
                  <div className="flex items-center justify-between text-[10px] font-medium text-[#567561]">
                    <span>PRATINJAU IDENTITAS &amp; KOMPONEN</span>
                    <span>AKTIF · {designPalette.length} TOKEN</span>
                  </div>
                  <div className="my-2 p-3.5 rounded bg-white dark:bg-[#141413] border border-[#DCE4D8] dark:border-[#2D3930] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8] truncate">
                        {projectData.focusObjective || designDoc.title}
                      </div>
                      <div className="text-[10px] text-[#777973] truncate mt-0.5">
                        {projectData.tagline}
                      </div>
                    </div>
                    <div
                      style={{ backgroundColor: primaryColor }}
                      className="w-8 h-8 rounded text-white flex items-center justify-center text-[10px] font-bold shrink-0"
                    >
                      {monogram}
                    </div>
                  </div>
                  <div className="text-[11px] text-[#777973] truncate">
                    PJ: {projectData.ownerName || 'Nadia Putri'} · {projectData.collaboratorsText}
                  </div>
                </div>
              </div>

              {/* Editable Color Palette */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8] uppercase tracking-wider">
                    Palet Warna Sistem Desain ({designPalette.length})
                  </h4>
                  {!isEditingPalette && (
                    <span className="text-[10px] text-[#777973]">Klik kartu warna untuk salin hex</span>
                  )}
                </div>

                {isEditingPalette ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {designPalette.map((swatch) => (
                        <div
                          key={swatch.id}
                          className="p-3 rounded-lg border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] flex items-center gap-3"
                        >
                          <input
                            type="color"
                            value={swatch.hex}
                            onChange={(e) => handleUpdateSwatch(swatch.id, { hex: e.target.value })}
                            className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <input
                              type="text"
                              value={swatch.name}
                              onChange={(e) => handleUpdateSwatch(swatch.id, { name: e.target.value })}
                              className="w-full px-2 py-1 text-xs font-medium rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#1E1E1C]"
                            />
                            <input
                              type="text"
                              value={swatch.role}
                              onChange={(e) => handleUpdateSwatch(swatch.id, { role: e.target.value })}
                              className="w-full px-2 py-1 text-[10px] rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-[#777973]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSwatch(swatch.id)}
                            className="p-1 text-[#777973] hover:text-rose-500 cursor-pointer"
                            title="Hapus warna"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <form
                      onSubmit={handleAddSwatch}
                      className="p-3 rounded-lg border border-dashed border-[#C8CBC1] dark:border-[#444] flex flex-wrap items-center gap-2"
                    >
                      <input
                        type="color"
                        value={newSwatchHex}
                        onChange={(e) => setNewSwatchHex(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        required
                        value={newSwatchName}
                        onChange={(e) => setNewSwatchName(e.target.value)}
                        placeholder="Nama token warna..."
                        className="flex-1 min-w-[140px] px-2.5 py-1.5 text-xs rounded border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211]"
                      />
                      <input
                        type="text"
                        value={newSwatchRole}
                        onChange={(e) => setNewSwatchRole(e.target.value)}
                        placeholder="Peran (mis. Tombol utama)"
                        className="flex-1 min-w-[140px] px-2.5 py-1.5 text-xs rounded border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded bg-[#282925] text-white text-xs font-medium cursor-pointer"
                      >
                        + Tambah Warna
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {designPalette.map((swatch) => (
                      <button
                        key={swatch.id}
                        type="button"
                        onClick={() => handleCopyColor(swatch.hex)}
                        className="text-left p-2.5 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28] bg-white dark:bg-[#20201D] hover:border-[#282925] transition-colors cursor-pointer"
                      >
                        <div
                          className="w-full h-12 rounded mb-2 border border-black/5"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <div className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] truncate">
                          {swatch.name}
                        </div>
                        <div className="text-[10px] text-[#A1A29B] truncate">{swatch.role}</div>
                        <div className="flex items-center justify-between text-[10px] text-[#777973] mt-1">
                          <span className="font-mono">
                            {copiedHex === swatch.hex ? 'Disalin!' : swatch.hex}
                          </span>
                          <Copy size={10} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Shared Reusable Project Modals                            */}
      {/* ========================================================= */}
      <ProjectOverviewEditModal
        isOpen={showOverviewModal}
        domainLabel="Desain Sistem"
        docTitle={designDoc.title}
        docStatus={designDoc.status}
        docPriority={designDoc.priority}
        docDeadline={designDoc.deadline}
        projectData={projectData}
        onClose={() => setShowOverviewModal(false)}
        onSave={handleSaveOverview}
      />

      <ProjectTaskEditorModal
        isOpen={showTaskModal}
        editingTask={editingTask}
        defaultAssignee={projectData.ownerName?.split(' ')[0] || 'Nadia'}
        defaultDueDate="20 Nov"
        onClose={() => setShowTaskModal(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <ProjectToolsEditorModal
        isOpen={showToolsModal}
        projectTitle={designDoc.title}
        toolLinks={toolLinks}
        onClose={() => setShowToolsModal(false)}
        onSave={handleSaveTools}
      />

      <ProjectDocEditorModal
        isOpen={showDocModal}
        editingDoc={editingProjectDoc}
        workspaceDocs={docs}
        onClose={() => setShowDocModal(false)}
        onSave={handleSaveProjectDoc}
        onDelete={handleDeleteProjectDoc}
        onCreateLinkedWorkspaceDoc={() => onCreateDoc(designDoc.id)}
      />
    </div>
  );
};
