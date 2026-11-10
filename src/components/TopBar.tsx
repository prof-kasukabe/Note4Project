import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Bell, 
  Sun, 
  Moon, 
  Monitor, 
  Coffee, 
  Globe, 
  Download, 
  Upload, 
  ChevronRight, 
  Menu
} from 'lucide-react';
import { DocItem, ActiveView, ThemeMode, Language, Collaborator } from '../types';
import { translations } from '../utils/i18n';

interface TopBarProps {
  activeDoc: DocItem | null;
  docs: DocItem[];
  activeView: ActiveView;
  theme: ThemeMode;
  lang: Language;
  collaborators: Collaborator[];
  isVaultUnlocked: boolean;
  unreadRemindersCount: number;
  isSyncing?: boolean;
  isOnline?: boolean;
  userProfile?: { userId: string; name: string; color: string };
  onUpdateUserProfile?: (name: string, color?: string) => void;
  onManualSync?: () => void;
  onToggleMobileSidebar: () => void;
  onSelectDoc: (id: string) => void;
  onSelectView: (view: ActiveView) => void;
  onToggleTheme: (theme: ThemeMode) => void;
  onToggleLanguage: (lang: Language) => void;
  onOpenEncryptionModal: () => void;
  onOpenNotificationModal: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeDoc,
  docs,
  activeView,
  theme,
  lang,
  collaborators,
  isVaultUnlocked,
  unreadRemindersCount,
  isSyncing = false,
  isOnline = true,
  userProfile,
  onUpdateUserProfile,
  onManualSync,
  onToggleMobileSidebar,
  onSelectDoc,
  onSelectView,
  onToggleTheme,
  onToggleLanguage,
  onOpenEncryptionModal,
  onOpenNotificationModal,
  onExportMarkdown,
  onExportJson,
  onImportJson,
}) => {
  const t = translations[lang];
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [editedName, setEditedName] = useState(userProfile?.name || 'Randye');
  const [selectedColor, setSelectedColor] = useState(userProfile?.color || '#6366F1');

  // Compute breadcrumbs
  const breadcrumbs: DocItem[] = [];
  if (activeDoc) {
    let curr: DocItem | undefined = activeDoc;
    const visited = new Set<string>();
    while (curr && !visited.has(curr.id)) {
      breadcrumbs.unshift(curr);
      visited.add(curr.id);
      curr = curr.parentId ? docs.find((d) => d.id === curr?.parentId) : undefined;
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = '';
    }
  };

  return (
    <header className="h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 select-none z-20">
      {/* Zone 1: Mobile Hamburger & Breadcrumb Trail */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title="Buka Menu"
        >
          <Menu size={18} />
        </button>

        <span 
          onClick={() => onSelectView('database_table')}
          className="hover:text-slate-900 dark:hover:text-white cursor-pointer font-medium whitespace-nowrap shrink-0 hidden sm:inline"
        >
          {t.appName}
        </span>

        {activeView === 'editor' && breadcrumbs.length > 0 ? (
          breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={12} className="shrink-0 text-slate-300 dark:text-slate-600" />
              <button
                onClick={() => onSelectDoc(crumb.id)}
                className={`truncate max-w-[90px] sm:max-w-[140px] md:max-w-[200px] hover:text-slate-900 dark:hover:text-white ${
                  idx === breadcrumbs.length - 1 ? 'font-semibold text-slate-900 dark:text-slate-100' : ''
                }`}
              >
                <span className="mr-1">{crumb.icon || '📄'}</span>
                {crumb.title || t.emptyTitle}
              </button>
            </React.Fragment>
          ))
        ) : (
          <>
            <ChevronRight size={12} className="shrink-0 text-slate-300 dark:text-slate-600 hidden sm:inline" />
            <span className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap truncate max-w-[120px] sm:max-w-none">
              {activeView === 'database_table' && t.tableView}
              {activeView === 'database_board' && t.boardView}
              {activeView === 'database_calendar' && t.calendarView}
              {activeView === 'analytics' && t.analytics}
            </span>
          </>
        )}
      </div>

      {/* Zone 2: Collaborators & Right Utility Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Real-time Database Connectivity Indicator & Quick Sync Trigger */}
        <button
          onClick={onManualSync}
          title="Status database terhubung. Klik untuk sinkronisasi paksa sekarang."
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
            isOnline
              ? isSyncing
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
          }`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${isSyncing ? 'bg-amber-500 animate-spin' : isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          <span className="whitespace-nowrap hidden sm:inline">
            {isSyncing ? 'Menyinkronkan...' : isOnline ? 'Database Terhubung' : 'Offline'}
          </span>
          <span className="whitespace-nowrap sm:hidden">
            {isSyncing ? 'Sync...' : isOnline ? 'Tersambung' : 'Offline'}
          </span>
        </button>

        {/* Real-time Collaboration Pill */}
        {collaborators.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-[11px] text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{collaborators.length} {t.collaborators.toLowerCase()}</span>
          </div>
        )}

        {/* E2EE Vault Action Button */}
        <button
          onClick={onOpenEncryptionModal}
          title={isVaultUnlocked ? t.e2eeUnlocked : t.e2eeLocked}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isVaultUnlocked
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          {isVaultUnlocked ? <Unlock size={13} /> : <Lock size={13} />}
          <span className="hidden md:inline whitespace-nowrap">{t.encryptedVault}</span>
        </button>

        {/* Time Reminder Notification Bell */}
        <button
          onClick={onOpenNotificationModal}
          title={t.reminders}
          className="relative p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell size={16} />
          {unreadRemindersCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              {unreadRemindersCount}
            </span>
          )}
        </button>

        {/* Theme Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            title={t.theme}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'light' && <Sun size={16} />}
            {theme === 'dark' && <Moon size={16} />}
            {theme === 'oled' && <Monitor size={16} />}
            {theme === 'sepia' && <Coffee size={16} />}
          </button>

          {showThemeMenu && (
            <div 
              onMouseLeave={() => setShowThemeMenu(false)}
              className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in"
            >
              <button
                onClick={() => { onToggleTheme('light'); setShowThemeMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Sun size={14} className="text-amber-500" />
                <span>{t.themeLight}</span>
              </button>
              <button
                onClick={() => { onToggleTheme('dark'); setShowThemeMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Moon size={14} className="text-indigo-400" />
                <span>{t.themeDark}</span>
              </button>
              <button
                onClick={() => { onToggleTheme('oled'); setShowThemeMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Monitor size={14} className="text-slate-400" />
                <span>{t.themeOled}</span>
              </button>
              <button
                onClick={() => { onToggleTheme('sepia'); setShowThemeMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Coffee size={14} className="text-amber-700" />
                <span>{t.themeSepia}</span>
              </button>
            </div>
          )}
        </div>

        {/* Language Toggle (ID / EN) */}
        <button
          onClick={() => onToggleLanguage(lang === 'id' ? 'en' : 'id')}
          title={lang === 'id' ? 'Beralih ke English' : 'Switch to Bahasa Indonesia'}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Globe size={14} />
          <span className="uppercase">{lang}</span>
        </button>

        {/* Export / Import Menu */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export / Import"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Download size={16} />
          </button>

          {showExportMenu && (
            <div 
              onMouseLeave={() => setShowExportMenu(false)}
              className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in"
            >
              <button
                onClick={() => { onExportMarkdown(); setShowExportMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Download size={13} className="text-indigo-500" />
                <span>{t.exportMarkdown}</span>
              </button>
              <button
                onClick={() => { onExportJson(); setShowExportMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Download size={13} className="text-emerald-500" />
                <span>{t.exportJson}</span>
              </button>
              <label className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                <Upload size={13} className="text-amber-500" />
                <span>{t.importJson}</span>
                <input
                  type="file"
                  accept=".json,.md"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
        {/* User Profile Pill & Collaborator Identity Switcher */}
        {userProfile && (
          <div className="relative">
            <button
              onClick={() => {
                setEditedName(userProfile.name);
                setSelectedColor(userProfile.color);
                setShowProfileMenu(!showProfileMenu);
              }}
              title={`Profil Pengguna: ${userProfile.name}. Klik untuk ubah nama atau warna kontributor.`}
              className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
            >
              <div
                style={{ backgroundColor: userProfile.color }}
                className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white dark:ring-slate-900"
              >
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden sm:inline max-w-[85px] truncate">
                {userProfile.name}
              </span>
            </button>

            {showProfileMenu && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-3 z-50 text-xs text-slate-800 dark:text-slate-200"
              >
                <div className="font-bold text-slate-900 dark:text-white mb-1">
                  {lang === 'id' ? 'Profil Kontributor Anda' : 'Your Contributor Profile'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                  {lang === 'id' 
                    ? 'Nama ini dicatat pada audit log saat Anda mengubah status tugas.' 
                    : 'This name is recorded in audit logs when you update task status.'}
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      {lang === 'id' ? 'Nama Tampilan' : 'Display Name'}
                    </label>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="e.g. Randye (Laptop)"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      maxLength={25}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      {lang === 'id' ? 'Warna Avatar' : 'Avatar Color'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444'].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setSelectedColor(col)}
                          style={{ backgroundColor: col }}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                            selectedColor === col ? 'scale-125 ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : 'opacity-80 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowProfileMenu(false)}
                      className="px-2.5 py-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateUserProfile && editedName.trim()) {
                          onUpdateUserProfile(editedName.trim(), selectedColor);
                        }
                        setShowProfileMenu(false);
                      }}
                      className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
