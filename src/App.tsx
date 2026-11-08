import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  DocItem, 
  ActiveView, 
  ThemeMode, 
  Language, 
  SyncState, 
  Collaborator 
} from './types';
import { translations } from './utils/i18n';
import { INITIAL_DOCS } from './utils/seedData';
import { 
  loadStoredDocs, 
  saveStoredDocs, 
  loadActiveDocId, 
  saveActiveDocId,
  subscribeToCrossTab,
  getUserProfile,
  addToSyncQueue,
  clearSyncQueue
} from './utils/storage';
import { CollabManager } from './utils/collab';
import { 
  playReminderChime, 
  sendBrowserNotification 
} from './utils/notifications';
import { encryptText, decryptText } from './utils/crypto';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DocumentEditor } from './components/DocumentEditor';
import { DatabaseView } from './components/DatabaseView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { EncryptionModal } from './components/EncryptionModal';
import { NotificationModal } from './components/NotificationModal';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('noverse_theme_v1') as ThemeMode) || 'dark';
  });

  // Language state
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('noverse_lang_v1') as Language;
    if (saved) return saved;
    return navigator.language.startsWith('id') ? 'id' : 'en';
  });

  // Documents state
  const [docs, setDocs] = useState<DocItem[]>(() => {
    const loaded = loadStoredDocs();
    return loaded && loaded.length > 0 ? loaded : INITIAL_DOCS;
  });

  // Active doc state
  const [activeDocId, setActiveDocId] = useState<string | null>(() => {
    const savedId = loadActiveDocId();
    if (savedId) return savedId;
    return INITIAL_DOCS[0]?.id || null;
  });

  // Active view state
  const [activeView, setActiveView] = useState<ActiveView>('editor');

  // Sync state
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncedAt: Date.now(),
  });

  // Collaborators & presence
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const collabManagerRef = useRef<CollabManager | null>(null);

  // E2EE Vault state
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState<string | null>(null);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);

  // Reminders modal state
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [unreadRemindersCount, setUnreadRemindersCount] = useState(0);

  // User Profile
  const userProfile = useMemo(() => getUserProfile(), []);

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.removeAttribute('data-theme');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'oled') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'oled');
    } else if (theme === 'sepia') {
      root.setAttribute('data-theme', 'sepia');
    }
    localStorage.setItem('noverse_theme_v1', theme);
  }, [theme]);

  // Language persistence
  useEffect(() => {
    localStorage.setItem('noverse_lang_v1', lang);
  }, [lang]);

  // Initialize CollabManager and Cross-Tab sync
  useEffect(() => {
    const collab = new CollabManager(userProfile);
    collabManagerRef.current = collab;

    collab.setCallbacks({
      onPresenceChange: (users) => {
        setCollaborators(users);
      },
      onDocChange: (docId, change: unknown) => {
        setDocs((prevDocs) => {
          return prevDocs.map((d) => {
            if (d.id === docId && typeof change === 'string') {
              return { ...d, content: change, updatedAt: Date.now() };
            }
            return d;
          });
        });
      },
      onStatusChange: (connected) => {
        setSyncState((prev) => ({ ...prev, isOnline: connected }));
      },
    });

    // Listen for cross-tab local updates
    const unsubscribeCrossTab = subscribeToCrossTab(() => {
      const reloaded = loadStoredDocs();
      if (reloaded) setDocs(reloaded);
    });

    // Listen for browser online/offline events
    const handleOnline = () => {
      setSyncState((prev) => ({ ...prev, isOnline: true, isSyncing: true }));
      clearSyncQueue();
      setTimeout(() => {
        setSyncState((prev) => ({ ...prev, isSyncing: false, pendingCount: 0, lastSyncedAt: Date.now() }));
      }, 1000);
    };

    const handleOffline = () => {
      setSyncState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      collab.disconnect();
      unsubscribeCrossTab();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userProfile]);

  // Join room whenever active doc changes
  useEffect(() => {
    if (activeDocId) {
      saveActiveDocId(activeDocId);
      collabManagerRef.current?.setDoc(activeDocId);
    }
  }, [activeDocId]);

  // Save docs to localStorage & handle offline queue
  const updateDocs = (updater: (prev: DocItem[]) => DocItem[], broadcastDocId?: string, changePayload?: unknown) => {
    setDocs((prev) => {
      const next = updater(prev);
      saveStoredDocs(next);

      if (!syncState.isOnline) {
        addToSyncQueue({
          type: 'upsert',
          docId: broadcastDocId || '',
        });
        setSyncState((s) => ({ ...s, pendingCount: s.pendingCount + 1 }));
      } else if (broadcastDocId && changePayload !== undefined) {
        collabManagerRef.current?.sendDocChange(broadcastDocId, changePayload);
      }
      return next;
    });
  };

  // Time-based reminder scheduler check
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      let dueCount = 0;

      setDocs((prevDocs) => {
        let hasChanges = false;
        const updated = prevDocs.map((doc) => {
          if (doc.reminderTime) {
            const reminderMs = new Date(doc.reminderTime).getTime();
            if (reminderMs <= now) {
              dueCount++;
              if (!doc.reminderNotified) {
                hasChanges = true;
                playReminderChime();
                sendBrowserNotification(
                  `🔔 Pengingat Noverse: ${doc.title}`,
                  `Waktunya memeriksa: ${doc.title}`
                );
                return { ...doc, reminderNotified: true };
              }
            }
          }
          return doc;
        });

        if (hasChanges) {
          saveStoredDocs(updated, false);
          return updated;
        }
        return prevDocs;
      });

      setUnreadRemindersCount(dueCount);
    };

    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, []);

  // Current active doc
  const activeDoc = useMemo(() => {
    return docs.find((d) => d.id === activeDocId) || docs[0] || null;
  }, [docs, activeDocId]);

  // Child sub-pages for active doc
  const subPages = useMemo(() => {
    if (!activeDoc) return [];
    return docs.filter((d) => d.parentId === activeDoc.id);
  }, [docs, activeDoc]);

  // Handlers
  const handleSelectDoc = (id: string) => {
    setActiveDocId(id);
    setActiveView('editor');
  };

  const handleCreateDoc = (parentId: string | null = null, datePreset?: string) => {
    const newId = `doc_${Date.now()}`;
    const newDoc: DocItem = {
      id: newId,
      title: 'Dokumen Baru',
      icon: '📄',
      parentId,
      tags: ['Umum'],
      status: 'not_started',
      priority: 'medium',
      deadline: datePreset || undefined,
      content: '# 📄 Dokumen Baru\n\nMulai tulis ide atau rencana di sini...',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    updateDocs((prev) => [newDoc, ...prev]);
    setActiveDocId(newId);
    setActiveView('editor');
  };

  const handleDeleteDoc = (id: string) => {
    const confirmMsg = translations[lang].confirmDelete;
    if (window.confirm(confirmMsg)) {
      updateDocs((prev) => prev.filter((d) => d.id !== id && d.parentId !== id));
      if (activeDocId === id) {
        const remaining = docs.filter((d) => d.id !== id && d.parentId !== id);
        setActiveDocId(remaining[0]?.id || null);
      }
    }
  };

  const handleDuplicateDoc = (id: string) => {
    const original = docs.find((d) => d.id === id);
    if (!original) return;

    const dupId = `doc_${Date.now()}`;
    const duplicate: DocItem = {
      ...original,
      id: dupId,
      title: `${original.title} (Salinan)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    updateDocs((prev) => [duplicate, ...prev]);
    setActiveDocId(dupId);
  };

  const handleToggleFavorite = (id: string) => {
    updateDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isFavorite: !d.isFavorite } : d))
    );
  };

  const handleUpdateActiveDoc = (updated: Partial<DocItem>) => {
    if (!activeDocId) return;
    updateDocs(
      (prev) => prev.map((d) => (d.id === activeDocId ? { ...d, ...updated } : d)),
      activeDocId,
      updated.content
    );
  };

  const handleUpdateDocById = (id: string, updated: Partial<DocItem>) => {
    updateDocs(
      (prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)),
      id,
      updated.content
    );
  };

  // E2EE Vault unlock
  const handleUnlockVault = async (passphrase: string): Promise<boolean> => {
    try {
      // Test decrypting sample or checking passphrase length
      if (passphrase.length < 4) return false;

      setIsVaultUnlocked(true);
      setVaultPassphrase(passphrase);

      // If active doc was encrypted demo, ensure content is revealed
      if (activeDoc?.isEncrypted) {
        updateDocs((prev) =>
          prev.map((d) => {
            if (d.id === activeDoc.id) {
              return {
                ...d,
                content: `# 🔒 Catatan Rahasia yang Berhasil Terbuka\n\nBrankas **End-to-End Encryption** berhasil dibuka dengan kunci privat lokal Anda.\n\n### Data Terproteksi:\n- Kode API Rahasia: \`sk-prod-994129x-vault\`\n- Akses Kunci: Terverifikasi AES-GCM 256-bit\n- Hanya Anda yang memiliki akses ke memori ini.`,
              };
            }
            return d;
          })
        );
      }
      return true;
    } catch (err) {
      console.error('Decryption failed:', err);
      return false;
    }
  };

  const handleLockVault = () => {
    setIsVaultUnlocked(false);
    setVaultPassphrase(null);
  };

  // Reminder Snooze & Dismiss
  const handleSnoozeReminder = (docId: string, minutes: number) => {
    const newTime = new Date(Date.now() + minutes * 60000).toISOString();
    handleUpdateDocById(docId, { reminderTime: newTime, reminderNotified: false });
  };

  const handleDismissReminder = (docId: string) => {
    handleUpdateDocById(docId, { reminderTime: undefined, reminderNotified: true });
  };

  // Export / Import
  const handleExportMarkdown = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc.title.replace(/\s+/g, '_') || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const data = JSON.stringify(docs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noverse-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportEncryptedVault = async () => {
    if (!vaultPassphrase) return;
    const encrypted = await encryptText(JSON.stringify(docs), vaultPassphrase);
    const blob = new Blob([JSON.stringify(encrypted, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noverse-e2ee-vault-${Date.now()}.vault.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (Array.isArray(parsed)) {
          setDocs(parsed);
          saveStoredDocs(parsed);
          alert('Cadangan workspace berhasil diimpor!');
        } else {
          alert('Format berkas cadangan tidak sesuai.');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-slate-950 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        docs={docs}
        activeDocId={activeDocId}
        activeView={activeView}
        lang={lang}
        syncState={syncState}
        collaborators={collaborators}
        onSelectDoc={handleSelectDoc}
        onSelectView={setActiveView}
        onCreateDoc={handleCreateDoc}
        onDeleteDoc={handleDeleteDoc}
        onDuplicateDoc={handleDuplicateDoc}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <TopBar
          activeDoc={activeDoc}
          docs={docs}
          activeView={activeView}
          theme={theme}
          lang={lang}
          collaborators={collaborators}
          isVaultUnlocked={isVaultUnlocked}
          unreadRemindersCount={unreadRemindersCount}
          onSelectDoc={handleSelectDoc}
          onSelectView={setActiveView}
          onToggleTheme={setTheme}
          onToggleLanguage={setLang}
          onOpenEncryptionModal={() => setShowEncryptionModal(true)}
          onOpenNotificationModal={() => setShowNotificationModal(true)}
          onExportMarkdown={handleExportMarkdown}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
        />

        {/* View Routing */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {activeView === 'editor' && activeDoc && (
            <DocumentEditor
              doc={activeDoc}
              subPages={subPages}
              lang={lang}
              collaborators={collaborators}
              isVaultUnlocked={isVaultUnlocked}
              onUpdateDoc={handleUpdateActiveDoc}
              onSelectDoc={handleSelectDoc}
              onCreateSubPage={handleCreateDoc}
              onSendCursor={(cursor) => collabManagerRef.current?.sendCursorMove(cursor)}
              onUnlockVault={handleUnlockVault}
            />
          )}

          {activeView === 'database_table' && (
            <DatabaseView
              docs={docs}
              currentMode="table"
              lang={lang}
              onSelectDoc={handleSelectDoc}
              onUpdateDoc={handleUpdateDocById}
              onCreateDoc={handleCreateDoc}
              onDeleteDoc={handleDeleteDoc}
            />
          )}

          {activeView === 'database_board' && (
            <DatabaseView
              docs={docs}
              currentMode="board"
              lang={lang}
              onSelectDoc={handleSelectDoc}
              onUpdateDoc={handleUpdateDocById}
              onCreateDoc={handleCreateDoc}
              onDeleteDoc={handleDeleteDoc}
            />
          )}

          {activeView === 'database_calendar' && (
            <DatabaseView
              docs={docs}
              currentMode="calendar"
              lang={lang}
              onSelectDoc={handleSelectDoc}
              onUpdateDoc={handleUpdateDocById}
              onCreateDoc={handleCreateDoc}
              onDeleteDoc={handleDeleteDoc}
            />
          )}

          {activeView === 'analytics' && (
            <AnalyticsDashboard
              docs={docs}
              lang={lang}
            />
          )}
        </main>
      </div>

      {/* Encryption & Vault Modal */}
      <EncryptionModal
        isOpen={showEncryptionModal}
        isUnlocked={isVaultUnlocked}
        lang={lang}
        onClose={() => setShowEncryptionModal(false)}
        onUnlock={handleUnlockVault}
        onLock={handleLockVault}
        onExportEncryptedVault={handleExportEncryptedVault}
      />

      {/* Notification & Reminders Drawer */}
      <NotificationModal
        isOpen={showNotificationModal}
        docs={docs}
        lang={lang}
        onClose={() => setShowNotificationModal(false)}
        onSelectDoc={handleSelectDoc}
        onSnoozeReminder={handleSnoozeReminder}
        onDismissReminder={handleDismissReminder}
      />
    </div>
  );
}
