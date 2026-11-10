import React, { useState } from 'react';
import { 
  Layers, 
  CircleDashed, 
  CheckCircle2, 
  BarChart3, 
  Plus, 
  List, 
  Columns3, 
  ListFilter, 
  ArrowUpDown, 
  Search, 
  ListTodo, 
  ArrowUpRight, 
  History, 
  Globe, 
  Smartphone, 
  Palette, 
  Mail, 
  Component, 
  NotebookPen, 
  MoreHorizontal, 
  Check,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import { DocItem, DocStatus, DocPriority, ActiveView, Language, Collaborator } from '../types';
import { translations } from '../utils/i18n';
import { formatTimeAgo } from '../utils/formatTime';

interface WorkspaceOverviewProps {
  docs: DocItem[];
  lang?: Language;
  collaborators?: Collaborator[];
  userProfile: { userId: string; name: string; color: string };
  onSelectDoc: (id: string) => void;
  onUpdateDoc: (id: string, updated: Partial<DocItem>) => void;
  onCreateDoc: (parentId?: string | null) => void;
  onSelectView: (view: ActiveView) => void;
}

export const WorkspaceOverview: React.FC<WorkspaceOverviewProps> = ({
  docs,
  lang = 'id',
  collaborators = [],
  userProfile,
  onSelectDoc,
  onUpdateDoc,
  onCreateDoc,
  onSelectView,
}) => {
  const t = translations[lang];
  const [projectFilter, setProjectFilter] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectSortAsc, setProjectSortAsc] = useState(false);
  const [projectMode, setProjectMode] = useState<'table' | 'board'>('table');

  // Compute stats
  const totalDocs = docs.length;
  const inProgressDocs = docs.filter((d) => d.status === 'in_progress');
  const completedDocs = docs.filter((d) => d.status === 'completed');
  const notStartedDocs = docs.filter((d) => d.status === 'not_started');

  const completionPercent = totalDocs > 0 ? Math.round((completedDocs.length / totalDocs) * 100) : 0;

  // Filtered projects
  const filteredProjects = docs.filter((d) => {
    if (projectFilter !== 'all' && d.status !== projectFilter) return false;
    if (projectSearch.trim() && !d.title.toLowerCase().includes(projectSearch.toLowerCase()) && !d.tags.some(t => t.toLowerCase().includes(projectSearch.toLowerCase()))) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (projectSortAsc) {
      return (a.title || '').localeCompare(b.title || '');
    }
    return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
  });

  // Recent tasks (extract from docs that act as actionable tasks or have deadlines)
  const upcomingTasks = docs.filter((d) => d.deadline || d.status !== 'completed').slice(0, 5);

  // Extract real-time team audit logs
  interface StatusLogItem {
    id: string;
    docId: string;
    docTitle: string;
    docIcon: string;
    fromStatus: DocStatus;
    toStatus: DocStatus;
    userName: string;
    userColor: string;
    timestamp: number;
  }

  const teamActivityLogs: StatusLogItem[] = [];
  docs.forEach((doc) => {
    if (doc.statusHistory && doc.statusHistory.length > 0) {
      doc.statusHistory.forEach((log) => {
        teamActivityLogs.push({
          id: log.id,
          docId: doc.id,
          docTitle: doc.title || 'Dokumen',
          docIcon: doc.icon || '📄',
          fromStatus: log.fromStatus,
          toStatus: log.toStatus,
          userName: log.changedBy?.name || 'Kolaborator',
          userColor: log.changedBy?.color || '#ECEAE4',
          timestamp: log.timestamp,
        });
      });
    } else if (doc.lastModifiedBy) {
      teamActivityLogs.push({
        id: `log_${doc.id}_${doc.lastModifiedBy.timestamp}`,
        docId: doc.id,
        docTitle: doc.title || 'Dokumen',
        docIcon: doc.icon || '📄',
        fromStatus: doc.status,
        toStatus: doc.status,
        userName: doc.lastModifiedBy.name || 'Kolaborator',
        userColor: doc.lastModifiedBy.color || '#ECEAE4',
        timestamp: doc.lastModifiedBy.timestamp,
      });
    }
  });

  teamActivityLogs.sort((a, b) => b.timestamp - a.timestamp);
  const recentActivityLogs = teamActivityLogs.slice(0, 6);

  // Preset collaborator team members for the avatar row
  const teamMembers = [
    { name: userProfile.name, initial: userProfile.name.charAt(0).toUpperCase(), bg: userProfile.color || '#ECEAE4', isUser: true },
    { name: 'Siti Rahma', initial: 'S', bg: '#EEE3DF' },
    { name: 'Budi Santoso', initial: 'B', bg: '#E2E8EE' },
    { name: 'Alex Wijaya', initial: 'A', bg: '#E3EBE3' },
  ];

  // Map icon component per project symbol
  const getProjectIcon = (doc: DocItem, idx: number) => {
    const tLower = (doc.title + doc.tags.join(' ')).toLowerCase();
    if (tLower.includes('web') || tLower.includes('platform')) return <Globe size={16} className="text-[#282925] dark:text-[#EDEDE8]" />;
    if (tLower.includes('mobile') || tLower.includes('app') || tLower.includes('hp')) return <Smartphone size={16} className="text-[#282925] dark:text-[#EDEDE8]" />;
    if (tLower.includes('desain') || tLower.includes('design') || tLower.includes('sistem')) return <Palette size={16} className="text-[#282925] dark:text-[#EDEDE8]" />;
    if (tLower.includes('email') || tLower.includes('mail') || tLower.includes('meeting')) return <Mail size={16} className="text-[#282925] dark:text-[#EDEDE8]" />;
    if (tLower.includes('komponen') || tLower.includes('api') || tLower.includes('arsitektur')) return <Component size={16} className="text-[#282925] dark:text-[#EDEDE8]" />;
    if (idx % 3 === 0) return <NotebookPen size={16} className="text-[#282925] dark:text-[#EDEDE8]" />;
    if (idx % 3 === 1) return <Globe size={16} className="text-[#282925] dark:text-[#EDEDE8]" />;
    return <Smartphone size={16} className="text-[#282925] dark:text-[#EDEDE8]" />;
  };

  // Status badge helper following Figma styling
  const renderStatusBadge = (status: DocStatus) => {
    switch (status) {
      case 'in_progress':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#EBF0F5] dark:bg-[#1C2630] text-[#5D748B] dark:text-[#90A7BD] text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5D748B]" />
            <span>{t.inProgress}</span>
          </div>
        );
      case 'completed':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#EDF3EE] dark:bg-[#1A281E] text-[#567561] dark:text-[#8CA796] text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#567561]" />
            <span>{t.completed}</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#F4F4F0] dark:bg-[#252522] text-[#777973] dark:text-[#9E9F99] text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#777973]" />
            <span>{t.notStarted}</span>
          </div>
        );
    }
  };

  // Current day context
  const todayFormatted = new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-white dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] selection:bg-[#EAEAE5] select-text">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-12 py-9 space-y-8">
        {/* ========================================================= */}
        {/* SECTION 1: Pengantar & Ringkasan Progres */}
        {/* ========================================================= */}
        <div className="space-y-6">
          {/* Greeting & Date Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#777973] dark:text-[#9E9F99]">
            <div className="flex items-center gap-2">
              <span>Selamat pagi, <strong className="font-semibold text-[#282925] dark:text-[#EDEDE8]">{userProfile.name}</strong></span>
              <span className="text-[#A1A29B]">·</span>
              <span>Workspace aktif</span>
            </div>
            <div className="text-[11px] font-medium text-[#777973] dark:text-[#9E9F99]">
              {todayFormatted}
            </div>
          </div>

          {/* Heading & "+ Proyek Baru" Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-[34px] leading-tight font-normal tracking-[-1.1px] text-[#282925] dark:text-[#EDEDE8]">
                Ringkasan Workspace
              </h1>
              <p className="text-[13px] text-[#777973] dark:text-[#9E9F99] mt-1.5">
                Pantau perkembangan proyek, tugas terdekat, dan aktivitas tim dalam satu tampilan.
              </p>
            </div>

            <button
              onClick={() => onCreateDoc(null)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-md bg-[#282925] hover:bg-[#383935] dark:bg-[#EDEDE8] dark:hover:bg-white text-white dark:text-[#181816] text-xs font-medium transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Plus size={14} />
              <span>Proyek Baru</span>
            </button>
          </div>

          {/* 4 Workspace Stats Metrics with Figma divider styling */}
          <div className="border-y border-[#EAEAE5] dark:border-[#2B2B28] py-5.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#EAEAE5] dark:divide-[#2B2B28]">
            {/* Metric 1: Proyek Aktif */}
            <div className="lg:px-6 first:pl-0 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-[#777973] dark:text-[#9E9F99]">
                <Layers size={14} className="text-[#777973] dark:text-[#9E9F99]" />
                <span>Proyek Aktif</span>
              </div>
              <div className="text-[30px] font-normal leading-tight tracking-[-1px] text-[#282925] dark:text-[#EDEDE8] font-mono">
                {totalDocs}
              </div>
              <div className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
                +3 dibuat pekan ini
              </div>
            </div>

            {/* Metric 2: Dalam Pengerjaan */}
            <div className="pt-4 sm:pt-0 lg:px-6 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-[#777973] dark:text-[#9E9F99]">
                <CircleDashed size={14} className="text-[#777973] dark:text-[#9E9F99]" />
                <span>Dalam Pengerjaan</span>
              </div>
              <div className="text-[30px] font-normal leading-tight tracking-[-1px] text-[#282925] dark:text-[#EDEDE8] font-mono">
                {inProgressDocs.length}
              </div>
              <div className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
                Fokus sprint berjalan
              </div>
            </div>

            {/* Metric 3: Diselesaikan */}
            <div className="pt-4 sm:pt-0 lg:px-6 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-[#777973] dark:text-[#9E9F99]">
                <CheckCircle2 size={14} className="text-[#777973] dark:text-[#9E9F99]" />
                <span>Diselesaikan</span>
              </div>
              <div className="text-[30px] font-normal leading-tight tracking-[-1px] text-[#282925] dark:text-[#EDEDE8] font-mono">
                {completedDocs.length}
              </div>
              <div className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
                Tepat waktu
              </div>
            </div>

            {/* Metric 4: Progres Keseluruhan */}
            <div className="pt-4 sm:pt-0 lg:px-6 last:pr-0 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs text-[#777973] dark:text-[#9E9F99]">
                <BarChart3 size={14} className="text-[#777973] dark:text-[#9E9F99]" />
                <span>Progres Keseluruhan</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[30px] font-normal leading-tight tracking-[-1px] text-[#282925] dark:text-[#EDEDE8] font-mono">
                  {completionPercent}%
                </span>
                <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
                  {completedDocs.length}/{totalDocs} tugas
                </span>
              </div>
              {/* Progress bar with 5px height & #8CA796 sage fill */}
              <div className="w-full max-w-[240px] h-[5px] bg-[#ECEEE9] dark:bg-[#2B2B28] rounded-full overflow-hidden">
                <div
                  style={{ width: `${completionPercent}%` }}
                  className="h-full bg-[#8CA796] rounded-full transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: Daftar Proyek (Table & Board view) */}
        {/* ========================================================= */}
        <div className="space-y-4">
          {/* Section Header: Title + Mode Toggle (Tabel vs Papan) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-[-0.4px] text-[#282925] dark:text-[#EDEDE8]">
                Proyek Berjalan
              </h2>
              <span className="text-xs text-[#A1A29B] font-mono font-medium">
                {filteredProjects.length}
              </span>
            </div>

            {/* View Switcher: Tabel (active) vs Papan */}
            <div className="p-0.5 bg-[#F4F4F0] dark:bg-[#20201E] rounded-md flex items-center gap-1">
              <button
                onClick={() => setProjectMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  projectMode === 'table'
                    ? 'bg-white dark:bg-[#2B2B28] text-[#282925] dark:text-white shadow-2xs font-semibold'
                    : 'text-[#777973] hover:text-[#282925] dark:text-[#9E9F99]'
                }`}
              >
                <List size={13} />
                <span>Tabel</span>
              </button>

              <button
                onClick={() => setProjectMode('board')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  projectMode === 'board'
                    ? 'bg-white dark:bg-[#2B2B28] text-[#282925] dark:text-white shadow-2xs font-semibold'
                    : 'text-[#777973] hover:text-[#282925] dark:text-[#9E9F99]'
                }`}
              >
                <Columns3 size={13} />
                <span>Papan</span>
              </button>
            </div>
          </div>

          {/* Project Toolbar: Status Tabs & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAEAE5] dark:border-[#2B2B28] pb-1">
            {/* Status Tabs */}
            <div className="flex items-center gap-5 text-xs">
              <button
                onClick={() => setProjectFilter('all')}
                className={`pb-2.5 -mb-1 flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                  projectFilter === 'all'
                    ? 'border-b-2 border-[#282925] dark:border-white text-[#282925] dark:text-white font-semibold'
                    : 'text-[#777973] hover:text-[#282925] dark:text-[#9E9F99]'
                }`}
              >
                <span>Semua</span>
                <span className="text-[10px] text-[#A1A29B] font-mono">{totalDocs}</span>
              </button>

              <button
                onClick={() => setProjectFilter('in_progress')}
                className={`pb-2.5 -mb-1 flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                  projectFilter === 'in_progress'
                    ? 'border-b-2 border-[#282925] dark:border-white text-[#282925] dark:text-white font-semibold'
                    : 'text-[#777973] hover:text-[#282925] dark:text-[#9E9F99]'
                }`}
              >
                <span>Dalam pengerjaan</span>
                <span className="text-[10px] text-[#A1A29B] font-mono">{inProgressDocs.length}</span>
              </button>

              <button
                onClick={() => setProjectFilter('completed')}
                className={`pb-2.5 -mb-1 flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                  projectFilter === 'completed'
                    ? 'border-b-2 border-[#282925] dark:border-white text-[#282925] dark:text-white font-semibold'
                    : 'text-[#777973] hover:text-[#282925] dark:text-[#9E9F99]'
                }`}
              >
                <span>Selesai</span>
                <span className="text-[10px] text-[#A1A29B] font-mono">{completedDocs.length}</span>
              </button>

              <button
                onClick={() => setProjectFilter('not_started')}
                className={`pb-2.5 -mb-1 flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                  projectFilter === 'not_started'
                    ? 'border-b-2 border-[#282925] dark:border-white text-[#282925] dark:text-white font-semibold'
                    : 'text-[#777973] hover:text-[#282925] dark:text-[#9E9F99]'
                }`}
              >
                <span>Belum mulai</span>
                <span className="text-[10px] text-[#A1A29B] font-mono">{notStartedDocs.length}</span>
              </button>
            </div>

            {/* Filter, Sort & Search controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-[#777973]" />
                <input
                  type="text"
                  placeholder="Cari proyek..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-36 sm:w-48 pl-8 pr-2.5 py-1 text-xs rounded-md border border-[#EAEAE5] dark:border-[#2B2B28] bg-white dark:bg-[#1A1A18] text-[#282925] dark:text-[#EDEDE8] placeholder-[#A1A29B] focus:outline-none"
                />
              </div>

              <button
                onClick={() => setProjectSortAsc(!projectSortAsc)}
                title="Urutkan proyek"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#EAEAE5] dark:border-[#2B2B28] bg-white dark:bg-[#1A1A18] text-xs font-medium text-[#282925] dark:text-[#EDEDE8] hover:bg-[#F8F8F6] transition-colors"
              >
                <ArrowUpDown size={12} className="text-[#777973]" />
                <span className="hidden sm:inline">Urutkan</span>
              </button>
            </div>
          </div>

          {/* Table Mode View */}
          {projectMode === 'table' ? (
            <div className="border-t border-[#EAEAE5] dark:border-[#2B2B28] overflow-x-auto">
              {/* Table Column Header */}
              <div className="min-w-[760px] h-8 bg-[#F8F8F6] dark:bg-[#181816] border-b border-[#EAEAE5] dark:border-[#2B2B28] px-3 flex items-center text-[10px] font-normal uppercase tracking-wider text-[#777973] dark:text-[#9E9F99]">
                <div className="flex-1 min-w-[260px]">KOLOM NAMA</div>
                <div className="w-36 px-2">STATUS</div>
                <div className="w-40 px-2">PENYELESAIAN TUGAS</div>
                <div className="w-32 px-2">DIUBAH OLEH</div>
                <div className="w-28 px-2">TENGGAT</div>
                <div className="w-10 text-right">AKSI</div>
              </div>

              {/* Table Body Rows */}
              <div className="divide-y divide-[#EAEAE5] dark:divide-[#2B2B28] min-w-[760px]">
                {filteredProjects.map((doc, idx) => {
                  const isDone = doc.status === 'completed';
                  const taskPercent = isDone ? 100 : doc.status === 'in_progress' ? 65 : 15;
                  const category = doc.tags?.[0] || 'Produk & Rencana';
                  const modifier = doc.lastModifiedBy?.name || 'Randye';
                  const modifierColor = doc.lastModifiedBy?.color || '#ECEAE4';

                  return (
                    <div
                      key={doc.id}
                      onClick={() => onSelectDoc(doc.id)}
                      className="h-15 px-3 flex items-center hover:bg-[#F8F8F6]/80 dark:hover:bg-[#1A1A18] transition-colors group cursor-pointer"
                    >
                      {/* Project Identity */}
                      <div className="flex-1 min-w-[260px] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-[#F4F4F0] dark:bg-[#242422] flex items-center justify-center shrink-0">
                          {getProjectIcon(doc, idx)}
                        </div>
                        <div className="min-w-0 pr-2">
                          <div className="text-[13px] font-medium text-[#282925] dark:text-[#EDEDE8] truncate group-hover:underline">
                            {doc.title || t.emptyTitle}
                          </div>
                          <div className="text-[10px] text-[#777973] dark:text-[#9E9F99] truncate">
                            {category}
                          </div>
                        </div>
                      </div>

                      {/* Status Selector */}
                      <div className="w-36 px-2" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={doc.status}
                          onChange={(e) => onUpdateDoc(doc.id, { status: e.target.value as DocStatus, updatedAt: Date.now() })}
                          className="bg-transparent border-none text-[11px] font-medium text-[#282925] dark:text-[#EDEDE8] focus:outline-none cursor-pointer"
                        >
                          <option value="not_started">⚪ Belum mulai</option>
                          <option value="in_progress">🔵 Dalam pengerjaan</option>
                          <option value="completed">🟢 Selesai</option>
                          <option value="archived">🟡 Diarsipkan</option>
                        </select>
                      </div>

                      {/* Task Completion & Progress Bar */}
                      <div className="w-40 px-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#282925] dark:text-[#EDEDE8] font-medium">{taskPercent}%</span>
                          <span className="text-[10px] text-[#777973]">{isDone ? 'Semua selesai' : '5/8 tugas'}</span>
                        </div>
                        <div className="w-full h-[5px] bg-[#ECEEE9] dark:bg-[#2B2B28] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${taskPercent}%` }}
                            className="h-full bg-[#8CA796] rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>

                      {/* Modifier Avatar & Name */}
                      <div className="w-32 px-2 flex items-center gap-1.5 min-w-0">
                        <div
                          style={{ backgroundColor: modifierColor }}
                          className="w-5 h-5 rounded-full text-[#777973] dark:text-[#181816] text-[9px] font-bold flex items-center justify-center shrink-0 border border-white dark:border-[#282925]"
                        >
                          {modifier.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-[#282925] dark:text-[#EDEDE8] truncate">
                          {modifier}
                        </span>
                      </div>

                      {/* Deadline Date */}
                      <div className="w-28 px-2 flex items-center gap-1.5 text-xs text-[#282925] dark:text-[#EDEDE8] font-mono">
                        {isDone && <Check size={12} className="text-[#567561] shrink-0" />}
                        <span>{doc.deadline ? doc.deadline.slice(5) : '18 Nov'}</span>
                      </div>

                      {/* Action Menu */}
                      <div className="w-10 text-right text-[#777973]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDoc(doc.id);
                          }}
                          className="p-1 rounded hover:bg-[#EAEAE5] dark:hover:bg-[#2B2B28] transition-colors"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Project Action Link */}
              <div
                onClick={() => onCreateDoc(null)}
                className="py-3 px-3 border-t border-[#EAEAE5] dark:border-[#2B2B28] flex items-center gap-2 text-xs text-[#777973] hover:text-[#282925] dark:hover:text-white cursor-pointer transition-colors"
              >
                <Plus size={14} />
                <span>Tambah proyek baru</span>
              </div>
            </div>
          ) : (
            /* Board Mode View (Kanban style following Figma aesthetic) */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {[
                { key: 'not_started', label: 'Belum Mulai', docs: notStartedDocs, dot: 'bg-[#777973]' },
                { key: 'in_progress', label: 'Dalam Pengerjaan', docs: inProgressDocs, dot: 'bg-[#5D748B]' },
                { key: 'completed', label: 'Selesai', docs: completedDocs, dot: 'bg-[#567561]' },
              ].map((column) => (
                <div
                  key={column.key}
                  className="bg-[#F8F8F6] dark:bg-[#181816] rounded-lg p-3 border border-[#EAEAE5] dark:border-[#2B2B28] flex flex-col min-h-[300px]"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EAEAE5] dark:border-[#2B2B28] text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${column.dot}`} />
                      <span>{column.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#A1A29B]">{column.docs.length}</span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {column.docs.map((item, i) => (
                      <div
                        key={item.id}
                        onClick={() => onSelectDoc(item.id)}
                        className="p-3 bg-white dark:bg-[#20201E] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-md shadow-2xs hover:shadow-xs transition-shadow cursor-pointer space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-[#F4F4F0] dark:bg-[#282925] flex items-center justify-center shrink-0">
                            {getProjectIcon(item, i)}
                          </div>
                          <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] truncate">
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#777973]">
                          <span>{item.tags[0] || 'Umum'}</span>
                          <span>{item.deadline || '18 Nov'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: Tugas dan Kolaborasi (2 Kolom) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          {/* Kolom Kiri (744px / 8 cols): Tugas Terdekat */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo size={18} className="text-[#282925] dark:text-[#EDEDE8]" />
                <h3 className="text-[17px] font-semibold tracking-[-0.4px] text-[#282925] dark:text-[#EDEDE8]">
                  Tugas Terdekat
                </h3>
              </div>

              <button
                onClick={() => onSelectView('database_table')}
                className="flex items-center gap-1 text-[11px] text-[#777973] hover:text-[#282925] dark:hover:text-white font-medium"
              >
                <span>Semua tugas</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            <p className="text-xs text-[#777973] dark:text-[#9E9F99]">
              Tugas dengan tenggat waktu paling mendesak pekan ini.
            </p>

            {/* Task list with interactive checkboxes */}
            <div className="border-t border-[#EAEAE5] dark:border-[#2B2B28] divide-y divide-[#EAEAE5] dark:divide-[#2B2B28]">
              {upcomingTasks.map((task) => {
                const isCompleted = task.status === 'completed';
                const assignee = task.lastModifiedBy?.name || 'Randye';
                const priorityColor = task.priority === 'high' ? 'bg-[#967846]' : 'bg-[#A1A29B]';
                const priorityLabel = task.priority === 'high' ? 'Tinggi' : task.priority === 'medium' ? 'Sedang' : 'Rendah';

                return (
                  <div
                    key={task.id}
                    className="py-3 px-1 flex items-center gap-3 hover:bg-[#F8F8F6]/60 dark:hover:bg-[#181816]/60 transition-colors group"
                  >
                    {/* Checkbox square 16x16px */}
                    <button
                      type="button"
                      onClick={() => {
                        const newStatus: DocStatus = isCompleted ? 'in_progress' : 'completed';
                        onUpdateDoc(task.id, { status: newStatus, updatedAt: Date.now() });
                      }}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        isCompleted
                          ? 'bg-[#8CA796] border-[#8CA796] text-white'
                          : 'bg-white dark:bg-[#1A1A18] border-[#CDCEC7] dark:border-[#444540] hover:border-[#282925]'
                      }`}
                    >
                      {isCompleted && <Check size={11} />}
                    </button>

                    {/* Task Title & Project */}
                    <div
                      onClick={() => onSelectDoc(task.id)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div
                        className={`text-xs font-medium truncate ${
                          isCompleted
                            ? 'line-through text-[#A1A29B]'
                            : 'text-[#282925] dark:text-[#EDEDE8] group-hover:underline'
                        }`}
                      >
                        {task.title || t.emptyTitle}
                      </div>
                      <div className="text-[10px] text-[#777973] truncate">
                        {task.tags?.[0] || 'Proyek Roadmap'}
                      </div>
                    </div>

                    {/* Priority Dot & Label */}
                    <div className="flex items-center gap-1.5 text-[10px] text-[#777973] shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${priorityColor}`} />
                      <span>{priorityLabel}</span>
                    </div>

                    {/* Assignee Avatar */}
                    <div
                      title={assignee}
                      className="w-6 h-6 rounded-full bg-[#EEE3DF] dark:bg-[#302B28] border-2 border-white dark:border-[#20201E] text-[9px] font-bold text-[#777973] dark:text-[#A1A29B] flex items-center justify-center shrink-0"
                    >
                      {assignee.charAt(0).toUpperCase()}
                    </div>

                    {/* Due Date */}
                    <div
                      className={`w-16 text-right text-[10px] font-mono shrink-0 ${
                        isCompleted ? 'text-[#567561]' : 'text-[#967846]'
                      }`}
                    >
                      {task.deadline ? task.deadline.slice(5) : 'Hari ini'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick add task */}
            <div
              onClick={() => onCreateDoc(null)}
              className="pt-2 flex items-center gap-1.5 text-xs text-[#777973] hover:text-[#282925] dark:hover:text-white cursor-pointer transition-colors"
            >
              <Plus size={13} />
              <span>Tambah tugas baru</span>
            </div>
          </div>

          {/* Kolom Kanan (344px / 4 cols): Kabar dari Tim */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[#EAEAE5] dark:border-[#2B2B28] lg:pl-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-semibold tracking-[-0.4px] text-[#282925] dark:text-[#EDEDE8]">
                Kabar dari Tim
              </h3>
              <span className="text-xs text-[#777973] font-mono">
                {teamMembers.length} anggota
              </span>
            </div>

            {/* Team Members Row */}
            <div className="flex items-center justify-between gap-2">
              {teamMembers.map((member) => (
                <div key={member.name} className="flex flex-col items-center gap-1 text-center">
                  <div
                    style={{ backgroundColor: member.bg }}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-[#20201E] text-[#777973] text-[11px] font-bold flex items-center justify-center shadow-2xs"
                  >
                    {member.initial}
                  </div>
                  <span className="text-[10px] text-[#777973] max-w-[42px] truncate">
                    {member.name.split(' ')[0]}
                  </span>
                </div>
              ))}

              {/* Add / Invite Button */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => alert('Tautan undangan workspace telah disalin ke papan klip!')}
                  className="w-8 h-8 rounded-full border border-dashed border-[#CDCEC7] dark:border-[#444540] flex items-center justify-center text-[#777973] hover:text-[#282925] hover:border-[#282925] transition-colors cursor-pointer"
                  title="Undang anggota baru"
                >
                  <Plus size={14} />
                </button>
                <span className="text-[10px] text-[#777973]">Undang</span>
              </div>
            </div>

            <hr className="border-[#EAEAE5] dark:border-[#2B2B28]" />

            {/* Activity History Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">
                <span>Aktivitas Terkini</span>
                <History size={14} className="text-[#777973]" />
              </div>

              {recentActivityLogs.length > 0 ? (
                <div className="space-y-3">
                  {recentActivityLogs.map((act) => (
                    <div key={act.id} className="flex items-start gap-2.5 text-xs">
                      <div
                        style={{ backgroundColor: act.userColor }}
                        className="w-6 h-6 rounded-full border border-white dark:border-[#20201E] text-[#777973] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                      >
                        {act.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] leading-snug font-medium text-[#282925] dark:text-[#EDEDE8]">
                          <strong>{act.userName}</strong>{' '}
                          <span className="font-normal text-[#777973]">
                            memperbarui status pada
                          </span>{' '}
                          <span
                            onClick={() => onSelectDoc(act.docId)}
                            className="font-medium hover:underline cursor-pointer"
                          >
                            {act.docTitle}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#A1A29B] font-mono mt-0.5">
                          {formatTimeAgo(act.timestamp, lang)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[#A1A29B] italic py-2">
                  Belum ada catatan aktivitas baru.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
