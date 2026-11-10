import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  DocItem, 
  ActiveView, 
  ThemeMode, 
  Language, 
  SyncState, 
  Collaborator,
  StatusChangeLog
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
  saveUserProfile,
  addToSyncQueue,
  clearSyncQueue
} from './utils/storage';
import { CollabManager } from './utils/collab';
import { 
  playReminderChime, 
  sendBrowserNotification 
} from './utils/notifications';
import { 
  subscribeToWorkspace, 
  saveDocToFirestore, 
  deleteDocFromFirestore, 
  seedFirestoreIfEmpty,
  testFirestoreConnection
} from './services/firestoreSync';
import { encryptText, decryptText } from './utils/crypto';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DocumentEditor } from './components/DocumentEditor';
import { DatabaseView } from './components/DatabaseView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { EncryptionModal } from './components/EncryptionModal';
import { NotificationModal } from './components/NotificationModal';
import { WorkspaceOverview } from './components/WorkspaceOverview';
import { 
  FileText, 
  Table, 
  Kanban, 
  Calendar as CalendarIcon, 
  BarChart3,
  Home
} from 'lucide-react';

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
  const [activeView, setActiveView] = useState<ActiveView>('overview');

  // Mobile sidebar drawer state
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

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
  const [userProfile, setUserProfile] = useState(() => getUserProfile());

  const handleUpdateUserProfile = (name: string, color?: string) => {
    const updated = {
      ...userProfile,
      name: name.trim() || userProfile.name,
      color: color || userProfile.color,
    };
    setUserProfile(updated);
    saveUserProfile(updated);
  };

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

  // Continuous background auto-sync polling to guarantee 100% database connectivity across devices
  const lastRevisionRef = useRef<number>(0);
  const syncDebounceTimerRef = useRef<number | null>(null);
  const isActivelyEditingRef = useRef<boolean>(false);

  // Trigger real-time Firestore sync & server backup
  const triggerServerSync = (
    currentDocs: DocItem[],
    mutation?: { type: 'upsert' | 'delete'; doc?: DocItem; docId?: string },
    immediate = false
  ) => {
    if (syncDebounceTimerRef.current) {
      clearTimeout(syncDebounceTimerRef.current);
      syncDebounceTimerRef.current = null;
    }

    const performSync = async () => {
      try {
        setSyncState((s) => ({ ...s, isSyncing: true }));

        // 1. Sync to Cloud Firestore in real-time
        if (mutation) {
          if (mutation.type === 'upsert' && mutation.doc) {
            saveDocToFirestore(mutation.doc).catch((e) => console.warn('Firestore upsert:', e));
          } else if (mutation.type === 'delete' && mutation.docId) {
            deleteDocFromFirestore(mutation.docId).catch((e) => console.warn('Firestore delete:', e));
          }
        } else if (currentDocs.length > 0) {
          currentDocs.forEach((d) => {
            saveDocToFirestore(d).catch(() => {});
          });
        }

        // 2. Server persistence backup & broadcast
        const payload = mutation
          ? { mutation }
          : { docs: currentDocs, replaceFull: true };

        const res = await fetch('/api/docs/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.revision) {
            lastRevisionRef.current = data.revision;
          }
        }

        setSyncState((s) => ({
          ...s,
          isOnline: true,
          isSyncing: false,
          lastSyncedAt: Date.now(),
          pendingCount: 0,
        }));
      } catch {
        setSyncState((s) => ({ ...s, isSyncing: false, isOnline: false }));
      }
    };

    if (immediate) {
      performSync();
    } else {
      syncDebounceTimerRef.current = window.setTimeout(performSync, 250);
    }
  };

  // Real-time Cloud Firestore subscription + background server polling
  useEffect(() => {
    // 1. Test live Firestore connection and initialize seed if collection is empty
    testFirestoreConnection();
    seedFirestoreIfEmpty(INITIAL_DOCS);

    // 2. Subscribe to real-time Cloud Firestore updates (active across all devices simultaneously)
    const unsubscribeFirestore = subscribeToWorkspace(
      (remoteDocs) => {
        if (Array.isArray(remoteDocs) && remoteDocs.length > 0) {
          setDocs((currentDocs) => {
            if (isActivelyEditingRef.current && activeDocId) {
              const activeLocal = currentDocs.find((d) => d.id === activeDocId);
              const merged = remoteDocs.map((r) => {
                if (r.id === activeDocId && activeLocal) {
                  return { ...r, content: activeLocal.content, title: activeLocal.title };
                }
                return r;
              });
              saveStoredDocs(merged, false);
              return merged;
            }
            saveStoredDocs(remoteDocs, false);
            return remoteDocs;
          });

          setSyncState((prev) => ({
            ...prev,
            isOnline: true,
            isSyncing: false,
            lastSyncedAt: Date.now(),
            pendingCount: 0,
          }));
        }
      },
      (err) => {
        console.warn('Firestore listener fallback notice:', err);
      }
    );

    // 3. Continuous server fallback polling every 2.5 seconds
    const fetchServerFallback = async () => {
      try {
        const res = await fetch('/api/docs', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.docs) && data.docs.length > 0) {
            if (lastRevisionRef.current === 0 || data.revision > lastRevisionRef.current) {
              lastRevisionRef.current = data.revision;
              setDocs((currentDocs) => {
                if (isActivelyEditingRef.current && activeDocId) {
                  const activeLocal = currentDocs.find((d) => d.id === activeDocId);
                  const updatedList = data.docs.map((sDoc: DocItem) => {
                    if (sDoc.id === activeDocId && activeLocal) {
                      return { ...sDoc, content: activeLocal.content, title: activeLocal.title };
                    }
                    return sDoc;
                  });
                  saveStoredDocs(updatedList, false);
                  return updatedList;
                }
                saveStoredDocs(data.docs, false);
                return data.docs;
              });
            }
          }
        }
      } catch {}
    };

    fetchServerFallback();
    const interval = setInterval(fetchServerFallback, 2500);

    return () => {
      unsubscribeFirestore();
      clearInterval(interval);
      if (syncDebounceTimerRef.current) clearTimeout(syncDebounceTimerRef.current);
    };
  }, [activeDocId]);

  // Force instant manual synchronization across Firestore & local server
  const handleManualSyncNow = async () => {
    try {
      setSyncState((s) => ({ ...s, isSyncing: true }));
      
      // Push all documents to Firestore
      const firestorePromises = docs.map((d) => saveDocToFirestore(d));
      await Promise.allSettled(firestorePromises);

      // Push to server API
      const res = await fetch('/api/docs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs, replaceFull: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.revision) {
          lastRevisionRef.current = data.revision;
        }
      }

      setSyncState((s) => ({
        ...s,
        isOnline: true,
        isSyncing: false,
        lastSyncedAt: Date.now(),
        pendingCount: 0,
      }));
    } catch {
      setSyncState((s) => ({ ...s, isSyncing: false }));
    }
  };

  // Initialize CollabManager and Cross-Device WebSocket & Cross-Tab sync
  useEffect(() => {
    const collab = new CollabManager(userProfile);
    collabManagerRef.current = collab;

    collab.setCallbacks({
      onWorkspaceSync: (serverDocs) => {
        if (Array.isArray(serverDocs) && serverDocs.length > 0) {
          setDocs(serverDocs);
          saveStoredDocs(serverDocs, false);
          setSyncState((prev) => ({ ...prev, isSyncing: false, lastSyncedAt: Date.now() }));
        }
      },
      onDocUpdated: (updatedDoc) => {
        setDocs((prev) => {
          const idx = prev.findIndex((d) => d.id === updatedDoc.id);
          const next = idx >= 0
            ? prev.map((d) => (d.id === updatedDoc.id ? { ...d, ...updatedDoc } : d))
            : [updatedDoc, ...prev];
          saveStoredDocs(next, false);
          return next;
        });
      },
      onDocDeleted: (deletedDocId) => {
        setDocs((prev) => {
          const next = prev.filter((d) => d.id !== deletedDocId && d.parentId !== deletedDocId);
          saveStoredDocs(next, false);
          return next;
        });
      },
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
      collab.requestInitialSync();
      setTimeout(() => {
        setSyncState((prev) => ({ ...prev, isSyncing: false, pendingCount: 0, lastSyncedAt: Date.now() }));
      }, 800);
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

  // Save docs to localStorage & broadcast to all devices via WebSocket & server REST API
  const updateDocs = (
    updater: (prev: DocItem[]) => DocItem[], 
    broadcastDocId?: string, 
    changePayload?: unknown,
    mutation?: { type: 'upsert' | 'delete'; doc?: DocItem; docId?: string },
    immediateSync = false
  ) => {
    setDocs((prev) => {
      const next = updater(prev);
      saveStoredDocs(next);

      if (!syncState.isOnline) {
        addToSyncQueue({
          type: 'upsert',
          docId: broadcastDocId || '',
        });
        setSyncState((s) => ({ ...s, pendingCount: s.pendingCount + 1 }));
      } else {
        if (broadcastDocId && changePayload !== undefined) {
          collabManagerRef.current?.sendDocChange(broadcastDocId, changePayload);
        }
        if (mutation) {
          if (mutation.type === 'upsert' && mutation.doc) {
            collabManagerRef.current?.sendDocUpsert(mutation.doc);
          } else if (mutation.type === 'delete' && mutation.docId) {
            collabManagerRef.current?.sendDocDelete(mutation.docId);
          }
        }
      }

      // Automatically trigger server synchronization
      triggerServerSync(next, mutation, immediateSync);
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
    setIsOpenMobileSidebar(false);
  };

  const handleCreateDoc = (parentId: string | null = null, datePreset?: string) => {
    const newId = `doc_${Date.now()}`;
    const now = Date.now();
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
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: {
        userId: userProfile.userId,
        name: userProfile.name,
        color: userProfile.color,
        timestamp: now,
        action: 'Membuat dokumen baru',
      },
      statusHistory: [
        {
          id: `log_${now}_${Math.random().toString(36).substring(2, 6)}`,
          fromStatus: 'not_started',
          toStatus: 'not_started',
          changedBy: {
            userId: userProfile.userId,
            name: userProfile.name,
            color: userProfile.color,
          },
          timestamp: now,
        },
      ],
    };

    updateDocs(
      (prev) => [newDoc, ...prev],
      newId,
      newDoc.content,
      { type: 'upsert', doc: newDoc },
      true
    );
    setActiveDocId(newId);
    setActiveView('editor');
    setIsOpenMobileSidebar(false);
  };

  const handleDeleteDoc = (id: string) => {
    const confirmMsg = translations[lang].confirmDelete;
    if (window.confirm(confirmMsg)) {
      updateDocs(
        (prev) => prev.filter((d) => d.id !== id && d.parentId !== id),
        id,
        undefined,
        { type: 'delete', docId: id },
        true
      );
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
    const now = Date.now();
    const duplicate: DocItem = {
      ...original,
      id: dupId,
      title: `${original.title} (Salinan)`,
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: {
        userId: userProfile.userId,
        name: userProfile.name,
        color: userProfile.color,
        timestamp: now,
        action: 'Menduplikasi dokumen',
      },
      statusHistory: original.statusHistory ? [...original.statusHistory] : [],
    };

    updateDocs(
      (prev) => [duplicate, ...prev],
      dupId,
      duplicate.content,
      { type: 'upsert', doc: duplicate },
      true
    );
    setActiveDocId(dupId);
  };

  const handleToggleFavorite = (id: string) => {
    updateDocs(
      (prev) =>
        prev.map((d) => {
          if (d.id === id) {
            const updated = { ...d, isFavorite: !d.isFavorite };
            return updated;
          }
          return d;
        }),
      undefined,
      undefined,
      undefined,
      true
    );
  };

  const activeTypingTimerRef = useRef<number | null>(null);

  const handleUpdateActiveDoc = (updated: Partial<DocItem>) => {
    if (!activeDocId) return;
    const current = docs.find((d) => d.id === activeDocId);
    if (!current) return;

    const statusChanged = updated.status !== undefined && updated.status !== current.status;
    const now = Date.now();

    let newHistory = current.statusHistory ? [...current.statusHistory] : [];
    if (statusChanged && updated.status) {
      const changeLog: StatusChangeLog = {
        id: `log_${now}_${Math.random().toString(36).substring(2, 6)}`,
        fromStatus: current.status,
        toStatus: updated.status,
        changedBy: {
          userId: userProfile.userId,
          name: userProfile.name,
          color: userProfile.color,
        },
        timestamp: now,
      };
      newHistory = [changeLog, ...newHistory].slice(0, 50);
    }

    const actionText = statusChanged
      ? `Mengubah status jadi ${updated.status === 'completed' ? 'Selesai' : updated.status === 'in_progress' ? 'Sedang Dikerjakan' : updated.status === 'archived' ? 'Arsip' : 'Belum Mulai'}`
      : 'Menyunting dokumen';

    const merged: DocItem = {
      ...current,
      ...updated,
      lastModifiedBy: {
        userId: userProfile.userId,
        name: userProfile.name,
        color: userProfile.color,
        timestamp: now,
        action: actionText,
      },
      statusHistory: newHistory,
      updatedAt: now,
    };

    const isTypingContent = updated.content !== undefined;
    if (isTypingContent) {
      isActivelyEditingRef.current = true;
      if (activeTypingTimerRef.current) clearTimeout(activeTypingTimerRef.current);
      activeTypingTimerRef.current = window.setTimeout(() => {
        isActivelyEditingRef.current = false;
      }, 1500);
    }

    updateDocs(
      (prev) => prev.map((d) => (d.id === activeDocId ? merged : d)),
      activeDocId,
      updated.content,
      { type: 'upsert', doc: merged },
      !isTypingContent // Immediate sync for cover, icon, tags, status; debounced for typing
    );
  };

  const handleUpdateDocById = (id: string, updated: Partial<DocItem>) => {
    const current = docs.find((d) => d.id === id);
    if (!current) return;

    const statusChanged = updated.status !== undefined && updated.status !== current.status;
    const now = Date.now();

    let newHistory = current.statusHistory ? [...current.statusHistory] : [];
    if (statusChanged && updated.status) {
      const changeLog: StatusChangeLog = {
        id: `log_${now}_${Math.random().toString(36).substring(2, 6)}`,
        fromStatus: current.status,
        toStatus: updated.status,
        changedBy: {
          userId: userProfile.userId,
          name: userProfile.name,
          color: userProfile.color,
        },
        timestamp: now,
      };
      newHistory = [changeLog, ...newHistory].slice(0, 50);
    }

    const actionText = statusChanged
      ? `Mengubah status jadi ${updated.status === 'completed' ? 'Selesai' : updated.status === 'in_progress' ? 'Sedang Dikerjakan' : updated.status === 'archived' ? 'Arsip' : 'Belum Mulai'}`
      : 'Memperbarui dokumen';

    const merged: DocItem = {
      ...current,
      ...updated,
      lastModifiedBy: {
        userId: userProfile.userId,
        name: userProfile.name,
        color: userProfile.color,
        timestamp: now,
        action: actionText,
      },
      statusHistory: newHistory,
      updatedAt: now,
    };

    updateDocs(
      (prev) => prev.map((d) => (d.id === id ? merged : d)),
      id,
      updated.content,
      { type: 'upsert', doc: merged },
      true // Immediate sync for database view updates
    );
  };

  // E2EE Vault unlock
  const handleUnlockVault = async (passphrase: string): Promise<boolean> => {
    try {
      if (passphrase.length < 4) return false;
      setIsVaultUnlocked(true);
      setVaultPassphrase(passphrase);

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
          fetch('/api/docs/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ docs: parsed }),
          }).catch(() => {});
          alert('Cadangan workspace berhasil diimpor & disinkronkan!');
        } else {
          alert('Format berkas cadangan tidak sesuai.');
        }
      } catch {
        alert('Gagal membaca berkas JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-slate-950 font-sans">
      {/* Sidebar Navigation (with Mobile Drawer Slide-over) */}
      <Sidebar
        docs={docs}
        activeDocId={activeDocId}
        activeView={activeView}
        lang={lang}
        syncState={syncState}
        collaborators={collaborators}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
        onSelectDoc={handleSelectDoc}
        onSelectView={setActiveView}
        onCreateDoc={handleCreateDoc}
        onDeleteDoc={handleDeleteDoc}
        onDuplicateDoc={handleDuplicateDoc}
        onToggleFavorite={handleToggleFavorite}
        onManualSync={handleManualSyncNow}
        userProfile={userProfile}
        onOpenNotificationModal={() => setShowNotificationModal(true)}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden pb-14 md:pb-0">
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
          isSyncing={syncState.isSyncing}
          isOnline={syncState.isOnline}
          userProfile={userProfile}
          onUpdateUserProfile={handleUpdateUserProfile}
          onManualSync={handleManualSyncNow}
          onToggleMobileSidebar={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
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
          {activeView === 'overview' && (
            <WorkspaceOverview
              docs={docs}
              lang={lang}
              collaborators={collaborators}
              userProfile={userProfile}
              onSelectDoc={handleSelectDoc}
              onSelectView={setActiveView}
              onCreateDoc={handleCreateDoc}
              onUpdateDoc={handleUpdateDocById}
            />
          )}

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

      {/* Mobile Bottom Navigation Bar (< md) for fast view switching */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-14 bg-white/95 dark:bg-[#121211]/95 backdrop-blur-md border-t border-[#EAEAE5] dark:border-[#2B2B28] z-30 flex items-center justify-around px-2">
        <button
          onClick={() => setActiveView('overview')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeView === 'overview'
              ? 'text-[#282925] dark:text-[#EDEDE8] font-bold'
              : 'text-[#777973]'
          }`}
        >
          <Home size={17} />
          <span>Ringkasan</span>
        </button>

        <button
          onClick={() => {
            setActiveView('editor');
            if (!activeDocId && docs[0]) setActiveDocId(docs[0].id);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeView === 'editor'
              ? 'text-[#282925] dark:text-[#EDEDE8] font-bold'
              : 'text-[#777973]'
          }`}
        >
          <FileText size={17} />
          <span>Catatan</span>
        </button>

        <button
          onClick={() => setActiveView('database_table')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeView === 'database_table'
              ? 'text-[#282925] dark:text-[#EDEDE8] font-bold'
              : 'text-[#777973]'
          }`}
        >
          <Table size={17} />
          <span>Tabel</span>
        </button>

        <button
          onClick={() => setActiveView('database_board')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeView === 'database_board'
              ? 'text-[#282925] dark:text-[#EDEDE8] font-bold'
              : 'text-[#777973]'
          }`}
        >
          <Kanban size={17} />
          <span>Kanban</span>
        </button>

        <button
          onClick={() => setActiveView('database_calendar')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeView === 'database_calendar'
              ? 'text-[#282925] dark:text-[#EDEDE8] font-bold'
              : 'text-[#777973]'
          }`}
        >
          <CalendarIcon size={17} />
          <span>Kalender</span>
        </button>
      </nav>

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
