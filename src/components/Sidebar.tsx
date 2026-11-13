import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Search,
  Wifi,
  WifiOff,
  RefreshCw,
  Copy,
  X,
  Home,
  Inbox,
  CheckCircle2,
  FolderOpen,
  CalendarDays,
  FileText,
  Users,
  Globe,
  Smartphone,
  Palette,
  UserPlus,
  Settings2,
  ChevronsUpDown,
  ArrowRight,
  Star,
  Lock,
  ChartNoAxesCombined
} from 'lucide-react';
import { DocItem, ActiveView, Language, SyncState, Collaborator } from '../types';
import { translations } from '../utils/i18n';
import {
  WEB_PROJECT_DOC_ID,
  MOBILE_PROJECT_DOC_ID,
  DESIGN_PROJECT_DOC_ID,
} from '../utils/seedData';

interface SidebarProps {
  docs: DocItem[];
  activeDocId: string | null;
  activeView: ActiveView;
  lang: Language;
  syncState: SyncState;
  collaborators: Collaborator[];
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSelectDoc: (id: string) => void;
  onSelectView: (view: ActiveView) => void;
  onCreateDoc: (parentId?: string | null) => void;
  onDeleteDoc: (id: string) => void;
  onDuplicateDoc: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onManualSync?: () => void;
  userProfile?: { userId: string; name: string; color: string };
  onOpenNotificationModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  docs,
  activeDocId,
  activeView,
  lang,
  syncState,
  collaborators,
  isOpenMobile,
  onCloseMobile,
  onSelectDoc,
  onSelectView,
  onCreateDoc,
  onDeleteDoc,
  onDuplicateDoc,
  onToggleFavorite,
  onManualSync,
  userProfile = { userId: 'u1', name: 'Nabila A.', color: '#6366F1' },
  onOpenNotificationModal,
}) => {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [showDocTree, setShowDocTree] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredDocs = searchQuery.trim()
    ? docs.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : docs;

  const favoriteDocs = docs.filter(
    (d) =>
      d.isFavorite &&
      d.id !== 'doc-portfolio-web' &&
      d.id !== 'doc-habit-tracker' &&
      d.id !== 'doc-kopi-sore'
  );

  const getChildren = (parentId: string | null) => {
    return filteredDocs.filter((d) => d.parentId === parentId);
  };

  const handleDocClick = (id: string) => {
    onSelectDoc(id);
    onSelectView('editor');
    onCloseMobile();
  };

  const handleViewClick = (view: ActiveView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const handleInviteClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const renderDocNode = (doc: DocItem, level = 0) => {
    const children = getChildren(doc.id);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedNodes[doc.id];
    const isSelected = activeView === 'editor' && activeDocId === doc.id;

    return (
      <div key={doc.id} className="select-none">
        <div
          onClick={() => handleDocClick(doc.id)}
          style={{ paddingLeft: `${Math.max(8, level * 12 + 8)}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded text-xs cursor-pointer transition-colors duration-150 ${
            isSelected
              ? 'bg-[#EAEAE5] dark:bg-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] font-semibold'
              : 'text-[#777973] dark:text-[#A1A29B] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925] dark:hover:text-[#EDEDE8]'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {hasChildren ? (
              <button
                onClick={(e) => toggleCollapse(doc.id, e)}
                className="p-0.5 rounded text-[#777973] hover:text-[#282925] dark:hover:text-white"
              >
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              </button>
            ) : (
              <span className="w-3 inline-block" />
            )}
            <span className="text-xs shrink-0">{doc.icon || '📄'}</span>
            <span className="truncate">{doc.title || t.emptyTitle}</span>
            {doc.isEncrypted && (
              <Lock size={10} className="text-amber-500 shrink-0 ml-0.5" />
            )}
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              title={t.newSubDoc}
              onClick={(e) => {
                e.stopPropagation();
                onCreateDoc(doc.id);
                onCloseMobile();
              }}
              className="p-0.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-slate-700 text-[#777973]"
            >
              <Plus size={11} />
            </button>
            <button
              title={t.duplicateDoc}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateDoc(doc.id);
              }}
              className="p-0.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-slate-700 text-[#777973]"
            >
              <Copy size={11} />
            </button>
            <button
              title={t.deleteDoc}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDoc(doc.id);
              }}
              className="p-0.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-slate-700 text-rose-500"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="relative">
            <div 
              className="absolute left-[14px] top-0 bottom-0 w-px bg-[#EAEAE5] dark:bg-[#2B2B28]"
              style={{ left: `${level * 12 + 14}px` }}
            />
            {children.map((child) => renderDocNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootDocs = getChildren(null);
  const activeTasksCount = docs.filter((d) => d.status === 'in_progress' || d.status === 'not_started').length;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Main Sidebar Drawer (Figma width: 224px, bg: #F8F8F6, border-r: #EAEAE5) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-[224px] min-w-[224px] max-w-[224px] h-screen bg-[#F8F8F6] dark:bg-[#181816] border-r border-[#EAEAE5] dark:border-[#2B2B28] flex flex-col justify-between p-[22px_12px_18px] select-none transition-transform duration-200 ease-in-out shrink-0 overflow-y-auto ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* 1. Identitas Workspace (Figma: Logo 28x28 #282925, Monogram 'N', Nama, Chevrons) */}
          <div className="flex items-center justify-between px-2 h-7">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-[6px] bg-[#282925] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                N
              </div>
              <span className="font-semibold text-sm text-[#282925] dark:text-[#EDEDE8] truncate">
                Ruang Bersama
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ChevronsUpDown size={14} className="text-[#777973] shrink-0" />
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1 text-[#777973] hover:text-[#282925]"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* 2. Menu Utama (Figma: Cari ⌘K, Kotak masuk 8, Ringkasan, Tugas saya 7) */}
          <nav className="flex flex-col gap-[3px]">
            {/* Quick Search */}
            <div className="relative flex items-center px-2.5 h-9 rounded bg-[#F8F8F6] dark:bg-[#181816] text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] transition-colors cursor-pointer group">
              <Search size={16} className="text-[#777973] shrink-0 mr-2.5" />
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-[13px] text-[#282925] dark:text-[#EDEDE8] placeholder-[#777973] focus:outline-none"
              />
              <span className="text-[11px] text-[#777973] shrink-0 group-hover:text-[#282925] font-mono">
                ⌘K
              </span>
            </div>

            {/* Kotak Masuk */}
            <button
              onClick={() => {
                if (onOpenNotificationModal) onOpenNotificationModal();
                onCloseMobile();
              }}
              className="flex items-center justify-between px-2.5 h-9 rounded bg-[#F8F8F6] dark:bg-[#181816] text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Inbox size={16} className="text-[#777973] shrink-0" />
                <span className="text-[13px] font-normal">Kotak masuk</span>
              </div>
              <span className="text-[11px] text-[#777973]">8</span>
            </button>

            {/* Ringkasan (Overview) */}
            <button
              onClick={() => handleViewClick('overview')}
              className={`flex items-center justify-between px-2.5 h-9 rounded transition-colors ${
                activeView === 'overview'
                  ? 'bg-[#EAEAE5] dark:bg-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                  : 'bg-[#F8F8F6] dark:bg-[#181816] text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Home size={16} className={activeView === 'overview' ? 'text-[#282925] dark:text-[#EDEDE8]' : 'text-[#777973]'} />
                <span className="text-[13px]">Ringkasan</span>
              </div>
            </button>

            {/* Tugas Saya */}
            <button
              onClick={() => handleViewClick('database_board')}
              className={`flex items-center justify-between px-2.5 h-9 rounded transition-colors ${
                activeView === 'database_board'
                  ? 'bg-[#EAEAE5] dark:bg-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                  : 'bg-[#F8F8F6] dark:bg-[#181816] text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#777973]" />
                <span className="text-[13px] font-normal">Tugas saya</span>
              </div>
              <span className="text-[11px] text-[#777973]">{activeTasksCount || 7}</span>
            </button>

            {/* Evaluasi (Figma: Menu evaluasi aktif bg #EAECE5, chart-no-axes-combined) */}
            <button
              onClick={() => handleViewClick('evaluasi')}
              className={`flex items-center justify-between px-2.5 h-9 rounded transition-colors ${
                activeView === 'evaluasi'
                  ? 'bg-[#EAECE5] dark:bg-[#252822] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                  : 'bg-[#F8F8F6] dark:bg-[#181816] text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ChartNoAxesCombined size={15} className={activeView === 'evaluasi' ? 'text-[#282925] dark:text-[#EDEDE8]' : 'text-[#777973]'} />
                <span className="text-[13px]">Evaluasi</span>
              </div>
            </button>
          </nav>

          {/* 3. Halaman Workspace (Figma: HALAMAN + Proyek aktif 4, Kalender kerja, Catatan & Dokumen, Tim & Kolaborator 5) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2.5">
              <span className="text-[11px] font-medium text-[#A1A29B] tracking-wider uppercase">
                Halaman
              </span>
              <button
                onClick={() => {
                  onCreateDoc(null);
                  onCloseMobile();
                }}
                title="Halaman Baru"
                className="text-[#777973] hover:text-[#282925] transition-colors"
              >
                <Plus size={13} />
              </button>
            </div>

            <div className="flex flex-col gap-[3px]">
              {/* Proyek Aktif */}
              <button
                onClick={() => handleViewClick('database_table')}
                className={`flex items-center justify-between px-2.5 h-9 rounded transition-colors ${
                  activeView === 'database_table'
                    ? 'bg-[#EAEAE5] dark:bg-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                    : 'bg-[#F8F8F6] dark:bg-[#181816] text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FolderOpen size={16} className="text-[#777973] shrink-0" />
                  <span className="text-[13px]">Proyek aktif</span>
                </div>
                <span className="text-[11px] text-[#777973]">{docs.length || 4}</span>
              </button>

              {/* Kalender Kerja */}
              <button
                onClick={() => handleViewClick('database_calendar')}
                className={`flex items-center justify-between px-2.5 h-9 rounded transition-colors ${
                  activeView === 'database_calendar'
                    ? 'bg-[#EAEAE5] dark:bg-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                    : 'bg-[#F8F8F6] dark:bg-[#181816] text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays size={16} className="text-[#777973] shrink-0" />
                  <span className="text-[13px]">Kalender kerja</span>
                </div>
              </button>

              {/* Catatan & Dokumen */}
              <button
                onClick={() => {
                  setShowDocTree(!showDocTree);
                  if (activeView !== 'editor') handleViewClick('editor');
                }}
                className={`flex items-center justify-between px-2.5 h-9 rounded transition-colors ${
                  activeView === 'editor'
                    ? 'bg-[#EAEAE5] dark:bg-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                    : 'bg-[#F8F8F6] dark:bg-[#181816] text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={16} className="text-[#777973] shrink-0" />
                  <span className="text-[13px]">Catatan & Dokumen</span>
                </div>
                {showDocTree ? <ChevronDown size={13} className="text-[#777973]" /> : <ChevronRight size={13} className="text-[#777973]" />}
              </button>

              {/* Nested Document Subtree */}
              {showDocTree && (
                <div className="pl-2 pr-1 py-1 flex flex-col gap-0.5 max-h-48 overflow-y-auto border-l border-[#EAEAE5] dark:border-[#2B2B28] ml-4 mt-0.5">
                  {rootDocs.length > 0 ? (
                    rootDocs.map((doc) => renderDocNode(doc, 0))
                  ) : (
                    <div className="text-[11px] text-[#A1A29B] px-2 py-1">Belum ada dokumen</div>
                  )}
                </div>
              )}

              {/* Tim & Kolaborator */}
              <button
                onClick={() => handleViewClick('analytics')}
                className={`flex items-center justify-between px-2.5 h-9 rounded transition-colors ${
                  activeView === 'analytics'
                    ? 'bg-[#EAEAE5] dark:bg-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                    : 'bg-[#F8F8F6] dark:bg-[#181816] text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users size={16} className="text-[#777973] shrink-0" />
                  <span className="text-[13px]">Tim & Kolaborator</span>
                </div>
                <span className="text-[11px] text-[#777973]">{collaborators.length || 5}</span>
              </button>
            </div>
          </div>

          {/* 4. Proyek Favorit (Figma: PROYEK FAVORIT + Platform Web, Aplikasi Mobile, Desain Sistem) */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-[#A1A29B] tracking-wider uppercase px-2.5">
              Proyek Favorit
            </span>

            <div className="flex flex-col gap-[3px]">
              {(() => {
                const webDoc = docs.find((d) => d.id === WEB_PROJECT_DOC_ID);
                const mobileDoc = docs.find((d) => d.id === MOBILE_PROJECT_DOC_ID);
                const designDoc = docs.find((d) => d.id === DESIGN_PROJECT_DOC_ID);
                return (
                  <>
                    <button
                      onClick={() => handleViewClick('project_web')}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[5px] transition-colors text-left ${
                        activeView === 'project_web'
                          ? 'bg-[#E9EBE3] dark:bg-[#252822] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                          : 'text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925]'
                      }`}
                    >
                      <Globe size={16} className={activeView === 'project_web' ? 'text-[#282925] dark:text-[#EDEDE8] shrink-0' : 'text-[#777973] shrink-0'} />
                      <div className="flex flex-col min-w-0 leading-tight">
                        <span className="text-[12.5px] truncate">Platform Web</span>
                        {webDoc?.title && (
                          <span className="text-[10px] font-normal text-[#A1A29B] truncate">
                            {webDoc.title}
                          </span>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => handleViewClick('project_mobile')}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[5px] transition-colors text-left ${
                        activeView === 'project_mobile'
                          ? 'bg-[#E9EBE3] dark:bg-[#252822] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                          : 'text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925]'
                      }`}
                    >
                      <Smartphone size={16} className={activeView === 'project_mobile' ? 'text-[#282925] dark:text-[#EDEDE8] shrink-0' : 'text-[#777973] shrink-0'} />
                      <div className="flex flex-col min-w-0 leading-tight">
                        <span className="text-[12.5px] truncate">Aplikasi Mobile</span>
                        {mobileDoc?.title && (
                          <span className="text-[10px] font-normal text-[#A1A29B] truncate">
                            {mobileDoc.title}
                          </span>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => handleViewClick('project_design')}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[5px] transition-colors text-left ${
                        activeView === 'project_design'
                          ? 'bg-[#E9EBE3] dark:bg-[#252822] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                          : 'text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925]'
                      }`}
                    >
                      <Palette size={16} className={activeView === 'project_design' ? 'text-[#282925] dark:text-[#EDEDE8] shrink-0' : 'text-[#777973] shrink-0'} />
                      <div className="flex flex-col min-w-0 leading-tight">
                        <span className="text-[12.5px] truncate">Desain Sistem</span>
                        {designDoc?.title && (
                          <span className="text-[10px] font-normal text-[#A1A29B] truncate">
                            {designDoc.title}
                          </span>
                        )}
                      </div>
                    </button>
                  </>
                );
              })()}

              {favoriteDocs.map((fav) => (
                <button
                  key={fav.id}
                  onClick={() => handleDocClick(fav.id)}
                  className="flex items-center gap-2.5 px-2.5 h-9 rounded text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925] transition-colors text-left"
                >
                  <span className="text-sm shrink-0">{fav.icon || '⭐'}</span>
                  <span className="text-[13px] truncate">{fav.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Bottom Section: Ajakan Berkolaborasi Card & Pengaturan Akun */}
        <div className="flex flex-col gap-4 pt-4 mt-4">
          {/* Ajakan berkolaborasi Card (Figma: border 1px #EAEAE5, bg #FFF, padding 12px) */}
          <div className="bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] p-3 flex flex-col gap-2">
            <UserPlus size={18} className="text-[#282925] dark:text-[#EDEDE8]" />
            <div className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">
              Undang anggota tim
            </div>
            <p className="text-[11px] text-[#777973] dark:text-[#A1A29B] leading-relaxed">
              Kolaborasi real-time lebih seru bersama rekan kerja Anda
            </p>
            <button
              onClick={handleInviteClick}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-[#282925] dark:text-[#EDEDE8] hover:underline pt-0.5 cursor-pointer text-left"
            >
              <span>{copyFeedback ? 'Tautan disalin!' : 'Undang teman'}</span>
              <ArrowRight size={12} className="text-[#777973]" />
            </button>
          </div>

          {/* Pengaturan & Akun Aktif (Figma: settings-2, divider, avatar 30px #ECEAE4, Nabila A., Anggota aktif) */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => handleViewClick('analytics')}
              className="flex items-center gap-2.5 px-2.5 h-9 rounded text-[#777973] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] hover:text-[#282925] transition-colors text-left"
            >
              <Settings2 size={16} className="text-[#777973] shrink-0" />
              <span className="text-[13px]">Pengaturan</span>
            </button>

            {/* Pemisah */}
            <div className="h-px bg-[#EAEAE5] dark:bg-[#2B2B28] w-full" />

            {/* Akun Aktif Row */}
            <div className="flex items-center justify-between px-1.5 py-1">
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  style={{ backgroundColor: userProfile.color || '#ECEAE4' }}
                  className="w-[30px] h-[30px] rounded-full border-2 border-white dark:border-[#181816] flex items-center justify-center text-[11px] font-semibold text-white shadow-xs shrink-0"
                >
                  {userProfile.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'NA'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] truncate">
                    {userProfile.name || 'Nabila A.'}
                  </span>
                  <span className="text-[10px] text-[#777973]">
                    Anggota aktif
                  </span>
                </div>
              </div>
              <ChevronsUpDown size={14} className="text-[#777973] shrink-0" />
            </div>

            {/* Sync connection status mini indicator */}
            <div className="flex items-center justify-between px-1.5 pt-1 text-[10px] text-[#A1A29B]">
              <button
                onClick={onManualSync}
                className="flex items-center gap-1 hover:text-[#282925] cursor-pointer"
              >
                {syncState.isOnline ? (
                  <Wifi size={11} className="text-emerald-500" />
                ) : (
                  <WifiOff size={11} className="text-amber-500" />
                )}
                <span>{syncState.isSyncing ? 'Sinkron...' : syncState.isOnline ? 'Tersambung' : 'Offline'}</span>
              </button>
              <button
                onClick={onManualSync}
                className="hover:text-[#282925] cursor-pointer"
              >
                <RefreshCw size={10} className={syncState.isSyncing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
