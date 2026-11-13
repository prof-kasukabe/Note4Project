import React, { useState, useMemo } from 'react';
import { 
  Star, 
  ExternalLink, 
  Plus, 
  Check, 
  Clock, 
  Calendar, 
  Users, 
  Tag, 
  ChevronRight, 
  Share2, 
  MessageSquare, 
  FolderOpen, 
  ArrowUpRight,
  Globe,
  Github,
  Figma,
  Layers,
  Send,
  X,
  Laptop,
  Smartphone,
  Tablet,
  CheckCircle2,
  ListTodo
} from 'lucide-react';
import { DocItem, DocStatus, DocPriority, ActiveView, Language, Collaborator } from '../types';
import { translations } from '../utils/i18n';
import { formatTimeAgo } from '../utils/formatTime';

interface ProjectWebDetailProps {
  docs: DocItem[];
  lang?: Language;
  collaborators?: Collaborator[];
  userProfile: { userId: string; name: string; color: string };
  onSelectDoc: (id: string) => void;
  onUpdateDoc: (id: string, updated: Partial<DocItem>) => void;
  onCreateDoc: (parentId?: string | null) => void;
  onSelectView: (view: ActiveView) => void;
  onToggleFavorite?: (id: string) => void;
}

interface PortfolioTask {
  id: string;
  title: string;
  assignee: string;
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
  dueDate: string;
  completed: boolean;
}

interface DiscussionMessage {
  id: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
}

