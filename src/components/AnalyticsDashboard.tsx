import React from 'react';
import { 
  BarChart3, 
  CheckCircle, 
  FileText, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Flame, 
  Zap,
  Tag,
  Trophy,
  History,
  ArrowRight
} from 'lucide-react';
import { DocItem, DocStatus, Language } from '../types';
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

  const days = lang === 'id' 
    ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const activityLevels = [4, 6, 9, 7, 12, 8, 11];

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

  allStatusLogs.sort((a, b) => b.timestamp - a.timestamp);
  const recentStatusLogs = allStatusLogs.slice(0, 8);

  const statusBadgeInfo = (st: DocStatus) => {
    switch (st) {
      case 'completed': return { text: t.completed, color: 'text-[#567561] bg-[#EDF3EE] dark:bg-[#1E2B22]' };
      case 'in_progress': return { text: t.inProgress, color: 'text-[#5D748B] bg-[#EBF0F5] dark:bg-[#242A32]' };
      case 'archived': return { text: t.archived, color: 'text-[#777973] bg-[#F4F4F0]' };
      default: return { text: t.notStarted, color: 'text-[#777973] bg-[#F4F4F0]' };
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-white dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] p-6 md:p-8 select-none font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#282925] dark:text-[#EDEDE8] flex items-center gap-2.5">
            <BarChart3 className="text-[#282925] dark:text-[#EDEDE8]" size={20} />
            <span>{t.productivityTitle}</span>
          </h2>
          <p className="text-xs text-[#777973] mt-1">
            Visualisasi perkembangan dokumen hierarkis, penyelesaian tugas, dan audit kontribusi tim.
          </p>
        </div>

        {/* 4 KPI Summary Cards (Figma aesthetic: #F8F8F6 bg, border #EAEAE5, sage green accents) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Documents */}
          <div className="p-4 rounded-[8px] bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#777973] font-medium">
                {t.totalDocs}
              </div>
              <div className="text-2xl font-semibold text-[#282925] dark:text-[#EDEDE8] mt-1 font-mono tabular-nums">
                {docs.length}
              </div>
              <div className="text-[11px] text-[#8CA796] mt-1 flex items-center gap-1 font-medium">
                <TrendingUp size={11} />
                <span>+3 minggu ini</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-[6px] bg-white dark:bg-[#252522] border border-[#EAEAE5] dark:border-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>

          {/* Words Written */}
          <div className="p-4 rounded-[8px] bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#777973] font-medium">
                {t.totalWords}
              </div>
              <div className="text-2xl font-semibold text-[#282925] dark:text-[#EDEDE8] mt-1 font-mono tabular-nums">
                {totalWords.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#777973] mt-1 flex items-center gap-1">
                <Zap size={11} className="text-[#8CA796]" />
                <span>Kecepatan aktif</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-[6px] bg-white dark:bg-[#252522] border border-[#EAEAE5] dark:border-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>

          {/* Completion Rate */}
          <div className="p-4 rounded-[8px] bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#777973] font-medium">
                {t.completionRate}
              </div>
              <div className="text-2xl font-semibold text-[#282925] dark:text-[#EDEDE8] mt-1 font-mono tabular-nums">
                {completionRate}%
              </div>
              <div className="text-[11px] text-[#777973] mt-1">
                {completedCount} dari {totalTasks} selesai
              </div>
            </div>
            <div className="w-9 h-9 rounded-[6px] bg-white dark:bg-[#252522] border border-[#EAEAE5] dark:border-[#2B2B28] text-[#8CA796] flex items-center justify-center">
              <CheckCircle size={18} />
            </div>
          </div>

          {/* Deadlines Due Soon / Overdue */}
          <div className="p-4 rounded-[8px] bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#777973] font-medium">
                {t.dueSoon}
              </div>
              <div className="text-2xl font-semibold text-[#282925] dark:text-[#EDEDE8] mt-1 font-mono tabular-nums">
                {dueSoonDocs.length}
              </div>
              <div className="text-[11px] text-[#777973] mt-1 flex items-center gap-1 font-mono">
                {overdueDocs.length > 0 ? (
                  <span className="text-rose-500 flex items-center gap-1">
                    <AlertTriangle size={11} />
                    <span>{overdueDocs.length} {t.overdue}</span>
                  </span>
                ) : (
                  <span className="text-[#8CA796]">Semua tepat jadwal</span>
                )}
              </div>
            </div>
            <div className="w-9 h-9 rounded-[6px] bg-white dark:bg-[#252522] border border-[#EAEAE5] dark:border-[#2B2B28] text-[#777973] flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown Chart */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A29B] mb-3">
              {t.statusBreakdown}
            </h3>

            {/* Segmented bar */}
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-[#F4F4F0] dark:bg-[#252522] my-4">
              <div
                style={{ width: `${(completedCount / (totalTasks || 1)) * 100}%` }}
                className="bg-[#8CA796] h-full"
                title={`${t.completed}: ${completedCount}`}
              />
              <div
                style={{ width: `${(inProgressCount / (totalTasks || 1)) * 100}%` }}
                className="bg-[#5D748B] h-full"
                title={`${t.inProgress}: ${inProgressCount}`}
              />
              <div
                style={{ width: `${(notStartedCount / (totalTasks || 1)) * 100}%` }}
                className="bg-[#A1A29B] h-full"
                title={`${t.notStarted}: ${notStartedCount}`}
              />
              <div
                style={{ width: `${(archivedCount / (totalTasks || 1)) * 100}%` }}
                className="bg-[#777973] h-full"
                title={`${t.archived}: ${archivedCount}`}
              />
            </div>

            {/* Legend with percentages */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-[4px] bg-[#F8F8F6] dark:bg-[#181816]">
                <span className="flex items-center gap-1.5 text-[#777973]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8CA796]" />
                  {t.completed}
                </span>
                <span className="font-mono font-semibold text-[#282925] dark:text-[#EDEDE8]">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-[4px] bg-[#F8F8F6] dark:bg-[#181816]">
                <span className="flex items-center gap-1.5 text-[#777973]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5D748B]" />
                  {t.inProgress}
                </span>
                <span className="font-mono font-semibold text-[#282925] dark:text-[#EDEDE8]">{inProgressCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-[4px] bg-[#F8F8F6] dark:bg-[#181816]">
                <span className="flex items-center gap-1.5 text-[#777973]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A1A29B]" />
                  {t.notStarted}
                </span>
                <span className="font-mono font-semibold text-[#282925] dark:text-[#EDEDE8]">{notStartedCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-[4px] bg-[#F8F8F6] dark:bg-[#181816]">
                <span className="flex items-center gap-1.5 text-[#777973]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#777973]" />
                  {t.archived}
                </span>
                <span className="font-mono font-semibold text-[#282925] dark:text-[#EDEDE8]">{archivedCount}</span>
              </div>
            </div>
          </div>

          {/* 7-Day Activity Heatmap */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A29B]">
                {t.activityHeatmap}
              </h3>
              <span className="flex items-center gap-1 text-xs text-[#282925] dark:text-[#EDEDE8] font-medium">
                <Flame size={13} className="text-amber-500" />
                <span>5 Hari Beruntun (Streak)</span>
              </span>
            </div>

            {/* Visual vertical bar chart */}
            <div className="h-36 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-[#EAEAE5] dark:border-[#2B2B28]">
              {activityLevels.map((val, idx) => {
                const max = Math.max(...activityLevels);
                const heightPct = Math.round((val / max) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono text-[#A1A29B] opacity-0 group-hover:opacity-100 transition-opacity">
                      {val}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[28px] rounded-t-[3px] bg-[#282925] dark:bg-[#EDEDE8] hover:bg-[#8CA796] transition-all duration-200"
                    />
                    <span className="text-[11px] font-medium text-[#777973]">
                      {days[idx]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-[11px] text-[#777973] flex items-center justify-between">
              <span>Rata-rata 8.1 tindakan produktivitas harian</span>
              <span className="text-[#8CA796] font-medium">+18% dari pekan lalu</span>
            </div>
          </div>
        </div>

        {/* Priority & Tags Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority breakdown */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A29B] mb-3">
              {t.priorityBreakdown}
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#D32F2F] flex items-center gap-1">
                    <span>{t.high}</span>
                  </span>
                  <span className="font-mono text-[#777973]">{highPriorityCount} catatan</span>
                </div>
                <div className="w-full bg-[#F4F4F0] dark:bg-[#252522] h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(highPriorityCount / (totalTasks || 1)) * 100}%` }}
                    className="bg-[#D32F2F] h-full rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#B78103] flex items-center gap-1">
                    <span>{t.medium}</span>
                  </span>
                  <span className="font-mono text-[#777973]">{mediumPriorityCount} catatan</span>
                </div>
                <div className="w-full bg-[#F4F4F0] dark:bg-[#252522] h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(mediumPriorityCount / (totalTasks || 1)) * 100}%` }}
                    className="bg-[#B78103] h-full rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#777973] flex items-center gap-1">
                    <span>{t.low}</span>
                  </span>
                  <span className="font-mono text-[#777973]">{lowPriorityCount} catatan</span>
                </div>
                <div className="w-full bg-[#F4F4F0] dark:bg-[#252522] h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(lowPriorityCount / (totalTasks || 1)) * 100}%` }}
                    className="bg-[#A1A29B] h-full rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Tags & Knowledge Topics */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A29B] mb-3">
              Topik & Tag Paling Aktif
            </h3>

            {topTags.length > 0 ? (
              <div className="space-y-2">
                {topTags.map(([tag, count]) => (
                  <div key={tag} className="flex items-center justify-between p-2 rounded-[4px] bg-[#F8F8F6] dark:bg-[#181816] text-xs">
                    <div className="flex items-center gap-2">
                      <Tag size={12} className="text-[#777973]" />
                      <span className="font-medium text-[#282925] dark:text-[#EDEDE8]">{tag}</span>
                    </div>
                    <span className="font-mono px-2 py-0.5 rounded-[4px] bg-[#EAEAE5] dark:bg-[#252522] text-[#282925] dark:text-[#EDEDE8] font-medium">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#A1A29B] italic">Belum ada tag yang ditambahkan.</p>
            )}
          </div>
        </div>

        {/* SECTION: Contributor Progress Leaderboard */}
        <div className="p-5 rounded-[8px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8] flex items-center gap-2">
                <Trophy className="text-amber-500" size={16} />
                <span>
                  {lang === 'id' 
                    ? 'Analisis Kontributor Progres (Paling Sering Mengubah Status)' 
                    : 'Progress Contributor Leaderboard (Most Frequent Status Updates)'}
                </span>
              </h3>
              <p className="text-xs text-[#777973] mt-0.5">
                {lang === 'id'
                  ? 'Peringkat anggota tim berdasarkan frekuensi pembaruan progres dokumen dan penyelesaian tugas.'
                  : 'Ranking of team members based on document progress updates and task completion velocity.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-[4px] bg-[#F8F8F6] dark:bg-[#181816] text-[#282925] dark:text-[#EDEDE8] border border-[#EAEAE5] dark:border-[#2B2B28]">
                {totalStatusChangesAll} {lang === 'id' ? 'Total Pembaruan' : 'Total Updates'}
              </span>
            </div>
          </div>

          {sortedContributors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedContributors.map((c, idx) => {
                const sharePercent = totalStatusChangesAll > 0 
                  ? Math.round((c.totalChanges / totalStatusChangesAll) * 100) 
                  : 0;

                const rankBadge = idx === 0 
                  ? { label: '#1 Top Leader', color: 'bg-[#FFF8E7] text-[#B78103] border-[#EAEAE5]' }
                  : idx === 1
                  ? { label: '#2 Runner-up', color: 'bg-[#F8F8F6] text-[#282925] border-[#EAEAE5]' }
                  : idx === 2
                  ? { label: '#3 Finisher', color: 'bg-[#F8F8F6] text-[#777973] border-[#EAEAE5]' }
                  : { label: `#${idx + 1}`, color: 'bg-[#F8F8F6] text-[#A1A29B] border-[#EAEAE5]' };

                return (
                  <div
                    key={c.name}
                    className="p-3.5 rounded-[6px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Row: User Avatar, Name & Rank Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            style={{ backgroundColor: c.color || '#6366F1' }}
                            className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs"
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-[#282925] dark:text-[#EDEDE8] block truncate">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-[#A1A29B] block truncate">
                              {c.recentTimestamp ? `Aktif ${formatTimeAgo(c.recentTimestamp, lang)}` : 'Anggota Tim'}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium border ${rankBadge.color} shrink-0`}>
                          {rankBadge.label}
                        </span>
                      </div>

                      {/* Stats Pills */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="p-2 rounded-[4px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28]">
                          <div className="text-[10px] text-[#A1A29B] font-medium">Perubahan Status</div>
                          <div className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8] font-mono mt-0.5">
                            {c.totalChanges} <span className="text-[10px] font-normal text-[#A1A29B]">kali</span>
                          </div>
                        </div>

                        <div className="p-2 rounded-[4px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28]">
                          <div className="text-[10px] text-[#A1A29B] font-medium">Tugas Selesai</div>
                          <div className="text-base font-semibold text-[#567561] font-mono mt-0.5">
                            {c.completedCount} <span className="text-[10px] font-normal text-[#A1A29B]">tugas</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Percentage Share Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-mono text-[#777973]">
                        <span>Porsi Kontribusi</span>
                        <span className="font-medium text-[#282925] dark:text-[#EDEDE8]">{sharePercent}%</span>
                      </div>
                      <div className="w-full bg-[#EAEAE5] dark:bg-[#252522] h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${sharePercent}%` }}
                          className="bg-[#282925] dark:bg-[#EDEDE8] h-full rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-[#A1A29B] italic">
              Belum ada riwayat aktivitas perubahan status.
            </div>
          )}
        </div>

        {/* SECTION: Real-time Status Change Activity Log */}
        <div className="p-5 rounded-[8px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8] flex items-center gap-2">
                <History className="text-[#282925] dark:text-[#EDEDE8]" size={16} />
                <span>
                  {lang === 'id' ? 'Log Aktivitas Perubahan Status Terbaru' : 'Recent Status Change Activity Log'}
                </span>
              </h3>
              <p className="text-xs text-[#777973] mt-0.5">
                {lang === 'id'
                  ? 'Catatan real-time perubahan status halaman dan tugas oleh seluruh kolaborator.'
                  : 'Real-time record of page and task status changes made by all collaborators.'}
              </p>
            </div>
          </div>

          {recentStatusLogs.length > 0 ? (
            <div className="space-y-2">
              {recentStatusLogs.map((log) => {
                const fromB = statusBadgeInfo(log.fromStatus);
                const toB = statusBadgeInfo(log.toStatus);

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-[6px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] hover:bg-[#EAEAE5] transition-colors flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    {/* Left: User Avatar + Name + Action + Document Title */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        style={{ backgroundColor: log.changedBy.color || '#6366F1' }}
                        className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs"
                      >
                        {log.changedBy.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-[#282925] dark:text-[#EDEDE8]">
                            {log.changedBy.name}
                          </span>
                          <span className="text-[#777973]">memperbarui status pada</span>
                          <span className="font-medium text-[#282925] dark:text-[#EDEDE8] inline-flex items-center gap-1 truncate max-w-[200px]">
                            <span>{log.docIcon}</span>
                            <span>{log.docTitle}</span>
                          </span>
                        </div>

                        <div className="text-[10px] text-[#A1A29B] mt-0.5 font-mono">
                          {formatTimeAgo(log.timestamp, lang)} · {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status Flow Pills */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-[4px] border border-[#EAEAE5] dark:border-[#2B2B28] text-[10px] font-medium ${fromB.color}`}>
                        {fromB.text}
                      </span>
                      <ArrowRight size={12} className="text-[#A1A29B] shrink-0" />
                      <span className={`px-2 py-0.5 rounded-[4px] border border-[#EAEAE5] dark:border-[#2B2B28] text-[10px] font-semibold ${toB.color}`}>
                        {toB.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-[#A1A29B] italic">
              Belum ada aktivitas perpindahan status tercatat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
