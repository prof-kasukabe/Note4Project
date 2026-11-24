import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  DocItem, 
  ActiveView, 
  ThemeMode, 
  Language, 
  SyncState, 
  Collaborator,
  StatusChangeLog,
  EvaluationData,
  ProductivityData
} from './types';
import { translations } from './utils/i18n';
import {
  INITIAL_DOCS,
  EVALUATION_DOC_ID,
  DEFAULT_EVALUATION_DATA,
  PRODUCTIVITY_DOC_ID,
  DEFAULT_PRODUCTIVITY_DATA,
  createDefaultProductivityDoc,
  WEB_PROJECT_DOC_ID,
  MOBILE_PROJECT_DOC_ID,
  DESIGN_PROJECT_DOC_ID,
  formatProjectDeadline,
  buildProjectMarkdownContent,
} from './utils/seedData';
import { 
  loadStoredDocs, 
  saveStoredDocs, 
  loadActiveDocId, 
  saveActiveDocId,
  subscribeToCrossTab,
  getUserProfile,
  saveUserProfile,
  loadSyncQueue,
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
  testFirestoreConnection,
  fetchAllDocsFromFirestore,
  WorkspaceSnapshotMeta
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
import { ProjectWebDetail } from './components/ProjectWebDetail';
import { ProjectMobileDetail } from './components/ProjectMobileDetail';
import { ProjectDesignDetail } from './components/ProjectDesignDetail';
import { EvaluasiPage } from './components/EvaluasiPage';
import { ProduktifPage, ProductivityTaskSyncHint } from './components/ProduktifPage';
import { 
  FileText, 
  Table, 
  Kanban, 
  Calendar as CalendarIcon, 
  ChartNoAxesCombined,
  CalendarCheck2,
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

  const migrateDocs = (list: DocItem[]): DocItem[] => {
    const seen = new Set<string>();
    const normalized: DocItem[] = [];
    const defaultActById = new Map(
      DEFAULT_PRODUCTIVITY_DATA.activities.map((a) => [a.id, a])
    );

    for (const item of list) {
      const id = item.id === '__workspace_evaluasi__' ? EVALUATION_DOC_ID : item.id;
      if (!seen.has(id)) {
        seen.add(id);
        let nextItem = id === item.id ? item : { ...item, id };
        if (id === PRODUCTIVITY_DOC_ID && nextItem.productivityData) {
          let changed = false;
          const patchedActivities = nextItem.productivityData.activities.map((act) => {
            const def = defaultActById.get(act.id);
            if (!def) return act;
            if (act.comments === undefined && def.comments) {
              changed = true;
              return {
                ...act,
                comments: def.comments,
                ...(act.notes === undefined && def.notes ? { notes: def.notes } : {}),
              };
            }
            return act;
          });
          if (changed) {
            nextItem = {
              ...nextItem,
              productivityData: {
                ...nextItem.productivityData,
                activities: patchedActivities,
              },
            };
          }
        }
        normalized.push(nextItem);
      }
    }
    if (!seen.has(PRODUCTIVITY_DOC_ID)) {
      normalized.push(createDefaultProductivityDoc());
    }
    return normalized;
  };

  // Documents state
  const [docs, setDocs] = useState<DocItem[]>(() => {
    const loaded = loadStoredDocs();
    return loaded && loaded.length > 0 ? migrateDocs(loaded) : INITIAL_DOCS;
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

  // Distraction-free Focus Mode state for DocumentEditor
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [autoFocusOnType, setAutoFocusOnType] = useState<boolean>(() => {
    const saved = localStorage.getItem('noverse_autofocus_on_type');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('noverse_autofocus_on_type', String(autoFocusOnType));
  }, [autoFocusOnType]);

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

  // E2EE Vault & Per-Document Lock state
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState<string | null>(null);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [unlockedDocs, setUnlockedDocs] = useState<Record<string, { content: string; passphrase: string }>>({});
  const unlockedDocsRef = useRef<Record<string, { content: string; passphrase: string }>>({});
  unlockedDocsRef.current = unlockedDocs;
  const encryptEditTimersRef = useRef<Record<string, number>>({});

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

  // Continuous background auto-sync & cross-site reconciliation refs
  const lastRevisionRef = useRef<number>(0);
  const syncDebounceTimerRef = useRef<number | null>(null);
  const isActivelyEditingRef = useRef<boolean>(false);
  const docsRef = useRef<DocItem[]>(docs);
  docsRef.current = docs;
  const activeDocIdRef = useRef<string | null>(activeDocId);
  activeDocIdRef.current = activeDocId;
  const hasAuthoritativeCloudRef = useRef<boolean>(false);
  const lastFocusSyncRef = useRef<number>(0);

  // Track pending local mutations so stale server caches never clobber recent edits/deletes
  const pendingUpsertsRef = useRef<Map<string, number>>((() => {
    const map = new Map<string, number>();
    loadSyncQueue().forEach((item) => {
      if (item.type === 'upsert' && item.docId) {
        map.set(item.docId, item.timestamp);
      }
    });
    return map;
  })());
  const pendingDeletesRef = useRef<Map<string, number>>((() => {
    const map = new Map<string, number>();
    loadSyncQueue().forEach((item) => {
      if (item.type === 'delete' && item.docId) {
        map.set(item.docId, item.timestamp);
      }
    });
    return map;
  })());

  const [importNotice, setImportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showTransientNotice = (type: 'success' | 'error', message: string) => {
    setImportNotice({ type, message });
    window.setTimeout(() => {
      setImportNotice((curr) => (curr?.message === message ? null : curr));
    }, 3500);
  };

  // Compare two document arrays cleanly (order-independent) to avoid redundant state updates
  const docsListChanged = (prev: DocItem[], next: DocItem[]): boolean => {
    if (prev.length !== next.length) return true;
    const prevById = new Map(prev.map((d) => [d.id, d]));
    for (const n of next) {
      const p = prevById.get(n.id);
      if (!p) return true;
      if (
        p.updatedAt !== n.updatedAt ||
        p.title !== n.title ||
        p.status !== n.status ||
        p.priority !== n.priority ||
        p.isFavorite !== n.isFavorite ||
        p.deadline !== n.deadline ||
        p.content !== n.content ||
        p.isEncrypted !== n.isEncrypted ||
        p.icon !== n.icon ||
        p.coverImage !== n.coverImage ||
        p.reminderTime !== n.reminderTime
      ) {
        return true;
      }
      if (
        JSON.stringify(p.projectData || null) !== JSON.stringify(n.projectData || null) ||
        JSON.stringify(p.evaluationData || null) !== JSON.stringify(n.evaluationData || null) ||
        JSON.stringify(p.productivityData || null) !== JSON.stringify(n.productivityData || null)
      ) {
        return true;
      }
    }
    return false;
  };

  // Authoritative timestamp-based merge across Firestore, local Express server, WebSocket, and tabs
  const mergeDocsWithSource = (
    localDocs: DocItem[],
    incomingRawDocs: DocItem[],
    options: {
      source: 'firestore' | 'server' | 'collab' | 'local';
      isAuthoritativeSnapshot?: boolean;
      activeEditingDocId?: string | null;
    }
  ): { merged: DocItem[]; localOnlyOrNewerToPush: DocItem[]; removedDocIds: string[] } => {
    const incomingDocs = migrateDocs(incomingRawDocs);
    const localMap = new Map(localDocs.map((d) => [d.id, d]));
    const incomingMap = new Map(incomingDocs.map((d) => [d.id, d]));
    const allIds = new Set([...localMap.keys(), ...incomingMap.keys()]);

    const merged: DocItem[] = [];
    const localOnlyOrNewerToPush: DocItem[] = [];
    const removedDocIds: string[] = [];

    const canDropDeletedFromCloud =
      options.source === 'firestore' &&
      Boolean(options.isAuthoritativeSnapshot) &&
      incomingDocs.length > 0;

    for (const id of allIds) {
      const loc = localMap.get(id);
      const inc = incomingMap.get(id);

      const pendingDeleteTs = pendingDeletesRef.current.get(id);
      if (pendingDeleteTs) {
        if (!inc && canDropDeletedFromCloud) {
          pendingDeletesRef.current.delete(id);
        } else if (!inc || (inc.updatedAt || 0) <= pendingDeleteTs + 2000) {
          continue;
        } else {
          // Another device edited this doc AFTER our local delete
          pendingDeletesRef.current.delete(id);
        }
      }

      if (loc && inc) {
        const isEditingThisDoc =
          Boolean(options.activeEditingDocId) &&
          id === options.activeEditingDocId &&
          isActivelyEditingRef.current;

        if (isEditingThisDoc) {
          merged.push(loc);
          continue;
        }

        const locUpdated = loc.updatedAt || 0;
        const incUpdated = inc.updatedAt || 0;

        if (incUpdated > locUpdated) {
          merged.push(inc);
          const pendingTs = pendingUpsertsRef.current.get(id);
          if (pendingTs !== undefined && incUpdated >= pendingTs) {
            pendingUpsertsRef.current.delete(id);
          }
        } else if (locUpdated > incUpdated) {
          merged.push(loc);
          if (options.source === 'firestore') {
            localOnlyOrNewerToPush.push(loc);
          }
        } else {
          // Equal timestamps: trust authoritative Firestore snapshot, otherwise preserve local
          if (options.source === 'firestore' && options.isAuthoritativeSnapshot) {
            merged.push(inc);
            pendingUpsertsRef.current.delete(id);
          } else {
            merged.push(loc);
          }
        }
      } else if (inc) {
        merged.push(inc);
      } else if (loc) {
        const isSystemDoc = id === PRODUCTIVITY_DOC_ID || id === EVALUATION_DOC_ID;
        const hasPendingLocalUpsert = pendingUpsertsRef.current.has(id);

        if (canDropDeletedFromCloud && !isSystemDoc && !hasPendingLocalUpsert) {
          // Doc was deleted on another device/site; propagate deletion here
          removedDocIds.push(id);
        } else {
          merged.push(loc);
          if (options.source === 'firestore' && options.isAuthoritativeSnapshot) {
            localOnlyOrNewerToPush.push(loc);
          }
        }
      }
    }

    // Preserve familiar ordering: incoming order first for existing docs, then newest updatedAt
    merged.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return { merged: migrateDocs(merged), localOnlyOrNewerToPush, removedDocIds };
  };

  const mirrorDocsToLocalServer = async (docsToMirror: DocItem[]) => {
    try {
      const res = await fetch('/api/docs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: docsToMirror, replaceFull: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.revision) {
          lastRevisionRef.current = data.revision;
        }
      }
    } catch {
      // Offline or Express unreachable; localStorage & Firestore remain valid
    }
  };

  type SyncMutation = { type: 'upsert' | 'delete'; doc?: DocItem; docId?: string; childIds?: string[] };

  // Trigger real-time Firestore sync & server backup
  const triggerServerSync = (
    currentDocs: DocItem[],
    mutation?: SyncMutation,
    immediate = false,
    extraUpserts: DocItem[] = []
  ) => {
    if (syncDebounceTimerRef.current) {
      clearTimeout(syncDebounceTimerRef.current);
      syncDebounceTimerRef.current = null;
    }

    const performSync = async () => {
      try {
        setSyncState((s) => ({ ...s, isSyncing: true }));

        const firestoreTasks: Promise<unknown>[] = [];

        // 1. Sync to Cloud Firestore in real-time
        if (mutation) {
          if (mutation.type === 'upsert' && mutation.doc) {
            const targetDoc = mutation.doc;
            firestoreTasks.push(
              saveDocToFirestore(targetDoc)
                .then(() => {
                  const pendingTs = pendingUpsertsRef.current.get(targetDoc.id);
                  if (pendingTs !== undefined && pendingTs <= (targetDoc.updatedAt || 0)) {
                    pendingUpsertsRef.current.delete(targetDoc.id);
                  }
                })
                .catch((e) => console.warn('Firestore upsert:', e))
            );
          } else if (mutation.type === 'delete' && mutation.docId) {
            const delId = mutation.docId;
            const childIds = mutation.childIds || [];
            firestoreTasks.push(
              deleteDocFromFirestore(delId, childIds)
                .then(() => {
                  pendingDeletesRef.current.delete(delId);
                  childIds.forEach((cid) => pendingDeletesRef.current.delete(cid));
                })
                .catch((e) => console.warn('Firestore delete:', e))
            );
          }
          for (const extra of extraUpserts) {
            firestoreTasks.push(
              saveDocToFirestore(extra)
                .then(() => {
                  const pendingTs = pendingUpsertsRef.current.get(extra.id);
                  if (pendingTs !== undefined && pendingTs <= (extra.updatedAt || 0)) {
                    pendingUpsertsRef.current.delete(extra.id);
                  }
                })
                .catch((e) => console.warn('Firestore extra upsert:', e))
            );
          }
        } else if (currentDocs.length > 0) {
          currentDocs.forEach((d) => {
            firestoreTasks.push(
              saveDocToFirestore(d)
                .then(() => {
                  pendingUpsertsRef.current.delete(d.id);
                })
                .catch(() => {})
            );
          });
        }

        // 2. Server persistence backup & broadcast (use full sync when multiple docs changed atomically)
        const payload =
          mutation && extraUpserts.length === 0
            ? { mutation }
            : { docs: currentDocs, replaceFull: true };

        const serverPromise = fetch('/api/docs/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.revision) {
              lastRevisionRef.current = data.revision;
            }
          }
          return res;
        });

        await Promise.allSettled([...firestoreTasks, serverPromise]);

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

  // Two-way reconciliation: pull authoritative Firestore state, merge newest-first, flush pending local edits/deletes
  const reconcileWithCloud = async (pushAllLocalIfNeeded = false) => {
    try {
      setSyncState((s) => ({ ...s, isSyncing: true }));

      // Flush any queued deletions first so cloud does not re-send deleted items
      const pendingDeleteIds = Array.from(pendingDeletesRef.current.keys());
      if (pendingDeleteIds.length > 0) {
        await Promise.allSettled(
          pendingDeleteIds.map((delId) =>
            deleteDocFromFirestore(delId).then(() => {
              pendingDeletesRef.current.delete(delId);
            })
          )
        );
      }

      const cloudDocs = await fetchAllDocsFromFirestore();
      hasAuthoritativeCloudRef.current = true;

      const currentLocal = docsRef.current;
      const { merged, localOnlyOrNewerToPush } = mergeDocsWithSource(currentLocal, cloudDocs, {
        source: 'firestore',
        isAuthoritativeSnapshot: cloudDocs.length > 0,
        activeEditingDocId: activeDocIdRef.current,
      });

      if (docsListChanged(currentLocal, merged)) {
        docsRef.current = merged;
        setDocs(merged);
        saveStoredDocs(merged, false);
      }

      // Push any newer local edits (or full set when forced manually) to Firestore
      const toPush = pushAllLocalIfNeeded
        ? Array.from(
            new Map(
              [...localOnlyOrNewerToPush, ...merged.filter((d) => pendingUpsertsRef.current.has(d.id))].map(
                (d) => [d.id, d]
              )
            ).values()
          )
        : localOnlyOrNewerToPush;

      if (toPush.length > 0) {
        await Promise.allSettled(
          toPush.map((d) =>
            saveDocToFirestore(d).then(() => {
              pendingUpsertsRef.current.delete(d.id);
            })
          )
        );
      } else if (cloudDocs.length === 0 && merged.length > 0) {
        await Promise.allSettled(merged.map((d) => saveDocToFirestore(d)));
      }

      await mirrorDocsToLocalServer(merged);
      clearSyncQueue();

      setSyncState((s) => ({
        ...s,
        isOnline: true,
        isSyncing: false,
        lastSyncedAt: Date.now(),
        pendingCount: 0,
      }));
    } catch {
      // Offline or Firestore temporarily unreachable: fall back cleanly
      setSyncState((s) => ({ ...s, isSyncing: false }));
    }
  };

  // Real-time Cloud Firestore subscription + background server polling + visibility re-sync
  useEffect(() => {
    testFirestoreConnection();
    seedFirestoreIfEmpty(INITIAL_DOCS);

    // 1. Real-time Cloud Firestore listener (works across all devices and separate deployed sites)
    const unsubscribeFirestore = subscribeToWorkspace(
      (rawRemoteDocs: DocItem[], meta: WorkspaceSnapshotMeta) => {
        if (!Array.isArray(rawRemoteDocs)) return;
        const isAuthoritative = !meta.fromCache;
        if (isAuthoritative) {
          hasAuthoritativeCloudRef.current = true;
        }
        if (rawRemoteDocs.length === 0 && !isAuthoritative) return;

        const prevLocal = docsRef.current;
        const { merged, localOnlyOrNewerToPush } = mergeDocsWithSource(prevLocal, rawRemoteDocs, {
          source: 'firestore',
          isAuthoritativeSnapshot: isAuthoritative,
          activeEditingDocId: activeDocIdRef.current,
        });

        const changed = docsListChanged(prevLocal, merged);
        if (changed) {
          docsRef.current = merged;
          setDocs(merged);
          saveStoredDocs(merged, false);
          if (isAuthoritative) {
            mirrorDocsToLocalServer(merged);
          }
        }

        // If this device had newer offline/unsynced edits, push them up to Cloud Firestore now
        if (isAuthoritative && localOnlyOrNewerToPush.length > 0) {
          localOnlyOrNewerToPush.forEach((docToPush) => {
            saveDocToFirestore(docToPush)
              .then(() => {
                pendingUpsertsRef.current.delete(docToPush.id);
              })
              .catch(() => {});
          });
        }

        if (isAuthoritative) {
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

    // 2. Local Express fallback polling (never overwrites newer Firestore or local docs)
    const fetchServerFallback = async () => {
      try {
        const res = await fetch('/api/docs', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.docs) && data.docs.length > 0) {
            if (lastRevisionRef.current === 0 || data.revision > lastRevisionRef.current) {
              lastRevisionRef.current = data.revision;
              const prevLocal = docsRef.current;
              const { merged } = mergeDocsWithSource(prevLocal, data.docs, {
                source: 'server',
                activeEditingDocId: activeDocIdRef.current,
              });
              if (docsListChanged(prevLocal, merged)) {
                docsRef.current = merged;
                setDocs(merged);
                saveStoredDocs(merged, false);
              }
            }
          }
        }
      } catch {}
    };

    fetchServerFallback();
    const interval = setInterval(fetchServerFallback, 4000);

    // 3. Reconcile immediately when switching back to this tab/app/device
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState && document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastFocusSyncRef.current < 2000) return;
      lastFocusSyncRef.current = now;
      reconcileWithCloud(false);
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      unsubscribeFirestore();
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      if (syncDebounceTimerRef.current) clearTimeout(syncDebounceTimerRef.current);
    };
  }, []);

  // Force instant manual two-way synchronization across Firestore & local server
  const handleManualSyncNow = async () => {
    await reconcileWithCloud(true);
  };

  // Initialize CollabManager and Cross-Device WebSocket & Cross-Tab sync
  useEffect(() => {
    const collab = new CollabManager(userProfile);
    collabManagerRef.current = collab;

    collab.setCallbacks({
      onWorkspaceSync: (rawServerDocs) => {
        if (Array.isArray(rawServerDocs) && rawServerDocs.length > 0) {
          const prevLocal = docsRef.current;
          const { merged } = mergeDocsWithSource(prevLocal, rawServerDocs, {
            source: 'collab',
            activeEditingDocId: activeDocIdRef.current,
          });
          if (docsListChanged(prevLocal, merged)) {
            docsRef.current = merged;
            setDocs(merged);
            saveStoredDocs(merged, false);
          }
          setSyncState((prev) => ({ ...prev, isSyncing: false, lastSyncedAt: Date.now() }));
        }
      },
      onDocUpdated: (rawUpdatedDoc) => {
        const [updatedDoc] = migrateDocs([rawUpdatedDoc]);
        const prevLocal = docsRef.current;
        const { merged } = mergeDocsWithSource(prevLocal, [updatedDoc], {
          source: 'collab',
          activeEditingDocId: activeDocIdRef.current,
        });
        if (docsListChanged(prevLocal, merged)) {
          docsRef.current = merged;
          setDocs(merged);
          saveStoredDocs(merged, false);
        }
      },
      onDocDeleted: (deletedDocId) => {
        pendingDeletesRef.current.set(deletedDocId, Date.now());
        setDocs((prev) => {
          const next = prev.filter((d) => d.id !== deletedDocId && d.parentId !== deletedDocId);
          docsRef.current = next;
          saveStoredDocs(next, false);
          return next;
        });
      },
      onPresenceChange: (users) => {
        setCollaborators(users);
      },
      onDocChange: (docId, change: unknown) => {
        setDocs((prevDocs) => {
          const next = prevDocs.map((d) => {
            if (d.id === docId && typeof change === 'string') {
              return { ...d, content: change, updatedAt: Date.now() };
            }
            return d;
          });
          docsRef.current = next;
          return next;
        });
      },
      onStatusChange: (connected) => {
        setSyncState((prev) => ({ ...prev, isOnline: connected }));
      },
    });

    // Listen for cross-tab local updates
    const unsubscribeCrossTab = subscribeToCrossTab(() => {
      const reloaded = loadStoredDocs();
      if (reloaded && reloaded.length > 0) {
        const prevLocal = docsRef.current;
        const { merged } = mergeDocsWithSource(prevLocal, reloaded, {
          source: 'local',
          activeEditingDocId: activeDocIdRef.current,
        });
        if (docsListChanged(prevLocal, merged)) {
          docsRef.current = merged;
          setDocs(merged);
        }
      }
    });

    // Listen for browser online/offline events — flush offline queue & reconcile cloud
    const handleOnline = () => {
      setSyncState((prev) => ({ ...prev, isOnline: true, isSyncing: true }));
      collab.requestInitialSync();
      reconcileWithCloud(true);
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

  // Save docs to localStorage & broadcast to all devices via WebSocket, Express, & Cloud Firestore
  const updateDocs = (
    updater: (prev: DocItem[]) => DocItem[], 
    broadcastDocId?: string, 
    changePayload?: unknown,
    mutation?: SyncMutation,
    immediateSync = false,
    extraUpserts: DocItem[] = []
  ) => {
    const nowTs = Date.now();
    if (mutation) {
      if (mutation.type === 'upsert' && mutation.doc) {
        pendingUpsertsRef.current.set(mutation.doc.id, mutation.doc.updatedAt || nowTs);
        pendingDeletesRef.current.delete(mutation.doc.id);
      } else if (mutation.type === 'delete' && mutation.docId) {
        pendingDeletesRef.current.set(mutation.docId, nowTs);
        pendingUpsertsRef.current.delete(mutation.docId);
        mutation.childIds?.forEach((cid) => {
          pendingDeletesRef.current.set(cid, nowTs);
          pendingUpsertsRef.current.delete(cid);
        });
      }
    }
    extraUpserts.forEach((extra) => {
      pendingUpsertsRef.current.set(extra.id, extra.updatedAt || nowTs);
      pendingDeletesRef.current.delete(extra.id);
    });

    setDocs((prev) => {
      const next = updater(prev);
      docsRef.current = next;
      saveStoredDocs(next);

      const isBrowserOnline = typeof navigator !== 'undefined' ? navigator.onLine : syncState.isOnline;
      if (!isBrowserOnline) {
        addToSyncQueue({
          type: mutation?.type === 'delete' ? 'delete' : 'upsert',
          docId: mutation?.docId || mutation?.doc?.id || broadcastDocId || '',
        });
        extraUpserts.forEach((extra) => {
          addToSyncQueue({ type: 'upsert', docId: extra.id });
        });
        setSyncState((s) => ({ ...s, pendingCount: s.pendingCount + 1 + extraUpserts.length }));
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
        extraUpserts.forEach((extra) => {
          collabManagerRef.current?.sendDocUpsert(extra);
        });
      }

      // Automatically trigger Cloud Firestore + Express synchronization
      triggerServerSync(next, mutation, immediateSync, extraUpserts);
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

  // Visible workspace documents (excluding internal workspace evaluation & productivity stores)
  const visibleDocs = useMemo(() => {
    return docs.filter((d) => d.id !== EVALUATION_DOC_ID && d.id !== PRODUCTIVITY_DOC_ID);
  }, [docs]);

  // Evaluation workspace data synced via Firestore & Express backend
  const evaluationData = useMemo(() => {
    const evalDoc = docs.find((d) => d.id === EVALUATION_DOC_ID);
    return evalDoc?.evaluationData || DEFAULT_EVALUATION_DATA;
  }, [docs]);

  // Productivity & Mini Calendar data synced via Firestore & Express backend
  const productivityData = useMemo(() => {
    const prodDoc = docs.find((d) => d.id === PRODUCTIVITY_DOC_ID);
    return prodDoc?.productivityData || DEFAULT_PRODUCTIVITY_DATA;
  }, [docs]);

  // Current active doc
  const activeDoc = useMemo(() => {
    return visibleDocs.find((d) => d.id === activeDocId) || visibleDocs[0] || null;
  }, [visibleDocs, activeDocId]);

  const activeDocLocked = Boolean(
    activeDoc?.isEncrypted && !unlockedDocs[activeDoc.id] && !isVaultUnlocked
  );
  const isEditorFocusActive =
    activeView === 'editor' && Boolean(activeDoc) && !activeDocLocked && isFocusMode;

  // Auto-exit Focus Mode when navigating away from DocumentEditor or when active document locks
  useEffect(() => {
    if (activeView !== 'editor' || !activeDoc || activeDocLocked) {
      setIsFocusMode(false);
    }
  }, [activeView, activeDoc, activeDocLocked]);

  // Child sub-pages for active doc
  const subPages = useMemo(() => {
    if (!activeDoc) return [];
    return visibleDocs.filter((d) => d.parentId === activeDoc.id);
  }, [visibleDocs, activeDoc]);

  // Handlers
  const handleSelectDoc = (id: string) => {
    setActiveDocId(id);
    setActiveView('editor');
    setIsOpenMobileSidebar(false);
    setIsFocusMode(false);
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

  const collectDescendantIds = (rootId: string, list: DocItem[]): string[] => {
    const result: string[] = [];
    const queue = [rootId];
    while (queue.length > 0) {
      const parent = queue.shift()!;
      for (const item of list) {
        if (item.parentId === parent && !result.includes(item.id)) {
          result.push(item.id);
          queue.push(item.id);
        }
      }
    }
    return result;
  };

  const handleDeleteDoc = (id: string) => {
    const confirmMsg = translations[lang].confirmDelete;
    if (window.confirm(confirmMsg)) {
      const childIds = collectDescendantIds(id, docsRef.current);
      const allDeleted = new Set([id, ...childIds]);
      updateDocs(
        (prev) => prev.filter((d) => !allDeleted.has(d.id)),
        id,
        undefined,
        { type: 'delete', docId: id, childIds },
        true
      );
      if (activeDocId && allDeleted.has(activeDocId)) {
        const remaining = visibleDocs.filter((d) => !allDeleted.has(d.id));
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
    const target = docs.find((d) => d.id === id);
    if (!target) return;
    const now = Date.now();
    const updatedTarget: DocItem = {
      ...target,
      isFavorite: !target.isFavorite,
      updatedAt: now,
      lastModifiedBy: {
        userId: userProfile.userId,
        name: userProfile.name,
        color: userProfile.color,
        timestamp: now,
        action: !target.isFavorite ? 'Menambahkan ke favorit' : 'Menghapus dari favorit',
      },
    };
    updateDocs(
      (prev) => prev.map((d) => (d.id === id ? updatedTarget : d)),
      id,
      undefined,
      { type: 'upsert', doc: updatedTarget },
      true
    );
  };

  const LOCKED_CONTENT_PLACEHOLDER =
    '🔒 Dokumen ini terkunci dengan enkripsi E2EE. Masukkan password untuk membaca dan menyunting.';

  const activeTypingTimerRef = useRef<number | null>(null);

  const STATUS_TO_LABEL: Record<DocItem['status'], string> = {
    not_started: 'Belum mulai',
    in_progress: 'Dikerjakan',
    completed: 'Selesai',
    archived: 'Diarsipkan',
  };

  const PRIORITY_TO_LABEL_ID: Record<DocItem['priority'], 'Tinggi' | 'Sedang' | 'Rendah'> = {
    high: 'Tinggi',
    medium: 'Sedang',
    low: 'Rendah',
  };

  const FAVORITE_PROJECT_IDS = new Set([
    WEB_PROJECT_DOC_ID,
    MOBILE_PROJECT_DOC_ID,
    DESIGN_PROJECT_DOC_ID,
  ]);

  // Helper: synchronize renamed doc titles into Productivity & Calendar labels
  const syncDocTitlesToProductivity = (
    list: DocItem[],
    renamedDocs: Array<{ id: string; title: string }>,
    now: number,
    lastModifiedBy: DocItem['lastModifiedBy']
  ): DocItem | null => {
    if (renamedDocs.length === 0) return null;
    const titleByDocId = new Map(renamedDocs.map((r) => [r.id, r.title]));
    const existingProd = list.find((d) => d.id === PRODUCTIVITY_DOC_ID);
    const curProd = existingProd?.productivityData || DEFAULT_PRODUCTIVITY_DATA;
    let changed = false;

    const nextActivities = curProd.activities.map((act) => {
      if (act.linkedDocId && titleByDocId.has(act.linkedDocId)) {
        const nextName = titleByDocId.get(act.linkedDocId)!;
        if (act.projectName !== nextName) {
          changed = true;
          return { ...act, projectName: nextName, updatedAt: now };
        }
      }
      return act;
    });

    const nextDayLabels = curProd.dayLabels.map((lbl) => {
      if (lbl.linkedDocId && titleByDocId.has(lbl.linkedDocId)) {
        const nextName = titleByDocId.get(lbl.linkedDocId)!;
        if (lbl.projectName !== nextName) {
          changed = true;
          return { ...lbl, projectName: nextName, updatedAt: now };
        }
      }
      return lbl;
    });

    if (!changed) return null;

    return {
      id: PRODUCTIVITY_DOC_ID,
      title: 'Produktivitas Workspace',
      icon: '⚡',
      parentId: null,
      content: '',
      tags: ['Produktif'],
      status: 'in_progress',
      priority: 'medium',
      createdAt: existingProd?.createdAt || now,
      updatedAt: now,
      productivityData: {
        ...curProd,
        activities: nextActivities,
        dayLabels: nextDayLabels,
        updatedAt: now,
      },
      lastModifiedBy,
    };
  };

  const handleUpdateActiveDoc = (updated: Partial<DocItem>) => {
    if (!activeDocId) return;
    const current = docs.find((d) => d.id === activeDocId);
    if (!current) return;

    const unlockedSession = unlockedDocsRef.current[activeDocId];
    const isEditingUnlockedEncrypted =
      Boolean(current.isEncrypted && unlockedSession && updated.content !== undefined);

    if (isEditingUnlockedEncrypted && updated.content !== undefined) {
      const nextPlaintext = updated.content;
      setUnlockedDocs((prev) => ({
        ...prev,
        [activeDocId]: { ...unlockedSession, content: nextPlaintext },
      }));
      unlockedDocsRef.current[activeDocId] = { ...unlockedSession, content: nextPlaintext };

      if (encryptEditTimersRef.current[activeDocId]) {
        clearTimeout(encryptEditTimersRef.current[activeDocId]);
      }
      const targetDocId = activeDocId;
      const sessionPass = unlockedSession.passphrase;
      encryptEditTimersRef.current[activeDocId] = window.setTimeout(async () => {
        try {
          const payload = await encryptText(nextPlaintext, sessionPass);
          const latestDoc = docsRef.current.find((d) => d.id === targetDocId) || current;
          const nowTs = Date.now();
          const reEncryptedDoc: DocItem = {
            ...latestDoc,
            isEncrypted: true,
            encryptedPayload: payload,
            content: LOCKED_CONTENT_PLACEHOLDER,
            updatedAt: nowTs,
            lastModifiedBy: {
              userId: userProfile.userId,
              name: userProfile.name,
              color: userProfile.color,
              timestamp: nowTs,
              action: 'Menyunting dokumen terenkripsi',
            },
          };
          updateDocs(
            (prev) => prev.map((d) => (d.id === targetDocId ? reEncryptedDoc : d)),
            targetDocId,
            undefined,
            { type: 'upsert', doc: reEncryptedDoc },
            false
          );
        } catch (err) {
          console.error('Failed to re-encrypt document:', err);
        }
      }, 450);
      return;
    }

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

    const lastModifiedBy = {
      userId: userProfile.userId,
      name: userProfile.name,
      color: userProfile.color,
      timestamp: now,
      action: actionText,
    };

    let syncedProjectData = current.projectData;
    if (current.projectData) {
      syncedProjectData = {
        ...current.projectData,
        ...(updated.status ? { statusLabel: STATUS_TO_LABEL[updated.status] || current.projectData.statusLabel } : {}),
        ...(updated.priority ? { priorityLabel: PRIORITY_TO_LABEL_ID[updated.priority] || current.projectData.priorityLabel } : {}),
        ...(updated.deadline !== undefined
          ? { deadlineLabel: formatProjectDeadline(updated.deadline, current.projectData.deadlineLabel) }
          : {}),
      };
    }

    const merged: DocItem = {
      ...current,
      ...updated,
      ...(syncedProjectData ? { projectData: syncedProjectData } : {}),
      lastModifiedBy,
      statusHistory: newHistory,
      updatedAt: now,
    };

    // If editing metadata of a Favorite Project from DocumentEditor, route through full Favorite Project sync
    if (FAVORITE_PROJECT_IDS.has(activeDocId) && updated.content === undefined && !current.isEncrypted) {
      handleSaveFavoriteProjectDoc(merged);
      return;
    }

    const isTypingContent = updated.content !== undefined;
    if (isTypingContent) {
      isActivelyEditingRef.current = true;
      if (activeTypingTimerRef.current) clearTimeout(activeTypingTimerRef.current);
      activeTypingTimerRef.current = window.setTimeout(() => {
        isActivelyEditingRef.current = false;
      }, 1500);
    }

    const extraUpserts: DocItem[] = [];
    if (updated.title !== undefined && updated.title !== current.title) {
      const prodSyncDoc = syncDocTitlesToProductivity(
        docs,
        [{ id: current.id, title: updated.title }],
        now,
        lastModifiedBy
      );
      if (prodSyncDoc) extraUpserts.push(prodSyncDoc);

      const existingEval = docs.find((d) => d.id === EVALUATION_DOC_ID);
      if (existingEval?.evaluationData) {
        const hasLinkedEval = existingEval.evaluationData.projects.some(
          (p) => p.linkedDocId === current.id
        );
        if (hasLinkedEval) {
          extraUpserts.push({
            ...existingEval,
            updatedAt: now,
            evaluationData: {
              ...existingEval.evaluationData,
              projects: existingEval.evaluationData.projects.map((p) =>
                p.linkedDocId === current.id ? { ...p, name: updated.title! } : p
              ),
              issues: existingEval.evaluationData.issues.map((iss) =>
                iss.projectName === current.title ? { ...iss, projectName: updated.title! } : iss
              ),
            },
            lastModifiedBy,
          });
        }
      }
    }

    updateDocs(
      (prev) => {
        let next = prev.map((d) => (d.id === activeDocId ? merged : d));
        extraUpserts.forEach((extra) => {
          const exists = next.some((d) => d.id === extra.id);
          next = exists ? next.map((d) => (d.id === extra.id ? extra : d)) : [...next, extra];
        });
        return next;
      },
      activeDocId,
      updated.content,
      { type: 'upsert', doc: merged },
      !isTypingContent,
      extraUpserts
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

    const lastModifiedBy = {
      userId: userProfile.userId,
      name: userProfile.name,
      color: userProfile.color,
      timestamp: now,
      action: actionText,
    };

    let syncedProjectData = current.projectData;
    if (current.projectData) {
      syncedProjectData = {
        ...current.projectData,
        ...(updated.status ? { statusLabel: STATUS_TO_LABEL[updated.status] || current.projectData.statusLabel } : {}),
        ...(updated.priority ? { priorityLabel: PRIORITY_TO_LABEL_ID[updated.priority] || current.projectData.priorityLabel } : {}),
        ...(updated.deadline !== undefined
          ? { deadlineLabel: formatProjectDeadline(updated.deadline, current.projectData.deadlineLabel) }
          : {}),
      };
    }

    const merged: DocItem = {
      ...current,
      ...updated,
      ...(syncedProjectData ? { projectData: syncedProjectData } : {}),
      lastModifiedBy,
      statusHistory: newHistory,
      updatedAt: now,
    };

    if (FAVORITE_PROJECT_IDS.has(id)) {
      handleSaveFavoriteProjectDoc(merged);
      return;
    }

    const extraUpserts: DocItem[] = [];
    if (updated.title !== undefined && updated.title !== current.title) {
      const prodSyncDoc = syncDocTitlesToProductivity(
        docs,
        [{ id: current.id, title: updated.title }],
        now,
        lastModifiedBy
      );
      if (prodSyncDoc) extraUpserts.push(prodSyncDoc);
    }

    updateDocs(
      (prev) => {
        let next = prev.map((d) => (d.id === id ? merged : d));
        extraUpserts.forEach((extra) => {
          const exists = next.some((d) => d.id === extra.id);
          next = exists ? next.map((d) => (d.id === extra.id ? extra : d)) : [...next, extra];
        });
        return next;
      },
      id,
      updated.content,
      { type: 'upsert', doc: merged },
      true,
      extraUpserts
    );
  };

  const handleUpdateEvaluation = (updatedEval: EvaluationData, actionLabel?: string) => {
    const now = Date.now();
    const existing = docs.find((d) => d.id === EVALUATION_DOC_ID);
    const lastModifiedBy = {
      userId: userProfile.userId,
      name: userProfile.name,
      color: userProfile.color,
      timestamp: now,
      action: actionLabel || 'Memperbarui data evaluasi',
    };

    const mergedEvalDoc: DocItem = {
      id: EVALUATION_DOC_ID,
      title: 'Evaluasi Workspace',
      icon: '📊',
      parentId: null,
      content: '',
      tags: ['Evaluasi'],
      status: 'in_progress',
      priority: 'medium',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      evaluationData: updatedEval,
      lastModifiedBy,
    };

    // Bi-directional sync back to linked project docs (title, status, & markdown content)
    const syncedLinkedDocs: DocItem[] = [];
    const renamedDocs: Array<{ id: string; title: string }> = [];

    for (const ep of updatedEval.projects) {
      if (!ep.linkedDocId) continue;
      const target = docs.find((d) => d.id === ep.linkedDocId);
      if (target && (target.status !== ep.status || target.title !== ep.name)) {
        if (target.title !== ep.name) {
          renamedDocs.push({ id: target.id, title: ep.name });
        }
        const nextProjectData = target.projectData
          ? { ...target.projectData, statusLabel: STATUS_TO_LABEL[ep.status] }
          : target.projectData;
        const nextContent =
          nextProjectData && !target.isEncrypted
            ? buildProjectMarkdownContent(ep.name, target.icon, target.deadline, nextProjectData)
            : target.content;

        syncedLinkedDocs.push({
          ...target,
          title: ep.name,
          status: ep.status,
          content: nextContent,
          updatedAt: now,
          projectData: nextProjectData,
          lastModifiedBy: {
            ...lastModifiedBy,
            action: `Sinkronisasi dari Evaluasi: ${ep.name}`,
          },
        });
      }
    }

    const syncedProdDoc = syncDocTitlesToProductivity(docs, renamedDocs, now, lastModifiedBy);
    const extraUpserts: DocItem[] = [...syncedLinkedDocs];
    if (syncedProdDoc) extraUpserts.push(syncedProdDoc);

    updateDocs(
      (prev) => {
        let next = prev.some((d) => d.id === EVALUATION_DOC_ID)
          ? prev.map((d) => (d.id === EVALUATION_DOC_ID ? mergedEvalDoc : d))
          : [...prev, mergedEvalDoc];
        for (const extra of extraUpserts) {
          const exists = next.some((d) => d.id === extra.id);
          next = exists ? next.map((d) => (d.id === extra.id ? extra : d)) : [...next, extra];
        }
        return next;
      },
      EVALUATION_DOC_ID,
      undefined,
      { type: 'upsert', doc: mergedEvalDoc },
      true,
      extraUpserts
    );
  };

  const handleSaveFavoriteProjectDoc = (updatedDoc: DocItem) => {
    const now = Date.now();
    const existingDoc = docs.find((d) => d.id === updatedDoc.id);

    let nextHistory = updatedDoc.statusHistory
      ? [...updatedDoc.statusHistory]
      : existingDoc?.statusHistory
      ? [...existingDoc.statusHistory]
      : [];

    if (existingDoc && existingDoc.status !== updatedDoc.status) {
      const changeLog: StatusChangeLog = {
        id: `log_${now}_${Math.random().toString(36).substring(2, 6)}`,
        fromStatus: existingDoc.status,
        toStatus: updatedDoc.status,
        changedBy: {
          userId: userProfile.userId,
          name: userProfile.name,
          color: userProfile.color,
        },
        timestamp: now,
      };
      nextHistory = [changeLog, ...nextHistory].slice(0, 50);
    }

    const rebuiltContent =
      updatedDoc.projectData && !updatedDoc.isEncrypted
        ? buildProjectMarkdownContent(
            updatedDoc.title,
            updatedDoc.icon,
            updatedDoc.deadline,
            updatedDoc.projectData
          )
        : updatedDoc.content;

    const finalProjectDoc: DocItem = {
      ...updatedDoc,
      content: rebuiltContent,
      updatedAt: updatedDoc.updatedAt || now,
      statusHistory: nextHistory,
    };

    const projectStats = finalProjectDoc.projectData
      ? {
          completedTasks:
            finalProjectDoc.projectData.tasks.filter((t) => t.completed).length +
            finalProjectDoc.projectData.baseCompletedTasks,
          totalTasks:
            finalProjectDoc.projectData.tasks.length +
            finalProjectDoc.projectData.baseTotalTasks,
          status: (finalProjectDoc.status === 'archived'
            ? 'in_progress'
            : finalProjectDoc.status) as 'not_started' | 'in_progress' | 'completed',
        }
      : null;

    const existingEvalDoc = docs.find((d) => d.id === EVALUATION_DOC_ID);
    const currentEvalData = existingEvalDoc?.evaluationData || DEFAULT_EVALUATION_DATA;

    let renamedFrom: string | null = null;
    const updatedEvalProjects = projectStats
      ? currentEvalData.projects.map((p) => {
          const matchesDoc =
            p.linkedDocId === finalProjectDoc.id ||
            (finalProjectDoc.id === WEB_PROJECT_DOC_ID &&
              (p.name.toLowerCase().includes('website') || p.id === 'eval-p-1')) ||
            (finalProjectDoc.id === MOBILE_PROJECT_DOC_ID &&
              (p.name.toLowerCase().includes('habit') || p.id === 'eval-p-2')) ||
            (finalProjectDoc.id === DESIGN_PROJECT_DOC_ID &&
              (p.name.toLowerCase().includes('kopi sore') || p.id === 'eval-p-3'));

          if (matchesDoc) {
            if (p.name !== finalProjectDoc.title) {
              renamedFrom = p.name;
            }
            return {
              ...p,
              name: finalProjectDoc.title,
              linkedDocId: finalProjectDoc.id,
              completedTasks: projectStats.completedTasks,
              totalTasks: projectStats.totalTasks,
              status: projectStats.status,
            };
          }
          return p;
        })
      : currentEvalData.projects;

    const updatedEvalIssues = renamedFrom
      ? currentEvalData.issues.map((iss) =>
          iss.projectName === renamedFrom
            ? { ...iss, projectName: finalProjectDoc.title }
            : iss
        )
      : currentEvalData.issues;

    const syncedEvalData: EvaluationData | null = projectStats
      ? {
          ...currentEvalData,
          projects: updatedEvalProjects,
          issues: updatedEvalIssues,
        }
      : null;

    const mergedEvalDoc: DocItem | null = syncedEvalData
      ? {
          id: EVALUATION_DOC_ID,
          title: 'Evaluasi Workspace',
          icon: '📊',
          parentId: null,
          content: '',
          tags: ['Evaluasi'],
          status: 'in_progress',
          priority: 'medium',
          createdAt: existingEvalDoc?.createdAt || now,
          updatedAt: now,
          evaluationData: syncedEvalData,
          lastModifiedBy: finalProjectDoc.lastModifiedBy,
        }
      : null;

    const existingProdDoc = docs.find((d) => d.id === PRODUCTIVITY_DOC_ID);
    const currentProdData = existingProdDoc?.productivityData || DEFAULT_PRODUCTIVITY_DATA;
    let prodChanged = false;
    const taskById = new Map((finalProjectDoc.projectData?.tasks || []).map((t) => [t.id, t]));
    const taskByTitle = new Map(
      (finalProjectDoc.projectData?.tasks || []).map((t) => [t.title.toLowerCase(), t])
    );

    const syncedActivities = currentProdData.activities.map((act) => {
      if (act.linkedDocId !== finalProjectDoc.id) return act;
      let nextAct = act;
      let actChanged = false;
      if (act.projectName !== finalProjectDoc.title) {
        nextAct = { ...nextAct, projectName: finalProjectDoc.title };
        actChanged = true;
      }
      const matchedById = act.linkedTaskId ? taskById.get(act.linkedTaskId) : undefined;
      const matchedTask = matchedById || taskByTitle.get(act.title.toLowerCase());
      if (matchedTask) {
        const expectedStatus = matchedTask.completed
          ? 'completed'
          : act.status === 'completed'
          ? 'in_progress'
          : act.status;
        if (expectedStatus !== nextAct.status) {
          nextAct = {
            ...nextAct,
            status: expectedStatus,
            durationMinutes:
              expectedStatus === 'completed' && nextAct.durationMinutes === 0 ? 30 : nextAct.durationMinutes,
          };
          actChanged = true;
        }
        // Sync task title & assignee edits when linked by taskId
        if (matchedById && matchedById.title !== nextAct.title) {
          nextAct = { ...nextAct, title: matchedById.title };
          actChanged = true;
        }
        if (matchedById && matchedById.assignee && nextAct.assignee !== 'Saya' && matchedById.assignee !== nextAct.assignee) {
          nextAct = { ...nextAct, assignee: matchedById.assignee };
          actChanged = true;
        }
        if (!nextAct.linkedTaskId) {
          nextAct = { ...nextAct, linkedTaskId: matchedTask.id };
          actChanged = true;
        }
      } else if (act.linkedTaskId && finalProjectDoc.projectData) {
        // Task was removed from project: clear dangling taskId while preserving logged activity
        nextAct = { ...nextAct, linkedTaskId: undefined };
        actChanged = true;
      }
      if (actChanged) {
        nextAct = { ...nextAct, updatedAt: now };
        prodChanged = true;
      }
      return nextAct;
    });

    const syncedDayLabels = currentProdData.dayLabels.map((lbl) => {
      if (lbl.linkedDocId === finalProjectDoc.id && lbl.projectName !== finalProjectDoc.title) {
        prodChanged = true;
        return { ...lbl, projectName: finalProjectDoc.title, updatedAt: now };
      }
      return lbl;
    });

    const mergedProdDoc: DocItem | null = prodChanged
      ? {
          id: PRODUCTIVITY_DOC_ID,
          title: 'Produktivitas Workspace',
          icon: '⚡',
          parentId: null,
          content: '',
          tags: ['Produktif'],
          status: 'in_progress',
          priority: 'medium',
          createdAt: existingProdDoc?.createdAt || now,
          updatedAt: now,
          productivityData: {
            ...currentProdData,
            activities: syncedActivities,
            dayLabels: syncedDayLabels,
            updatedAt: now,
          },
          lastModifiedBy: finalProjectDoc.lastModifiedBy,
        }
      : null;

    const extraUpserts: DocItem[] = [];
    if (mergedEvalDoc) extraUpserts.push(mergedEvalDoc);
    if (mergedProdDoc) extraUpserts.push(mergedProdDoc);

    updateDocs(
      (prev) => {
        const hasProject = prev.some((d) => d.id === finalProjectDoc.id);
        let next = hasProject
          ? prev.map((d) => (d.id === finalProjectDoc.id ? finalProjectDoc : d))
          : [finalProjectDoc, ...prev];
        for (const extra of extraUpserts) {
          const exists = next.some((d) => d.id === extra.id);
          next = exists ? next.map((d) => (d.id === extra.id ? extra : d)) : [...next, extra];
        }
        return next;
      },
      finalProjectDoc.id,
      finalProjectDoc.content,
      { type: 'upsert', doc: finalProjectDoc },
      true,
      extraUpserts
    );
  };

  const handleUpdateProductivity = (
    updatedProd: ProductivityData,
    actionLabel?: string,
    taskSync?: ProductivityTaskSyncHint
  ) => {
    const now = Date.now();
    const existingProd = docs.find((d) => d.id === PRODUCTIVITY_DOC_ID);
    const mergedProdDoc: DocItem = {
      id: PRODUCTIVITY_DOC_ID,
      title: 'Produktivitas Workspace',
      icon: '⚡',
      parentId: null,
      content: '',
      tags: ['Produktif'],
      status: 'in_progress',
      priority: 'medium',
      createdAt: existingProd?.createdAt || now,
      updatedAt: now,
      productivityData: updatedProd,
      lastModifiedBy: {
        userId: userProfile.userId,
        name: userProfile.name,
        color: userProfile.color,
        timestamp: now,
        action: actionLabel || 'Memperbarui data produktivitas',
      },
    };

    let syncedTargetDoc: DocItem | null = null;
    let syncedEvalDoc: DocItem | null = null;

    if (taskSync) {
      const target = docs.find((d) => d.id === taskSync.docId);
      if (target && target.projectData) {
        const pd = target.projectData;
        const matchedIdx = pd.tasks.findIndex(
          (t) =>
            (taskSync.taskId && t.id === taskSync.taskId) ||
            (taskSync.previousTitle && t.title.toLowerCase() === taskSync.previousTitle.toLowerCase()) ||
            t.title.toLowerCase() === taskSync.taskTitle.toLowerCase()
        );

        let nextTasks = [...pd.tasks];
        let changed = false;
        if (matchedIdx >= 0) {
          const existingTask = nextTasks[matchedIdx];
          const nextTitle = taskSync.taskTitle || existingTask.title;
          const nextAssignee = taskSync.assignee || existingTask.assignee;
          if (
            existingTask.completed !== taskSync.completed ||
            existingTask.title !== nextTitle ||
            existingTask.assignee !== nextAssignee
          ) {
            nextTasks[matchedIdx] = {
              ...existingTask,
              title: nextTitle,
              assignee: nextAssignee,
              completed: taskSync.completed,
              ...(taskSync.completed && existingTask.dueDate !== 'Selesai' ? { dueDate: 'Selesai' } : {}),
            };
            changed = true;
          }
        } else if (taskSync.createIfMissing) {
          nextTasks = [
            {
              id: taskSync.taskId || `task-prod-${now}`,
              title: taskSync.taskTitle,
              assignee: taskSync.assignee || userProfile.name,
              priority: 'Sedang',
              dueDate: 'Hari ini',
              completed: taskSync.completed,
            },
            ...nextTasks,
          ];
          changed = true;
        }

        if (changed) {
          const nextPd = { ...pd, tasks: nextTasks };
          syncedTargetDoc = {
            ...target,
            updatedAt: now,
            projectData: nextPd,
            content: buildProjectMarkdownContent(target.title, target.icon, target.deadline, nextPd),
            lastModifiedBy: {
              userId: userProfile.userId,
              name: userProfile.name,
              color: userProfile.color,
              timestamp: now,
              action: actionLabel || `Sinkron dari Produktif: ${taskSync.taskTitle}`,
            },
          };

          if (FAVORITE_PROJECT_IDS.has(target.id)) {
            const existingEval = docs.find((d) => d.id === EVALUATION_DOC_ID);
            const curEval = existingEval?.evaluationData || DEFAULT_EVALUATION_DATA;
            const completedTotal = nextTasks.filter((t) => t.completed).length + pd.baseCompletedTasks;
            const taskTotal = nextTasks.length + pd.baseTotalTasks;
            syncedEvalDoc = {
              id: EVALUATION_DOC_ID,
              title: 'Evaluasi Workspace',
              icon: '📊',
              parentId: null,
              content: '',
              tags: ['Evaluasi'],
              status: 'in_progress',
              priority: 'medium',
              createdAt: existingEval?.createdAt || now,
              updatedAt: now,
              evaluationData: {
                ...curEval,
                projects: curEval.projects.map((p) =>
                  p.linkedDocId === target.id
                    ? { ...p, completedTasks: completedTotal, totalTasks: taskTotal }
                    : p
                ),
              },
              lastModifiedBy: mergedProdDoc.lastModifiedBy,
            };
          }
        }
      }
    }

    const extraUpserts: DocItem[] = [];
    if (syncedTargetDoc) extraUpserts.push(syncedTargetDoc);
    if (syncedEvalDoc) extraUpserts.push(syncedEvalDoc);

    updateDocs(
      (prev) => {
        let next = prev.some((d) => d.id === PRODUCTIVITY_DOC_ID)
          ? prev.map((d) => (d.id === PRODUCTIVITY_DOC_ID ? mergedProdDoc : d))
          : [...prev, mergedProdDoc];
        for (const extra of extraUpserts) {
          const exists = next.some((d) => d.id === extra.id);
          next = exists ? next.map((d) => (d.id === extra.id ? extra : d)) : [...next, extra];
        }
        return next;
      },
      PRODUCTIVITY_DOC_ID,
      undefined,
      { type: 'upsert', doc: mergedProdDoc },
      true,
      extraUpserts
    );
  };

  // Lock & encrypt a document using the provided password
  const handleLockDocWithPassword = async (docId: string, passphrase: string): Promise<boolean> => {
    const current = docs.find((d) => d.id === docId);
    if (!current || !passphrase) return false;

    if (encryptEditTimersRef.current[docId]) {
      clearTimeout(encryptEditTimersRef.current[docId]);
      delete encryptEditTimersRef.current[docId];
    }

    const session = unlockedDocsRef.current[docId];
    const plaintext =
      session?.content !== undefined
        ? session.content
        : current.content === LOCKED_CONTENT_PLACEHOLDER
          ? ''
          : current.content || '';

    const encryptedPayload = await encryptText(plaintext, passphrase);
    const now = Date.now();

    const merged: DocItem = {
      ...current,
      isEncrypted: true,
      encryptedPayload,
      content: LOCKED_CONTENT_PLACEHOLDER,
      updatedAt: now,
      lastModifiedBy: {
        userId: userProfile.userId,
        name: userProfile.name,
        color: userProfile.color,
        timestamp: now,
        action: 'Mengunci dokumen dengan password (E2EE)',
      },
    };

    setUnlockedDocs((prev) => {
      if (!prev[docId]) return prev;
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    delete unlockedDocsRef.current[docId];

    updateDocs(
      (prev) => prev.map((d) => (d.id === docId ? merged : d)),
      docId,
      undefined,
      { type: 'upsert', doc: merged },
      true
    );

    return true;
  };

  // Unlock a locked document by verifying the exact same password used to lock it
  const handleUnlockDocWithPassword = async (
    docId: string,
    passphrase: string,
    options?: { permanent?: boolean }
  ): Promise<boolean> => {
    const current = docs.find((d) => d.id === docId);
    if (!current || !passphrase) return false;

    let plaintext = '';

    if (current.encryptedPayload) {
      // Compatibility for pre-seeded demo doc-secure dummy payload
      if (current.id === 'doc-secure' && current.encryptedPayload.iv === 'xYz123456789') {
        if (passphrase !== 'noverse2026') {
          return false;
        }
        plaintext =
          current.content && current.content !== LOCKED_CONTENT_PLACEHOLDER
            ? current.content
            : `# 🔒 Catatan Rahasia yang Berhasil Terbuka\n\nBrankas **End-to-End Encryption** berhasil dibuka dengan kunci privat lokal Anda.\n\n### Data Terproteksi:\n- Kode API Rahasia: \`sk-prod-994129x-vault\`\n- Akses Kunci: Terverifikasi AES-GCM 256-bit\n- Hanya Anda yang memiliki akses ke memori ini.`;

        // Upgrade legacy demo payload to real AES-GCM ciphertext
        if (!options?.permanent) {
          try {
            const upgradedPayload = await encryptText(plaintext, passphrase);
            const now = Date.now();
            const upgradedDoc: DocItem = {
              ...current,
              isEncrypted: true,
              encryptedPayload: upgradedPayload,
              content: LOCKED_CONTENT_PLACEHOLDER,
              updatedAt: now,
            };
            updateDocs(
              (prev) => prev.map((d) => (d.id === docId ? upgradedDoc : d)),
              docId,
              undefined,
              { type: 'upsert', doc: upgradedDoc },
              true
            );
          } catch {}
        }
      } else {
        try {
          plaintext = await decryptText(current.encryptedPayload, passphrase);
        } catch {
          return false;
        }
      }
    } else {
      // Fallback if an older doc was marked isEncrypted without encryptedPayload
      plaintext = current.content === LOCKED_CONTENT_PLACEHOLDER ? '' : current.content || '';
    }

    if (options?.permanent) {
      if (encryptEditTimersRef.current[docId]) {
        clearTimeout(encryptEditTimersRef.current[docId]);
        delete encryptEditTimersRef.current[docId];
      }
      setUnlockedDocs((prev) => {
        if (!prev[docId]) return prev;
        const next = { ...prev };
        delete next[docId];
        return next;
      });
      delete unlockedDocsRef.current[docId];

      const now = Date.now();
      const merged: DocItem = {
        ...current,
        isEncrypted: false,
        encryptedPayload: undefined,
        content: plaintext,
        updatedAt: now,
        lastModifiedBy: {
          userId: userProfile.userId,
          name: userProfile.name,
          color: userProfile.color,
          timestamp: now,
          action: 'Menonaktifkan kunci dokumen (E2EE)',
        },
      };

      updateDocs(
        (prev) => prev.map((d) => (d.id === docId ? merged : d)),
        docId,
        plaintext,
        { type: 'upsert', doc: merged },
        true
      );
      return true;
    }

    const sessionEntry = { content: plaintext, passphrase };
    unlockedDocsRef.current[docId] = sessionEntry;
    setUnlockedDocs((prev) => ({ ...prev, [docId]: sessionEntry }));
    return true;
  };

  // Re-lock an unlocked encrypted document immediately (flushing latest edits)
  const handleRelockDocSession = async (docId: string): Promise<void> => {
    const current = docs.find((d) => d.id === docId);
    const session = unlockedDocsRef.current[docId];
    if (!current || !session) return;

    if (encryptEditTimersRef.current[docId]) {
      clearTimeout(encryptEditTimersRef.current[docId]);
      delete encryptEditTimersRef.current[docId];
    }

    const encryptedPayload = await encryptText(session.content, session.passphrase);
    const now = Date.now();
    const merged: DocItem = {
      ...current,
      isEncrypted: true,
      encryptedPayload,
      content: LOCKED_CONTENT_PLACEHOLDER,
      updatedAt: now,
      lastModifiedBy: {
        userId: userProfile.userId,
        name: userProfile.name,
        color: userProfile.color,
        timestamp: now,
        action: 'Mengunci kembali dokumen (E2EE)',
      },
    };

    setUnlockedDocs((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    delete unlockedDocsRef.current[docId];

    updateDocs(
      (prev) => prev.map((d) => (d.id === docId ? merged : d)),
      docId,
      undefined,
      { type: 'upsert', doc: merged },
      true
    );
  };

  // E2EE Vault unlock (TopBar modal)
  const handleUnlockVault = async (passphrase: string): Promise<boolean> => {
    try {
      if (activeDoc?.isEncrypted) {
        const ok = await handleUnlockDocWithPassword(activeDoc.id, passphrase, { permanent: false });
        if (!ok) return false;
      } else if (passphrase.length < 4) {
        return false;
      }
      setIsVaultUnlocked(true);
      setVaultPassphrase(passphrase);
      return true;
    } catch (err) {
      console.error('Decryption failed:', err);
      return false;
    }
  };

  const handleLockVault = () => {
    setIsVaultUnlocked(false);
    setVaultPassphrase(null);
    Object.keys(unlockedDocsRef.current).forEach((docId) => {
      handleRelockDocSession(docId).catch(() => {});
    });
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
          const now = Date.now();
          const imported = migrateDocs(
            parsed.map((item: DocItem) => ({
              ...item,
              updatedAt: Math.max(item.updatedAt || 0, now),
            }))
          );
          imported.forEach((d) => pendingUpsertsRef.current.set(d.id, d.updatedAt || now));
          pendingDeletesRef.current.clear();
          docsRef.current = imported;
          setDocs(imported);
          saveStoredDocs(imported);
          triggerServerSync(imported, undefined, true);
          collabManagerRef.current?.requestInitialSync();
          showTransientNotice('success', 'Cadangan workspace berhasil diimpor & disinkronkan ke semua perangkat.');
        } else {
          showTransientNotice('error', 'Format berkas cadangan tidak sesuai.');
        }
      } catch {
        showTransientNotice('error', 'Gagal membaca berkas JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-slate-950 font-sans">
      {/* Sidebar Navigation (Hidden during Focus Mode) */}
      {!isEditorFocusActive && (
        <Sidebar
          docs={visibleDocs}
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
      )}

      {/* Main Viewport Container */}
      <div
        className={`flex-1 flex flex-col h-screen min-w-0 overflow-hidden ${
          isEditorFocusActive ? 'pb-0' : 'pb-14 md:pb-0'
        }`}
      >
        {/* Top Header Bar (Hidden during Focus Mode) */}
        {!isEditorFocusActive && (
          <TopBar
            activeDoc={activeDoc}
            docs={visibleDocs}
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
        )}

        {/* View Routing */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {importNotice && (
            <div
              className={`fixed bottom-16 md:bottom-5 right-5 z-50 px-4 py-2.5 rounded-[6px] border text-xs font-medium shadow-lg transition-all ${
                importNotice.type === 'success'
                  ? 'bg-[#EAF0EB] dark:bg-[#1D2B22] border-[#C5D6C9] dark:border-[#2E4636] text-[#282925] dark:text-[#EDEDE8]'
                  : 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200'
              }`}
            >
              {importNotice.message}
            </div>
          )}
          {activeView === 'overview' && (
            <WorkspaceOverview
              docs={visibleDocs}
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
              isDocUnlocked={!activeDoc.isEncrypted || Boolean(unlockedDocs[activeDoc.id])}
              unlockedContent={unlockedDocs[activeDoc.id]?.content}
              onUpdateDoc={handleUpdateActiveDoc}
              onSelectDoc={handleSelectDoc}
              onCreateSubPage={handleCreateDoc}
              onSendCursor={(cursor) => collabManagerRef.current?.sendCursorMove(cursor)}
              onUnlockVault={handleUnlockVault}
              onLockWithPassword={(passphrase) => handleLockDocWithPassword(activeDoc.id, passphrase)}
              onUnlockWithPassword={(passphrase, permanent) =>
                handleUnlockDocWithPassword(activeDoc.id, passphrase, { permanent })
              }
              onRelockDoc={() => handleRelockDocSession(activeDoc.id)}
              isFocusMode={isEditorFocusActive}
              autoFocusOnType={autoFocusOnType}
              onSetFocusMode={setIsFocusMode}
              onToggleAutoFocusOnType={() => setAutoFocusOnType((prev) => !prev)}
            />
          )}

          {activeView === 'database_table' && (
            <DatabaseView
              docs={visibleDocs}
              currentMode="table"
              lang={lang}
              dayLabels={productivityData.dayLabels}
              productivityActivities={productivityData.activities}
              onOpenProductivity={() => setActiveView('produktif')}
              onSelectDoc={handleSelectDoc}
              onUpdateDoc={handleUpdateDocById}
              onCreateDoc={handleCreateDoc}
              onDeleteDoc={handleDeleteDoc}
            />
          )}

          {activeView === 'database_board' && (
            <DatabaseView
              docs={visibleDocs}
              currentMode="board"
              lang={lang}
              dayLabels={productivityData.dayLabels}
              productivityActivities={productivityData.activities}
              onOpenProductivity={() => setActiveView('produktif')}
              onSelectDoc={handleSelectDoc}
              onUpdateDoc={handleUpdateDocById}
              onCreateDoc={handleCreateDoc}
              onDeleteDoc={handleDeleteDoc}
            />
          )}

          {activeView === 'database_calendar' && (
            <DatabaseView
              docs={visibleDocs}
              currentMode="calendar"
              lang={lang}
              dayLabels={productivityData.dayLabels}
              productivityActivities={productivityData.activities}
              onOpenProductivity={() => setActiveView('produktif')}
              onSelectDoc={handleSelectDoc}
              onUpdateDoc={handleUpdateDocById}
              onCreateDoc={handleCreateDoc}
              onDeleteDoc={handleDeleteDoc}
            />
          )}

          {activeView === 'analytics' && (
            <AnalyticsDashboard
              docs={visibleDocs}
              lang={lang}
            />
          )}

          {activeView === 'project_web' && (
            <ProjectWebDetail
              docs={visibleDocs}
              lang={lang}
              collaborators={collaborators}
              userProfile={userProfile}
              onSelectDoc={handleSelectDoc}
              onSaveWebDoc={handleSaveFavoriteProjectDoc}
              onCreateDoc={handleCreateDoc}
              onSelectView={setActiveView}
            />
          )}

          {activeView === 'project_mobile' && (
            <ProjectMobileDetail
              docs={visibleDocs}
              userProfile={userProfile}
              onSelectDoc={handleSelectDoc}
              onSaveMobileDoc={handleSaveFavoriteProjectDoc}
              onCreateDoc={handleCreateDoc}
            />
          )}

          {activeView === 'project_design' && (
            <ProjectDesignDetail
              docs={visibleDocs}
              userProfile={userProfile}
              onSelectDoc={handleSelectDoc}
              onSaveDesignDoc={handleSaveFavoriteProjectDoc}
              onCreateDoc={handleCreateDoc}
            />
          )}

          {activeView === 'evaluasi' && (
            <EvaluasiPage
              evaluationData={evaluationData}
              userProfile={userProfile}
              onUpdateEvaluation={handleUpdateEvaluation}
              onSelectView={setActiveView}
              onSelectDoc={handleSelectDoc}
            />
          )}

          {activeView === 'produktif' && (
            <ProduktifPage
              productivityData={productivityData}
              docs={visibleDocs}
              userProfile={userProfile}
              collaborators={collaborators}
              onUpdateProductivity={handleUpdateProductivity}
              onSelectDoc={handleSelectDoc}
              onSelectView={setActiveView}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< md) (Hidden during Focus Mode) */}
      {!isEditorFocusActive && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 h-14 bg-white/95 dark:bg-[#121211]/95 backdrop-blur-md border-t border-[#EAEAE5] dark:border-[#2B2B28] z-30 flex items-center justify-around px-1">
          <button
            onClick={() => setActiveView('overview')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              activeView === 'overview'
                ? 'text-[#282925] dark:text-[#EDEDE8] font-bold'
                : 'text-[#777973]'
            }`}
          >
            <Home size={16} />
            <span>Ringkasan</span>
          </button>

          <button
            onClick={() => {
              setActiveView('editor');
              if (!activeDocId && visibleDocs[0]) setActiveDocId(visibleDocs[0].id);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              activeView === 'editor'
                ? 'text-[#282925] dark:text-[#EDEDE8] font-bold'
                : 'text-[#777973]'
            }`}
          >
            <FileText size={16} />
            <span>Catatan</span>
          </button>

          <button
            onClick={() => setActiveView('database_table')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              activeView === 'database_table'
                ? 'text-[#282925] dark:text-[#EDEDE8] font-bold'
                : 'text-[#777973]'
            }`}
          >
            <Table size={16} />
            <span>Tabel</span>
          </button>

          <button
            onClick={() => setActiveView('database_board')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              activeView === 'database_board'
                ? 'text-[#282925] dark:text-[#EDEDE8] font-bold'
                : 'text-[#777973]'
            }`}
          >
            <Kanban size={16} />
            <span>Kanban</span>
          </button>

          <button
            onClick={() => setActiveView('database_calendar')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              activeView === 'database_calendar'
                ? 'text-[#282925] dark:text-[#EDEDE8] font-bold'
                : 'text-[#777973]'
            }`}
          >
            <CalendarIcon size={16} />
            <span>Kalender</span>
          </button>

          <button
            onClick={() => setActiveView('evaluasi')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              activeView === 'evaluasi'
                ? 'text-[#282925] dark:text-[#EDEDE8] font-bold'
                : 'text-[#777973]'
            }`}
          >
            <ChartNoAxesCombined size={16} />
            <span>Evaluasi</span>
          </button>

          <button
            onClick={() => setActiveView('produktif')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              activeView === 'produktif'
                ? 'text-[#282925] dark:text-[#EDEDE8] font-bold'
                : 'text-[#777973]'
            }`}
          >
            <CalendarCheck2 size={16} />
            <span>Produktif</span>
          </button>
        </nav>
      )}

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
        docs={visibleDocs}
        lang={lang}
        onClose={() => setShowNotificationModal(false)}
        onSelectDoc={handleSelectDoc}
        onSnoozeReminder={handleSnoozeReminder}
        onDismissReminder={handleDismissReminder}
      />
    </div>
  );
}