export const ProjectWebDetail: React.FC<ProjectWebDetailProps> = ({
  docs,
  lang = 'id',
  collaborators = [],
  userProfile,
  onSelectDoc,
  onUpdateDoc,
  onCreateDoc,
  onSelectView,
  onToggleFavorite,
}) => {
  const t = translations[lang];

  // Active sub-tab in project page: 'ringkasan' | 'tugas' | 'dokumen' | 'diskusi'
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'tugas' | 'dokumen' | 'diskusi'>('ringkasan');

  // Find or use portfolio doc from docs state
  const portfolioDoc = useMemo(() => {
    return docs.find((d) => d.id === 'doc-portfolio-web' || d.title.toLowerCase().includes('website portofolio')) || docs[0];
  }, [docs]);

  // Project status state
  const [projectStatus, setProjectStatus] = useState<string>('Dikerjakan');
  const [isFavorite, setIsFavorite] = useState<boolean>(true);

  // Initial tasks matching Figma spec
  const [tasks, setTasks] = useState<PortfolioTask[]>([
    {
      id: 'task-pw-1',
      title: 'Finalisasi desain halaman utama',
      assignee: 'Nadia',
      priority: 'Tinggi',
      dueDate: 'Hari ini',
      completed: false,
    },
    {
      id: 'task-pw-2',
      title: 'Perbaiki navigasi versi mobile',
      assignee: 'Rafi',
      priority: 'Sedang',
      dueDate: 'Besok',
      completed: false,
    },
    {
      id: 'task-pw-3',
      title: 'Tambahkan studi kasus proyek',
      assignee: 'Andi',
      priority: 'Sedang',
      dueDate: '12 Nov',
      completed: false,
    },
    {
      id: 'task-pw-4',
      title: 'Uji responsivitas & aksesibilitas',
      assignee: 'Rafi',
      priority: 'Tinggi',
      dueDate: '13 Nov',
      completed: false,
    },
    {
      id: 'task-pw-5',
      title: 'Susun struktur halaman',
      assignee: 'Andi',
      priority: 'Sedang',
      dueDate: 'Selesai',
      completed: true,
    },
  ]);

  // Modals & previews
  const [showWebsiteModal, setShowWebsiteModal] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showToolsModal, setShowToolsModal] = useState<boolean>(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);

  // New task inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Andi');
  const [newTaskPriority, setNewTaskPriority] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [newTaskDueDate, setNewTaskDueDate] = useState('14 Nov');

  // Discussions feed
  const [discussions, setDiscussions] = useState<DiscussionMessage[]>([
    {
      id: 'disc-1',
      userName: 'Andi Darma',
      userColor: '#6366F1',
      text: 'Draft wireframe untuk studi kasus sudah diunggah di Figma. Silakan cek di tab Dokumen.',
      timestamp: Date.now() - 3600000 * 3,
    },
    {
      id: 'disc-2',
      userName: 'Nadia',
      userColor: '#EC4899',
      text: 'Navigasi mobile sudah saya revisi agar lebih responsif di layar di bawah 400px.',
      timestamp: Date.now() - 3600000 * 1,
    },
  ]);
  const [newComment, setNewComment] = useState('');

  // Tools external links
  const [toolLinks, setToolLinks] = useState({
    figma: 'https://figma.com/@portfolio-v2',
    github: 'https://github.com/noverse-workspace/portfolio-web',
    vercel: 'https://portfolio-web.vercel.app',
  });

  // Calculate dynamic progress
  const totalTasks = tasks.length + 19; // 5 explicit + 19 background tasks to match "18 dari 24 tugas"
  const completedCount = tasks.filter((t) => t.completed).length + 17; // 1 completed + 17 background = 18
  const progressPercent = Math.min(100, Math.round((completedCount / totalTasks) * 100));

  // Toggle task completion and sync to backend / Firestore
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    setTasks(updatedTasks);

    // Sync to Firestore & backend through onUpdateDoc
    if (portfolioDoc) {
      onUpdateDoc(portfolioDoc.id, {
        updatedAt: Date.now(),
        lastModifiedBy: {
          userId: userProfile.userId,
          name: userProfile.name,
          color: userProfile.color,
          timestamp: Date.now(),
          action: `Memperbarui tugas pada Website Portofolio`,
        },
      });
    }
  };

  // Add new task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: PortfolioTask = {
      id: `task-pw-${Date.now()}`,
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee,
      priority: newTaskPriority,
      dueDate: newTaskDueDate || '15 Nov',
      completed: false,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setShowNewTaskModal(false);

    if (portfolioDoc) {
      onUpdateDoc(portfolioDoc.id, {
        updatedAt: Date.now(),
        lastModifiedBy: {
          userId: userProfile.userId,
          name: userProfile.name,
          color: userProfile.color,
          timestamp: Date.now(),
          action: `Menambahkan tugas baru: ${newTask.title}`,
        },
      });
    }
  };

  // Add comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: DiscussionMessage = {
      id: `disc-${Date.now()}`,
      userName: userProfile.name || 'Andi Darma',
      userColor: userProfile.color || '#6366F1',
      text: newComment.trim(),
      timestamp: Date.now(),
    };

    setDiscussions([...discussions, comment]);
    setNewComment('');

    if (portfolioDoc) {
      onUpdateDoc(portfolioDoc.id, {
        updatedAt: Date.now(),
        lastModifiedBy: {
          userId: userProfile.userId,
          name: userProfile.name,
          color: userProfile.color,
          timestamp: Date.now(),
          action: `Mengirim pesan diskusi di Website Portofolio`,
        },
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto h-full bg-white dark:bg-[#121211] select-text">
      {/* Container matching Figma: max-w-[1120px] centered/padded */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-8 py-8 md:py-10 flex flex-col gap-8">
        
        {/* ========================================================= */}
        {/* 1. Header Proyek (Figma spec: Judul proyek, tags, status, tombol aksi) */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            {/* Category Breadcrumb */}
            <span className="text-[11px] font-medium tracking-wide text-[#777973] uppercase">
              WEBSITE · DESAIN & PENGEMBANGAN
            </span>

            {/* Main Title */}
            <h1 className="text-[28px] sm:text-[34px] font-normal leading-[1.25] text-[#282925] dark:text-[#EDEDE8] tracking-tight">
              Website project
            </h1>

            {/* Description */}
            <p className="text-[13px] text-[#777973] dark:text-[#A1A29B] max-w-[620px] leading-relaxed">
              Ruang untuk menampilkan karya, cerita, dan hal yang kamu kerjakan.
            </p>

            {/* Badges Row */}
            <div className="flex items-center gap-3 pt-2">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#EBF0F5] dark:bg-[#1B252E] text-[#5D748B] dark:text-[#88A6C4] text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5D748B] dark:bg-[#88A6C4]" />
                <span>• {projectStatus}</span>
              </div>

              {/* Added to Favorites Badge */}
              <span className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                {isFavorite ? 'Ditambahkan ke favorit' : 'Tersimpan di proyek'}
              </span>
            </div>
          </div>

          {/* Action Buttons: ☆ Favorit & Buka website ↗ */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setIsFavorite(!isFavorite);
                if (portfolioDoc && onToggleFavorite) {
                  onToggleFavorite(portfolioDoc.id);
                }
              }}
              className="flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-[5px] border border-[#E6E7E1] dark:border-[#2B2B28] bg-white dark:bg-[#1E1E1C] text-[#282925] dark:text-[#EDEDE8] text-xs font-medium hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors"
            >
              <Star 
                size={14} 
                className={isFavorite ? 'fill-[#282925] text-[#282925] dark:fill-[#EDEDE8] dark:text-[#EDEDE8]' : 'text-[#777973]'} 
              />
              <span>{isFavorite ? '★ Favorit' : '☆ Favorit'}</span>
            </button>

            <button
              onClick={() => setShowWebsiteModal(true)}
              className="flex items-center justify-center gap-2 px-4 h-9 rounded-[5px] bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#282925] text-xs font-medium hover:bg-[#3D3E3A] dark:hover:bg-white transition-colors shadow-xs"
            >
              <span>Buka website</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. Ringkasan Progres (4 KPI Cards separated by dividers #E6E7E1) */}
        {/* ========================================================= */}
        <div className="border-y border-[#E6E7E1] dark:border-[#2B2B28] py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#E6E7E1] dark:divide-[#2B2B28]">
            
            {/* KPI 1: Progres Proyek */}
            <div className="flex flex-col gap-1.5 md:pr-4">
              <span className="text-xs text-[#777973] dark:text-[#A1A29B]">
                Progres proyek
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-[26px] font-normal leading-none text-[#282925] dark:text-[#EDEDE8]">
                  {progressPercent}%
                </span>
              </div>
              {/* Progress track 180px, sage green bar #87A88E */}
              <div className="w-full max-w-[180px] h-1 bg-[#E6E7E1] dark:bg-[#2B2B28] rounded-[2px] overflow-hidden my-1">
                <div 
                  className="h-full bg-[#87A88E] rounded-[2px] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                {completedCount} dari {totalTasks} tugas
              </span>
            </div>

            {/* KPI 2: Tenggat Proyek */}
            <div className="flex flex-col gap-1.5 pt-4 md:pt-0 md:px-6">
              <span className="text-xs text-[#777973] dark:text-[#A1A29B]">
                Tenggat proyek
              </span>
              <span className="text-[17px] font-normal text-[#282925] dark:text-[#EDEDE8]">
                13 Nov 2026
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
                Andi, Nadia, Rafi
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
        {/* 3. Navigasi Proyek (Tabs: Ringkasan, Papan tugas, Dokumen 4, Diskusi) */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between border-b border-[#E6E7E1] dark:border-[#2B2B28] -mt-2">
          <div className="flex items-center gap-8 text-[13px]">
            {/* Tab 1: Ringkasan */}
            <button
              onClick={() => setActiveTab('ringkasan')}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === 'ringkasan'
                  ? 'text-[#282925] dark:text-[#EDEDE8] font-semibold'
                  : 'text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8]'
              }`}
            >
              Ringkasan
              {activeTab === 'ringkasan' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#282925] dark:bg-[#EDEDE8]" />
              )}
            </button>

            {/* Tab 2: Papan tugas */}
            <button
              onClick={() => setActiveTab('tugas')}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === 'tugas'
                  ? 'text-[#282925] dark:text-[#EDEDE8] font-semibold'
                  : 'text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8]'
              }`}
            >
              Papan tugas
              {activeTab === 'tugas' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#282925] dark:bg-[#EDEDE8]" />
              )}
            </button>

            {/* Tab 3: Dokumen 4 */}
            <button
              onClick={() => setActiveTab('dokumen')}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === 'dokumen'
                  ? 'text-[#282925] dark:text-[#EDEDE8] font-semibold'
                  : 'text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8]'
              }`}
            >
              Dokumen 4
              {activeTab === 'dokumen' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#282925] dark:bg-[#EDEDE8]" />
              )}
            </button>

            {/* Tab 4: Diskusi */}
            <button
              onClick={() => setActiveTab('diskusi')}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === 'diskusi'
                  ? 'text-[#282925] dark:text-[#EDEDE8] font-semibold'
                  : 'text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8]'
              }`}
            >
              Diskusi ({discussions.length})
              {activeTab === 'diskusi' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#282925] dark:bg-[#EDEDE8]" />
              )}
            </button>
          </div>

          <div className="hidden sm:block text-[11px] text-[#777973] dark:text-[#A1A29B] pb-3">
            Terakhir diperbarui hari ini oleh {userProfile.name}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. Tab Content: Ringkasan Layout (Left 740px, Right 348px) */}
        {/* ========================================================= */}
        {activeTab === 'ringkasan' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: 740px equivalent (col-span-8) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              
              {/* Tentang proyek */}
              <div className="flex flex-col gap-2">
                <h2 className="text-[17px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  Tentang proyek
                </h2>
                <p className="text-[13px] text-[#777973] dark:text-[#A1A29B] leading-relaxed">
                  Website personal untuk menampilkan karya terpilih, profil, dan kontak. Fokus pada pengalaman yang ringan, responsif, dan mudah diperbarui.
                </p>
              </div>

              {/* Tugas terdekat */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[17px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                      Tugas terdekat
                    </h2>
                    <span className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                      {completedCount}/{totalTasks} selesai
                    </span>
                  </div>

                  <button
                    onClick={() => setShowNewTaskModal(true)}
                    className="flex items-center gap-1.5 px-3 h-[34px] rounded-[4px] border border-[#E6E7E1] dark:border-[#2B2B28] bg-white dark:bg-[#1E1E1C] text-[11px] font-medium text-[#282925] dark:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors"
                  >
                    <Plus size={13} />
                    <span>Tambah tugas</span>
                  </button>
                </div>

                {/* List of Tasks */}
                <div className="flex flex-col divide-y divide-[#E6E7E1] dark:divide-[#2B2B28] border-t border-b border-[#E6E7E1] dark:border-[#2B2B28]">
                  {tasks.map((task) => (
                    <div 
                      key={task.id}
                      className="py-3 flex items-center justify-between gap-4 group hover:bg-[#FAFAF8] dark:hover:bg-[#181816] px-1 rounded transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Interactive Checkbox matching Figma */}
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className={`w-[15px] h-[15px] rounded-[3px] flex items-center justify-center shrink-0 transition-all ${
                            task.completed
                              ? 'bg-[#89A58F] text-white border-0'
                              : 'bg-white dark:bg-[#1E1E1C] border border-[#C8CBC1] dark:border-[#444] hover:border-[#89A58F]'
                          }`}
                        >
                          {task.completed && <Check size={11} strokeWidth={3} />}
                        </button>

                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-medium truncate ${
                            task.completed 
                              ? 'line-through text-[#777973] dark:text-[#777973]' 
                              : 'text-[#282925] dark:text-[#EDEDE8]'
                          }`}>
                            {task.title}
                          </span>
                          <span className="text-[10px] text-[#777973] dark:text-[#A1A29B]">
                            {task.assignee}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {/* Priority Badge */}
                        <div className={`px-2 py-0.5 rounded-[4px] text-[10px] font-normal ${
                          task.priority === 'Tinggi'
                            ? 'bg-[#F5EEE2] dark:bg-[#2D2418] text-[#8B6935] dark:text-[#D1A667]'
                            : 'bg-[#F1F2ED] dark:bg-[#22241F] text-[#777973] dark:text-[#A1A29B]'
                        }`}>
                          {task.priority}
                        </div>

                        {/* Due Date or Status */}
                        <span className={`text-[11px] w-14 text-right ${
                          task.completed 
                            ? 'text-[#567561] font-medium' 
                            : 'text-[#777973] dark:text-[#A1A29B]'
                        }`}>
                          {task.completed ? 'Selesai' : task.dueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View all tasks link */}
                <button
                  onClick={() => setActiveTab('tugas')}
                  className="text-[11px] text-[#777973] dark:text-[#A1A29B] hover:text-[#282925] dark:hover:text-[#EDEDE8] flex items-center gap-1 pt-1 self-start transition-colors"
                >
                  <span>Lihat semua tugas</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>

              {/* Dokumen proyek */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-[17px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    Dokumen proyek
                  </h2>
                  <button
                    onClick={() => setActiveTab('dokumen')}
                    className="text-[11px] text-[#777973] dark:text-[#A1A29B] hover:text-[#282925] dark:hover:text-[#EDEDE8] flex items-center gap-1 transition-colors"
                  >
                    <span>Lihat semua (4)</span>
                    <ArrowUpRight size={12} />
                  </button>
                </div>

                {/* Document Items matching Figma */}
                <div className="flex flex-col divide-y divide-[#E6E7E1] dark:divide-[#2B2B28] border-t border-b border-[#E6E7E1] dark:border-[#2B2B28]">
                  
                  {/* Doc 1 */}
                  <div 
                    onClick={() => {
                      if (docs[0]) onSelectDoc(docs[0].id);
                    }}
                    className="py-3 flex items-center justify-between gap-4 group cursor-pointer hover:bg-[#FAFAF8] dark:hover:bg-[#181816] px-1 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-[30px] h-[35px] rounded-[4px] bg-[#F2F3EE] dark:bg-[#252822] flex items-center justify-center text-[#777973] group-hover:text-[#282925] dark:group-hover:text-white transition-colors">
                        <ArrowUpRight size={15} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] group-hover:underline">
                          Struktur & konten website
                        </span>
                        <span className="text-[10px] text-[#777973] dark:text-[#A1A29B]">
                          Notion · Diperbarui hari ini
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                      Dokumen
                    </span>
                  </div>

                  {/* Doc 2 */}
                  <div 
                    onClick={() => setShowToolsModal(true)}
                    className="py-3 flex items-center justify-between gap-4 group cursor-pointer hover:bg-[#FAFAF8] dark:hover:bg-[#181816] px-1 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-[30px] h-[35px] rounded-[4px] bg-[#F2F3EE] dark:bg-[#252822] flex items-center justify-center text-[#777973] group-hover:text-[#282925] dark:group-hover:text-white transition-colors">
                        <ArrowUpRight size={15} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] group-hover:underline">
                          Desain antarmuka v2
                        </span>
                        <span className="text-[10px] text-[#777973] dark:text-[#A1A29B]">
                          Figma · Diperbarui kemarin
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                      Desain
                    </span>
                  </div>

                  {/* Doc 3 */}
                  <div 
                    onClick={() => setShowToolsModal(true)}
                    className="py-3 flex items-center justify-between gap-4 group cursor-pointer hover:bg-[#FAFAF8] dark:hover:bg-[#181816] px-1 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-[30px] h-[35px] rounded-[4px] bg-[#F2F3EE] dark:bg-[#252822] flex items-center justify-center text-[#777973] group-hover:text-[#282925] dark:group-hover:text-white transition-colors">
                        <ArrowUpRight size={15} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] group-hover:underline">
                          Panduan pengembangan
                        </span>
                        <span className="text-[10px] text-[#777973] dark:text-[#A1A29B]">
                          GitHub · Diperbarui 8 Nov
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                      Panduan
                    </span>
                  </div>

                </div>
              </div>

              {/* Catatan proyek (Figma: #F8F8F6 container, Catatan untuk tim) */}
              <div className="bg-[#F8F8F6] dark:bg-[#1B1B18] rounded-[6px] p-4 flex flex-col gap-1.5 border border-[#EAEAE5] dark:border-[#2B2B28]">
                <span className="text-[11px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  Catatan untuk tim
                </span>
                <p className="text-xs text-[#777973] dark:text-[#A1A29B] leading-relaxed">
                  Pastikan setiap studi kasus memuat konteks, proses, dan hasil. Tinjau versi mobile sebelum website dipublikasikan.
                </p>
              </div>

            </div>

            {/* RIGHT COLUMN: 348px equivalent (col-span-4) separated by 1px solid #E6E7E1 */}
            <div className="lg:col-span-4 lg:border-l lg:border-[#E6E7E1] dark:lg:border-[#2B2B28] lg:pl-6 flex flex-col gap-8">
              
              {/* Detail Proyek Section */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[17px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  Detail proyek
                </h3>

                <div className="flex flex-col gap-3 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#777973] dark:text-[#A1A29B]">Kategori</span>
                    <span className="font-medium text-[#282925] dark:text-[#EDEDE8]">Website</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#777973] dark:text-[#A1A29B]">Penanggung jawab</span>
                    <span className="font-medium text-[#282925] dark:text-[#EDEDE8]">Andi Darma</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#777973] dark:text-[#A1A29B]">Tenggat</span>
                    <span className="font-medium text-[#282925] dark:text-[#EDEDE8]">13 November 2026</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#777973] dark:text-[#A1A29B]">Visibilitas</span>
                    <span className="font-medium text-[#282925] dark:text-[#EDEDE8]">Anggota workspace</span>
                  </div>
                </div>
              </div>

              {/* Alat kerja proyek (Figma: #F8F8F6 box, Figma, GitHub, Vercel) */}
              <div className="bg-[#F8F8F6] dark:bg-[#1B1B18] rounded-[6px] p-4 flex flex-col gap-3 border border-[#EAEAE5] dark:border-[#2B2B28]">
                <div className="flex flex-col">
                  <h4 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    Alat kerja
                  </h4>
                  <span className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                    Sesuai kebutuhan proyek ini.
                  </span>
                </div>

                {/* Card 1: Figma */}
                <a
                  href={toolLinks.figma}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white dark:bg-[#252522] border border-[#E6E7E1] dark:border-[#333] rounded-[5px] p-3 flex items-center justify-between hover:border-[#282925] transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                      Figma
                    </span>
                    <span className="text-[10px] text-[#777973] dark:text-[#A1A29B]">
                      Desain UI & prototipe
                    </span>
                  </div>
                  <ArrowUpRight size={14} className="text-[#777973] group-hover:text-[#282925] dark:group-hover:text-white" />
                </a>

                {/* Card 2: GitHub */}
                <a
                  href={toolLinks.github}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white dark:bg-[#252522] border border-[#E6E7E1] dark:border-[#333] rounded-[5px] p-3 flex items-center justify-between hover:border-[#282925] transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                      GitHub
                    </span>
                    <span className="text-[10px] text-[#777973] dark:text-[#A1A29B]">
                      Repositori & review perubahan
                    </span>
                  </div>
                  <ArrowUpRight size={14} className="text-[#777973] group-hover:text-[#282925] dark:group-hover:text-white" />
                </a>

                {/* Card 3: Vercel */}
                <a
                  href={toolLinks.vercel}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white dark:bg-[#252522] border border-[#E6E7E1] dark:border-[#333] rounded-[5px] p-3 flex items-center justify-between hover:border-[#282925] transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                      Vercel
                    </span>
                    <span className="text-[10px] text-[#777973] dark:text-[#A1A29B]">
                      Preview & publikasi website
                    </span>
                  </div>
                  <ArrowUpRight size={14} className="text-[#777973] group-hover:text-[#282925] dark:group-hover:text-white" />
                </a>

                {/* Manage tool links */}
                <button
                  onClick={() => setShowToolsModal(true)}
                  className="text-[11px] text-[#777973] dark:text-[#A1A29B] hover:text-[#282925] dark:hover:text-[#EDEDE8] flex items-center gap-1 pt-1 transition-colors self-start"
                >
                  <span>Kelola tautan alat</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>

              {/* Hasil yang dituju (Figma: #87A88E bullet dots) */}
              <div className="flex flex-col gap-3">
                <h4 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  Hasil yang dituju
                </h4>

                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-[5px] h-[5px] rounded-[2px] bg-[#87A88E] shrink-0" />
                    <span className="text-xs text-[#777973] dark:text-[#A1A29B]">
                      Halaman utama & profil
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="w-[5px] h-[5px] rounded-[2px] bg-[#87A88E] shrink-0" />
                    <span className="text-xs text-[#777973] dark:text-[#A1A29B]">
                      Studi kasus & kontak
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="w-[5px] h-[5px] rounded-[2px] bg-[#87A88E] shrink-0" />
                    <span className="text-xs text-[#777973] dark:text-[#A1A29B]">
                      Website responsif
                    </span>
                  </div>
                </div>
              </div>

              {/* Petunjuk favorit (Figma: #EEF2EB container, sage green title #567561) */}
              <div className="bg-[#EEF2EB] dark:bg-[#1E2720] rounded-[6px] p-3.5 flex flex-col gap-1 border border-[#DCE4D8] dark:border-[#2D3930]">
                <span className="text-xs font-medium text-[#567561] dark:text-[#88A68F]">
                  Selalu dekat dengan yang penting.
                </span>
                <p className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
                  Proyek ini tersimpan di menu Favorit.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* 5. Tab Content: Papan Tugas (Kanban for Website Portfolio) */}
        {/* ========================================================= */}
        {activeTab === 'tugas' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  Papan Tugas · Website Portofolio
                </h2>
                <p className="text-xs text-[#777973]">
                  Kelola dan pantau seluruh tahap penyelesaian website portofolio tim.
                </p>
              </div>

              <button
                onClick={() => setShowNewTaskModal(true)}
                className="flex items-center gap-1.5 px-3.5 h-9 rounded-[5px] bg-[#282925] text-white text-xs font-medium hover:bg-[#3E403B] transition-colors"
              >
                <Plus size={14} />
                <span>Tambah tugas</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Belum Mulai */}
              <div className="flex flex-col gap-3 bg-[#F8F8F6] dark:bg-[#181816] p-4 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#777973]">
                  <span>BELUM MULAI</span>
                  <span className="text-[11px]">1</span>
                </div>
                <div className="bg-white dark:bg-[#20201D] p-3 rounded border border-[#E6E7E1] dark:border-[#333] shadow-xs flex flex-col gap-2">
                  <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                    Optimasi SEO & OpenGraph tags
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-[#777973]">
                    <span>Andi</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#F1F2ED] text-[#777973]">Sedang</span>
                  </div>
                </div>
              </div>

              {/* Column 2: Sedang Dikerjakan */}
              <div className="flex flex-col gap-3 bg-[#F8F8F6] dark:bg-[#181816] p-4 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#777973]">
                  <span>SEDANG DIKERJAKAN</span>
                  <span className="text-[11px]">{tasks.filter((t) => !t.completed).length}</span>
                </div>
                {tasks.filter((t) => !t.completed).map((t) => (
                  <div 
                    key={t.id}
                    onClick={() => handleToggleTask(t.id)}
                    className="bg-white dark:bg-[#20201D] p-3 rounded border border-[#E6E7E1] dark:border-[#333] shadow-xs flex flex-col gap-2 cursor-pointer hover:border-[#87A88E] transition-colors"
                  >
                    <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
                      {t.title}
                    </span>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#777973]">{t.assignee}</span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        t.priority === 'Tinggi' ? 'bg-[#F5EEE2] text-[#8B6935]' : 'bg-[#F1F2ED] text-[#777973]'
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Column 3: Selesai */}
              <div className="flex flex-col gap-3 bg-[#F8F8F6] dark:bg-[#181816] p-4 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#777973]">
                  <span>SELESAI</span>
                  <span className="text-[11px]">{tasks.filter((t) => t.completed).length}</span>
                </div>
                {tasks.filter((t) => t.completed).map((t) => (
                  <div 
                    key={t.id}
                    onClick={() => handleToggleTask(t.id)}
                    className="bg-white dark:bg-[#20201D] p-3 rounded border border-[#E6E7E1] dark:border-[#333] shadow-xs flex flex-col gap-2 cursor-pointer opacity-75 line-through"
                  >
                    <span className="text-xs text-[#777973]">
                      {t.title}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-[#567561]">
                      <span>{t.assignee}</span>
                      <span>✓ Selesai</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. Tab Content: Dokumen 4 */}
        {/* ========================================================= */}
        {activeTab === 'dokumen' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-semibold text-[#282925] dark:text-[#EDEDE8]">
                Dokumen Proyek
              </h2>
              <p className="text-xs text-[#777973]">
                Seluruh spesifikasi, catatan teknis, dan tautan dokumen desain website portofolio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => {
                  if (docs[0]) onSelectDoc(docs[0].id);
                }}
                className="p-4 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28] hover:border-[#282925] transition-colors cursor-pointer bg-white dark:bg-[#1A1A18] flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">Struktur & konten website</span>
                  <ArrowUpRight size={14} className="text-[#777973]" />
                </div>
                <p className="text-xs text-[#777973]">
                  Kerangka arsitektur informasi, copywriting per bagian profil, dan daftar proyek pilihan.
                </p>
                <span className="text-[10px] text-[#A1A29B] mt-2">Diperbarui hari ini oleh Nadia</span>
              </div>

              <div 
                onClick={() => setShowToolsModal(true)}
                className="p-4 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28] hover:border-[#282925] transition-colors cursor-pointer bg-white dark:bg-[#1A1A18] flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">Desain antarmuka v2 (Figma)</span>
                  <ArrowUpRight size={14} className="text-[#777973]" />
                </div>
                <p className="text-xs text-[#777973]">
                  Komponen UI, sistem tipografi, palet warna sage, dan prototipe interaktif tampilan responsif.
                </p>
                <span className="text-[10px] text-[#A1A29B] mt-2">Diperbarui kemarin oleh Andi</span>
              </div>

              <div 
                onClick={() => setShowToolsModal(true)}
                className="p-4 rounded-lg border border-[#E6E7E1] dark:border-[#2B2B28] hover:border-[#282925] transition-colors cursor-pointer bg-white dark:bg-[#1A1A18] flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">Panduan pengembangan (GitHub)</span>
                  <ArrowUpRight size={14} className="text-[#777973]" />
                </div>
                <p className="text-xs text-[#777973]">
                  Instruksi setup lokal, konfigurasi Tailwind CSS, CI/CD pipeline, dan deployment otomatis.
                </p>
                <span className="text-[10px] text-[#A1A29B] mt-2">Diperbarui 8 Nov oleh Rafi</span>
              </div>

              <div 
                onClick={() => onCreateDoc(null)}
                className="p-4 rounded-lg border border-dashed border-[#C8CBC1] dark:border-[#444] hover:border-[#282925] transition-colors cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center min-h-[110px]"
              >
                <Plus size={18} className="text-[#777973]" />
                <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Tambah dokumen baru</span>
                <span className="text-[10px] text-[#777973]">Tautkan catatan atau dokumen proyek</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. Tab Content: Diskusi & Kolaborator Real-time */}
        {/* ========================================================= */}
        {activeTab === 'diskusi' && (
          <div className="flex flex-col gap-6 max-w-[740px]">
            <div>
              <h2 className="text-lg font-semibold text-[#282925] dark:text-[#EDEDE8]">
                Diskusi Tim · Real-time
              </h2>
              <p className="text-xs text-[#777973]">
                Komentar tersinkronisasi otomatis ke semua anggota proyek dan dicatat dalam audit log.
              </p>
            </div>

            {/* Discussion Feed */}
            <div className="flex flex-col gap-4">
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
                        {msg.userName[0]}
                      </div>
                      <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">
                        {msg.userName}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#777973]">
                      {formatTimeAgo(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-[#777973] dark:text-[#A1A29B] pl-7">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Tulis pesan atau update progress..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-[5px] border border-[#E6E7E1] dark:border-[#2B2B28] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8] placeholder-[#777973] focus:outline-none focus:border-[#282925]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-[5px] bg-[#282925] text-white text-xs font-medium hover:bg-[#3E403B] transition-colors flex items-center gap-1.5"
              >
                <Send size={13} />
                <span>Kirim</span>
              </button>
            </form>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* Modal 1: Live Website Preview (Buka website ↗) */}
      {/* ========================================================= */}
      {showWebsiteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#181816] w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[#E6E7E1] dark:border-[#2B2B28]">
            {/* Header bar */}
            <div className="h-12 px-4 border-b border-[#E6E7E1] dark:border-[#2B2B28] flex items-center justify-between bg-[#F8F8F6] dark:bg-[#131311]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  Pratinjau Langsung: Website Portofolio
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                  Live Preview
                </span>
              </div>

              {/* Device switchers */}
              <div className="flex items-center gap-1 bg-[#EAEAE5] dark:bg-[#252522] p-0.5 rounded">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded text-xs ${previewDevice === 'desktop' ? 'bg-white dark:bg-[#181816] shadow-xs text-[#282925] dark:text-white' : 'text-[#777973]'}`}
                  title="Desktop View"
                >
                  <Laptop size={14} />
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded text-xs ${previewDevice === 'tablet' ? 'bg-white dark:bg-[#181816] shadow-xs text-[#282925] dark:text-white' : 'text-[#777973]'}`}
                  title="Tablet View"
                >
                  <Tablet size={14} />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded text-xs ${previewDevice === 'mobile' ? 'bg-white dark:bg-[#181816] shadow-xs text-[#282925] dark:text-white' : 'text-[#777973]'}`}
                  title="Mobile View"
                >
                  <Smartphone size={14} />
                </button>
              </div>

              <button
                onClick={() => setShowWebsiteModal(false)}
                className="p-1 rounded text-[#777973] hover:text-[#282925] dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Preview Frame */}
            <div className="flex-1 bg-[#EEF0EB] dark:bg-[#0D0D0C] p-4 flex items-center justify-center overflow-auto">
              <div 
                className={`bg-white dark:bg-[#121211] shadow-xl rounded-lg h-full overflow-y-auto transition-all duration-300 border border-[#E6E7E1] dark:border-[#333] ${
                  previewDevice === 'desktop'
                    ? 'w-full'
                    : previewDevice === 'tablet'
                    ? 'w-[768px]'
                    : 'w-[375px]'
                }`}
              >
                {/* Simulated Portfolio Landing Page */}
                <div className="p-8 sm:p-12 flex flex-col gap-10">
                  <header className="flex items-center justify-between border-b pb-4">
                    <div className="font-bold text-lg text-[#282925] dark:text-white tracking-tight">
                      Andi Darma.
                    </div>
                    <nav className="flex items-center gap-6 text-xs text-[#777973]">
                      <span>Karya</span>
                      <span>Tentang</span>
                      <span>Studi Kasus</span>
                      <span className="font-medium text-[#282925] dark:text-white">Kontak</span>
                    </nav>
                  </header>

                  <section className="flex flex-col gap-4 py-8">
                    <span className="text-xs uppercase tracking-widest text-[#87A88E] font-semibold">
                      Product Designer & Engineer
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-light text-[#282925] dark:text-white tracking-tight">
                      Membangun antarmuka yang bersih, cepat, dan bermakna.
                    </h1>
                    <p className="text-sm text-[#777973] max-w-xl leading-relaxed">
                      Ruang untuk menampilkan karya, cerita, dan hal yang kamu kerjakan. Fokus pada pengalaman yang ringan, responsif, dan mudah diperbarui.
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <button className="px-5 py-2.5 rounded bg-[#282925] dark:bg-white text-white dark:text-[#282925] text-xs font-medium">
                        Lihat Proyek Pilihan
                      </button>
                      <button className="px-5 py-2.5 rounded border border-[#E6E7E1] dark:border-[#333] text-xs font-medium">
                        Hubungi Saya
                      </button>
                    </div>
                  </section>

                  {/* Portfolio Projects Showcase */}
                  <section className="flex flex-col gap-4 pt-6 border-t border-[#E6E7E1] dark:border-[#333]">
                    <h3 className="text-base font-semibold text-[#282925] dark:text-white">
                      Karya Terpilih
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-[#F8F8F6] dark:bg-[#1E1E1C] flex flex-col gap-2">
                        <div className="h-32 bg-[#E9EBE3] dark:bg-[#252822] rounded flex items-center justify-center text-xs text-[#777973]">
                          [Antarmuka Desain Sistem v2]
                        </div>
                        <span className="text-xs font-semibold text-[#282925] dark:text-white">Noverse Design System</span>
                        <span className="text-[11px] text-[#777973]">Tokens, komponen modular, & aksesibilitas</span>
                      </div>
                      <div className="p-4 rounded-lg bg-[#F8F8F6] dark:bg-[#1E1E1C] flex flex-col gap-2">
                        <div className="h-32 bg-[#E9EBE3] dark:bg-[#252822] rounded flex items-center justify-center text-xs text-[#777973]">
                          [Platform Web Responsif]
                        </div>
                        <span className="text-xs font-semibold text-[#282925] dark:text-white">E-Commerce Architecture</span>
                        <span className="text-[11px] text-[#777973]">PWA offline-first & performa 99/100</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Modal 2: Kelola Tautan Alat (Figma, GitHub, Vercel) */}
      {/* ========================================================= */}
      {showToolsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#181816] w-full max-w-md rounded-xl p-6 shadow-2xl flex flex-col gap-4 border border-[#E6E7E1] dark:border-[#2B2B28]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
                Kelola Tautan Alat Kerja
              </h3>
              <button
                onClick={() => setShowToolsModal(false)}
                className="p-1 rounded text-[#777973] hover:text-[#282925]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#777973]">
              Perbarui tautan repositori dan file desain yang terhubung ke proyek ini.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Tautan Figma</label>
                <input
                  type="text"
                  value={toolLinks.figma}
                  onChange={(e) => setToolLinks({ ...toolLinks, figma: e.target.value })}
                  className="px-3 py-2 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Tautan GitHub</label>
                <input
                  type="text"
                  value={toolLinks.github}
                  onChange={(e) => setToolLinks({ ...toolLinks, github: e.target.value })}
                  className="px-3 py-2 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Tautan Vercel / Live URL</label>
                <input
                  type="text"
                  value={toolLinks.vercel}
                  onChange={(e) => setToolLinks({ ...toolLinks, vercel: e.target.value })}
                  className="px-3 py-2 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowToolsModal(false)}
                className="px-4 py-2 rounded bg-[#282925] text-white text-xs font-medium hover:bg-[#3E403B]"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Modal 3: Tambah Tugas Baru */}
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
                className="p-1 rounded text-[#777973] hover:text-[#282925]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Judul Tugas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Buat halaman kontak dan footer..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="px-3 py-2 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Penanggung Jawab</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="px-3 py-2 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                  >
                    <option value="Andi">Andi</option>
                    <option value="Nadia">Nadia</option>
                    <option value="Rafi">Rafi</option>
                    <option value={userProfile.name}>{userProfile.name}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Prioritas</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as 'Tinggi' | 'Sedang' | 'Rendah')}
                    className="px-3 py-2 rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                  >
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Tenggat Waktu</label>
                <input
                  type="text"
                  placeholder="Contoh: 15 Nov atau Besok"
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
                className="px-3.5 py-2 rounded border border-[#E6E7E1] text-xs font-medium text-[#777973]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#282925] text-white text-xs font-medium hover:bg-[#3E403B]"
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
