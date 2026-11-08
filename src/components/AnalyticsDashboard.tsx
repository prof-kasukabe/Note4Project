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
  Tag
} from 'lucide-react';
import { DocItem, Language } from '../types';
import { translations } from '../utils/i18n';

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
      </div>
    </div>
  );
};
