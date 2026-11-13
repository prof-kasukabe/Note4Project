import React, { useState, useMemo } from 'react';
import {
  Star,
  Plus,
  Check,
  ArrowUpRight,
  Send,
  X,
  Smartphone,
  Bell,
  Flame,
  Pencil,
} from 'lucide-react';
import {
  DocItem,
  DocStatus,
  ProjectTask,
  ProjectDiscussion,
  ProjectDetailData,
} from '../types';
import {
  MOBILE_PROJECT_DOC_ID,
  DEFAULT_MOBILE_PROJECT_DATA,
  createDefaultMobileProjectDoc,
} from '../utils/seedData';
import { formatTimeAgo } from '../utils/formatTime';

interface ProjectMobileDetailProps {
  docs: DocItem[];
  userProfile: { userId: string; name: string; color: string };
  onSelectDoc: (id: string) => void;
  onSaveMobileDoc: (updatedDoc: DocItem) => void;
  onCreateDoc: (parentId?: string | null) => void;
}

interface HabitSimItem {
  id: string;
  name: string;
  schedule: string;
  streak: number;
  doneToday: boolean;
  reminderOn: boolean;
}

const INITIAL_PROTOTYPE_HABITS: HabitSimItem[] = [
  { id: 'h-1', name: 'Minum air 2 liter', schedule: '07:30 · Setiap hari', streak: 12, doneToday: true, reminderOn: true },
  { id: 'h-2', name: 'Baca buku 20 menit', schedule: '21:00 · Malam', streak: 9, doneToday: true, reminderOn: true },
  { id: 'h-3', name: 'Olahraga ringan', schedule: '06:30 · Sen, Rab, Jum', streak: 5, doneToday: false, reminderOn: true },
  { id: 'h-4', name: 'Jurnal refleksi harian', schedule: '22:00 · Setiap hari', streak: 7, doneToday: false, reminderOn: false },
];

