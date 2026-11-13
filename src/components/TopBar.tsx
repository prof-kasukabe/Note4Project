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
  PanelLeft,
  Share2,
  Check
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
  const [editedName, setEditedName] = useState(userProfile?.name || 'Nabila A.');
  const [selectedColor, setSelectedColor] = useState(userProfile?.color || '#6366F1');
  const [shareCopied, setShareCopied] = useState(false);

  // Compute breadcrumbs for editor view
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

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = '';
    }
  };

  // Active view label in Indonesian
  const getViewLabel = () => {
    switch (activeView) {
      case 'overview':
        return 'Ringkasan';
      case 'database_table':
        return 'Tabel Proyek';
      case 'database_board':
        return 'Papan Kanban';
      case 'database_calendar':
        return 'Kalender Kerja';
      case 'analytics':
        return 'Analisis Produktivitas';
      case 'project_web':
        return 'Website project';
      case 'project_mobile':
        return 'Aplikasi habit tracker';
      case 'project_design':
        return 'Identitas Kopi Sore';
      case 'evaluasi':
        return 'Evaluasi';
      case 'editor':
        return activeDoc?.title || 'Dokumen';
      default:
        return 'Ringkasan';
    }
  };

  return (
    <header className="h-16 min-h-[64px] max-h-[64px] bg-white dark:bg-[#121211] border-b border-[#EAEAE5] dark:border-[#2B2B28] px-4 md:px-8 flex items-center justify-between gap-4 shrink-0 select-none z-20">
      {/* 1. Jejak Halaman (Figma: panel-left, Workspace / Ruang Bersama, pemisah '/', halaman aktif) */}
      <div className="flex items-center gap-2.5 text-xs text-[#777973] min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="p-1.5 -ml-1.5 rounded hover:bg-[#F2F2EE] dark:hover:bg-[#232320] text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] transition-colors shrink-0"
          title="Toggle Navigasi"
        >
          <PanelLeft size={16} />
        </button>

        <div className="flex items-center gap-2 truncate">
          <button
            onClick={() => onSelectView('overview')}
            className="text-xs text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] transition-colors whitespace-nowrap"
          >
            Ruang Bersama
          </button>

          <span className="text-[#A1A29B] text-xs">/</span>

          {activeView === 'editor' && breadcrumbs.length > 0 ? (
            <div className="flex items-center gap-1.5 truncate">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id}>
                  {idx > 0 && <span className="text-[#A1A29B] text-xs">/</span>}
                  <button
                    onClick={() => onSelectDoc(crumb.id)}
                    className={`truncate text-xs hover:text-[#282925] dark:hover:text-[#EDEDE8] ${
                      idx === breadcrumbs.length - 1 ? 'font-medium text-[#282925] dark:text-[#EDEDE8]' : 'text-[#777973]'
                    }`}
                  >
                    {crumb.icon && <span className="mr-1">{crumb.icon}</span>}
                    {crumb.title || t.emptyTitle}
                  </button>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] truncate">
              {getViewLabel()}
            </span>
          )}
        </div>
      </div>

      {/* 2. Aksi Halaman (Figma: Sinkronisasi, Anggota Avatar Stack, Tombol 'Bagikan', + utilitas) */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Sinkronisasi status */}
        <button
          onClick={onManualSync}
          title="Sinkronisasi database otomatis. Klik untuk sinkron ulang sekarang."
          className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#A1A29B] hover:text-[#282925] dark:hover:text-[#EDEDE8] transition-colors cursor-pointer"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-spin' : isOnline ? 'bg-emerald-500' : 'bg-[#A1A29B]'}`} />
          <span>
            {isSyncing ? 'Menyinkronkan...' : isOnline ? 'Tersinkronisasi otomatis' : 'Offline'}
          </span>
        </button>

        {/* Anggota Workspace Avatar Stack (Figma: overlapping avatars #ECEAE4, #EEE3DF, #E2E8EE, #E3EBE3) */}
        <div className="hidden md:flex items-center -space-x-1.5">
          <div 
            title="Nabila A. (Online)"
            className="w-[27px] h-[27px] rounded-full border-2 border-white dark:border-[#121211] bg-[#ECEAE4] flex items-center justify-center text-[9px] font-semibold text-[#777973] shadow-xs"
          >
            NA
          </div>
          <div 
            title="Budi Pratama (Online)"
            className="w-[27px] h-[27px] rounded-full border-2 border-white dark:border-[#121211] bg-[#EEE3DF] flex items-center justify-center text-[9px] font-semibold text-[#777973] shadow-xs"
          >
            BP
          </div>
          <div 
            title="Dina Amelia (Online)"
            className="w-[27px] h-[27px] rounded-full border-2 border-white dark:border-[#121211] bg-[#E2E8EE] flex items-center justify-center text-[9px] font-semibold text-[#777973] shadow-xs"
          >
            DA
          </div>
          <div 
            title="Rian Maulana (Online)"
            className="w-[27px] h-[27px] rounded-full border-2 border-white dark:border-[#121211] bg-[#E3EBE3] flex items-center justify-center text-[9px] font-semibold text-[#777973] shadow-xs"
          >
            RM
          </div>
          {collaborators.length > 4 && (
            <div className="w-[27px] h-[27px] rounded-full border-2 border-white dark:border-[#121211] bg-[#F4F4F0] flex items-center justify-center text-[9px] font-semibold text-[#777973]">
              +{collaborators.length - 4}
            </div>
          )}
        </div>

        {/* Tombol Bagikan (Figma: 34px, border #EAEAE5, bg #FFF, share-2 icon, 'Bagikan') */}
        <button
          onClick={handleShareClick}
          className="flex items-center gap-1.5 h-[34px] px-3 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] text-xs font-medium text-[#282925] dark:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors cursor-pointer"
        >
          {shareCopied ? (
            <>
              <Check size={14} className="text-emerald-600" />
              <span>Disalin!</span>
            </>
          ) : (
            <>
              <Share2 size={14} className="text-[#777973]" />
              <span>Bagikan</span>
            </>
          )}
        </button>

        {/* E2EE Vault Button */}
        <button
          onClick={onOpenEncryptionModal}
          title={isVaultUnlocked ? t.e2eeUnlocked : t.e2eeLocked}
          className="p-2 rounded-[6px] text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] transition-colors"
        >
          {isVaultUnlocked ? <Unlock size={15} className="text-emerald-600" /> : <Lock size={15} />}
        </button>

        {/* Reminders Bell */}
        <button
          onClick={onOpenNotificationModal}
          title="Pengingat"
          className="relative p-2 rounded-[6px] text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] transition-colors"
        >
          <Bell size={15} />
          {unreadRemindersCount > 0 && (
            <span className="absolute 1 top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        {/* Theme Menu */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            title="Tema Tampilan"
            className="p-2 rounded-[6px] text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] transition-colors"
          >
            {theme === 'light' && <Sun size={15} />}
            {theme === 'dark' && <Moon size={15} />}
            {theme === 'oled' && <Monitor size={15} />}
            {theme === 'sepia' && <Coffee size={15} />}
          </button>

          {showThemeMenu && (
            <div 
              onMouseLeave={() => setShowThemeMenu(false)}
              className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] shadow-lg py-1 z-50 text-xs text-[#282925] dark:text-[#EDEDE8] animate-in fade-in"
            >
              <button
                onClick={() => { onToggleTheme('light'); setShowThemeMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors"
              >
                <Sun size={13} className="text-amber-500" />
                <span>Terang</span>
              </button>
              <button
                onClick={() => { onToggleTheme('dark'); setShowThemeMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors"
              >
                <Moon size={13} className="text-indigo-400" />
                <span>Gelap</span>
              </button>
              <button
                onClick={() => { onToggleTheme('oled'); setShowThemeMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors"
              >
                <Monitor size={13} className="text-[#777973]" />
                <span>OLED</span>
              </button>
              <button
                onClick={() => { onToggleTheme('sepia'); setShowThemeMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors"
              >
                <Coffee size={13} className="text-amber-700" />
                <span>Sepia</span>
              </button>
            </div>
          )}
        </div>

        {/* Language Selector */}
        <button
          onClick={() => onToggleLanguage(lang === 'id' ? 'en' : 'id')}
          title="Ganti Bahasa"
          className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-xs font-semibold text-[#777973] hover:text-[#282925] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] transition-colors"
        >
          <Globe size={13} />
          <span className="uppercase">{lang}</span>
        </button>

        {/* Export / Import Menu */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Ekspor / Impor"
            className="p-2 rounded-[6px] text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] hover:bg-[#F2F2EE] dark:hover:bg-[#232320] transition-colors"
          >
            <Download size={15} />
          </button>

          {showExportMenu && (
            <div 
              onMouseLeave={() => setShowExportMenu(false)}
              className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] shadow-lg py-1 z-50 text-xs text-[#282925] dark:text-[#EDEDE8] animate-in fade-in"
            >
              <button
                onClick={() => { onExportMarkdown(); setShowExportMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors"
              >
                <Download size={13} className="text-[#777973]" />
                <span>Ekspor Markdown</span>
              </button>
              <button
                onClick={() => { onExportJson(); setShowExportMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors"
              >
                <Download size={13} className="text-[#777973]" />
                <span>Ekspor JSON</span>
              </button>
              <label className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors cursor-pointer">
                <Upload size={13} className="text-[#777973]" />
                <span>Impor Backup</span>
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

        {/* User Contributor Profile Pill */}
        {userProfile && (
          <div className="relative">
            <button
              onClick={() => {
                setEditedName(userProfile.name);
                setSelectedColor(userProfile.color);
                setShowProfileMenu(!showProfileMenu);
              }}
              title={`Profil Kontributor: ${userProfile.name}. Klik untuk ubah nama pengubah status.`}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-[#F2F2EE] dark:hover:bg-[#232320] transition-colors cursor-pointer"
            >
              <div
                style={{ backgroundColor: userProfile.color || '#6366F1' }}
                className="w-[26px] h-[26px] rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs"
              >
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
            </button>

            {showProfileMenu && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[8px] shadow-2xl p-3 z-50 text-xs text-[#282925] dark:text-[#EDEDE8]"
              >
                <div className="font-semibold text-sm mb-1 text-[#282925] dark:text-[#EDEDE8]">
                  Profil Kontributor
                </div>
                <p className="text-[11px] text-[#777973] mb-2.5">
                  Nama Anda dicatat pada audit log saat memperbarui progres proyek atau status halaman.
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#A1A29B] block mb-1">
                      Nama Tampilan
                    </label>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="e.g. Nabila A."
                      className="w-full px-2.5 py-1.5 rounded-[4px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                      maxLength={25}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#A1A29B] block mb-1">
                      Warna Avatar
                    </label>
                    <div className="flex items-center gap-1.5">
                      {['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444'].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setSelectedColor(col)}
                          style={{ backgroundColor: col }}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                            selectedColor === col ? 'scale-125 ring-2 ring-[#282925] dark:ring-white ring-offset-1' : 'opacity-80 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowProfileMenu(false)}
                      className="px-2.5 py-1 text-[#777973] hover:text-[#282925]"
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
                      className="px-3 py-1 rounded-[4px] bg-[#282925] hover:bg-[#3E3F3B] text-white font-medium shadow-xs"
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
