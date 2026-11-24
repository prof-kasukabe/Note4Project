import React, { useState, useMemo } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Edit3,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Tag,
  ArrowRight,
  SlidersHorizontal,
  ExternalLink,
  MessageSquare,
  Send,
} from 'lucide-react';
import {
  ActiveView,
  ActivityComment,
  CalendarDayLabel,
  Collaborator,
  DocItem,
  ProductivityActivity,
  ProductivityData,
} from '../types';
import {
  WEB_PROJECT_DOC_ID,
  MOBILE_PROJECT_DOC_ID,
  DESIGN_PROJECT_DOC_ID,
} from '../utils/seedData';

export interface ProductivityTaskSyncHint {
  docId: string;
  taskId?: string;
  taskTitle: string;
  previousTitle?: string;
  completed: boolean;
  assignee?: string;
  createIfMissing?: boolean;
}

interface ProduktifPageProps {
  productivityData: ProductivityData;
  docs: DocItem[];
  userProfile: { userId: string; name: string; color: string };
  collaborators?: Collaborator[];
  onUpdateProductivity: (
    updated: ProductivityData,
    actionLabel?: string,
    taskSync?: ProductivityTaskSyncHint
  ) => void;
  onSelectDoc: (id: string) => void;
  onSelectView: (view: ActiveView) => void;
}

const DEFAULT_TODAY_ISO = '2026-11-17';

const CATEGORIES = [
  'Desain antarmuka',
  'Pengembangan',
  'Riset & perencanaan',
  'Review & revisi',
];

const LABEL_COLORS: Array<{ name: string; hex: string; status: CalendarDayLabel['status'] }> = [
  { name: 'Selesai', hex: '#567561', status: 'completed' },
  { name: 'Dikerjakan', hex: '#5D748B', status: 'in_progress' },
  { name: 'Fokus Khusus', hex: '#8B6935', status: 'in_progress' },
  { name: 'Dijadwalkan', hex: '#6366F1', status: 'planned' },
];

const WEEKDAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];
const MONTHS_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const parseIsoDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const toIsoDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addDaysIso = (iso: string, delta: number): string => {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + delta);
  return toIsoDate(d);
};

