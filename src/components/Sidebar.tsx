import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  FileText, 
  Table, 
  Kanban, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Lock, 
  Star, 
  FolderTree, 
  Search,
  Wifi,
  WifiOff,
  RefreshCw,
  Copy,
  Layers
} from 'lucide-react';
import { DocItem, ActiveView, Language, SyncState, Collaborator } from '../types';
import { translations } from '../utils/i18n';

interface SidebarProps {
  docs: DocItem[];
  activeDocId: string | null;
  activeView: ActiveView;
  lang: Language;
  syncState: SyncState;
  collaborators: Collaborator[];
  onSelectDoc: (id: string) => void;
  onSelectView: (view: ActiveView) => void;
  onCreateDoc: (parentId?: string | null) => void;
  onDeleteDoc: (id: string) => void;
  onDuplicateDoc: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  docs,
  activeDocId,
  activeView,
  lang,
  syncState,
  collaborators,
  onSelectDoc,
  onSelectView,
  onCreateDoc,
  onDeleteDoc,
  onDuplicateDoc,
  onToggleFavorite,
}) => {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter docs
  const filteredDocs = searchQuery.trim()
    ? docs.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : docs;

  const favoriteDocs = docs.filter((d) => d.isFavorite);

  // Group by parentId
  const getChildren = (parentId: string | null) => {
    return filteredDocs.filter((d) => d.parentId === parentId);
  };

  const renderDocNode = (doc: DocItem, level = 0) => {
    const children = getChildren(doc.id);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedNodes[doc.id];
    const isSelected = activeView === 'editor' && activeDocId === doc.id;

    return (
      <div key={doc.id} className="select-none">
        <div
          onClick={() => {
            onSelectDoc(doc.id);
            onSelectView('editor');
          }}
          style={{ paddingLeft: `${Math.max(12, level * 16 + 12)}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2.5 rounded-md text-xs font-medium cursor-pointer transition-colors duration-150 ${
            isSelected
              ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {hasChildren ? (
              <button
                onClick={(e) => toggleCollapse(doc.id, e)}
                className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>
            ) : (
              <span className="w-3.5 inline-block" />
            )}
            <span className="text-sm shrink-0">{doc.icon || '📄'}</span>
            <span className="truncate">{doc.title || t.emptyTitle}</span>
            {doc.isEncrypted && (
              <Lock size={11} className="text-amber-500 shrink-0 ml-0.5" />
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              title={t.newSubDoc}
              onClick={(e) => {
                e.stopPropagation();
                onCreateDoc(doc.id);
              }}
              className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <Plus size={12} />
            </button>
            <button
              title={t.duplicateDoc}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateDoc(doc.id);
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <Copy size={12} />
            </button>
            <button
              title={t.deleteDoc}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDoc(doc.id);
              }}
              className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="relative">
            {/* Guide line for nested tree */}
            <div 
              className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800"
              style={{ left: `${level * 16 + 18}px` }}
            />
            {children.map((child) => renderDocNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootDocs = getChildren(null);

  return (
    <aside className="w-64 h-screen bg-slate-50/70 dark:bg-slate-900/60 border-r border-slate-200/80 dark:border-slate-800 flex flex-col shrink-0 select-none">
      {/* Workspace Brand Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-indigo-500/30">
              N
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                {t.appName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                {t.tagline}
              </div>
            </div>
          </div>

          <button
            title={t.newDoc}
            onClick={() => onCreateDoc(null)}
            className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Quick Search */}
        <div className="mt-3 relative">
          <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-md py-1.5 pl-8 pr-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Navigation Views */}
      <div className="px-2 pt-2 pb-1 space-y-0.5 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => onSelectView('database_table')}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeView === 'database_table'
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Table size={14} className="text-indigo-500" />
          <span>{t.tableView}</span>
        </button>

        <button
          onClick={() => onSelectView('database_board')}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeView === 'database_board'
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Kanban size={14} className="text-emerald-500" />
          <span>{t.boardView}</span>
        </button>

        <button
          onClick={() => onSelectView('database_calendar')}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeView === 'database_calendar'
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <CalendarIcon size={14} className="text-amber-500" />
          <span>{t.calendarView}</span>
        </button>

        <button
          onClick={() => onSelectView('analytics')}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeView === 'analytics'
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <BarChart3 size={14} className="text-purple-500" />
          <span>{t.analytics}</span>
        </button>
      </div>

      {/* Hierarchical Document Tree */}
      <div className="flex-1 overflow-y-auto px-1 py-2">
        {/* Favorites section if any */}
        {favoriteDocs.length > 0 && !searchQuery && (
          <div className="mb-3">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Star size={11} className="text-amber-400" />
              <span>{t.favorites}</span>
            </div>
            {favoriteDocs.map((doc) => (
              <div
                key={`fav-${doc.id}`}
                onClick={() => {
                  onSelectDoc(doc.id);
                  onSelectView('editor');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  activeView === 'editor' && activeDocId === doc.id
                    ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>{doc.icon || '📄'}</span>
                <span className="truncate">{doc.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Workspace Documents Header */}
        <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1">
            <FolderTree size={11} />
            <span>{t.allDocs} ({docs.length})</span>
          </span>
          <button
            onClick={() => onCreateDoc(null)}
            className="hover:text-slate-700 dark:hover:text-slate-200"
            title={t.newDoc}
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Tree List */}
        <div className="mt-1 space-y-0.5">
          {rootDocs.length > 0 ? (
            rootDocs.map((doc) => renderDocNode(doc, 0))
          ) : (
            <div className="px-3 py-4 text-center text-xs text-slate-400">
              {t.noSubPages}
            </div>
          )}
        </div>
      </div>

      {/* Offline Status & Sync Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900 text-xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            {syncState.isOnline ? (
              <Wifi size={13} className="text-emerald-500" />
            ) : (
              <WifiOff size={13} className="text-amber-500" />
            )}
            <span className="text-[11px] font-medium">
              {syncState.isOnline
                ? syncState.isSyncing
                  ? t.syncing
                  : t.synced
                : t.offline}
            </span>
          </div>

          {syncState.pendingCount > 0 && (
            <span className="text-[10px] text-amber-500 flex items-center gap-1">
              <RefreshCw size={10} className="animate-spin" />
              {syncState.pendingCount} {t.pendingSync}
            </span>
          )}
        </div>

        {/* Collaborators presence footer */}
        {collaborators.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">{t.collaborators}:</span>
            <div className="flex -space-x-1.5">
              {collaborators.slice(0, 4).map((c) => (
                <div
                  key={c.userId}
                  title={c.name}
                  style={{ backgroundColor: c.color }}
                  className="w-5 h-5 rounded-full border border-white dark:border-slate-900 text-white flex items-center justify-center text-[9px] font-bold uppercase shadow-xs"
                >
                  {c.name.charAt(0)}
                </div>
              ))}
              {collaborators.length > 4 && (
                <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[9px]">
                  +{collaborators.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
