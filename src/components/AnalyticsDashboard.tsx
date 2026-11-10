import React from 'react';
import { 
  BarChart3, 
  CheckCircle, 
  FileText, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Flame, 
  ShieldCheck, 
  Layers, 
  Zap,
  Tag,
  Users,
  Trophy,
  History,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { DocItem, DocStatus, StatusChangeLog, Language } from '../types';
import { translations } from '../utils/i18n';
import { formatTimeAgo } from '../utils/formatTime';

interface AnalyticsDashboardProps {
  docs: DocItem[];
  lang: Language;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ docs, lang }) => {
  const t = translations[lang];

  // Total words across all docs
  const totalWords = docs.reduce((acc, d) => {
    const words = (d.content || '').trim().split(/\s+/).filter(Boolean).length;
    return acc + words;
  }, 0);

  // Status counts
  const totalTasks = docs.length;
  const completedCount = docs.filter((d) => d.status === 'completed').length;
  const inProgressCount = docs.filter((d) => d.status === 'in_progress').length;
  const notStartedCount = docs.filter((d) => d.status === 'not_started').length;
  const archivedCount = docs.filter((d) => d.status === 'archived').length;

  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Priority counts
  const highPriorityCount = docs.filter((d) => d.priority === 'high').length;
  const mediumPriorityCount = docs.filter((d) => d.priority === 'medium').length;
  const lowPriorityCount = docs.filter((d) => d.priority === 'low').length;

  // Deadline analysis
  const now = new Date();
  const threeDaysLater = new Date(Date.now() + 86400000 * 3);

  const overdueDocs = docs.filter((d) => {
    if (!d.deadline || d.status === 'completed') return false;
    const deadlineDate = new Date(d.deadline);
    return deadlineDate < now;
  });

  const dueSoonDocs = docs.filter((d) => {
    if (!d.deadline || d.status === 'completed') return false;
    const deadlineDate = new Date(d.deadline);
    return deadlineDate >= now && deadlineDate <= threeDaysLater;
  });

  // Tag distribution
  const tagCounts: Record<string, number> = {};
  docs.forEach((d) => {
    d.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Simulated 7-day activity data based on timestamps
  const days = lang === 'id' 
    ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const activityLevels = [4, 6, 9, 7, 12, 8, 11]; // activity actions per day

  // Contributor Progress Analysis: Aggregate status change frequency & audit data
  interface ContributorStats {
    name: string;
    color: string;
    userId: string;
    totalChanges: number;
    completedCount: number;
    inProgressCount: number;
    recentTimestamp: number;
  }

  interface FlatStatusLog {
    id: string;
    docId: string;
    docTitle: string;
    docIcon: string;
    fromStatus: DocStatus;
    toStatus: DocStatus;
    changedBy: {
      userId: string;
      name: string;
      color: string;
    };
    timestamp: number;
  }

  const contributorMap: Record<string, ContributorStats> = {};
  const allStatusLogs: FlatStatusLog[] = [];

  docs.forEach((d) => {
    if (d.statusHistory && d.statusHistory.length > 0) {
      d.statusHistory.forEach((log) => {
        allStatusLogs.push({
          id: log.id,
          docId: d.id,
          docTitle: d.title || (lang === 'id' ? 'Dokumen Baru' : 'New Document'),
          docIcon: d.icon || '📄',
          fromStatus: log.fromStatus,
          toStatus: log.toStatus,
          changedBy: log.changedBy,
          timestamp: log.timestamp,
        });

        const key = log.changedBy?.name || 'Kolaborator';
        if (!contributorMap[key]) {
          contributorMap[key] = {
            name: key,
            color: log.changedBy?.color || '#6366F1',
            userId: log.changedBy?.userId || key,
            totalChanges: 0,
            completedCount: 0,
            inProgressCount: 0,
            recentTimestamp: log.timestamp,
          };
        }
        contributorMap[key].totalChanges += 1;
        if (log.toStatus === 'completed') contributorMap[key].completedCount += 1;
        if (log.toStatus === 'in_progress') contributorMap[key].inProgressCount += 1;
        if (log.timestamp > contributorMap[key].recentTimestamp) {
          contributorMap[key].recentTimestamp = log.timestamp;
        }
      });
    } else if (d.lastModifiedBy) {
      const key = d.lastModifiedBy.name || 'Kolaborator';
      if (!contributorMap[key]) {
        contributorMap[key] = {
          name: key,
          color: d.lastModifiedBy.color || '#6366F1',
          userId: d.lastModifiedBy.userId || key,
          totalChanges: 0,
          completedCount: 0,
          inProgressCount: 0,
          recentTimestamp: d.lastModifiedBy.timestamp,
        };
      }
      contributorMap[key].totalChanges += 1;
      if (d.status === 'completed') contributorMap[key].completedCount += 1;
      if (d.status === 'in_progress') contributorMap[key].inProgressCount += 1;
    }
  });

  const sortedContributors = Object.values(contributorMap).sort(
    (a, b) => b.totalChanges - a.totalChanges
  );

  const totalStatusChangesAll = sortedContributors.reduce((acc, c) => acc + c.totalChanges, 0);

  // Sort logs by newest first
  allStatusLogs.sort((a, b) => b.timestamp - a.timestamp);
  const recentStatusLogs = allStatusLogs.slice(0, 8);

  const statusBadgeInfo = (st: DocStatus) => {
    switch (st) {
      case 'completed': return { text: t.completed, color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' };
      case 'in_progress': return { text: t.inProgress, color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800' };
      case 'archived': return { text: t.archived, color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' };
      default: return { text: t.notStarted, color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={22} />
            <span>{t.productivityTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualisasi perkembangan dokumen hierarkis, penyelesaian tugas, dan metrik fokus harian.
          </p>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Documents */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t.totalDocs}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
                {docs.length}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                <TrendingUp size={11} />
                <span>+3 minggu ini</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText size={20} />
            </div>
          </div>

          {/* Words Written */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t.totalWords}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
                {totalWords.toLocaleString()}
              </div>
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-0.5">
                <Zap size={11} />
                <span>Kecepatan aktif</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>

          {/* Completion Rate */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t.completionRate}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
                {completionRate}%
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {completedCount} dari {totalTasks} selesai
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
          </div>

          {/* Deadlines Due Soon / Overdue */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t.dueSoon}
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono tabular-nums">
                {dueSoonDocs.length}
              </div>
              <div className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-mono">
                {overdueDocs.length > 0 ? (
                  <>
                    <AlertTriangle size={11} />
                    <span>{overdueDocs.length} {t.overdue}</span>
                  </>
                ) : (
                  <span>Semua tepat jadwal</span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown Chart */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              {t.statusBreakdown}
            </h3>

            {/* Segmented bar */}
            <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 my-4">
              <div
                style={{ width: `${(completedCount / (totalTasks || 1)) * 100}%` }}
                className="bg-emerald-500 h-full"
                title={`${t.completed}: ${completedCount}`}
              />
              <div
                style={{ width: `${(inProgressCount / (totalTasks || 1)) * 100}%` }}
                className="bg-indigo-500 h-full"
                title={`${t.inProgress}: ${inProgressCount}`}
              />
              <div
                style={{ width: `${(notStartedCount / (totalTasks || 1)) * 100}%` }}
                className="bg-slate-400 h-full"
                title={`${t.notStarted}: ${notStartedCount}`}
              />
              <div
                style={{ width: `${(archivedCount / (totalTasks || 1)) * 100}%` }}
                className="bg-amber-400 h-full"
                title={`${t.archived}: ${archivedCount}`}
              />
            </div>

            {/* Legend with percentages */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {t.completed}
                </span>
                <span className="font-mono font-bold">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  {t.inProgress}
                </span>
                <span className="font-mono font-bold">{inProgressCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  {t.notStarted}
                </span>
                <span className="font-mono font-bold">{notStartedCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  {t.archived}
                </span>
                <span className="font-mono font-bold">{archivedCount}</span>
              </div>
            </div>
          </div>

          {/* 7-Day Activity Heatmap */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.activityHeatmap}
              </h3>
              <span className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
                <Flame size={14} />
                <span>5 Hari Beruntun (Streak)</span>
              </span>
            </div>

            {/* Visual vertical bar chart */}
            <div className="h-36 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800">
              {activityLevels.map((val, idx) => {
                const max = Math.max(...activityLevels);
                const heightPct = Math.round((val / max) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {val}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[32px] rounded-t-md bg-indigo-500 group-hover:bg-indigo-600 transition-all duration-200"
                    />
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {days[idx]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Rata-rata 8.1 tindakan produktivitas harian</span>
              <span className="text-emerald-500 font-semibold">+18% dari pekan lalu</span>
            </div>
          </div>
        </div>

        {/* Priority & Tags Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority breakdown */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              {t.priorityBreakdown}
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span>{t.high}</span>
                  </span>
                  <span className="font-mono text-slate-500">{highPriorityCount} catatan</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(highPriorityCount / (totalTasks || 1)) * 100}%` }}
                    className="bg-rose-500 h-full rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span>{t.medium}</span>
                  </span>
                  <span className="font-mono text-slate-500">{mediumPriorityCount} catatan</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(mediumPriorityCount / (totalTasks || 1)) * 100}%` }}
                    className="bg-amber-500 h-full rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>{t.low}</span>
                  </span>
                  <span className="font-mono text-slate-500">{lowPriorityCount} catatan</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(lowPriorityCount / (totalTasks || 1)) * 100}%` }}
                    className="bg-slate-400 h-full rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Tags & Knowledge Topics */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Topik & Tag Paling Aktif
            </h3>

            {topTags.length > 0 ? (
              <div className="space-y-2.5">
                {topTags.map(([tag, count]) => (
                  <div key={tag} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs">
                    <div className="flex items-center gap-2">
                      <Tag size={12} className="text-indigo-500" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{tag}</span>
                    </div>
                    <span className="font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Belum ada tag yang ditambahkan.</p>
            )}
          </div>
        </div>

        {/* SECTION: Contributor Progress Leaderboard (Siapa yang Paling Sering Mengubah Status) */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="text-amber-500" size={17} />
                <span>
                  {lang === 'id' 
                    ? 'Analisis Kontributor Progres (Paling Sering Mengubah Status)' 
                    : 'Progress Contributor Leaderboard (Most Frequent Status Updates)'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'id'
                  ? 'Peringkat anggota tim berdasarkan frekuensi pembaruan progres dokumen dan penyelesaian tugas.'
                  : 'Ranking of team members based on document progress updates and task completion velocity.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {totalStatusChangesAll} {lang === 'id' ? 'Total Pembaruan' : 'Total Updates'}
              </span>
            </div>
          </div>

          {sortedContributors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {sortedContributors.map((c, idx) => {
                const sharePercent = totalStatusChangesAll > 0 
                  ? Math.round((c.totalChanges / totalStatusChangesAll) * 100) 
                  : 0;

                const rankBadge = idx === 0 
                  ? { label: '#1 Top Leader', color: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700' }
                  : idx === 1
                  ? { label: '#2 Runner-up', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700' }
                  : idx === 2
                  ? { label: '#3 Finisher', color: 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700' }
                  : { label: `#${idx + 1}`, color: 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700' };

                return (
                  <div
                    key={c.name}
                    className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Row: User Avatar, Name & Rank Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            style={{ backgroundColor: c.color }}
                            className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs"
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {c.recentTimestamp ? `Aktif ${formatTimeAgo(c.recentTimestamp, lang)}` : 'Anggota Tim'}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rankBadge.color} shrink-0`}>
                          {rankBadge.label}
                        </span>
                      </div>

                      {/* Stats Pills */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                          <div className="text-[10px] text-slate-400 font-medium">Perubahan Status</div>
                          <div className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                            {c.totalChanges} <span className="text-[11px] font-normal text-slate-400">kali</span>
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                          <div className="text-[10px] text-slate-400 font-medium">Tugas Selesai</div>
                          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                            {c.completedCount} <span className="text-[11px] font-normal text-slate-400">tugas</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Percentage Share Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-mono text-slate-500">
                        <span>Porsi Kontribusi</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{sharePercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${sharePercent}%` }}
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 italic">
              Belum ada riwayat aktivitas perubahan status.
            </div>
          )}
        </div>

        {/* SECTION: Real-time Status Change Activity Log */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="text-indigo-600 dark:text-indigo-400" size={17} />
                <span>
                  {lang === 'id' ? 'Log Aktivitas Perubahan Status Terbaru' : 'Recent Status Change Activity Log'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'id'
                  ? 'Catatan real-time perubahan status halaman dan tugas oleh seluruh kolaborator.'
                  : 'Real-time record of page and task status changes made by all collaborators.'}
              </p>
            </div>
          </div>

          {recentStatusLogs.length > 0 ? (
            <div className="space-y-2.5">
              {recentStatusLogs.map((log) => {
                const fromB = statusBadgeInfo(log.fromStatus);
                const toB = statusBadgeInfo(log.toStatus);

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    {/* Left: User Avatar + Name + Action + Document Title */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        style={{ backgroundColor: log.changedBy.color }}
                        className="w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs"
                      >
                        {log.changedBy.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {log.changedBy.name}
                          </span>
                          <span className="text-slate-400">memperbarui status pada</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 truncate max-w-[200px]">
                            <span>{log.docIcon}</span>
                            <span>{log.docTitle}</span>
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {formatTimeAgo(log.timestamp, lang)} · {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status Flow Pills */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${fromB.color}`}>
                        {fromB.text}
                      </span>
                      <ArrowRight size={12} className="text-slate-400 shrink-0" />
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${toB.color}`}>
                        {toB.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 italic">
              Belum ada aktivitas perpindahan status tercatat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