export const ProjectMobileDetail: React.FC<ProjectMobileDetailProps> = ({
  docs,
  userProfile,
  onSelectDoc,
  onSaveMobileDoc,
  onCreateDoc,
}) => {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'tugas' | 'dokumen' | 'diskusi'>('ringkasan');

  const mobileDoc = useMemo(() => {
    return (
      docs.find((d) => d.id === MOBILE_PROJECT_DOC_ID) ||
      docs.find((d) => d.title?.toLowerCase().includes('habit tracker')) ||
      createDefaultMobileProjectDoc()
    );
  }, [docs]);

  const projectData: ProjectDetailData = useMemo(() => {
    return mobileDoc.projectData || DEFAULT_MOBILE_PROJECT_DATA;
  }, [mobileDoc]);

  const tasks = projectData.tasks;
  const discussions = projectData.discussions;
  const toolLinks = projectData.toolLinks;
  const isFavorite = mobileDoc.isFavorite ?? true;

  // Modals & local UI states
  const [showPrototypeModal, setShowPrototypeModal] = useState(false);
  const [prototypePlatform, setPrototypePlatform] = useState<'android' | 'ios'>('android');
  const [simHabits, setSimHabits] = useState<HabitSimItem[]>(INITIAL_PROTOTYPE_HABITS);

  const [showToolsModal, setShowToolsModal] = useState(false);
  const [draftToolUrls, setDraftToolUrls] = useState<Record<string, string>>({});

  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Andi');
  const [newTaskPriority, setNewTaskPriority] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [newTaskDueDate, setNewTaskDueDate] = useState('16 Nov');

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState(projectData.teamNote);

  const [newComment, setNewComment] = useState('');

  // Dynamic progress calculation (baseCompleted=7, baseTotal=7 + 5 explicit tasks -> 8/12 = 67%)
  const totalTasks = tasks.length + projectData.baseTotalTasks;
  const completedCount = tasks.filter((t) => t.completed).length + projectData.baseCompletedTasks;
  const progressPercent = totalTasks > 0 ? Math.min(100, Math.round((completedCount / totalTasks) * 100)) : 0;

  // Persist helper to Firestore + Express + WebSocket
  const persistProjectChange = (
    nextData: ProjectDetailData,
    actionText: string,
    extraDocFields?: Partial<DocItem>
  ) => {
    const now = Date.now();
    const updatedDoc: DocItem = {
      ...mobileDoc,
      ...extraDocFields,
      id: mobileDoc.id || MOBILE_PROJECT_DOC_ID,
      projectData: nextData,
      updatedAt: now,
      lastModifiedBy: {
        userId: userProfile.userId,
        name: userProfile.name,
        color: userProfile.color,
        timestamp: now,
        action: actionText,
      },
    };
    onSaveMobileDoc(updatedDoc);
  };

  const handleToggleFavorite = () => {
    const nextFav = !isFavorite;
    persistProjectChange(
      projectData,
      nextFav
        ? 'Menambahkan Aplikasi habit tracker ke favorit'
        : 'Menghapus Aplikasi habit tracker dari favorit',
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
      `Mengubah status Aplikasi habit tracker menjadi ${next.label}`,
      { status: next.status }
    );
  };

  const handleToggleTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    persistProjectChange(
      { ...projectData, tasks: updatedTasks },
      `Memperbarui tugas "${target?.title || 'Aplikasi habit tracker'}"`
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: ProjectTask = {
      id: `task-hm-${Date.now()}`,
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee,
      priority: newTaskPriority,
      dueDate: newTaskDueDate.trim() || '16 Nov',
      completed: false,
    };

    persistProjectChange(
      { ...projectData, tasks: [newTask, ...tasks] },
      `Menambahkan tugas "${newTask.title}" pada Aplikasi habit tracker`
    );
    setNewTaskTitle('');
    setShowNewTaskModal(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: ProjectDiscussion = {
      id: `disc-hm-${Date.now()}`,
      userName: userProfile.name || 'Andi Darma',
      userColor: userProfile.color || '#6366F1',
      text: newComment.trim(),
      timestamp: Date.now(),
    };

    persistProjectChange(
      { ...projectData, discussions: [...discussions, comment] },
      'Mengirim pesan diskusi di Aplikasi habit tracker'
    );
    setNewComment('');
  };

  const handleSaveTeamNote = () => {
    const cleaned = draftNote.trim();
    if (cleaned) {
      persistProjectChange(
        { ...projectData, teamNote: cleaned },
        'Memperbarui catatan tim Aplikasi habit tracker'
      );
    }
    setIsEditingNote(false);
  };

  const handleOpenToolsModal = () => {
    const map: Record<string, string> = {};
    toolLinks.forEach((t) => {
      map[t.id] = t.url;
    });
    setDraftToolUrls(map);
    setShowToolsModal(true);
  };

  const handleSaveTools = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTools = toolLinks.map((t) => ({
      ...t,
      url: draftToolUrls[t.id] !== undefined ? draftToolUrls[t.id] : t.url,
    }));
    persistProjectChange(
      { ...projectData, toolLinks: updatedTools },
      'Memperbarui tautan alat kerja Aplikasi habit tracker'
    );
    setShowToolsModal(false);
  };

  const statusBadgeColors =
    projectData.statusLabel === 'Selesai'
      ? 'bg-[#ECF2ED] dark:bg-[#1D2B22] text-[#567561] dark:text-[#7DA88C]'
      : projectData.statusLabel === 'Belum mulai'
      ? 'bg-[#F1F1ED] dark:bg-[#232320] text-[#777973] dark:text-[#A1A29B]'
      : 'bg-[#EBF0F5] dark:bg-[#1B252E] text-[#5D748B] dark:text-[#88A6C4]';

  const simCompleted = simHabits.filter((h) => h.doneToday).length;

  return (
    <div className="flex-1 overflow-y-auto h-full bg-white dark:bg-[#121211] select-text">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-8 py-8 md:py-10 flex flex-col gap-7">
        {/* ========================================================= */}
        {/* 1. Judul proyek (Header)                                  */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium tracking-wide text-[#777973] dark:text-[#A1A29B] uppercase">
              APLIKASI MOBILE · PRODUK DIGITAL
            </span>

            <h1 className="text-[28px] sm:text-[34px] font-normal leading-[1.3] text-[#282925] dark:text-[#EDEDE8] tracking-tight">
              Aplikasi habit tracker
            </h1>

            <p className="text-[13px] text-[#777973] dark:text-[#A1A29B] max-w-[620px] leading-relaxed">
              Membangun kebiasaan baik, satu langkah kecil setiap hari.
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

          <div className="flex items-center gap-3 shrink-0 md:pt-7">
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
              onClick={() => setShowPrototypeModal(true)}
              className="flex items-center justify-center gap-2 px-4 h-9 rounded-[5px] bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#282925] text-xs font-medium hover:bg-[#3D3E3A] dark:hover:bg-white transition-colors shadow-xs cursor-pointer"
            >
              <span>Lihat prototipe</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. Ringkasan progres (4 KPI columns + sage bar)           */}
        {/* ========================================================= */}
        <div className="border-y border-[#E6E7E1] dark:border-[#2B2B28] py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#E6E7E1] dark:divide-[#2B2B28]">
            {/* KPI 1: Progres proyek */}
            <div className="flex flex-col gap-1.5 md:pr-4">
              <span className="text-xs text-[#777973] dark:text-[#A1A29B]">
                Progres proyek
              </span>
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

            {/* KPI 2: Tenggat proyek */}
            <div className="flex flex-col gap-1.5 pt-4 md:pt-0 md:px-6">
              <span className="text-xs text-[#777973] dark:text-[#A1A29B]">
                Tenggat proyek
              </span>
              <span className="text-[17px] font-normal text-[#282925] dark:text-[#EDEDE8]">
                16 Nov 2026
              </span>
              <span className="text-[11px] text-[#777973] dark:text-[#A1A29B] mt-auto">
                Target penyelesaian
              </span>
            </div>

            {/* KPI 3: Kolaborator */}
            <div className="flex flex-col gap-1.5 pt-4 md:pt-0 md:px-6">
              <span className="text-xs text-[#777973] dark:text-[#A1A29B]">
                Kolaborator
              </span>
              <span className="text-[17px] font-normal text-[#282925] dark:text-[#EDEDE8] truncate">
                Andi, Rafi
              </span>
              <span className="text-[11px] text-[#777973] dark:text-[#A1A29B] mt-auto">
                Bekerja bersama
              </span>
            </div>

            {/* KPI 4: Prioritas */}
            <div className="flex flex-col gap-1.5 pt-4 md:pt-0 md:pl-6">
              <span className="text-xs text-[#777973] dark:text-[#A1A29B]">
                Prioritas
              </span>
              <span className="text-[17px] font-normal text-[#282925] dark:text-[#EDEDE8]">
                Sedang
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
              Dokumen 3
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
            {mobileDoc.lastModifiedBy?.name ? ` · ${mobileDoc.lastModifiedBy.name}` : ''}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. Tab Content: Ringkasan                                 */}
        {/* ========================================================= */}
        {activeTab === 'ringkasan' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN (~740px -> col-span-8) */}
            <div className="lg:col-span-8 flex flex-col gap-9">
              {/* Tentang proyek */}
              <div className="flex flex-col gap-2">
                <h2 className="text-[17px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  Tentang proyek
                </h2>
                <p className="text-[13px] text-[#777973] dark:text-[#A1A29B] leading-[1.55]">
                  Aplikasi mobile untuk mencatat kebiasaan harian, menjaga konsistensi, dan melihat progres. Fokus pada alur sederhana dan pengingat yang membantu.
                </p>
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
                    onClick={() => setShowNewTaskModal(true)}
                    className="flex items-center gap-1.5 px-3 h-[34px] rounded-[4px] border border-[#E6E7E1] dark:border-[#2B2B28] bg-white dark:bg-[#1E1E1C] text-[11px] font-medium text-[#282925] dark:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Tambah tugas</span>
                  </button>
                </div>

                {/* Task Rows */}
                <div className="flex flex-col divide-y divide-[#E6E7E1] dark:divide-[#2B2B28] border-t border-b border-[#E6E7E1] dark:border-[#2B2B28]">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="min-h-[64px] py-3 flex items-center justify-between gap-4 hover:bg-[#FAFAF8] dark:hover:bg-[#181816] px-1 rounded transition-colors"
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

                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-xs font-medium truncate ${
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

                      <div className="flex items-center gap-8 sm:gap-14 shrink-0">
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
                  <button
                    onClick={() => setActiveTab('dokumen')}
                    className="text-[11px] text-[#777973] dark:text-[#A1A29B] hover:text-[#282925] dark:hover:text-[#EDEDE8] transition-colors cursor-pointer"
                  >
                    Lihat semua (3) ↗
                  </button>
                </div>

                <div className="flex flex-col divide-y divide-[#E6E7E1] dark:divide-[#2B2B28] border-b border-[#E6E7E1] dark:border-[#2B2B28]">
                  {/* Doc 1 */}
                  <div
                    onClick={handleOpenToolsModal}
                    className="h-[55px] flex items-center justify-between gap-4 group cursor-pointer hover:bg-[#FAFAF8] dark:hover:bg-[#181816] px-1 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-[30px] h-[35px] rounded-[4px] bg-[#F2F3EE] dark:bg-[#252822] flex items-center justify-center text-[#777973] text-sm shrink-0">
                        ↗
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] group-hover:underline truncate">
                          Alur pengguna & wireframe
                        </span>
                        <span className="text-[10px] text-[#777973] dark:text-[#A1A29B]">
                          Figma · Diperbarui hari ini
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#777973] dark:text-[#A1A29B] shrink-0">
                      Desain
                    </span>
                  </div>

                  {/* Doc 2 */}
                  <div
                    onClick={() => {
                      const target = docs.find((d) => d.id === MOBILE_PROJECT_DOC_ID) || docs[0];
                      if (target) onSelectDoc(target.id);
                    }}
                    className="h-[55px] flex items-center justify-between gap-4 group cursor-pointer hover:bg-[#FAFAF8] dark:hover:bg-[#181816] px-1 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-[30px] h-[35px] rounded-[4px] bg-[#F2F3EE] dark:bg-[#252822] flex items-center justify-center text-[#777973] text-sm shrink-0">
                        ↗
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] group-hover:underline truncate">
                          Spesifikasi habit & pengingat
                        </span>
                        <span className="text-[10px] text-[#777973] dark:text-[#A1A29B]">
                          Notion · Diperbarui 9 Nov
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#777973] dark:text-[#A1A29B] shrink-0">
                      Dokumen
                    </span>
                  </div>

                  {/* Doc 3 */}
                  <div
                    onClick={() => {
                      const target = docs.find((d) => d.id === 'doc-sprint') || docs[0];
                      if (target) onSelectDoc(target.id);
                    }}
                    className="h-[55px] flex items-center justify-between gap-4 group cursor-pointer hover:bg-[#FAFAF8] dark:hover:bg-[#181816] px-1 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-[30px] h-[35px] rounded-[4px] bg-[#F2F3EE] dark:bg-[#252822] flex items-center justify-center text-[#777973] text-sm shrink-0">
                        ↗
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] group-hover:underline truncate">
                          Catatan pengujian aplikasi
                        </span>
                        <span className="text-[10px] text-[#777973] dark:text-[#A1A29B]">
                          Notion · Diperbarui 8 Nov
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#777973] dark:text-[#A1A29B] shrink-0">
                      Pengujian
                    </span>
                  </div>
                </div>
              </div>

              {/* Catatan proyek */}
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
                        className="px-3 py-1 rounded bg-[#282925] text-white text-[11px] font-medium cursor-pointer"
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

            {/* RIGHT COLUMN (~348px -> col-span-4, border-l #E6E7E1) */}
            <div className="lg:col-span-4 lg:border-l lg:border-[#E6E7E1] dark:lg:border-[#2B2B28] lg:pl-6 flex flex-col gap-8">
              {/* Detail proyek */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[17px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  Detail proyek
                </h3>

                <div className="flex flex-col gap-3.5 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777973] dark:text-[#A1A29B]">Kategori</span>
                    <span className="font-medium text-[#282925] dark:text-[#EDEDE8] text-right">
                      Aplikasi mobile
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777973] dark:text-[#A1A29B]">Penanggung jawab</span>
                    <span className="font-medium text-[#282925] dark:text-[#EDEDE8] text-right">
                      Andi Darma
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777973] dark:text-[#A1A29B]">Tenggat</span>
                    <span className="font-medium text-[#282925] dark:text-[#EDEDE8] text-right">
                      16 November 2026
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#777973] dark:text-[#A1A29B]">Visibilitas</span>
                    <span className="font-medium text-[#282925] dark:text-[#EDEDE8] text-right">
                      Anggota workspace
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
                  onClick={handleOpenToolsModal}
                  className="text-[11px] text-[#777973] dark:text-[#A1A29B] hover:text-[#282925] dark:hover:text-[#EDEDE8] flex items-center gap-1 pt-1 transition-colors self-start cursor-pointer"
                >
                  <span>Kelola tautan alat ↗</span>
                </button>
              </div>

              {/* Hasil yang dituju */}
              <div className="flex flex-col gap-3">
                <h4 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  Hasil yang dituju
                </h4>

                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-[5px] h-[5px] rounded-[2px] bg-[#87A88E] shrink-0" />
                    <span className="text-xs text-[#777973] dark:text-[#A1A29B]">
                      Onboarding & daftar kebiasaan
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="w-[5px] h-[5px] rounded-[2px] bg-[#87A88E] shrink-0" />
                    <span className="text-xs text-[#777973] dark:text-[#A1A29B]">
                      Pengingat harian
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="w-[5px] h-[5px] rounded-[2px] bg-[#87A88E] shrink-0" />
                    <span className="text-xs text-[#777973] dark:text-[#A1A29B]">
                      Statistik progres mingguan
                    </span>
                  </div>
                </div>
              </div>

              {/* Petunjuk favorit */}
              <div className="bg-[#EEF2EB] dark:bg-[#1E2720] rounded-[6px] p-3.5 flex flex-col gap-1 border border-[#DCE4D8] dark:border-[#2D3930]">
                <span className="text-xs font-medium text-[#567561] dark:text-[#88A68F]">
                  Selalu dekat dengan yang penting.
                </span>
                <p className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                  {isFavorite
                    ? 'Proyek ini tersimpan di menu Favorit.'
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
                  Papan Tugas · Aplikasi habit tracker
                </h2>
                <p className="text-xs text-[#777973] dark:text-[#A1A29B]">
                  Klik kartu tugas untuk memperbarui status penyelesaian dan menyinkronkan progres secara real-time.
                </p>
              </div>

              <button
                onClick={() => setShowNewTaskModal(true)}
                className="flex items-center gap-1.5 px-3.5 h-9 rounded-[5px] bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#282925] text-xs font-medium hover:bg-[#3E403B] transition-colors cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span>Tambah tugas</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Belum Mulai */}
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
                      className="bg-white dark:bg-[#20201D] p-3 rounded border border-[#E6E7E1] dark:border-[#333] shadow-2xs flex flex-col gap-2 cursor-pointer hover:border-[#87A88E] transition-colors"
                    >
                      <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                        {task.title}
                      </span>
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
                      className="bg-white dark:bg-[#20201D] p-3 rounded border border-[#E6E7E1] dark:border-[#333] shadow-2xs flex flex-col gap-2 cursor-pointer hover:border-[#87A88E] transition-colors"
                    >
                      <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                        {task.title}
                      </span>
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
                      <span className="text-xs text-[#777973] line-through">
                        {task.title}
                      </span>
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
        {/* 6. Tab Content: Dokumen 3                                 */}
        {/* ========================================================= */}
        {activeTab === 'dokumen' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-semibold text-[#282925] dark:text-[#EDEDE8]">
                Dokumen Proyek (3)
              </h2>
              <p className="text-xs text-[#777973] dark:text-[#A1A29B]">
                Alur wireframe, spesifikasi pengingat kebiasaan, dan catatan uji coba Android & iOS.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={handleOpenToolsModal}
                className="p-4 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28] hover:border-[#282925] transition-colors cursor-pointer bg-white dark:bg-[#1A1A18] flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    Alur pengguna & wireframe
                  </span>
                  <ArrowUpRight size={14} className="text-[#777973]" />
                </div>
                <p className="text-xs text-[#777973]">
                  Struktur onboarding 3 langkah, pemilihan kebiasaan awal, dan hierarki navigasi tab bawah.
                </p>
                <span className="text-[10px] text-[#A1A29B] mt-2">Figma · Diperbarui hari ini</span>
              </div>

              <div
                onClick={() => onSelectDoc(mobileDoc.id)}
                className="p-4 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28] hover:border-[#282925] transition-colors cursor-pointer bg-white dark:bg-[#1A1A18] flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    Spesifikasi habit & pengingat
                  </span>
                  <ArrowUpRight size={14} className="text-[#777973]" />
                </div>
                <p className="text-xs text-[#777973]">
                  Pengaturan jadwal pengingat per kebiasaan, logika streak mingguan, dan aturan reset harian.
                </p>
                <span className="text-[10px] text-[#A1A29B] mt-2">Notion · Diperbarui 9 Nov</span>
              </div>

              <div
                onClick={() => {
                  const target = docs.find((d) => d.id === 'doc-sprint') || mobileDoc;
                  onSelectDoc(target.id);
                }}
                className="p-4 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28] hover:border-[#282925] transition-colors cursor-pointer bg-white dark:bg-[#1A1A18] flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    Catatan pengujian aplikasi
                  </span>
                  <ArrowUpRight size={14} className="text-[#777973]" />
                </div>
                <p className="text-xs text-[#777973]">
                  Daftar skenario uji coba push notification dan konsistensi gesture di Android serta iOS.
                </p>
                <span className="text-[10px] text-[#A1A29B] mt-2">Notion · Diperbarui 8 Nov</span>
              </div>

              <div
                onClick={() => onCreateDoc(mobileDoc.id)}
                className="p-4 rounded-lg border border-dashed border-[#C8CBC1] dark:border-[#444] hover:border-[#282925] transition-colors cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center min-h-[110px]"
              >
                <Plus size={18} className="text-[#777973]" />
                <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                  Tambah dokumen baru
                </span>
                <span className="text-[10px] text-[#777973]">
                  Buat sub-halaman dokumentasi baru
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
                Diskusi Tim · Aplikasi habit tracker
              </h2>
              <p className="text-xs text-[#777973] dark:text-[#A1A29B]">
                Komentar tersinkronisasi secara real-time melalui Cloud Firestore ke seluruh anggota tim.
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
                placeholder="Tulis catatan diskusi atau pembaruan uji coba..."
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
      {/* Modal 1: Prototipe Interaktif (Lihat prototipe ↗)         */}
      {/* ========================================================= */}
      {showPrototypeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#181816] w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[#E6E7E1] dark:border-[#2B2B28]">
            <div className="h-12 px-4 border-b border-[#E6E7E1] dark:border-[#2B2B28] flex items-center justify-between bg-[#F8F8F6] dark:bg-[#131311]">
              <div className="flex items-center gap-2.5">
                <Smartphone size={15} className="text-[#567561]" />
                <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  Prototipe Interaktif · Aplikasi habit tracker
                </span>
              </div>

              <div className="flex items-center gap-1 bg-[#EAEAE5] dark:bg-[#252522] p-0.5 rounded text-[11px]">
                <button
                  onClick={() => setPrototypePlatform('android')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${
                    prototypePlatform === 'android'
                      ? 'bg-white dark:bg-[#181816] text-[#282925] dark:text-white font-medium shadow-2xs'
                      : 'text-[#777973]'
                  }`}
                >
                  Android
                </button>
                <button
                  onClick={() => setPrototypePlatform('ios')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${
                    prototypePlatform === 'ios'
                      ? 'bg-white dark:bg-[#181816] text-[#282925] dark:text-white font-medium shadow-2xs'
                      : 'text-[#777973]'
                  }`}
                >
                  iOS
                </button>
              </div>

              <button
                onClick={() => setShowPrototypeModal(false)}
                className="p-1 rounded text-[#777973] hover:text-[#282925] dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 bg-[#EEF0EB] dark:bg-[#0D0D0C] flex justify-center overflow-y-auto max-h-[78vh]">
              {/* Mobile Device Frame */}
              <div
                className={`w-[340px] bg-white dark:bg-[#141413] border-4 border-[#282925] dark:border-[#3A3B36] shadow-xl overflow-hidden flex flex-col ${
                  prototypePlatform === 'ios' ? 'rounded-[34px]' : 'rounded-[22px]'
                }`}
              >
                {/* Status bar */}
                <div className="px-5 pt-3 pb-2 flex items-center justify-between text-[10px] font-medium text-[#777973]">
                  <span>09:41</span>
                  {prototypePlatform === 'ios' && (
                    <span className="w-16 h-3.5 bg-[#282925] rounded-full" />
                  )}
                  <span>5G · 94%</span>
                </div>

                {/* App Header */}
                <div className="px-5 pt-2 pb-4 border-b border-[#EAEAE5] dark:border-[#2B2B28]">
                  <span className="text-[10px] font-medium text-[#567561] uppercase tracking-wider">
                    JUMAT · 13 NOV 2026
                  </span>
                  <h4 className="text-lg font-medium text-[#282925] dark:text-[#EDEDE8] mt-0.5">
                    Kebiasaan hari ini
                  </h4>
                  <div className="mt-3 p-3 rounded-lg bg-[#EEF2EB] dark:bg-[#1E2720] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#567561] dark:text-[#88A68F]">
                        {simCompleted} dari {simHabits.length} selesai
                      </div>
                      <div className="text-[10px] text-[#777973] dark:text-[#A1A29B]">
                        Pertahankan ritme harianmu
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-[#141413] text-[11px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                      <Flame size={13} className="text-amber-500" />
                      <span>12 hari</span>
                    </div>
                  </div>
                </div>

                {/* Habits list */}
                <div className="p-4 flex flex-col gap-2.5 flex-1">
                  {simHabits.map((habit) => (
                    <div
                      key={habit.id}
                      className="p-3 rounded-lg border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#FAFAF8] dark:bg-[#1B1B18] flex items-center justify-between gap-2"
                    >
                      <button
                        onClick={() =>
                          setSimHabits((prev) =>
                            prev.map((h) =>
                              h.id === habit.id ? { ...h, doneToday: !h.doneToday } : h
                            )
                          )
                        }
                        className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                            habit.doneToday
                              ? 'bg-[#89A58F] text-white'
                              : 'border border-[#C8CBC1] bg-white dark:bg-[#141413]'
                          }`}
                        >
                          {habit.doneToday && <Check size={11} strokeWidth={3} />}
                        </span>
                        <div className="min-w-0">
                          <div
                            className={`text-xs font-medium truncate ${
                              habit.doneToday
                                ? 'line-through text-[#777973]'
                                : 'text-[#282925] dark:text-[#EDEDE8]'
                            }`}
                          >
                            {habit.name}
                          </div>
                          <div className="text-[10px] text-[#777973] truncate">
                            {habit.schedule} · 🔥 {habit.streak}h
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          setSimHabits((prev) =>
                            prev.map((h) =>
                              h.id === habit.id ? { ...h, reminderOn: !h.reminderOn } : h
                            )
                          )
                        }
                        title={habit.reminderOn ? 'Pengingat aktif' : 'Pengingat nonaktif'}
                        className={`p-1.5 rounded cursor-pointer ${
                          habit.reminderOn
                            ? 'bg-[#EEF2EB] text-[#567561]'
                            : 'text-[#A1A29B] hover:text-[#777973]'
                        }`}
                      >
                        <Bell size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Bottom mobile nav */}
                <div className="h-11 border-t border-[#EAEAE5] dark:border-[#2B2B28] px-6 flex items-center justify-between text-[10px] text-[#777973]">
                  <span className="font-semibold text-[#282925] dark:text-[#EDEDE8]">Hari ini</span>
                  <span>Statistik</span>
                  <span>Pengingat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Modal 2: Kelola Tautan Alat Kerja                         */}
      {/* ========================================================= */}
      {showToolsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveTools}
            className="bg-white dark:bg-[#181816] w-full max-w-md rounded-xl p-6 shadow-2xl flex flex-col gap-4 border border-[#E6E7E1] dark:border-[#2B2B28]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
                Kelola Tautan Alat Kerja
              </h3>
              <button
                type="button"
                onClick={() => setShowToolsModal(false)}
                className="p-1 rounded text-[#777973] hover:text-[#282925] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#777973]">
              Perbarui URL Figma, Android Studio / Xcode, dan Firebase untuk proyek Aplikasi habit tracker.
            </p>

            <div className="flex flex-col gap-3">
              {toolLinks.map((tool) => (
                <div key={tool.id} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                    {tool.name} ({tool.description})
                  </label>
                  <input
                    type="text"
                    value={draftToolUrls[tool.id] ?? tool.url}
                    onChange={(e) =>
                      setDraftToolUrls((prev) => ({ ...prev, [tool.id]: e.target.value }))
                    }
                    className="px-3 py-2 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowToolsModal(false)}
                className="px-3.5 py-2 rounded border border-[#E6E7E1] text-xs font-medium text-[#777973] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#282925] text-white text-xs font-medium hover:bg-[#3E403B] cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* Modal 3: Tambah Tugas Baru                                */}
      {/* ========================================================= */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleAddTask}
            className="bg-white dark:bg-[#181816] w-full max-w-md rounded-xl p-6 shadow-2xl flex flex-col gap-4 border border-[#E6E7E1] dark:border-[#2B2B28]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
                Tambah Tugas Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="p-1 rounded text-[#777973] hover:text-[#282925] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Uji push notification iOS..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="px-3 py-2 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                    Penanggung Jawab
                  </label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="px-3 py-2 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                  >
                    <option value="Andi">Andi</option>
                    <option value="Rafi">Rafi</option>
                    <option value="Nadia">Nadia</option>
                    <option value={userProfile.name}>{userProfile.name}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                    Prioritas
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) =>
                      setNewTaskPriority(e.target.value as 'Tinggi' | 'Sedang' | 'Rendah')
                    }
                    className="px-3 py-2 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                  >
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                  Tenggat Waktu
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 16 Nov"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="px-3 py-2 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="px-3.5 py-2 rounded border border-[#E6E7E1] text-xs font-medium text-[#777973] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#282925] text-white text-xs font-medium hover:bg-[#3E403B] cursor-pointer"
              >
                Tambah Tugas
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