const formatLongDateId = (iso: string): string => {
  const date = parseIsoDate(iso);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatShortDayHeaderId = (iso: string): { shortDay: string; dayNum: number; label: string; longName: string } => {
  const date = parseIsoDate(iso);
  const shortDay = WEEKDAYS_SHORT[date.getDay()];
  const dayNum = date.getDate();
  const longName = date.toLocaleDateString('id-ID', { weekday: 'long' });
  return {
    shortDay,
    dayNum,
    label: `${shortDay} ${dayNum}`,
    longName: longName.charAt(0).toUpperCase() + longName.slice(1),
  };
};

const formatFocusDuration = (minutes: number): string => {
  if (minutes <= 0) return '0 mnt';
  if (minutes < 60) return `${minutes} mnt`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} jam`;
  return `${hrs}j ${mins}m`;
};

const formatCommentTime = (ts: number): string => {
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  if (diffMin >= 0 && diffMin < 1) return 'Baru saja';
  if (diffMin >= 1 && diffMin < 60) return `${diffMin} mnt lalu`;
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS_SHORT_ID[d.getMonth()]} · ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
};

export const ProduktifPage: React.FC<ProduktifPageProps> = ({
  productivityData,
  docs,
  userProfile,
  collaborators = [],
  onUpdateProductivity,
  onSelectDoc,
  onSelectView,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(DEFAULT_TODAY_ISO);
  const [calendarCursor, setCalendarCursor] = useState<Date>(() => parseIsoDate(DEFAULT_TODAY_ISO));

  // Header filters
  const [memberFilter, setMemberFilter] = useState<string>('Saya');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [rangeMode, setRangeMode] = useState<'week_focus' | 'week_selected' | 'month'>('week_focus');
  const [activityStatusFilter, setActivityStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Dropdown visibility
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Modals & Inline editors
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ProductivityActivity | null>(null);
  const [showTargetEditor, setShowTargetEditor] = useState(false);
  const [dailyTargetInput, setDailyTargetInput] = useState(String(productivityData.dailyTarget || 6));
  const [weeklyTargetInput, setWeeklyTargetInput] = useState(String(productivityData.weeklyTarget || 42));

  React.useEffect(() => {
    if (!showTargetEditor) {
      setDailyTargetInput(String(productivityData.dailyTarget || 6));
      setWeeklyTargetInput(String(productivityData.weeklyTarget || 42));
    }
  }, [productivityData.dailyTarget, productivityData.weeklyTarget, showTargetEditor]);

  // Task Detail & Collaborator Comments Drawer
  const [detailActivityId, setDetailActivityId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isEditingTaskNote, setIsEditingTaskNote] = useState(false);
  const [taskNoteInput, setTaskNoteInput] = useState('');
  const commentInputRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Mini calendar inline label creator
  const [newLabelText, setNewLabelText] = useState('');
  const [newLabelStatus, setNewLabelStatus] = useState<CalendarDayLabel['status']>('in_progress');
  const [newLabelColor, setNewLabelColor] = useState('#567561');
  const [newLabelDocId, setNewLabelDocId] = useState<string>('');
  const [editingDayLabelId, setEditingDayLabelId] = useState<string | null>(null);

  // Daily reflection inline editor
  const [isEditingReflection, setIsEditingReflection] = useState(false);
  const [reflectionHeadlineInput, setReflectionHeadlineInput] = useState('');
  const [reflectionSummaryInput, setReflectionSummaryInput] = useState('');

  // Activity Modal Form State
  const [actTitle, setActTitle] = useState('');
  const [actLinkedDocId, setActLinkedDocId] = useState<string>(WEB_PROJECT_DOC_ID);
  const [actCategory, setActCategory] = useState<string>(CATEGORIES[0]);
  const [actDuration, setActDuration] = useState<string>('30');
  const [actDate, setActDate] = useState<string>(DEFAULT_TODAY_ISO);
  const [actStatus, setActStatus] = useState<ProductivityActivity['status']>('completed');
  const [actAssignee, setActAssignee] = useState<string>('Saya');
  const [actNotes, setActNotes] = useState<string>('');
  const [actSyncToProject, setActSyncToProject] = useState<boolean>(true);

  // Resolve live project names from docs when linkedDocId exists
  const docTitleById = useMemo(() => {
    const map = new Map<string, string>();
    docs.forEach((d) => map.set(d.id, d.title));
    return map;
  }, [docs]);

  const resolveProjectDisplayName = (projectName: string, linkedDocId?: string) => {
    if (linkedDocId && docTitleById.has(linkedDocId)) {
      return docTitleById.get(linkedDocId) || projectName;
    }
    return projectName;
  };

  // Unique project options from live workspace docs
  const projectOptions = useMemo(() => {
    return docs.map((d) => ({
      id: d.id,
      title: d.title,
      icon: d.icon,
    }));
  }, [docs]);

  // Unique member options
  const memberOptions = useMemo(() => {
    const set = new Set<string>(['Saya', userProfile.name]);
    productivityData.activities.forEach((a) => {
      if (a.assignee) set.add(a.assignee);
    });
    return ['Semua tim', ...Array.from(set)];
  }, [productivityData.activities, userProfile.name]);

  // Active task detail item derived reactively so remote collaborator comments sync live
  const detailActivity = useMemo(
    () =>
      detailActivityId
        ? productivityData.activities.find((a) => a.id === detailActivityId) || null
        : null,
    [productivityData.activities, detailActivityId]
  );

  // Known collaborator names for quick @mention inside task comments
  const quickMentionNames = useMemo(() => {
    const names = new Set<string>();
    collaborators.forEach((c) => {
      if (c.name && c.name !== userProfile.name) names.add(c.name);
    });
    productivityData.activities.forEach((a) => {
      a.comments?.forEach((cm) => {
        if (cm.authorName && cm.authorName !== userProfile.name) {
          names.add(cm.authorName);
        }
      });
    });
    if (names.size === 0) {
      ['Rafi', 'Nadia', 'Siti Rahma'].forEach((n) => {
        if (n !== userProfile.name) names.add(n);
      });
    }
    return Array.from(names).slice(0, 5);
  }, [collaborators, productivityData.activities, userProfile.name]);

  // Active 7-day chart dates
  const weekDates = useMemo(() => {
    const anchorIso = rangeMode === 'week_selected' ? selectedDate : DEFAULT_TODAY_ISO;
    const dates: string[] = [];
    for (let i = -6; i <= 0; i++) {
      dates.push(addDaysIso(anchorIso, i));
    }
    return dates;
  }, [rangeMode, selectedDate]);

  const rangeDateSet = useMemo(() => new Set(weekDates), [weekDates]);

  const activeRangeLabel = useMemo(() => {
    if (rangeMode === 'month') {
      return `${MONTHS_ID[calendarCursor.getMonth()]} ${calendarCursor.getFullYear()}`;
    }
    const start = parseIsoDate(weekDates[0]);
    const end = parseIsoDate(weekDates[weekDates.length - 1]);
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}–${end.getDate()} ${MONTHS_SHORT_ID[end.getMonth()]} ${end.getFullYear()}`;
    }
    return `${start.getDate()} ${MONTHS_SHORT_ID[start.getMonth()]}–${end.getDate()} ${MONTHS_SHORT_ID[end.getMonth()]} ${end.getFullYear()}`;
  }, [rangeMode, weekDates, calendarCursor]);

  const chartSubtitleRange = useMemo(() => {
    if (rangeMode === 'month') {
      return `${MONTHS_ID[calendarCursor.getMonth()]} ${calendarCursor.getFullYear()}`;
    }
    const start = parseIsoDate(weekDates[0]);
    const end = parseIsoDate(weekDates[weekDates.length - 1]);
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}–${end.getDate()} ${MONTHS_ID[end.getMonth()]}`;
    }
    return `${start.getDate()} ${MONTHS_SHORT_ID[start.getMonth()]}–${end.getDate()} ${MONTHS_SHORT_ID[end.getMonth()]}`;
  }, [rangeMode, weekDates, calendarCursor]);

  // Filtered activities by top-level Member & Project filters
  const scopedActivities = useMemo(() => {
    return productivityData.activities.filter((act) => {
      if (memberFilter !== 'Semua tim') {
        const matchesMe =
          memberFilter === 'Saya'
            ? act.assignee === 'Saya' || act.assignee === userProfile.name
            : act.assignee === memberFilter;
        if (!matchesMe) return false;
      }
      if (projectFilter !== 'all') {
        const displayName = resolveProjectDisplayName(act.projectName, act.linkedDocId);
        if (act.linkedDocId !== projectFilter && displayName !== projectFilter) {
          return false;
        }
      }
      return true;
    });
  }, [productivityData.activities, memberFilter, projectFilter, userProfile.name, docTitleById]);

  // Activities inside selected period (for Weekly KPI, Bar Chart, Category Breakdown)
  const periodActivities = useMemo(() => {
    if (rangeMode === 'month') {
      const prefix = `${calendarCursor.getFullYear()}-${String(calendarCursor.getMonth() + 1).padStart(2, '0')}`;
      return scopedActivities.filter((a) => a.date.startsWith(prefix));
    }
    return scopedActivities.filter((a) => rangeDateSet.has(a.date));
  }, [scopedActivities, rangeMode, calendarCursor, rangeDateSet]);

  // Selected date activities
  const selectedDayActivities = useMemo(() => {
    return scopedActivities.filter((a) => a.date === selectedDate);
  }, [scopedActivities, selectedDate]);

  const filteredSelectedDayActivities = useMemo(() => {
    return selectedDayActivities.filter((a) => {
      if (activityStatusFilter !== 'all' && a.status !== activityStatusFilter) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      return true;
    });
  }, [selectedDayActivities, activityStatusFilter, categoryFilter]);

  // Selected date calendar labels
  const selectedDayLabels = useMemo(() => {
    return productivityData.dayLabels.filter((l) => l.date === selectedDate);
  }, [productivityData.dayLabels, selectedDate]);

  // Workspace doc deadlines matching selectedDate
  const selectedDayDeadlines = useMemo(() => {
    return docs.filter((d) => d.deadline && d.deadline.slice(0, 10) === selectedDate);
  }, [docs, selectedDate]);

  // Compute Consistency Streak (consecutive days ending at DEFAULT_TODAY_ISO with completed activity OR worked/completed day label)
  const consistencyStreak = useMemo(() => {
    const activeDates = new Set<string>();
    scopedActivities.forEach((a) => {
      if (a.status === 'completed') activeDates.add(a.date);
    });
    productivityData.dayLabels.forEach((l) => {
      if (l.status === 'completed' || l.status === 'in_progress') activeDates.add(l.date);
    });

    let streak = 0;
    for (let i = 0; i < 31; i++) {
      const checkIso = addDaysIso(DEFAULT_TODAY_ISO, -i);
      if (activeDates.has(checkIso)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [scopedActivities, productivityData.dayLabels]);

  // KPI computations
  const kpiStats = useMemo(() => {
    const dailyTarget = Math.max(1, productivityData.dailyTarget || 6);
    const weeklyTarget = Math.max(1, productivityData.weeklyTarget || 42);

    const dayCompleted = selectedDayActivities.filter((a) => a.status === 'completed').length;
    const dayPct = Math.min(100, Math.round((dayCompleted / dailyTarget) * 100));

    const periodCompleted = periodActivities.filter((a) => a.status === 'completed');
    const periodDoneCount = periodCompleted.length;
    const periodPct = Math.min(100, Math.round((periodDoneCount / weeklyTarget) * 100));

    const totalFocusMinutes = periodActivities.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
    const selectedDayFocusMinutes = selectedDayActivities.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);

    return {
      dailyTarget,
      weeklyTarget,
      dayCompleted,
      dayTotal: selectedDayActivities.length,
      dayPct,
      periodDoneCount,
      periodPct,
      totalFocusMinutes,
      selectedDayFocusMinutes,
    };
  }, [selectedDayActivities, periodActivities, productivityData.dailyTarget, productivityData.weeklyTarget]);

  // 7-Day Bar Chart Data
  const dailyChartBars = useMemo(() => {
    const countsByDate: Record<string, number> = {};
    scopedActivities.forEach((a) => {
      if (a.status === 'completed') {
        countsByDate[a.date] = (countsByDate[a.date] || 0) + 1;
      }
    });

    return weekDates.map((iso) => {
      const info = formatShortDayHeaderId(iso);
      const count = countsByDate[iso] || 0;
      return {
        iso,
        shortLabel: info.label,
        longName: info.longName,
        count,
        isToday: iso === DEFAULT_TODAY_ISO,
        isSelected: iso === selectedDate,
      };
    });
  }, [weekDates, scopedActivities, selectedDate]);

  const chartMaxScale = useMemo(() => {
    const maxCount = Math.max(...dailyChartBars.map((b) => b.count), kpiStats.dailyTarget, 8);
    return Math.ceil(maxCount / 2) * 2;
  }, [dailyChartBars, kpiStats.dailyTarget]);

  const bestChartDay = useMemo(() => {
    return dailyChartBars.reduce(
      (best, curr) => (curr.count > best.count ? curr : best),
      dailyChartBars[0] || { iso: DEFAULT_TODAY_ISO, shortLabel: 'Sel 17', longName: 'Selasa', count: 0 }
    );
  }, [dailyChartBars]);

  // Category Breakdown ("Paling sering dikerjakan")
  const categoryStats = useMemo(() => {
    const completed = periodActivities.filter((a) => a.status === 'completed');
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((c) => {
      counts[c] = 0;
    });
    completed.forEach((a) => {
      const cat = a.category || 'Lainnya';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const total = completed.length;
    const sorted = Object.entries(counts)
      .filter(([cat, cnt]) => CATEGORIES.includes(cat) || cnt > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const maxCat = Math.max(...sorted.map(([, c]) => c), 1);
    const barShades = ['#567561', '#7F9787', '#A2B6A8', '#C2D0C6'];

    return {
      total,
      rows: sorted.map(([name, count], idx) => ({
        rank: String(idx + 1).padStart(2, '0'),
        name,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
        barWidthPct: Math.round((count / maxCat) * 100),
        color: barShades[idx] || '#C2D0C6',
      })),
      topCategory: sorted[0]?.[0] || 'Desain antarmuka',
      topCount: sorted[0]?.[1] || 0,
    };
  }, [periodActivities]);

  // Mini Calendar Month Grid computations
  const calendarGrid = useMemo(() => {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const labelsByDate: Record<string, CalendarDayLabel[]> = {};
    productivityData.dayLabels.forEach((l) => {
      if (!labelsByDate[l.date]) labelsByDate[l.date] = [];
      labelsByDate[l.date].push(l);
    });

    const actsByDate: Record<string, { total: number; done: number }> = {};
    scopedActivities.forEach((a) => {
      if (!actsByDate[a.date]) actsByDate[a.date] = { total: 0, done: 0 };
      actsByDate[a.date].total += 1;
      if (a.status === 'completed') actsByDate[a.date].done += 1;
    });

    const deadlinesByDate: Record<string, DocItem[]> = {};
    docs.forEach((d) => {
      if (d.deadline) {
        const key = d.deadline.slice(0, 10);
        if (!deadlinesByDate[key]) deadlinesByDate[key] = [];
        deadlinesByDate[key].push(d);
      }
    });

    const cells: Array<{
      dayNum: number;
      iso: string;
      labels: CalendarDayLabel[];
      acts: { total: number; done: number };
      deadlines: DocItem[];
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNum: d,
        iso,
        labels: labelsByDate[iso] || [],
        acts: actsByDate[iso] || { total: 0, done: 0 },
        deadlines: deadlinesByDate[iso] || [],
        isToday: iso === DEFAULT_TODAY_ISO,
        isSelected: iso === selectedDate,
      });
    }

    return {
      year,
      month,
      monthName: MONTHS_ID[month],
      firstDayIndex,
      cells,
    };
  }, [calendarCursor, productivityData.dayLabels, scopedActivities, docs, selectedDate]);

  // Reflection for selectedDate
  const activeReflection = useMemo(() => {
    const found = productivityData.reflections.find((r) => r.date === selectedDate);
    if (found) return found;
    const remaining = Math.max(0, kpiStats.dailyTarget - kpiStats.dayCompleted);
    return {
      id: `ref-${selectedDate}`,
      date: selectedDate,
      headline:
        kpiStats.dayCompleted >= kpiStats.dailyTarget
          ? 'Target harian tercapai dengan baik.'
          : remaining === 1
          ? 'Satu langkah lagi untuk hari yang baik.'
          : 'Ritme kerja berjalan stabil hari ini.',
      summary:
        selectedDayActivities.length === 0
          ? 'Belum ada aktivitas tercatat pada tanggal ini. Tambahkan aktivitas atau beri label hari kerja di kalender mini.'
          : remaining === 0
          ? `${kpiStats.dayCompleted} tugas selesai pada tanggal ini. Pertahankan alur kerja yang ringan dan konsisten.`
          : `${remaining} tugas lagi menuju target harianmu. Fokus pada prioritas utama yang sedang dikerjakan.`,
      updatedAt: Date.now(),
    };
  }, [productivityData.reflections, selectedDate, kpiStats, selectedDayActivities]);

  // Navigation helper when clicking a project name
  const handleNavigateToDoc = (docId?: string) => {
    if (!docId) return;
    if (docId === WEB_PROJECT_DOC_ID) {
      onSelectView('project_web');
    } else if (docId === MOBILE_PROJECT_DOC_ID) {
      onSelectView('project_mobile');
    } else if (docId === DESIGN_PROJECT_DOC_ID) {
      onSelectView('project_design');
    } else {
      onSelectDoc(docId);
    }
  };

  // Toggle activity completion & auto-sync with linked project task + mini calendar label
  const handleToggleActivityStatus = (activity: ProductivityActivity, targetStatus?: ProductivityActivity['status']) => {
    const nextStatus: ProductivityActivity['status'] =
      targetStatus ||
      (activity.status === 'completed'
        ? 'in_progress'
        : activity.status === 'in_progress'
        ? 'completed'
        : 'in_progress');

    const now = Date.now();
    const nextDuration =
      nextStatus === 'completed' && (!activity.durationMinutes || activity.durationMinutes === 0)
        ? 30
        : activity.durationMinutes;

    const updatedActivities = productivityData.activities.map((a) =>
      a.id === activity.id
        ? { ...a, status: nextStatus, durationMinutes: nextDuration, updatedAt: now }
        : a
    );

    // Automatically ensure or update a CalendarDayLabel if marking completed on a date with no label yet
    let updatedLabels = [...productivityData.dayLabels];
    if (nextStatus === 'completed') {
      const existingOnDate = updatedLabels.filter((l) => l.date === activity.date);
      if (existingOnDate.length === 0) {
        updatedLabels.push({
          id: `dl-${now}`,
          date: activity.date,
          label: activity.title,
          status: 'completed',
          colorHex: '#567561',
          projectName: resolveProjectDisplayName(activity.projectName, activity.linkedDocId),
          linkedDocId: activity.linkedDocId,
          workedMinutes: nextDuration,
          createdBy: userProfile.name,
          updatedAt: now,
        });
      }
    }

    const taskSync: ProductivityTaskSyncHint | undefined = activity.linkedDocId
      ? {
          docId: activity.linkedDocId,
          taskId: activity.linkedTaskId,
          taskTitle: activity.title,
          completed: nextStatus === 'completed',
          assignee: activity.assignee === 'Saya' ? userProfile.name : activity.assignee,
        }
      : undefined;

    onUpdateProductivity(
      {
        ...productivityData,
        activities: updatedActivities,
        dayLabels: updatedLabels,
        updatedAt: now,
      },
      `${nextStatus === 'completed' ? 'Menyelesaikan' : 'Memperbarui'} aktivitas: ${activity.title}`,
      taskSync
    );
  };

  // Open Activity Modal (Create or Edit)
  const openCreateActivityModal = (presetDate?: string) => {
    const d = presetDate || selectedDate;
    setEditingActivity(null);
    setActTitle('');
    setActLinkedDocId(projectFilter !== 'all' ? projectFilter : WEB_PROJECT_DOC_ID);
    setActCategory(CATEGORIES[0]);
    setActDuration('30');
    setActDate(d);
    setActStatus('completed');
    setActAssignee(memberFilter === 'Semua tim' ? 'Saya' : memberFilter);
    setActNotes('');
    setActSyncToProject(true);
    setShowActivityModal(true);
  };

  const openEditActivityModal = (activity: ProductivityActivity) => {
    setEditingActivity(activity);
    setActTitle(activity.title);
    setActLinkedDocId(activity.linkedDocId || '');
    setActCategory(activity.category || CATEGORIES[0]);
    setActDuration(String(activity.durationMinutes || 0));
    setActDate(activity.date);
    setActStatus(activity.status);
    setActAssignee(activity.assignee || 'Saya');
    setActNotes(activity.notes || '');
    setActSyncToProject(Boolean(activity.linkedDocId));
    setShowActivityModal(true);
  };

  const handleSaveActivityModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle.trim()) return;

    const now = Date.now();
    const linkedDoc = docs.find((d) => d.id === actLinkedDocId);
    const resolvedProjectName = linkedDoc ? linkedDoc.title : 'Workspace Umum';
    const parsedDuration = Math.max(0, Number(actDuration) || 0);
    const trimmedNotes = actNotes.trim();

    let updatedActivities: ProductivityActivity[];
    let targetTaskId = editingActivity?.linkedTaskId;

    if (editingActivity) {
      updatedActivities = productivityData.activities.map((a) =>
        a.id === editingActivity.id
          ? {
              ...a,
              title: actTitle.trim(),
              projectName: resolvedProjectName,
              linkedDocId: linkedDoc?.id,
              category: actCategory,
              durationMinutes: parsedDuration,
              date: actDate,
              status: actStatus,
              assignee: actAssignee,
              ...(trimmedNotes ? { notes: trimmedNotes } : { notes: undefined }),
              updatedAt: now,
            }
          : a
      );
    } else {
      targetTaskId = actSyncToProject && linkedDoc?.projectData ? `task-prod-${now}` : undefined;
      const newAct: ProductivityActivity = {
        id: `act-${now}`,
        title: actTitle.trim(),
        projectName: resolvedProjectName,
        linkedDocId: linkedDoc?.id,
        linkedTaskId: targetTaskId,
        category: actCategory,
        durationMinutes: parsedDuration,
        date: actDate,
        status: actStatus,
        assignee: actAssignee,
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
        createdAt: now,
        updatedAt: now,
      };
      updatedActivities = [newAct, ...productivityData.activities];
    }

    // Also reflect a work label on that date in Mini Calendar if none exists yet and status isn't not_started
    let updatedLabels = [...productivityData.dayLabels];
    if (actStatus !== 'not_started') {
      const hasDateLabel = updatedLabels.some((l) => l.date === actDate);
      if (!hasDateLabel) {
        updatedLabels.push({
          id: `dl-auto-${now}`,
          date: actDate,
          label: actTitle.trim(),
          status: actStatus === 'completed' ? 'completed' : 'in_progress',
          colorHex: actStatus === 'completed' ? '#567561' : '#5D748B',
          projectName: resolvedProjectName,
          linkedDocId: linkedDoc?.id,
          workedMinutes: parsedDuration,
          createdBy: userProfile.name,
          updatedAt: now,
        });
      }
    }

    const taskSync: ProductivityTaskSyncHint | undefined =
      actSyncToProject && linkedDoc
        ? {
            docId: linkedDoc.id,
            taskId: targetTaskId,
            taskTitle: actTitle.trim(),
            previousTitle: editingActivity?.title,
            completed: actStatus === 'completed',
            assignee: actAssignee === 'Saya' ? userProfile.name : actAssignee,
            createIfMissing: !editingActivity,
          }
        : undefined;

    setSelectedDate(actDate);
    setCalendarCursor(parseIsoDate(actDate));

    onUpdateProductivity(
      {
        ...productivityData,
        activities: updatedActivities,
        dayLabels: updatedLabels,
        updatedAt: now,
      },
      `${editingActivity ? 'Memperbarui' : 'Mencatat'} aktivitas: ${actTitle.trim()}`,
      taskSync
    );

    setShowActivityModal(false);
    setEditingActivity(null);
  };

  const handleDeleteActivity = (activity: ProductivityActivity) => {
    const updatedActivities = productivityData.activities.filter((a) => a.id !== activity.id);
    if (detailActivityId === activity.id) {
      setDetailActivityId(null);
    }
    onUpdateProductivity(
      {
        ...productivityData,
        activities: updatedActivities,
        updatedAt: Date.now(),
      },
      `Menghapus aktivitas: ${activity.title}`
    );
  };

  // Task Detail & Collaborator Comments Handlers
  const openTaskDetailDrawer = (activity: ProductivityActivity, focusComment = false) => {
    setDetailActivityId(activity.id);
    setCommentInput('');
    setEditingCommentId(null);
    setEditingCommentText('');
    setIsEditingTaskNote(false);
    setTaskNoteInput(activity.notes || '');
    if (focusComment) {
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 60);
    }
  };

  const handleAddActivityComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!detailActivity) return;
    const trimmed = commentInput.trim().slice(0, 1000);
    if (!trimmed) return;

    const now = Date.now();
    const newComment: ActivityComment = {
      id: `cmt-${now}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: userProfile.userId,
      authorName: userProfile.name,
      authorColor: userProfile.color || '#567561',
      text: trimmed,
      createdAt: now,
    };

    const updatedActivities = productivityData.activities.map((a) =>
      a.id === detailActivity.id
        ? {
            ...a,
            comments: [...(a.comments || []), newComment],
            updatedAt: now,
          }
        : a
    );

    onUpdateProductivity(
      {
        ...productivityData,
        activities: updatedActivities,
        updatedAt: now,
      },
      `Mengomentari tugas: ${detailActivity.title}`
    );
    setCommentInput('');
  };

  const handleSaveEditedComment = (commentId: string) => {
    if (!detailActivity) return;
    const trimmed = editingCommentText.trim().slice(0, 1000);
    if (!trimmed) return;

    const now = Date.now();
    const updatedActivities = productivityData.activities.map((a) =>
      a.id === detailActivity.id
        ? {
            ...a,
            comments: (a.comments || []).map((c) =>
              c.id === commentId ? { ...c, text: trimmed, updatedAt: now } : c
            ),
            updatedAt: now,
          }
        : a
    );

    onUpdateProductivity(
      {
        ...productivityData,
        activities: updatedActivities,
        updatedAt: now,
      },
      `Memperbarui komentar pada: ${detailActivity.title}`
    );
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    if (!detailActivity) return;
    const now = Date.now();
    const updatedActivities = productivityData.activities.map((a) =>
      a.id === detailActivity.id
        ? {
            ...a,
            comments: (a.comments || []).filter((c) => c.id !== commentId),
            updatedAt: now,
          }
        : a
    );

    onUpdateProductivity(
      {
        ...productivityData,
        activities: updatedActivities,
        updatedAt: now,
      },
      `Menghapus komentar pada: ${detailActivity.title}`
    );
  };

  const handleSaveTaskNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailActivity) return;
    const now = Date.now();
    const trimmed = taskNoteInput.trim().slice(0, 1000);
    const updatedActivities = productivityData.activities.map((a) =>
      a.id === detailActivity.id
        ? {
            ...a,
            notes: trimmed || undefined,
            updatedAt: now,
          }
        : a
    );

    onUpdateProductivity(
      {
        ...productivityData,
        activities: updatedActivities,
        updatedAt: now,
      },
      `Memperbarui catatan tugas: ${detailActivity.title}`
    );
    setIsEditingTaskNote(false);
  };

  // Mini Calendar Label Handlers
  const handleQuickMarkDayWorked = () => {
    const now = Date.now();
    const existing = selectedDayLabels.find(
      (l) => l.status === 'completed' || l.status === 'in_progress'
    );

    let updatedLabels: CalendarDayLabel[];
    if (existing) {
      // Toggle existing label completed <-> in_progress
      const nextStatus: CalendarDayLabel['status'] =
        existing.status === 'completed' ? 'in_progress' : 'completed';
      updatedLabels = productivityData.dayLabels.map((l) =>
        l.id === existing.id
          ? {
              ...l,
              status: nextStatus,
              colorHex: nextStatus === 'completed' ? '#567561' : '#5D748B',
              updatedAt: now,
            }
          : l
      );
    } else {
      updatedLabels = [
        ...productivityData.dayLabels,
        {
          id: `dl-${now}`,
          date: selectedDate,
          label: 'Dikerjakan hari ini',
          status: 'completed',
          colorHex: '#567561',
          projectName: projectFilter !== 'all' ? docTitleById.get(projectFilter) : undefined,
          linkedDocId: projectFilter !== 'all' ? projectFilter : undefined,
          createdBy: userProfile.name,
          updatedAt: now,
        },
      ];
    }

    onUpdateProductivity(
      {
        ...productivityData,
        dayLabels: updatedLabels,
        updatedAt: now,
      },
      `Menandai pengerjaan tanggal ${selectedDate}`
    );
  };

  const handleSaveDayLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelText.trim()) return;

    const now = Date.now();
    const linkedDoc = docs.find((d) => d.id === newLabelDocId);
    let updatedLabels: CalendarDayLabel[];

    if (editingDayLabelId) {
      updatedLabels = productivityData.dayLabels.map((l) =>
        l.id === editingDayLabelId
          ? {
              ...l,
              label: newLabelText.trim(),
              status: newLabelStatus,
              colorHex: newLabelColor,
              projectName: linkedDoc?.title,
              linkedDocId: linkedDoc?.id,
              updatedAt: now,
            }
          : l
      );
    } else {
      const entry: CalendarDayLabel = {
        id: `dl-${now}`,
        date: selectedDate,
        label: newLabelText.trim(),
        status: newLabelStatus,
        colorHex: newLabelColor,
        projectName: linkedDoc?.title,
        linkedDocId: linkedDoc?.id,
        createdBy: userProfile.name,
        updatedAt: now,
      };
      updatedLabels = [...productivityData.dayLabels, entry];
    }

    onUpdateProductivity(
      {
        ...productivityData,
        dayLabels: updatedLabels,
        updatedAt: now,
      },
      `Menambahkan label kalender (${selectedDate}): ${newLabelText.trim()}`
    );

    setNewLabelText('');
    setNewLabelDocId('');
    setEditingDayLabelId(null);
  };

  const handleEditDayLabel = (lbl: CalendarDayLabel) => {
    setEditingDayLabelId(lbl.id);
    setNewLabelText(lbl.label);
    setNewLabelStatus(lbl.status);
    setNewLabelColor(lbl.colorHex);
    setNewLabelDocId(lbl.linkedDocId || '');
  };

  const handleDeleteDayLabel = (id: string) => {
    const updatedLabels = productivityData.dayLabels.filter((l) => l.id !== id);
    onUpdateProductivity(
      {
        ...productivityData,
        dayLabels: updatedLabels,
        updatedAt: Date.now(),
      },
      `Menghapus label kalender pada ${selectedDate}`
    );
  };

  // Reflection Save
  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    const exists = productivityData.reflections.some((r) => r.date === selectedDate);
    const nextItem = {
      id: `ref-${selectedDate}`,
      date: selectedDate,
      headline: reflectionHeadlineInput.trim() || activeReflection.headline,
      summary: reflectionSummaryInput.trim() || activeReflection.summary,
      updatedAt: now,
    };

    const updatedReflections = exists
      ? productivityData.reflections.map((r) => (r.date === selectedDate ? nextItem : r))
      : [...productivityData.reflections, nextItem];

    onUpdateProductivity(
      {
        ...productivityData,
        reflections: updatedReflections,
        updatedAt: now,
      },
      `Menyimpan refleksi produktivitas (${selectedDate})`
    );
    setIsEditingReflection(false);
  };

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    const daily = Math.max(1, Number(dailyTargetInput) || 6);
    const weekly = Math.max(daily, Number(weeklyTargetInput) || daily * 7);
    onUpdateProductivity(
      {
        ...productivityData,
        dailyTarget: daily,
        weeklyTarget: weekly,
        updatedAt: Date.now(),
      },
      `Memperbarui target produktivitas (${daily}/hari, ${weekly}/minggu)`
    );
    setShowTargetEditor(false);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] font-sans">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-9 space-y-8">
        {/* =============================================================== */}
        {/* 1. JUDUL & FILTER                                               */}
        {/* =============================================================== */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#777973] dark:text-[#9E9F99]">
            <span className="font-medium tracking-[0.04em] uppercase">
              LANGKAH KECIL, SETIAP HARI
            </span>
            <span className="tabular-nums">
              {formatLongDateId(selectedDate)}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <h1 className="text-[26px] sm:text-[32px] font-normal tracking-[-0.02em] leading-[1.3] text-[#282925] dark:text-[#EDEDE8]">
                Produktif, dengan ritmemu sendiri.
              </h1>
              <p className="text-[13px] text-[#777973] dark:text-[#9E9F99]">
                Pantau progres harian, tandai hari kerja di kalender mini, dan kenali pekerjaan yang paling sering kamu lakukan.
              </p>
            </div>

            <button
              onClick={() => openCreateActivityModal(selectedDate)}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-[4px] bg-[#282925] hover:bg-[#3A3B36] dark:bg-[#EDEDE8] dark:hover:bg-white text-white dark:text-[#181816] text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus size={14} />
              <span>Catat aktivitas</span>
            </button>
          </div>

          {/* Filter Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter Anggota */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMemberDropdown(!showMemberDropdown);
                    setShowProjectDropdown(false);
                    setShowRangeDropdown(false);
                  }}
                  className="inline-flex items-center justify-between gap-3 h-9 px-3 bg-white dark:bg-[#1B1B19] border border-[#E9EAE5] dark:border-[#2B2B28] rounded-[4px] text-xs font-medium text-[#282925] dark:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#232320] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>{memberFilter}</span>
                  <ChevronDown size={13} className="text-[#777973]" />
                </button>
                {showMemberDropdown && (
                  <div
                    onMouseLeave={() => setShowMemberDropdown(false)}
                    className="absolute left-0 mt-1 w-44 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] shadow-lg py-1 z-30 text-xs"
                  >
                    {memberOptions.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setMemberFilter(m);
                          setShowMemberDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] flex items-center justify-between ${
                          memberFilter === m ? 'font-semibold text-[#567561]' : ''
                        }`}
                      >
                        <span className="truncate">{m}</span>
                        {memberFilter === m && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Proyek */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProjectDropdown(!showProjectDropdown);
                    setShowMemberDropdown(false);
                    setShowRangeDropdown(false);
                  }}
                  className="inline-flex items-center justify-between gap-3 h-9 px-3 bg-white dark:bg-[#1B1B19] border border-[#E9EAE5] dark:border-[#2B2B28] rounded-[4px] text-xs font-medium text-[#282925] dark:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#232320] transition-colors whitespace-nowrap cursor-pointer max-w-[210px]"
                >
                  <span className="truncate">
                    {projectFilter === 'all' ? 'Semua proyek' : docTitleById.get(projectFilter) || projectFilter}
                  </span>
                  <ChevronDown size={13} className="text-[#777973] shrink-0" />
                </button>
                {showProjectDropdown && (
                  <div
                    onMouseLeave={() => setShowProjectDropdown(false)}
                    className="absolute left-0 mt-1 w-60 max-h-64 overflow-y-auto bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] shadow-lg py-1 z-30 text-xs"
                  >
                    <button
                      onClick={() => {
                        setProjectFilter('all');
                        setShowProjectDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] flex items-center justify-between ${
                        projectFilter === 'all' ? 'font-semibold text-[#567561]' : ''
                      }`}
                    >
                      <span>Semua proyek</span>
                      {projectFilter === 'all' && <Check size={12} />}
                    </button>
                    {projectOptions.map((proj) => (
                      <button
                        key={proj.id}
                        onClick={() => {
                          setProjectFilter(proj.id);
                          setShowProjectDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] flex items-center justify-between gap-2 ${
                          projectFilter === proj.id ? 'font-semibold text-[#567561]' : ''
                        }`}
                      >
                        <span className="truncate">
                          {proj.icon} {proj.title}
                        </span>
                        {projectFilter === proj.id && <Check size={12} className="shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Rentang Waktu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowRangeDropdown(!showRangeDropdown);
                    setShowMemberDropdown(false);
                    setShowProjectDropdown(false);
                  }}
                  className="inline-flex items-center justify-between gap-3 h-9 px-3 bg-white dark:bg-[#1B1B19] border border-[#E9EAE5] dark:border-[#2B2B28] rounded-[4px] text-xs font-medium text-[#282925] dark:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#232320] transition-colors whitespace-nowrap cursor-pointer tabular-nums"
                >
                  <span>{activeRangeLabel}</span>
                  <ChevronDown size={13} className="text-[#777973]" />
                </button>
                {showRangeDropdown && (
                  <div
                    onMouseLeave={() => setShowRangeDropdown(false)}
                    className="absolute left-0 mt-1 w-56 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] shadow-lg py-1 z-30 text-xs"
                  >
                    <button
                      onClick={() => {
                        setRangeMode('week_focus');
                        setShowRangeDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] flex items-center justify-between ${
                        rangeMode === 'week_focus' ? 'font-semibold text-[#567561]' : ''
                      }`}
                    >
                      <span>11–17 Nov 2026 (Minggu ini)</span>
                      {rangeMode === 'week_focus' && <Check size={12} />}
                    </button>
                    <button
                      onClick={() => {
                        setRangeMode('week_selected');
                        setShowRangeDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] flex items-center justify-between ${
                        rangeMode === 'week_selected' ? 'font-semibold text-[#567561]' : ''
                      }`}
                    >
                      <span>7 hari hingga tgl terpilih</span>
                      {rangeMode === 'week_selected' && <Check size={12} />}
                    </button>
                    <button
                      onClick={() => {
                        setRangeMode('month');
                        setShowRangeDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] flex items-center justify-between ${
                        rangeMode === 'month' ? 'font-semibold text-[#567561]' : ''
                      }`}
                    >
                      <span>Satu bulan kalender aktif</span>
                      {rangeMode === 'month' && <Check size={12} />}
                    </button>
                  </div>
                )}
              </div>

              {(projectFilter !== 'all' || memberFilter !== 'Saya' || categoryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setProjectFilter('all');
                    setMemberFilter('Saya');
                    setCategoryFilter('all');
                    setActivityStatusFilter('all');
                  }}
                  className="text-xs text-[#567561] hover:underline px-1.5 py-1 cursor-pointer"
                >
                  Reset filter
                </button>
              )}
            </div>

            <div className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
              Tersinkron otomatis · proyek & kalender workspace
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 2. RINGKASAN PRODUKTIVITAS (4 KPI METRICS)                      */}
        {/* =============================================================== */}
        <section className="border-y border-[#E9EAE5] dark:border-[#2B2B28] py-4 grid grid-cols-2 lg:grid-cols-4 gap-y-5 lg:gap-y-0 lg:divide-x divide-[#E9EAE5] dark:divide-[#2B2B28]">
          {/* KPI 1 */}
          <div className="pr-4 lg:pr-6 space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs text-[#777973] dark:text-[#9E9F99]">
              <span>Tugas {selectedDate === DEFAULT_TODAY_ISO ? 'hari ini' : 'tanggal ini'}</span>
              <button
                onClick={() => {
                  setDailyTargetInput(String(kpiStats.dailyTarget));
                  setWeeklyTargetInput(String(kpiStats.weeklyTarget));
                  setShowTargetEditor(true);
                }}
                title="Atur target harian & mingguan"
                className="text-[#A1A29B] hover:text-[#282925] dark:hover:text-[#EDEDE8] transition-colors cursor-pointer"
              >
                <SlidersHorizontal size={12} />
              </button>
            </div>
            <div className="text-[28px] font-normal leading-[1.35] text-[#282925] dark:text-[#EDEDE8] tabular-nums">
              {kpiStats.dayCompleted} / {kpiStats.dailyTarget}
            </div>
            <div className="text-[11px] text-[#777973] dark:text-[#9E9F99] tabular-nums">
              {kpiStats.dayPct}% dari target harian
            </div>
          </div>

          {/* KPI 2 */}
          <div className="pl-4 lg:px-6 space-y-1">
            <div className="text-xs text-[#777973] dark:text-[#9E9F99]">
              {rangeMode === 'month' ? 'Selesai bulan ini' : 'Selesai minggu ini'}
            </div>
            <div className="text-[28px] font-normal leading-[1.35] text-[#282925] dark:text-[#EDEDE8] tabular-nums">
              {kpiStats.periodDoneCount} tugas
            </div>
            <div className="text-[11px] text-[#777973] dark:text-[#9E9F99] tabular-nums">
              Target {kpiStats.weeklyTarget} tugas · tercapai {kpiStats.periodPct}%
            </div>
          </div>

          {/* KPI 3 */}
          <div className="pr-4 lg:px-6 space-y-1">
            <div className="text-xs text-[#777973] dark:text-[#9E9F99]">Waktu fokus</div>
            <div className="text-[28px] font-normal leading-[1.35] text-[#282925] dark:text-[#EDEDE8] tabular-nums">
              {formatFocusDuration(kpiStats.totalFocusMinutes)}
            </div>
            <div className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
              Total selama {rangeMode === 'month' ? 'bulan terpilih' : '7 hari terakhir'}
            </div>
          </div>

          {/* KPI 4 */}
          <div className="pl-4 lg:pl-6 space-y-1">
            <div className="text-xs text-[#777973] dark:text-[#9E9F99]">Konsistensi</div>
            <div className="text-[28px] font-normal leading-[1.35] text-[#282925] dark:text-[#EDEDE8] tabular-nums">
              {consistencyStreak} hari
            </div>
            <div className="text-[11px] text-[#567561] dark:text-[#8FB49C]">
              {consistencyStreak >= 7 ? 'Aktif setiap hari minggu ini' : 'Hari beruntun produktif & berlabel'}
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 3. PROGRES DAN KEBIASAAN (GRAFIK 7 HARI + PALING SERING)        */}
        {/* =============================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Progres setiap hari (Bar Chart) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-[18px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  Progres setiap hari
                </h2>
                <p className="text-xs text-[#777973] dark:text-[#9E9F99] mt-0.5">
                  Jumlah tugas selesai · {chartSubtitleRange}
                </p>
              </div>
              <div className="flex items-center gap-5 text-[11px] pt-1">
                <span className="inline-flex items-center gap-1.5 text-[#567561] dark:text-[#8FB49C]">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#567561] inline-block" />
                  <span>Selesai</span>
                </span>
                <button
                  onClick={() => {
                    setDailyTargetInput(String(kpiStats.dailyTarget));
                    setWeeklyTargetInput(String(kpiStats.weeklyTarget));
                    setShowTargetEditor(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] cursor-pointer"
                >
                  <span className="w-3.5 h-[1.5px] bg-[#777973] inline-block" />
                  <span className="tabular-nums">Target {kpiStats.dailyTarget}</span>
                </button>
              </div>
            </div>

            {/* Chart Area */}
            <div className="relative pt-4 pb-1 select-none">
              <div className="flex">
                {/* Y-axis ticks */}
                <div className="w-7 flex flex-col justify-between h-[196px] text-[10px] text-[#777973] tabular-nums pr-2 text-right">
                  {[chartMaxScale, Math.round(chartMaxScale * 0.75), Math.round(chartMaxScale * 0.5), Math.round(chartMaxScale * 0.25), 0].map((tick, idx) => (
                    <span key={idx} className="leading-none -translate-y-1">
                      {tick}
                    </span>
                  ))}
                </div>

                {/* Plot grid + bars */}
                <div className="flex-1 relative h-[196px]">
                  {/* Horizontal Grid Lines */}
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <div
                      key={pct}
                      style={{ top: `${pct}%` }}
                      className="absolute inset-x-0 h-px bg-[#E9EAE5] dark:bg-[#2B2B28]"
                    />
                  ))}

                  {/* Target Dashed Line */}
                  {kpiStats.dailyTarget <= chartMaxScale && (
                    <div
                      style={{
                        bottom: `${(kpiStats.dailyTarget / chartMaxScale) * 100}%`,
                      }}
                      className="absolute inset-x-0 border-t border-dashed border-[#777973]/70 z-10 pointer-events-none"
                    />
                  )}

                  {/* 7 Columns */}
                  <div className="relative z-20 grid grid-cols-7 h-full items-end gap-2 sm:gap-4 px-2 sm:px-4">
                    {dailyChartBars.map((bar) => {
                      const heightPct = Math.min(100, (bar.count / chartMaxScale) * 100);
                      const isHighlighted = bar.isSelected || (selectedDate === DEFAULT_TODAY_ISO && bar.isToday);
                      return (
                        <button
                          key={bar.iso}
                          onClick={() => {
                            setSelectedDate(bar.iso);
                            setCalendarCursor(parseIsoDate(bar.iso));
                          }}
                          title={`${bar.longName}: ${bar.count} tugas selesai`}
                          className="group flex flex-col items-center justify-end h-full cursor-pointer focus:outline-none"
                        >
                          <span
                            className={`text-xs font-medium tabular-nums mb-1.5 transition-colors ${
                              isHighlighted
                                ? 'text-[#567561] dark:text-[#8FB49C]'
                                : 'text-[#282925] dark:text-[#EDEDE8]'
                            }`}
                          >
                            {bar.count}
                          </span>
                          <div
                            style={{ height: `${Math.max(heightPct, bar.count > 0 ? 4 : 0)}%` }}
                            className={`w-full max-w-[42px] rounded-t-[3px] transition-all duration-150 ${
                              isHighlighted
                                ? 'bg-[#567561]'
                                : 'bg-[#8EAB97] group-hover:bg-[#73967E]'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* X-axis Labels */}
              <div className="flex mt-2.5">
                <div className="w-7" />
                <div className="flex-1 grid grid-cols-7 gap-2 sm:gap-4 px-2 sm:px-4 text-center">
                  {dailyChartBars.map((bar) => {
                    const isHighlighted = bar.isSelected;
                    return (
                      <div key={bar.iso} className="flex flex-col items-center">
                        <span
                          className={`text-[11px] tabular-nums ${
                            isHighlighted
                              ? 'font-semibold text-[#567561] dark:text-[#8FB49C]'
                              : 'text-[#777973] dark:text-[#9E9F99]'
                          }`}
                        >
                          {bar.shortLabel}
                        </span>
                        {bar.isToday && (
                          <span className="text-[10px] text-[#567561] dark:text-[#8FB49C] mt-0.5">
                            Hari ini
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rangkuman mingguan strip */}
            <div className="bg-[#F8F8F6] dark:bg-[#1B1B19] rounded-[4px] px-3.5 py-2.5 text-xs text-[#777973] dark:text-[#9E9F99] tabular-nums">
              {kpiStats.periodDoneCount} dari {kpiStats.weeklyTarget} tugas selesai. Pencapaian tertinggi: {bestChartDay.longName}, {bestChartDay.count} tugas.
            </div>
          </div>

          {/* Right: Paling sering dikerjakan */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div>
              <h2 className="text-[18px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                Paling sering dikerjakan
              </h2>
              <p className="text-xs text-[#777973] dark:text-[#9E9F99] mt-0.5 tabular-nums">
                Dari {categoryStats.total} tugas selesai {rangeMode === 'month' ? 'bulan ini' : 'minggu ini'}
              </p>
            </div>

            <div className="space-y-4">
              {categoryStats.rows.map((row) => {
                const isActiveCat = categoryFilter === row.name;
                return (
                  <button
                    key={row.name}
                    onClick={() => setCategoryFilter(isActiveCat ? 'all' : row.name)}
                    className={`w-full text-left space-y-1.5 rounded-[4px] transition-opacity cursor-pointer ${
                      categoryFilter !== 'all' && !isActiveCat ? 'opacity-45 hover:opacity-80' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[11px] text-[#777973] tabular-nums w-5 shrink-0">
                          {row.rank}
                        </span>
                        <span className="text-[13px] font-medium text-[#282925] dark:text-[#EDEDE8] truncate">
                          {row.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#777973] dark:text-[#9E9F99] tabular-nums shrink-0">
                        {row.count} tugas · {row.pct}%
                      </span>
                    </div>
                    <div className="pl-8">
                      <div className="w-full h-[5px] bg-[#E9EAE5] dark:bg-[#2B2B28] rounded-[2px] overflow-hidden">
                        <div
                          style={{ width: `${row.barWidthPct}%`, backgroundColor: row.color }}
                          className="h-full rounded-[2px] transition-all duration-200"
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pola kerja highlight */}
            <div className="bg-[#EAF0EB] dark:bg-[#1B261F] rounded-[4px] px-3.5 py-3 space-y-0.5">
              <div className="text-xs font-medium text-[#567561] dark:text-[#9CC0A8]">
                {categoryStats.topCategory} jadi fokus utamamu.
              </div>
              <div className="text-[11px] text-[#567561] dark:text-[#8FB49C] tabular-nums">
                {categoryStats.topCount} tugas selesai dalam {rangeMode === 'month' ? 'bulan terpilih' : '7 hari terakhir'}.
              </div>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 4. KALENDER MINI (LABEL DIKERJAKAN) & AKTIVITAS HARIAN          */}
        {/* =============================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start pt-1">
          {/* Left Column: Kalender Mini + Panel Label Tanggal Terpilih */}
          <div className="lg:col-span-4 border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] bg-white dark:bg-[#161614] p-4 space-y-4">
            {/* Kalender Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CalendarIcon size={15} className="text-[#567561] shrink-0" />
                <h3 className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8] truncate">
                  {calendarGrid.monthName} {calendarGrid.year}
                </h3>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setSelectedDate(DEFAULT_TODAY_ISO);
                    setCalendarCursor(parseIsoDate(DEFAULT_TODAY_ISO));
                  }}
                  className="px-2 py-1 text-[11px] font-medium rounded-[4px] bg-[#F8F8F6] dark:bg-[#232320] text-[#282925] dark:text-[#EDEDE8] hover:bg-[#EAEAE5] dark:hover:bg-[#2E2E2A] transition-colors cursor-pointer"
                >
                  Hari ini
                </button>
                <button
                  onClick={() =>
                    setCalendarCursor(new Date(calendarGrid.year, calendarGrid.month - 1, 1))
                  }
                  aria-label="Bulan sebelumnya"
                  className="p-1 rounded-[4px] text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#232320] cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() =>
                    setCalendarCursor(new Date(calendarGrid.year, calendarGrid.month + 1, 1))
                  }
                  aria-label="Bulan berikutnya"
                  className="p-1 rounded-[4px] text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#232320] cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Day of Week Headings */}
            <div className="grid grid-cols-7 text-center text-[10px] font-medium text-[#A1A29B] uppercase tracking-wider">
              {WEEKDAYS_SHORT.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Compact Day Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calendarGrid.firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9" />
              ))}
              {calendarGrid.cells.map((cell) => {
                const hasCompletedLabel = cell.labels.some((l) => l.status === 'completed');
                const hasAnyLabel = cell.labels.length > 0;
                const hasWorked = hasAnyLabel || cell.acts.done > 0;
                const hasDeadline = cell.deadlines.length > 0;
                const primaryColor = cell.labels[0]?.colorHex || (cell.acts.done > 0 ? '#567561' : undefined);

                return (
                  <button
                    key={cell.iso}
                    onClick={() => setSelectedDate(cell.iso)}
                    title={
                      cell.labels.length > 0
                        ? cell.labels.map((l) => l.label).join(' · ')
                        : cell.acts.total > 0
                        ? `${cell.acts.done}/${cell.acts.total} aktivitas`
                        : cell.iso
                    }
                    className={`h-9 rounded-[4px] flex flex-col items-center justify-center relative transition-colors cursor-pointer tabular-nums ${
                      cell.isSelected
                        ? 'bg-[#282925] text-white dark:bg-[#EDEDE8] dark:text-[#181816] font-semibold'
                        : hasCompletedLabel || cell.acts.done > 0
                        ? 'bg-[#EAF0EB] dark:bg-[#1C2720] text-[#282925] dark:text-[#EDEDE8] hover:bg-[#DCE7DE] dark:hover:bg-[#243429]'
                        : hasAnyLabel
                        ? 'bg-[#EDF1F5] dark:bg-[#1C252E] text-[#282925] dark:text-[#EDEDE8] hover:bg-[#E1E8EF]'
                        : 'text-[#282925] dark:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#232320]'
                    } ${
                      cell.isToday && !cell.isSelected
                        ? 'ring-1 ring-[#567561]'
                        : ''
                    }`}
                  >
                    <span className="text-[11px] leading-none">{cell.dayNum}</span>
                    {/* Indicator Dots Row */}
                    {(hasWorked || hasDeadline) && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {cell.labels.slice(0, 2).map((l) => (
                          <span
                            key={l.id}
                            style={{
                              backgroundColor: cell.isSelected ? '#FFFFFF' : l.colorHex,
                            }}
                            className="w-1.5 h-1.5 rounded-full"
                          />
                        ))}
                        {cell.labels.length === 0 && cell.acts.done > 0 && primaryColor && (
                          <span
                            style={{
                              backgroundColor: cell.isSelected ? '#FFFFFF' : primaryColor,
                            }}
                            className="w-1.5 h-1.5 rounded-full"
                          />
                        )}
                        {hasDeadline && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cell.isSelected ? 'bg-amber-300' : 'bg-[#B78103]'
                            }`}
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mini Calendar Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#777973] dark:text-[#9E9F99] pt-1">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#567561]" />
                Selesai
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#5D748B]" />
                Dikerjakan
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#B78103]" />
                Tenggat Doc
              </span>
            </div>

            {/* Hairline Divider */}
            <div className="h-px bg-[#EAEAE5] dark:bg-[#2B2B28]" />

            {/* Selected Day Work Labels + Quick Labeling */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-[#777973] dark:text-[#9E9F99]">
                    Label pengerjaan tanggal ini
                  </div>
                  <div className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8] truncate tabular-nums">
                    {formatLongDateId(selectedDate)}
                  </div>
                </div>
                <button
                  onClick={handleQuickMarkDayWorked}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedDayLabels.some((l) => l.status === 'completed')
                      ? 'bg-[#EAF0EB] dark:bg-[#1D2B22] text-[#567561] dark:text-[#8FB49C]'
                      : 'bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#181816]'
                  }`}
                >
                  <Check size={12} />
                  <span>
                    {selectedDayLabels.some((l) => l.status === 'completed')
                      ? 'Sudah Dikerjakan'
                      : 'Tandai Dikerjakan'}
                  </span>
                </button>
              </div>

              {/* Active Labels List on Selected Date */}
              {selectedDayLabels.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedDayLabels.map((lbl) => (
                    <div
                      key={lbl.id}
                      className="group flex items-start justify-between gap-2 px-2.5 py-2 rounded-[4px] bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28]"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <span
                          style={{ backgroundColor: lbl.colorHex }}
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] break-words">
                            {lbl.label}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#777973] dark:text-[#9E9F99] mt-0.5">
                            <span>
                              {lbl.status === 'completed'
                                ? 'Selesai'
                                : lbl.status === 'in_progress'
                                ? 'Dikerjakan'
                                : 'Dijadwalkan'}
                            </span>
                            {(lbl.linkedDocId || lbl.projectName) && (
                              <>
                                <span>·</span>
                                <button
                                  onClick={() => handleNavigateToDoc(lbl.linkedDocId)}
                                  className="hover:text-[#567561] hover:underline truncate max-w-[140px] cursor-pointer"
                                >
                                  {resolveProjectDisplayName(lbl.projectName || '', lbl.linkedDocId)}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                        <button
                          onClick={() => handleEditDayLabel(lbl)}
                          title="Edit label"
                          className="p-1 text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] cursor-pointer"
                        >
                          <Edit3 size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteDayLabel(lbl.id)}
                          title="Hapus label"
                          className="p-1 text-[#777973] hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-[#777973] dark:text-[#9E9F99] py-1">
                  Belum ada label khusus pada tanggal ini. Tambahkan label apa yang dikerjakan di bawah.
                </div>
              )}

              {/* Add / Edit Label Form */}
              <form onSubmit={handleSaveDayLabel} className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <Tag size={12} className="text-[#777973] shrink-0" />
                  <input
                    type="text"
                    value={newLabelText}
                    onChange={(e) => setNewLabelText(e.target.value)}
                    placeholder="Label dikerjakan (mis. Review UI, Rilis Beta)..."
                    className="w-full h-8 px-2.5 text-xs bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] text-[#282925] dark:text-[#EDEDE8] placeholder-[#A1A29B] focus:outline-none focus:border-[#567561]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newLabelStatus}
                    onChange={(e) => {
                      const st = e.target.value as CalendarDayLabel['status'];
                      setNewLabelStatus(st);
                      if (st === 'completed') setNewLabelColor('#567561');
                      else if (st === 'in_progress') setNewLabelColor('#5D748B');
                      else setNewLabelColor('#6366F1');
                    }}
                    className="h-8 px-2 text-[11px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                  >
                    <option value="in_progress">Status: Dikerjakan</option>
                    <option value="completed">Status: Selesai</option>
                    <option value="planned">Status: Dijadwalkan</option>
                  </select>

                  <select
                    value={newLabelDocId}
                    onChange={(e) => setNewLabelDocId(e.target.value)}
                    className="h-8 px-2 text-[11px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                  >
                    <option value="">Kaitkan proyek (opsional)</option>
                    {projectOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    {LABEL_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c.hex}
                        onClick={() => setNewLabelColor(c.hex)}
                        title={c.name}
                        style={{ backgroundColor: c.hex }}
                        className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                          newLabelColor === c.hex ? 'ring-2 ring-offset-1 ring-[#282925] dark:ring-[#EDEDE8] scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {editingDayLabelId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDayLabelId(null);
                          setNewLabelText('');
                          setNewLabelDocId('');
                        }}
                        className="px-2 py-1 text-[11px] text-[#777973] hover:text-[#282925] cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!newLabelText.trim()}
                      className="h-7 px-2.5 rounded-[4px] bg-[#567561] hover:bg-[#486351] disabled:opacity-45 text-white text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      {editingDayLabelId ? 'Perbarui' : 'Simpan label'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Synced Workspace Document Deadlines on Selected Date */}
              {selectedDayDeadlines.length > 0 && (
                <div className="pt-2 border-t border-[#EAEAE5] dark:border-[#2B2B28] space-y-1.5">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-[#A1A29B]">
                    Tenggat Workspace ({selectedDayDeadlines.length})
                  </div>
                  {selectedDayDeadlines.map((docItem) => (
                    <button
                      key={docItem.id}
                      onClick={() => handleNavigateToDoc(docItem.id)}
                      className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-[4px] text-left text-xs hover:bg-[#F8F8F6] dark:hover:bg-[#1E1E1C] transition-colors cursor-pointer"
                    >
                      <span className="truncate text-[#282925] dark:text-[#EDEDE8]">
                        {docItem.icon || '📄'} {docItem.title}
                      </span>
                      <ExternalLink size={11} className="text-[#777973] shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Aktivitas Hari Ini / Tanggal Terpilih */}
          <div className="lg:col-span-8 space-y-4">
            {/* Section Title & Filter */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[18px] font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    {selectedDate === DEFAULT_TODAY_ISO
                      ? 'Aktivitas hari ini'
                      : `Aktivitas · ${parseIsoDate(selectedDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}`}
                  </h2>
                  {selectedDate !== DEFAULT_TODAY_ISO && (
                    <button
                      onClick={() => {
                        setSelectedDate(DEFAULT_TODAY_ISO);
                        setCalendarCursor(parseIsoDate(DEFAULT_TODAY_ISO));
                      }}
                      className="text-[11px] text-[#567561] hover:underline cursor-pointer"
                    >
                      Kembali ke hari ini
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#777973] dark:text-[#9E9F99] mt-0.5 tabular-nums">
                  {formatLongDateId(selectedDate).replace(/ \d{4}$/, '')} · {kpiStats.dayCompleted} dari {kpiStats.dayTotal} tugas selesai
                </p>
              </div>

              {/* Filter Status Aktivitas */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] py-1 cursor-pointer"
                >
                  <span>
                    {activityStatusFilter === 'all'
                      ? 'Semua aktivitas'
                      : activityStatusFilter === 'completed'
                      ? 'Selesai'
                      : activityStatusFilter === 'in_progress'
                      ? 'Dikerjakan'
                      : 'Belum mulai'}
                  </span>
                  <ChevronDown size={13} />
                </button>
                {showStatusDropdown && (
                  <div
                    onMouseLeave={() => setShowStatusDropdown(false)}
                    className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] shadow-lg py-1 z-30 text-xs"
                  >
                    {[
                      { id: 'all', label: 'Semua aktivitas' },
                      { id: 'completed', label: 'Selesai' },
                      { id: 'in_progress', label: 'Dikerjakan' },
                      { id: 'not_started', label: 'Belum mulai' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setActivityStatusFilter(opt.id as typeof activityStatusFilter);
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-[#F8F8F6] dark:hover:bg-[#252522] flex items-center justify-between ${
                          activityStatusFilter === opt.id ? 'font-semibold text-[#567561]' : ''
                        }`}
                      >
                        <span>{opt.label}</span>
                        {activityStatusFilter === opt.id && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Daily Progress Bar */}
            <div className="w-full h-[5px] bg-[#E9EAE5] dark:bg-[#2B2B28] rounded-[2px] overflow-hidden">
              <div
                style={{
                  width: `${
                    kpiStats.dayTotal > 0
                      ? Math.round((kpiStats.dayCompleted / kpiStats.dayTotal) * 100)
                      : 0
                  }%`,
                }}
                className="h-full bg-[#8EAB97] rounded-[2px] transition-all duration-200"
              />
            </div>

            {/* Activity Table */}
            <div className="overflow-x-auto">
              <div className="min-w-[620px]">
                {/* Header */}
                <div className="grid grid-cols-12 items-center h-[34px] px-3.5 bg-[#F8F8F6] dark:bg-[#1B1B19] text-[11px] text-[#777973] dark:text-[#9E9F99]">
                  <div className="col-span-4">Aktivitas</div>
                  <div className="col-span-3">Proyek</div>
                  <div className="col-span-2">Kategori</div>
                  <div className="col-span-1">Durasi</div>
                  <div className="col-span-2">Status</div>
                </div>

                {/* Rows */}
                {filteredSelectedDayActivities.length > 0 ? (
                  <div className="divide-y divide-[#E9EAE5] dark:divide-[#2B2B28] border-b border-[#E9EAE5] dark:border-[#2B2B28]">
                    {filteredSelectedDayActivities.map((act) => {
                      const isDone = act.status === 'completed';
                      const isWorking = act.status === 'in_progress';
                      const displayProject = resolveProjectDisplayName(act.projectName, act.linkedDocId);
                      const commentCount = act.comments?.length || 0;

                      const badgeClass = isDone
                        ? 'bg-[#EAF0EB] dark:bg-[#1D2B22] text-[#567561] dark:text-[#8FB49C]'
                        : isWorking
                        ? 'bg-[#EDF1F5] dark:bg-[#1C252E] text-[#5D748B] dark:text-[#89A8C7]'
                        : 'bg-[#F2F2EE] dark:bg-[#232320] text-[#777973] dark:text-[#A1A29B]';

                      const badgeText = isDone ? 'Selesai' : isWorking ? 'Dikerjakan' : 'Belum mulai';

                      return (
                        <div
                          key={act.id}
                          className="group grid grid-cols-12 items-center min-h-[43px] py-2 px-3.5 hover:bg-[#FAFAF8] dark:hover:bg-[#181816] transition-colors text-xs"
                        >
                          {/* Aktivitas + Check toggle + Detail/Comments trigger */}
                          <div className="col-span-4 pr-2 flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <button
                                onClick={() => handleToggleActivityStatus(act)}
                                title={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                  isDone
                                    ? 'text-[#567561] dark:text-[#8FB49C] font-semibold'
                                    : 'border border-[#A1A29B] hover:border-[#567561] text-transparent'
                                }`}
                              >
                                {isDone ? '✓' : ''}
                              </button>
                              <button
                                onClick={() => openTaskDetailDrawer(act)}
                                title="Buka detail tugas & komentar kolaborator"
                                className="font-medium truncate cursor-pointer hover:underline text-left text-[#282925] dark:text-[#EDEDE8]"
                              >
                                {act.title}
                              </button>
                            </div>

                            <button
                              onClick={() => openTaskDetailDrawer(act, true)}
                              title={
                                commentCount > 0
                                  ? `${commentCount} komentar kolaborator`
                                  : 'Beri masukan pada tugas ini'
                              }
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[11px] tabular-nums shrink-0 cursor-pointer transition-colors ${
                                commentCount > 0
                                  ? 'text-[#567561] dark:text-[#8FB49C] hover:bg-[#EAF0EB] dark:hover:bg-[#1D2B22]'
                                  : 'opacity-0 group-hover:opacity-100 text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8]'
                              }`}
                            >
                              <MessageSquare size={12} />
                              {commentCount > 0 && <span>{commentCount}</span>}
                            </button>
                          </div>

                          {/* Proyek (clickable link) */}
                          <div className="col-span-3 pr-2 truncate">
                            {act.linkedDocId ? (
                              <button
                                onClick={() => handleNavigateToDoc(act.linkedDocId)}
                                className="text-[#777973] dark:text-[#9E9F99] hover:text-[#282925] dark:hover:text-[#EDEDE8] hover:underline truncate max-w-full cursor-pointer text-left"
                              >
                                {displayProject}
                              </button>
                            ) : (
                              <span className="text-[#777973] dark:text-[#9E9F99] truncate">
                                {displayProject}
                              </span>
                            )}
                          </div>

                          {/* Kategori */}
                          <div className="col-span-2 pr-2 text-[#777973] dark:text-[#9E9F99] truncate">
                            {act.category}
                          </div>

                          {/* Durasi */}
                          <div className="col-span-1 text-[#777973] dark:text-[#9E9F99] tabular-nums">
                            {act.durationMinutes > 0 ? `${act.durationMinutes} mnt` : '—'}
                          </div>

                          {/* Status + quick actions */}
                          <div className="col-span-2 flex items-center justify-between gap-1">
                            <button
                              onClick={() => {
                                const cycle: ProductivityActivity['status'] =
                                  act.status === 'not_started'
                                    ? 'in_progress'
                                    : act.status === 'in_progress'
                                    ? 'completed'
                                    : 'not_started';
                                handleToggleActivityStatus(act, cycle);
                              }}
                              title="Klik untuk ubah status"
                              className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-[11px] font-medium whitespace-nowrap cursor-pointer hover:opacity-85 transition-opacity ${badgeClass}`}
                            >
                              {badgeText}
                            </button>

                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openTaskDetailDrawer(act, true)}
                                title="Detail & komentar"
                                className="p-1 text-[#777973] hover:text-[#567561] cursor-pointer"
                              >
                                <MessageSquare size={12} />
                              </button>
                              <button
                                onClick={() => openEditActivityModal(act)}
                                title="Edit aktivitas"
                                className="p-1 text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] cursor-pointer"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(act)}
                                title="Hapus aktivitas"
                                className="p-1 text-[#777973] hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 px-4 text-center border-b border-[#E9EAE5] dark:border-[#2B2B28] text-xs text-[#777973] dark:text-[#9E9F99] space-y-2">
                    <p>Belum ada aktivitas tercatat untuk tanggal dan filter ini.</p>
                    <button
                      onClick={() => openCreateActivityModal(selectedDate)}
                      className="inline-flex items-center gap-1.5 text-[#567561] font-medium hover:underline cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Catat aktivitas pertama di tanggal ini</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action & Focus Time Total */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-[#777973] dark:text-[#9E9F99]">
              <button
                onClick={() => openCreateActivityModal(selectedDate)}
                className="inline-flex items-center gap-1.5 hover:text-[#282925] dark:hover:text-[#EDEDE8] transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Tambah aktivitas</span>
              </button>

              <span className="text-[11px] tabular-nums">
                Total waktu fokus {selectedDate === DEFAULT_TODAY_ISO ? 'hari ini' : 'tanggal ini'}: {formatFocusDuration(kpiStats.selectedDayFocusMinutes)}
              </span>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 5. REFLEKSI PRODUKTIVITAS                                       */}
        {/* =============================================================== */}
        <section className="space-y-3 pt-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Refleksi hari ini */}
            <div className="lg:col-span-8 bg-[#F8F8F6] dark:bg-[#1A1A18] rounded-[5px] p-4.5 sm:p-5 flex flex-col justify-between min-h-[130px]">
              {!isEditingReflection ? (
                <>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
                      {activeReflection.headline}
                    </h3>
                    <p className="text-[13px] text-[#777973] dark:text-[#9E9F99] leading-relaxed">
                      {activeReflection.summary}
                    </p>
                  </div>
                  <div className="pt-3">
                    <button
                      onClick={() => {
                        setReflectionHeadlineInput(activeReflection.headline);
                        setReflectionSummaryInput(activeReflection.summary);
                        setIsEditingReflection(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#567561] dark:text-[#8FB49C] hover:underline cursor-pointer"
                    >
                      <span>Tulis refleksi hari ini</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveReflection} className="space-y-2.5">
                  <input
                    type="text"
                    value={reflectionHeadlineInput}
                    onChange={(e) => setReflectionHeadlineInput(e.target.value)}
                    placeholder="Judul singkat refleksi..."
                    className="w-full h-9 px-3 text-sm font-medium bg-white dark:bg-[#121211] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] focus:outline-none focus:border-[#567561]"
                  />
                  <textarea
                    rows={2}
                    value={reflectionSummaryInput}
                    onChange={(e) => setReflectionSummaryInput(e.target.value)}
                    placeholder="Apa pencapaian hari ini atau fokus esok hari?"
                    className="w-full p-2.5 text-xs bg-white dark:bg-[#121211] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] focus:outline-none focus:border-[#567561]"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingReflection(false)}
                      className="px-3 py-1.5 text-xs text-[#777973] hover:text-[#282925] cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-[4px] bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#181816] text-xs font-medium cursor-pointer"
                    >
                      Simpan refleksi
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right: Kebiasaan baik */}
            <div className="lg:col-span-4 bg-[#EAF0EB] dark:bg-[#1B261F] rounded-[5px] p-4.5 sm:p-5 flex flex-col justify-between min-h-[130px]">
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-[#567561] dark:text-[#9CC0A8] tracking-[0.04em] uppercase tabular-nums">
                  {consistencyStreak} HARI KONSISTEN
                </div>
                <div className="text-[17px] font-medium text-[#282925] dark:text-[#EDEDE8]">
                  Sedikit, tapi terus bergerak.
                </div>
                <p className="text-xs text-[#567561] dark:text-[#8FB49C] leading-relaxed">
                  Kamu menyelesaikan tugas setiap hari. Pertahankan ritme yang nyaman untukmu.
                </p>
              </div>
            </div>
          </div>

          {/* Quiet Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-[#777973] dark:text-[#9E9F99]">
            <span>Ruang kecil, progres yang berarti.</span>
            <span>Tersinkronisasi otomatis dengan Firestore, Proyek Favorit, & Kalender Kerja.</span>
          </div>
        </section>
      </div>

      {/* ================================================================= */}
      {/* MODAL: CATAT / EDIT AKTIVITAS                                     */}
      {/* ================================================================= */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EAEAE5] dark:border-[#2B2B28]">
              <h3 className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8]">
                {editingActivity ? 'Edit aktivitas produktif' : 'Catat aktivitas baru'}
              </h3>
              <button
                onClick={() => setShowActivityModal(false)}
                className="p-1 text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveActivityModal} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-[#282925] dark:text-[#EDEDE8]">
                  Nama aktivitas / pekerjaan
                </label>
                <input
                  type="text"
                  required
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  placeholder="Contoh: Finalisasi komponen kalender"
                  className="w-full h-9 px-3 bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] text-[#282925] dark:text-[#EDEDE8] focus:outline-none focus:border-[#567561]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-medium text-[#282925] dark:text-[#EDEDE8]">
                    Proyek terhubung
                  </label>
                  <select
                    value={actLinkedDocId}
                    onChange={(e) => setActLinkedDocId(e.target.value)}
                    className="w-full h-9 px-2.5 bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                  >
                    <option value="">Workspace Umum</option>
                    {projectOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-[#282925] dark:text-[#EDEDE8]">
                    Kategori
                  </label>
                  <select
                    value={actCategory}
                    onChange={(e) => setActCategory(e.target.value)}
                    className="w-full h-9 px-2.5 bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-medium text-[#282925] dark:text-[#EDEDE8]">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={actDate}
                    onChange={(e) => setActDate(e.target.value)}
                    className="w-full h-9 px-2.5 bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] text-[#282925] dark:text-[#EDEDE8] tabular-nums focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-[#282925] dark:text-[#EDEDE8]">
                    Durasi (menit)
                  </label>
                  <div className="relative flex items-center">
                    <Clock size={12} className="absolute left-2.5 text-[#777973]" />
                    <input
                      type="number"
                      min="0"
                      max="600"
                      value={actDuration}
                      onChange={(e) => setActDuration(e.target.value)}
                      className="w-full h-9 pl-7 pr-2 bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] text-[#282925] dark:text-[#EDEDE8] tabular-nums focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-[#282925] dark:text-[#EDEDE8]">
                    Status
                  </label>
                  <select
                    value={actStatus}
                    onChange={(e) => setActStatus(e.target.value as ProductivityActivity['status'])}
                    className="w-full h-9 px-2 bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                  >
                    <option value="completed">Selesai</option>
                    <option value="in_progress">Dikerjakan</option>
                    <option value="not_started">Belum mulai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="space-y-1.5">
                  <label className="block font-medium text-[#282925] dark:text-[#EDEDE8]">
                    Pelaksana
                  </label>
                  <input
                    type="text"
                    value={actAssignee}
                    onChange={(e) => setActAssignee(e.target.value)}
                    className="w-full h-9 px-3 bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                  />
                </div>

                {actLinkedDocId && docs.find((d) => d.id === actLinkedDocId)?.projectData && (
                  <label className="flex items-center gap-2 pt-5 cursor-pointer select-none text-[11px] text-[#567561] dark:text-[#8FB49C]">
                    <input
                      type="checkbox"
                      checked={actSyncToProject}
                      onChange={(e) => setActSyncToProject(e.target.checked)}
                      className="rounded border-[#EAEAE5] accent-[#567561]"
                    />
                    <span>Sinkronkan ke daftar tugas proyek</span>
                  </label>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-[#282925] dark:text-[#EDEDE8]">
                  Catatan pekerjaan (opsional)
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={actNotes}
                  onChange={(e) => setActNotes(e.target.value)}
                  placeholder="Konteks singkat atau ruang lingkup pekerjaan..."
                  className="w-full p-2.5 bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] text-[#282925] dark:text-[#EDEDE8] focus:outline-none focus:border-[#567561]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAEAE5] dark:border-[#2B2B28]">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="h-9 px-3.5 rounded-[4px] border border-[#EAEAE5] dark:border-[#2B2B28] text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-[4px] bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#181816] font-medium cursor-pointer"
                >
                  {editingActivity ? 'Simpan perubahan' : 'Simpan aktivitas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* DRAWER: DETAIL TUGAS & KOMENTAR KOLABORATOR                       */}
      {/* ================================================================= */}
      {detailActivity && (
        <div
          onClick={() => setDetailActivityId(null)}
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs"
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg h-full bg-white dark:bg-[#161614] border-l border-[#EAEAE5] dark:border-[#2B2B28] shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[#EAEAE5] dark:border-[#2B2B28] shrink-0">
              <div className="flex items-center gap-2 text-xs text-[#777973] dark:text-[#9E9F99] min-w-0">
                <MessageSquare size={14} className="text-[#567561] shrink-0" />
                <span className="font-medium text-[#282925] dark:text-[#EDEDE8] truncate">
                  Detail tugas & masukan kolaborator
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openEditActivityModal(detailActivity)}
                  title="Edit rincian tugas"
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-[4px] border border-[#EAEAE5] dark:border-[#2B2B28] text-[11px] font-medium text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#232320] cursor-pointer whitespace-nowrap"
                >
                  <Edit3 size={12} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDetailActivityId(null)}
                  aria-label="Tutup detail tugas"
                  className="p-1.5 rounded-[4px] text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#232320] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Title + Status Switch */}
              <div className="space-y-3">
                <h2 className="text-[20px] font-semibold leading-snug text-[#282925] dark:text-[#EDEDE8]">
                  {detailActivity.title}
                </h2>

                {/* Clean Unboxed Metadata Line */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#777973] dark:text-[#9E9F99] tabular-nums">
                  <span>{formatLongDateId(detailActivity.date)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{detailActivity.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {detailActivity.durationMinutes > 0
                      ? `${detailActivity.durationMinutes} mnt`
                      : 'Durasi belum dicatat'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Pelaksana: {detailActivity.assignee || 'Saya'}</span>
                </div>

                {/* Project Link + Status Segmented Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  {detailActivity.linkedDocId ? (
                    <button
                      onClick={() => {
                        const targetId = detailActivity.linkedDocId;
                        setDetailActivityId(null);
                        handleNavigateToDoc(targetId);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#567561] dark:text-[#8FB49C] hover:underline cursor-pointer"
                    >
                      <span>
                        {resolveProjectDisplayName(
                          detailActivity.projectName,
                          detailActivity.linkedDocId
                        )}
                      </span>
                      <ExternalLink size={11} />
                    </button>
                  ) : (
                    <span className="text-xs text-[#777973] dark:text-[#9E9F99]">
                      {detailActivity.projectName || 'Workspace Umum'}
                    </span>
                  )}

                  <div className="inline-flex items-center p-0.5 rounded-[4px] bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28]">
                    {(
                      [
                        { id: 'not_started', label: 'Belum mulai' },
                        { id: 'in_progress', label: 'Dikerjakan' },
                        { id: 'completed', label: 'Selesai' },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        onClick={() => handleToggleActivityStatus(detailActivity, st.id)}
                        className={`px-2.5 py-1 rounded-[3px] text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          detailActivity.status === st.id
                            ? st.id === 'completed'
                              ? 'bg-[#EAF0EB] dark:bg-[#1D2B22] text-[#567561] dark:text-[#8FB49C]'
                              : st.id === 'in_progress'
                              ? 'bg-[#EDF1F5] dark:bg-[#1C252E] text-[#5D748B] dark:text-[#89A8C7]'
                              : 'bg-white dark:bg-[#2A2A27] text-[#282925] dark:text-[#EDEDE8]'
                            : 'text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8]'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#EAEAE5] dark:bg-[#2B2B28]" />

              {/* Task Notes / Context */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    Catatan pekerjaan
                  </span>
                  {!isEditingTaskNote && (
                    <button
                      onClick={() => {
                        setTaskNoteInput(detailActivity.notes || '');
                        setIsEditingTaskNote(true);
                      }}
                      className="text-[11px] font-medium text-[#567561] dark:text-[#8FB49C] hover:underline cursor-pointer"
                    >
                      {detailActivity.notes ? 'Ubah catatan' : 'Tambah catatan'}
                    </button>
                  )}
                </div>

                {!isEditingTaskNote ? (
                  <p className="text-xs leading-relaxed text-[#777973] dark:text-[#9E9F99] bg-[#F8F8F6] dark:bg-[#1B1B19] rounded-[4px] px-3.5 py-2.5 whitespace-pre-wrap">
                    {detailActivity.notes ||
                      'Belum ada catatan ringkas untuk pekerjaan ini. Tambahkan konteks agar kolaborator mudah memberi masukan.'}
                  </p>
                ) : (
                  <form onSubmit={handleSaveTaskNote} className="space-y-2">
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={taskNoteInput}
                      onChange={(e) => setTaskNoteInput(e.target.value)}
                      placeholder="Tuliskan konteks teknis, referensi desain, atau hal yang perlu ditinjau..."
                      className="w-full p-3 text-xs bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] text-[#282925] dark:text-[#EDEDE8] focus:outline-none focus:border-[#567561]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingTaskNote(false)}
                        className="px-2.5 py-1 text-[11px] text-[#777973] hover:text-[#282925] cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-[4px] bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#181816] text-[11px] font-medium cursor-pointer"
                      >
                        Simpan catatan
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="h-px bg-[#EAEAE5] dark:bg-[#2B2B28]" />

              {/* Collaborator Comments Feed */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8] tabular-nums">
                    Komentar kolaborator ({detailActivity.comments?.length || 0})
                  </h3>
                  <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
                    Tersinkron real-time
                  </span>
                </div>

                {detailActivity.comments && detailActivity.comments.length > 0 ? (
                  <div className="space-y-3">
                    {detailActivity.comments.map((cmt) => {
                      const isMine =
                        cmt.authorId === userProfile.userId ||
                        cmt.authorName === userProfile.name;
                      const isEditingThis = editingCommentId === cmt.id;

                      return (
                        <div
                          key={cmt.id}
                          className="group/cmt rounded-[5px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#FAFAF8] dark:bg-[#1A1A18] p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                style={{ backgroundColor: cmt.authorColor || '#567561' }}
                                className="w-6 h-6 rounded-full text-white text-[10px] font-semibold flex items-center justify-center shrink-0"
                              >
                                {cmt.authorName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0 text-xs">
                                <span className="font-semibold text-[#282925] dark:text-[#EDEDE8] truncate">
                                  {cmt.authorName}
                                </span>
                                <span aria-hidden="true" className="text-[#A1A29B]">
                                  ·
                                </span>
                                <span className="text-[11px] text-[#777973] dark:text-[#9E9F99] tabular-nums shrink-0">
                                  {formatCommentTime(cmt.createdAt)}
                                  {cmt.updatedAt ? ' (diedit)' : ''}
                                </span>
                              </div>
                            </div>

                            {isMine && !isEditingThis && (
                              <div className="flex items-center gap-1 opacity-0 group-hover/cmt:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingCommentId(cmt.id);
                                    setEditingCommentText(cmt.text);
                                  }}
                                  title="Edit komentar"
                                  className="p-1 text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] cursor-pointer"
                                >
                                  <Edit3 size={11} />
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(cmt.id)}
                                  title="Hapus komentar"
                                  className="p-1 text-[#777973] hover:text-rose-600 cursor-pointer"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            )}
                          </div>

                          {!isEditingThis ? (
                            <p className="text-xs leading-relaxed text-[#282925] dark:text-[#EDEDE8] whitespace-pre-wrap break-words pl-8">
                              {cmt.text}
                            </p>
                          ) : (
                            <div className="pl-8 space-y-2">
                              <textarea
                                rows={2}
                                maxLength={1000}
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                className="w-full p-2 text-xs bg-white dark:bg-[#121211] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] focus:outline-none focus:border-[#567561]"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditingCommentText('');
                                  }}
                                  className="px-2 py-1 text-[11px] text-[#777973] hover:text-[#282925] cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedComment(cmt.id)}
                                  className="px-2.5 py-1 rounded-[4px] bg-[#567561] text-white text-[11px] font-medium cursor-pointer"
                                >
                                  Simpan
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[5px] border border-dashed border-[#EAEAE5] dark:border-[#2B2B28] px-4 py-6 text-center text-xs text-[#777973] dark:text-[#9E9F99]">
                    Belum ada komentar pada tugas ini. Berikan masukan spesifik untuk item pekerjaan ini di bawah.
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Comment Composer Footer */}
            <form
              onSubmit={handleAddActivityComment}
              className="border-t border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#141412] px-6 py-4 space-y-2.5 shrink-0"
            >
              {/* Quick Mention Buttons */}
              {quickMentionNames.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#777973] dark:text-[#9E9F99]">
                  <span>Sebut rekan:</span>
                  {quickMentionNames.map((name) => (
                    <button
                      type="button"
                      key={name}
                      onClick={() => {
                        setCommentInput((prev) =>
                          prev.trim() ? `${prev.trimEnd()} @${name} ` : `@${name} `
                        );
                        commentInputRef.current?.focus();
                      }}
                      className="px-1.5 py-0.5 rounded-[4px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] hover:border-[#567561] transition-colors cursor-pointer"
                    >
                      @{name}
                    </button>
                  ))}
                </div>
              )}

              <textarea
                ref={commentInputRef}
                rows={2}
                maxLength={1000}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleAddActivityComment();
                  }
                }}
                placeholder="Tulis masukan spesifik untuk tugas ini... (Ctrl+Enter kirim)"
                className="w-full p-3 text-xs bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] text-[#282925] dark:text-[#EDEDE8] placeholder-[#A1A29B] focus:outline-none focus:border-[#567561] resize-none"
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] text-[#777973] dark:text-[#9E9F99] min-w-0">
                  <span
                    style={{ backgroundColor: userProfile.color || '#567561' }}
                    className="w-4 h-4 rounded-full text-white text-[9px] font-bold inline-flex items-center justify-center shrink-0"
                  >
                    {userProfile.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">Kirim sebagai {userProfile.name}</span>
                </div>

                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[4px] bg-[#282925] hover:bg-[#3A3B36] dark:bg-[#EDEDE8] dark:hover:bg-white disabled:opacity-45 text-white dark:text-[#181816] text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Send size={12} />
                  <span>Kirim masukan</span>
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: ATUR TARGET HARIAN & MINGGUAN                              */}
      {/* ================================================================= */}
      {showTargetEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EAEAE5] dark:border-[#2B2B28]">
              <h3 className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8]">
                Atur target produktivitas
              </h3>
              <button
                onClick={() => setShowTargetEditor(false)}
                className="p-1 text-[#777973] hover:text-[#282925] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveTargets} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-[#282925] dark:text-[#EDEDE8]">
                  Target tugas per hari
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={dailyTargetInput}
                  onChange={(e) => setDailyTargetInput(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] tabular-nums focus:outline-none focus:border-[#567561]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-medium text-[#282925] dark:text-[#EDEDE8]">
                  Target tugas per minggu
                </label>
                <input
                  type="number"
                  min="1"
                  max="350"
                  value={weeklyTargetInput}
                  onChange={(e) => setWeeklyTargetInput(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F8F8F6] dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] tabular-nums focus:outline-none focus:border-[#567561]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTargetEditor(false)}
                  className="h-9 px-3 rounded-[4px] border border-[#EAEAE5] dark:border-[#2B2B28] text-[#777973] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-[4px] bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#181816] font-medium cursor-pointer"
                >
                  Simpan target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
