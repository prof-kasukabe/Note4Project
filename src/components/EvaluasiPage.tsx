import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  Plus, 
  X, 
  Check, 
  Edit3
} from 'lucide-react';
import { 
  EvaluationData, 
  EvaluationProject, 
  EvaluationIssue, 
  EvaluationLearning,
  ActiveView 
} from '../types';

interface EvaluasiPageProps {
  evaluationData: EvaluationData;
  userProfile: { userId: string; name: string; color: string };
  onUpdateEvaluation: (updated: EvaluationData, actionLabel?: string) => void;
  onSelectView?: (view: ActiveView) => void;
  onSelectDoc?: (docId: string) => void;
}

const formatRupiah = (amount: number): string => {
  if (amount === 0) return 'Rp0';
  return 'Rp' + amount.toLocaleString('id-ID');
};

const formatJutaShort = (amount: number): string => {
  const juta = amount / 1000000;
  if (Number.isInteger(juta)) {
    return `Rp${juta} jt`;
  }
  return `Rp${juta.toFixed(1).replace('.', ',')} jt`;
};

const formatMillionsNumber = (amount: number): string => {
  const juta = amount / 1000000;
  if (Number.isInteger(juta)) return String(juta);
  return juta.toFixed(1);
};

export const EvaluasiPage: React.FC<EvaluasiPageProps> = ({
  evaluationData,
  userProfile,
  onUpdateEvaluation,
  onSelectView,
  onSelectDoc,
}) => {
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(evaluationData.period || 'November 2026');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [exportToast, setExportToast] = useState(false);

  // Modals for interactive editing (persisted to Firestore + Backend)
  const [editingProject, setEditingProject] = useState<EvaluationProject | null>(null);
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [editingLearning, setEditingLearning] = useState<EvaluationLearning | null>(null);

  // Add Issue Form state
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueProject, setNewIssueProject] = useState(evaluationData.projects[0]?.name || 'Website portofolio');
  const [newIssuePriority, setNewIssuePriority] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [newIssueAction, setNewIssueAction] = useState('');
  const [newIssueOwner, setNewIssueOwner] = useState(userProfile.name || 'Rafi');
  const [newIssueTarget, setNewIssueTarget] = useState('Target 18 Nov 2026');

  const periods = ['November 2026', 'Oktober 2026', 'Q4 2026'];

  // Filter projects and issues according to dropdown
  const filteredProjects = useMemo(() => {
    if (selectedProjectFilter === 'all') return evaluationData.projects;
    return evaluationData.projects.filter((p) => p.name === selectedProjectFilter);
  }, [evaluationData.projects, selectedProjectFilter]);

  const filteredIssues = useMemo(() => {
    if (selectedProjectFilter === 'all') return evaluationData.issues;
    return evaluationData.issues.filter((i) => i.projectName === selectedProjectFilter);
  }, [evaluationData.issues, selectedProjectFilter]);

  // Compute KPI totals dynamically
  const stats = useMemo(() => {
    const totalProj = filteredProjects.length;
    const completedProj = filteredProjects.filter((p) => p.status === 'completed').length;
    const inProgressProj = filteredProjects.filter((p) => p.status === 'in_progress').length;
    const notStartedProj = filteredProjects.filter((p) => p.status === 'not_started').length;

    const totalTasks = filteredProjects.reduce((acc, p) => acc + p.totalTasks, 0);
    const completedTasks = filteredProjects.reduce((acc, p) => acc + p.completedTasks, 0);
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalBudget = filteredProjects.reduce((acc, p) => acc + p.budget, 0);
    const totalRealization = filteredProjects.reduce((acc, p) => acc + p.realization, 0);
    const remainingBudget = Math.max(0, totalBudget - totalRealization);
    const budgetPercent = totalBudget > 0 ? ((totalRealization / totalBudget) * 100).toFixed(1).replace('.', ',') : '0';

    const openIssues = filteredIssues.filter((i) => i.status === 'Terbuka');
    const highIssues = openIssues.filter((i) => i.priority === 'Tinggi').length;
    const medIssues = openIssues.filter((i) => i.priority === 'Sedang').length;

    return {
      totalProj,
      completedProj,
      inProgressProj,
      notStartedProj,
      totalTasks,
      completedTasks,
      overallProgress,
      totalBudget,
      totalRealization,
      remainingBudget,
      budgetPercent,
      openIssuesCount: openIssues.length,
      highIssues,
      medIssues,
    };
  }, [filteredProjects, filteredIssues]);

  // Compute Chart Rows (top 3 individual projects + aggregated "3 proyek lainnya" when all are shown)
  const chartRows = useMemo(() => {
    const maxScale = 8000000; // 8 jt scale per Figma design (5/8 = 62.5%, 8/8 = 100%, 4/8 = 50%, 7/8 = 87.5%)
    if (selectedProjectFilter !== 'all') {
      return filteredProjects.map((p) => ({
        label: p.name,
        budget: p.budget,
        realization: p.realization,
        budgetPct: Math.min(100, (p.budget / Math.max(maxScale, p.budget)) * 100),
        realizationPct: Math.min(100, (p.realization / Math.max(maxScale, p.budget)) * 100),
        ratioText: `${formatMillionsNumber(p.realization)} / ${formatMillionsNumber(p.budget)}`,
      }));
    }

    const firstThree = evaluationData.projects.slice(0, 3);
    const rest = evaluationData.projects.slice(3);
    const rows = firstThree.map((p) => ({
      label: p.name,
      budget: p.budget,
      realization: p.realization,
      budgetPct: Math.min(100, (p.budget / maxScale) * 100),
      realizationPct: Math.min(100, (p.realization / maxScale) * 100),
      ratioText: `${formatMillionsNumber(p.realization)} / ${formatMillionsNumber(p.budget)}`,
    }));

    if (rest.length > 0) {
      const restBudget = rest.reduce((acc, p) => acc + p.budget, 0);
      const restReal = rest.reduce((acc, p) => acc + p.realization, 0);
      rows.push({
        label: `${rest.length} proyek lainnya`,
        budget: restBudget,
        realization: restReal,
        budgetPct: Math.min(100, (restBudget / maxScale) * 100),
        realizationPct: Math.min(100, (restReal / maxScale) * 100),
        ratioText: `${(restReal / 1000000).toFixed(1)} / ${formatMillionsNumber(restBudget)}`,
      });
    }

    return rows;
  }, [evaluationData.projects, filteredProjects, selectedProjectFilter]);

  // Actions
  const handleExportReport = () => {
    const lines = [
      `# Laporan Evaluasi Workspace (${selectedPeriod})`,
      `Diperbarui: ${evaluationData.updatedLabel}`,
      `Filter Proyek: ${selectedProjectFilter === 'all' ? 'Semua proyek' : selectedProjectFilter}`,
      '',
      '## Ringkasan Evaluasi',
      `- Proyek Selesai: ${String(stats.completedProj).padStart(2, '0')} / ${String(stats.totalProj).padStart(2, '0')}`,
      `- Progres Keseluruhan: ${stats.overallProgress}% (${stats.completedTasks} dari ${stats.totalTasks} tugas selesai)`,
      `- Realisasi Anggaran: ${formatRupiah(stats.totalRealization)} (${stats.budgetPercent}% dari ${formatRupiah(stats.totalBudget)})`,
      `- Sisa Anggaran: ${formatRupiah(stats.remainingBudget)}`,
      `- Masalah Terbuka: ${stats.openIssuesCount}`,
      '',
      '## Evaluasi Per Proyek',
      '| Proyek | Status | Progres | Anggaran | Realisasi | Hasil / Evaluasi |',
      '| --- | --- | --- | --- | --- | --- |',
      ...filteredProjects.map((p) => {
        const pct = p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;
        const st = p.status === 'completed' ? 'Selesai' : p.status === 'in_progress' ? 'Dikerjakan' : 'Belum mulai';
        return `| ${p.name} | ${st} | ${pct}% (${p.completedTasks}/${p.totalTasks}) | ${formatRupiah(p.budget)} | ${formatRupiah(p.realization)} | ${p.evaluationNote} |`;
      }),
      '',
      '## Masalah & Tindak Lanjut',
      ...filteredIssues.map((i) => `- [${i.status}] (${i.priority}) ${i.title} — ${i.projectName} | ${i.actionPlan} (${i.owner}, ${i.targetDate})`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-evaluasi-${selectedPeriod.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);

    setExportToast(true);
    setTimeout(() => setExportToast(false), 2500);
  };

  const handleCycleProjectStatus = (project: EvaluationProject) => {
    const nextStatus: EvaluationProject['status'] =
      project.status === 'not_started'
        ? 'in_progress'
        : project.status === 'in_progress'
        ? 'completed'
        : 'not_started';

    const updatedProjects = evaluationData.projects.map((p) =>
      p.id === project.id
        ? {
            ...p,
            status: nextStatus,
            completedTasks: nextStatus === 'completed' ? p.totalTasks : nextStatus === 'not_started' ? 0 : p.completedTasks || Math.ceil(p.totalTasks / 2),
          }
        : p
    );

    onUpdateEvaluation(
      {
        ...evaluationData,
        projects: updatedProjects,
      },
      `Mengubah status proyek evaluasi: ${project.name}`
    );
  };

  const handleSaveEditedProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    const updatedProjects = evaluationData.projects.map((p) =>
      p.id === editingProject.id ? editingProject : p
    );

    onUpdateEvaluation(
      {
        ...evaluationData,
        projects: updatedProjects,
      },
      `Memperbarui evaluasi proyek: ${editingProject.name}`
    );
    setEditingProject(null);
  };

  const handleToggleIssueStatus = (issue: EvaluationIssue) => {
    const nextStatus: EvaluationIssue['status'] =
      issue.status === 'Terbuka' ? 'Selesai' : 'Terbuka';
    const updatedIssues = evaluationData.issues.map((i) =>
      i.id === issue.id ? { ...i, status: nextStatus } : i
    );
    onUpdateEvaluation(
      {
        ...evaluationData,
        issues: updatedIssues,
      },
      `Menandai masalah "${issue.title}" sebagai ${nextStatus}`
    );
  };

  const handleAddIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueTitle.trim()) return;

    const nextCode = String(evaluationData.issues.length + 1).padStart(2, '0');
    const created: EvaluationIssue = {
      id: `issue-${Date.now()}`,
      code: nextCode,
      title: newIssueTitle.trim(),
      projectName: newIssueProject,
      priority: newIssuePriority,
      actionPlan: newIssueAction.trim() || 'Tinjau rencana penanganan bersama tim.',
      owner: newIssueOwner.trim() || userProfile.name,
      targetDate: newIssueTarget.trim() || 'Target 18 Nov 2026',
      status: 'Terbuka',
    };

    onUpdateEvaluation(
      {
        ...evaluationData,
        issues: [...evaluationData.issues, created],
      },
      `Menambahkan masalah evaluasi baru: ${created.title}`
    );

    setNewIssueTitle('');
    setNewIssueAction('');
    setShowAddIssueModal(false);
  };

  const handleSaveEditedLearning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLearning) return;

    const updatedLearnings = evaluationData.learnings.map((l) =>
      l.id === editingLearning.id ? editingLearning : l
    );

    onUpdateEvaluation(
      {
        ...evaluationData,
        learnings: updatedLearnings,
      },
      `Memperbarui catatan retrospektif: ${editingLearning.title}`
    );
    setEditingLearning(null);
  };

  return (
    <div className="flex-1 overflow-y-auto h-full bg-white dark:bg-[#121211] select-text">
      <div className="max-w-[1216px] mx-auto px-5 sm:px-8 lg:px-12 py-8 lg:py-9 flex flex-col gap-7">
        
        {/* ========================================================= */}
        {/* 1. Judul dan filter */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-4">
          {/* Periode evaluasi bar */}
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#777973] dark:text-[#9E9F99]">
            <span className="font-medium uppercase tracking-normal">
              REFLEKSI KERJA BERSAMA
            </span>
            <span>{evaluationData.updatedLabel || 'Diperbarui 13 November 2026'}</span>
          </div>

          {/* Judul dan aksi */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex flex-col gap-2">
              <h1 className="text-[28px] sm:text-[32px] font-normal leading-[145%] text-[#282925] dark:text-[#EDEDE8] tracking-tight">
                Evaluasi hasil, langkah lebih baik.
              </h1>
              <p className="text-[13px] font-normal leading-[145%] text-[#777973] dark:text-[#9E9F99]">
                Lihat capaian proyek, kelola anggaran, dan temukan ruang untuk bertumbuh.
              </p>
            </div>

            <button
              onClick={handleExportReport}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-[9px] rounded-[5px] bg-[#282925] hover:bg-[#3A3B36] dark:bg-[#EDEDE8] dark:hover:bg-white text-white dark:text-[#282925] text-xs font-medium transition-colors shrink-0 cursor-pointer self-start sm:self-center"
            >
              {exportToast ? (
                <>
                  <Check size={13} />
                  <span>Laporan diunduh</span>
                </>
              ) : (
                <>
                  <span>Ekspor laporan</span>
                </>
              )}
            </button>
          </div>

          {/* Filter evaluasi row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Project Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProjectDropdown(!showProjectDropdown);
                    setShowPeriodDropdown(false);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-[9px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[5px] text-xs font-medium text-[#282925] dark:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors cursor-pointer"
                >
                  <span>{selectedProjectFilter === 'all' ? 'Semua proyek' : selectedProjectFilter}</span>
                  <ChevronDown size={13} className="text-[#777973]" />
                </button>

                {showProjectDropdown && (
                  <div className="absolute left-0 mt-1.5 w-56 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-md shadow-lg py-1 z-30">
                    <button
                      onClick={() => {
                        setSelectedProjectFilter('all');
                        setShowProjectDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F8F8F6] dark:hover:bg-[#252522] flex items-center justify-between ${
                        selectedProjectFilter === 'all' ? 'font-semibold text-[#282925] dark:text-white' : 'text-[#777973]'
                      }`}
                    >
                      <span>Semua proyek</span>
                      {selectedProjectFilter === 'all' && <Check size={12} />}
                    </button>
                    {evaluationData.projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProjectFilter(p.name);
                          setShowProjectDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F8F8F6] dark:hover:bg-[#252522] flex items-center justify-between ${
                          selectedProjectFilter === p.name ? 'font-semibold text-[#282925] dark:text-white' : 'text-[#777973]'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        {selectedProjectFilter === p.name && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Period Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowPeriodDropdown(!showPeriodDropdown);
                    setShowProjectDropdown(false);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-[9px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[5px] text-xs font-medium text-[#282925] dark:text-[#EDEDE8] hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors cursor-pointer"
                >
                  <span>{selectedPeriod}</span>
                  <ChevronDown size={13} className="text-[#777973]" />
                </button>

                {showPeriodDropdown && (
                  <div className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-md shadow-lg py-1 z-30">
                    {periods.map((period) => (
                      <button
                        key={period}
                        onClick={() => {
                          setSelectedPeriod(period);
                          setShowPeriodDropdown(false);
                          onUpdateEvaluation({
                            ...evaluationData,
                            period,
                          }, `Mengubah periode evaluasi ke ${period}`);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F8F8F6] dark:hover:bg-[#252522] flex items-center justify-between ${
                          selectedPeriod === period ? 'font-semibold text-[#282925] dark:text-white' : 'text-[#777973]'
                        }`}
                      >
                        <span>{period}</span>
                        {selectedPeriod === period && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
              Anggaran &amp; temuan evaluasi: data contoh
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. Ringkasan evaluasi (4 KPI columns) */}
        {/* ========================================================= */}
        <div className="border-y border-[#EAEAE5] dark:border-[#2B2B28] py-[22px] grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* KPI 1 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-[#777973] dark:text-[#9E9F99]">
              Proyek selesai
            </span>
            <span className="text-[28px] font-normal leading-[145%] text-[#282925] dark:text-[#EDEDE8]">
              {String(stats.completedProj).padStart(2, '0')} / {String(stats.totalProj).padStart(2, '0')}
            </span>
            <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
              {stats.inProgressProj} dikerjakan · {stats.notStartedProj} belum mulai
            </span>
          </div>

          {/* KPI 2 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-[#777973] dark:text-[#9E9F99]">
              Progres keseluruhan
            </span>
            <span className="text-[28px] font-normal leading-[145%] text-[#282925] dark:text-[#EDEDE8]">
              {stats.overallProgress}%
            </span>
            <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
              {stats.completedTasks} dari {stats.totalTasks} tugas selesai
            </span>
          </div>

          {/* KPI 3 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-[#777973] dark:text-[#9E9F99]">
              Realisasi anggaran
            </span>
            <span className="text-[28px] font-normal leading-[145%] text-[#282925] dark:text-[#EDEDE8]">
              {formatJutaShort(stats.totalRealization)}
            </span>
            <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
              {stats.budgetPercent}% dari {formatJutaShort(stats.totalBudget)}
            </span>
          </div>

          {/* KPI 4 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-[#777973] dark:text-[#9E9F99]">
              Masalah terbuka
            </span>
            <span className="text-[28px] font-normal leading-[145%] text-[#282925] dark:text-[#EDEDE8]">
              {String(stats.openIssuesCount).padStart(2, '0')}
            </span>
            <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
              {stats.highIssues} prioritas tinggi · {stats.medIssues} sedang
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. Anggaran dan temuan */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Perbandingan anggaran (Figma ~680px / 7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[17px] font-semibold leading-[145%] text-[#282925] dark:text-[#EDEDE8]">
                Anggaran &amp; realisasi
              </h2>
              <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
                Dalam juta rupiah
              </span>
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-[18px] text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-[#777973] dark:text-[#9E9F99]">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#D9DDD5] dark:bg-[#494E44] inline-block" />
                <span>Anggaran</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#567561] dark:text-[#7DA88C]">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#567561] inline-block" />
                <span>Realisasi</span>
              </span>
            </div>

            {/* Batang perbandingan rows */}
            <div className="flex flex-col gap-4">
              {chartRows.map((row) => (
                <div key={row.label} className="flex items-center gap-4">
                  <div className="w-32 sm:w-[170px] text-xs text-[#282925] dark:text-[#EDEDE8] truncate shrink-0">
                    {row.label}
                  </div>

                  <div className="flex-1 flex flex-col gap-1 max-w-[350px]">
                    {/* Anggaran track */}
                    <div className="w-full h-[6px] bg-[#EAEAE5] dark:bg-[#2B2B28] rounded-[3px] overflow-hidden">
                      <div
                        className="h-full bg-[#D9DDD5] dark:bg-[#5E6458] rounded-[3px] transition-all duration-300"
                        style={{ width: `${row.budgetPct}%` }}
                      />
                    </div>
                    {/* Realisasi track */}
                    <div className="w-full h-[6px] bg-[#EAEAE5] dark:bg-[#2B2B28] rounded-[3px] overflow-hidden">
                      <div
                        className="h-full bg-[#567561] rounded-[3px] transition-all duration-300"
                        style={{ width: `${row.realizationPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="w-14 text-right text-[11px] text-[#777973] dark:text-[#9E9F99] shrink-0">
                    {row.ratioText}
                  </div>
                </div>
              ))}
            </div>

            {/* Total anggaran sisa */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[#777973] dark:text-[#9E9F99]">
                Sisa anggaran
              </span>
              <span className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8]">
                {formatRupiah(stats.remainingBudget)}
              </span>
            </div>
          </div>

          {/* Right: Catatan evaluasi (Figma ~416px / 5 cols) */}
          <div className="lg:col-span-5 bg-[#F8F8F6] dark:bg-[#181816] rounded-[6px] p-5 flex flex-col gap-3.5">
            <h3 className="text-base font-semibold leading-[145%] text-[#282925] dark:text-[#EDEDE8]">
              Yang perlu diperhatikan
            </h3>

            <div className="text-sm font-medium leading-[145%] text-[#567561] dark:text-[#7DA88C]">
              {evaluationData.attentionHighlight}
            </div>

            <p className="text-xs leading-[145%] text-[#777973] dark:text-[#9E9F99]">
              {stats.overallProgress}% tugas selesai dengan {stats.budgetPercent}% anggaran terpakai. Tinjau kebutuhan biaya untuk pekerjaan yang tersisa.
            </p>

            <div className="border-t border-[#EAEAE5] dark:border-[#2B2B28] pt-3 flex flex-col gap-2">
              <span className="text-[11px] font-medium text-[#777973] dark:text-[#9E9F99]">
                Fokus minggu ini
              </span>
              <p className="text-xs leading-[145%] text-[#282925] dark:text-[#EDEDE8]">
                {evaluationData.weeklyFocus}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. Evaluasi per proyek */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold leading-[145%] text-[#282925] dark:text-[#EDEDE8]">
              Evaluasi per proyek
            </h2>
            <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
              {filteredProjects.length} proyek &nbsp;·&nbsp; Status mengikuti progres workspace
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              {/* Kepala tabel */}
              <div className="grid grid-cols-12 items-center bg-[#F8F8F6] dark:bg-[#181816] h-[45px] px-3 text-[11px] text-[#777973] dark:text-[#9E9F99]">
                <div className="col-span-3">Proyek</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Progres</div>
                <div className="col-span-2">Anggaran</div>
                <div className="col-span-2">Realisasi</div>
                <div className="col-span-2">Hasil / evaluasi</div>
              </div>

              {/* Tabel rows */}
              <div className="divide-y divide-[#EAEAE5]/60 dark:divide-[#2B2B28]/60">
                {filteredProjects.map((project) => {
                  const pct = project.totalTasks > 0
                    ? Math.round((project.completedTasks / project.totalTasks) * 100)
                    : 0;

                  const statusLabel =
                    project.status === 'completed'
                      ? 'Selesai'
                      : project.status === 'in_progress'
                      ? 'Dikerjakan'
                      : 'Belum mulai';

                  const statusStyle =
                    project.status === 'completed'
                      ? 'bg-[#ECF2ED] dark:bg-[#1D2B22] text-[#567561] dark:text-[#7DA88C]'
                      : project.status === 'in_progress'
                      ? 'bg-[#EBF0F5] dark:bg-[#1B252E] text-[#5D748B] dark:text-[#88A6C4]'
                      : 'bg-[#F1F1ED] dark:bg-[#232320] text-[#777973] dark:text-[#A1A29B]';

                  return (
                    <div
                      key={project.id}
                      className="grid grid-cols-12 items-center min-h-[68px] py-3 px-3 bg-white dark:bg-[#121211] hover:bg-[#FAFAF8] dark:hover:bg-[#181816] transition-colors group"
                    >
                      {/* Proyek */}
                      <div className="col-span-3 pr-2 flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (project.name.toLowerCase().includes('website') && onSelectView) {
                              onSelectView('project_web');
                            } else if (project.name.toLowerCase().includes('habit') && onSelectView) {
                              onSelectView('project_mobile');
                            } else if (project.name.toLowerCase().includes('kopi sore') && onSelectView) {
                              onSelectView('project_design');
                            } else if (project.linkedDocId && onSelectDoc) {
                              onSelectDoc(project.linkedDocId);
                            } else {
                              setEditingProject({ ...project });
                            }
                          }}
                          className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] hover:underline text-left cursor-pointer"
                        >
                          {project.name}
                        </button>
                      </div>

                      {/* Status (clickable to cycle & sync) */}
                      <div className="col-span-2">
                        <button
                          onClick={() => handleCycleProjectStatus(project)}
                          title="Klik untuk mengubah status"
                          className={`inline-flex items-center px-2 py-[3px] rounded-[4px] text-[11px] font-medium cursor-pointer transition-opacity hover:opacity-80 ${statusStyle}`}
                        >
                          {statusLabel}
                        </button>
                      </div>

                      {/* Progres */}
                      <div className="col-span-1 flex flex-col">
                        <span className="text-[11px] text-[#282925] dark:text-[#EDEDE8]">
                          {pct}%
                        </span>
                        <span className="text-[10px] text-[#777973] dark:text-[#9E9F99]">
                          {project.completedTasks}/{project.totalTasks} tugas
                        </span>
                      </div>

                      {/* Anggaran */}
                      <div className="col-span-2 text-[11px] text-[#282925] dark:text-[#EDEDE8]">
                        {formatRupiah(project.budget)}
                      </div>

                      {/* Realisasi */}
                      <div className="col-span-2 text-[11px] text-[#282925] dark:text-[#EDEDE8]">
                        {formatRupiah(project.realization)}
                      </div>

                      {/* Hasil / evaluasi */}
                      <div className="col-span-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#282925] dark:text-[#EDEDE8] truncate">
                          {project.evaluationNote}
                        </span>
                        <button
                          onClick={() => setEditingProject({ ...project })}
                          title="Edit proyek evaluasi"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#777973] hover:text-[#282925] dark:hover:text-white transition-opacity cursor-pointer shrink-0"
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Jumlah anggaran footer row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
              Total &nbsp;·&nbsp; {filteredProjects.length} proyek
            </span>
            <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">
              Anggaran {formatRupiah(stats.totalBudget)} &nbsp;&nbsp;/&nbsp;&nbsp; Realisasi {formatRupiah(stats.totalRealization)} &nbsp;&nbsp;/&nbsp;&nbsp; Sisa {formatRupiah(stats.remainingBudget)}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. Masalah & tindak lanjut */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold leading-[145%] text-[#282925] dark:text-[#EDEDE8]">
              Masalah &amp; tindak lanjut
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
                {stats.openIssuesCount} terbuka &nbsp;·&nbsp; Rencana penanganan
              </span>
              <button
                onClick={() => setShowAddIssueModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#282925] dark:text-[#EDEDE8] hover:underline cursor-pointer"
              >
                <Plus size={12} />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Daftar masalah */}
          <div className="divide-y divide-[#EAEAE5]/70 dark:divide-[#2B2B28]/70">
            {filteredIssues.map((issue, idx) => {
              const priorityBadge =
                issue.priority === 'Tinggi'
                  ? 'bg-[#F7EDE8] dark:bg-[#2F1E18] text-[#9A5945] dark:text-[#D98C76]'
                  : issue.priority === 'Sedang'
                  ? 'bg-[#F8F1E5] dark:bg-[#2E2517] text-[#936B32] dark:text-[#D5A761]'
                  : 'bg-[#F1F1ED] dark:bg-[#252522] text-[#777973]';

              return (
                <div
                  key={issue.id}
                  className="py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-5"
                >
                  {/* Number code */}
                  <div className="text-xs text-[#777973] dark:text-[#9E9F99] w-6 shrink-0">
                    {issue.code || String(idx + 1).padStart(2, '0')}
                  </div>

                  {/* Masalah title + project */}
                  <div className="md:w-[285px] flex flex-col gap-1 shrink-0">
                    <span className={`text-[13px] font-medium leading-[145%] ${issue.status === 'Selesai' ? 'line-through text-[#777973]' : 'text-[#282925] dark:text-[#EDEDE8]'}`}>
                      {issue.title}
                    </span>
                    <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
                      {issue.projectName}
                    </span>
                  </div>

                  {/* Priority pill */}
                  <div className="w-20 shrink-0">
                    <span className={`inline-flex items-center px-2 py-[3px] rounded-[4px] text-[11px] font-medium ${priorityBadge}`}>
                      {issue.priority}
                    </span>
                  </div>

                  {/* Langkah penanganan */}
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span className="text-xs text-[#282925] dark:text-[#EDEDE8] leading-[145%]">
                      {issue.actionPlan}
                    </span>
                    <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
                      {issue.owner} &nbsp;·&nbsp; {issue.targetDate}
                    </span>
                  </div>

                  {/* Status button (toggleable & persisted) */}
                  <div className="shrink-0">
                    <button
                      onClick={() => handleToggleIssueStatus(issue)}
                      title="Klik untuk menandai Terbuka / Selesai"
                      className={`text-[11px] cursor-pointer hover:underline ${
                        issue.status === 'Selesai'
                          ? 'text-[#567561] font-medium'
                          : 'text-[#777973] dark:text-[#9E9F99]'
                      }`}
                    >
                      {issue.status}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 6. Pembelajaran tim */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-4 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold leading-[145%] text-[#282925] dark:text-[#EDEDE8]">
              Bawa pembelajaran ke langkah berikutnya.
            </h2>
            <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
              Catatan retrospektif
            </span>
          </div>

          {/* 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {evaluationData.learnings.map((item) => (
              <div
                key={item.id}
                onClick={() => setEditingLearning({ ...item })}
                className="bg-[#F8F8F6] dark:bg-[#181816] rounded-[6px] p-[18px] flex flex-col gap-[9px] cursor-pointer hover:bg-[#F2F3EE] dark:hover:bg-[#1E1F1B] transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[#777973] dark:text-[#9E9F99] uppercase">
                    {item.tag}
                  </span>
                  <Edit3 size={11} className="text-[#777973] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-sm font-medium leading-[145%] text-[#282925] dark:text-[#EDEDE8]">
                  {item.title}
                </h3>
                <p className="text-xs leading-[145%] text-[#777973] dark:text-[#9E9F99]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Keterangan laporan footer */}
          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] text-[#777973] dark:text-[#9E9F99]">
              Ruang kecil, perbaikan yang berarti.
            </span>
            <span className="text-[10px] text-[#777973] dark:text-[#9E9F99]">
              Anggaran, masalah, dan pembelajaran adalah contoh untuk ditinjau tim.
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* Modal Edit Proyek Evaluasi */}
      {/* ========================================================= */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditedProject}
            className="bg-white dark:bg-[#181816] w-full max-w-md rounded-xl p-6 shadow-2xl border border-[#EAEAE5] dark:border-[#2B2B28] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
                Perbarui Evaluasi Proyek
              </h3>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1 text-[#777973] hover:text-[#282925]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Nama Proyek</label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Anggaran (Rp)</label>
                  <input
                    type="number"
                    value={editingProject.budget}
                    onChange={(e) => setEditingProject({ ...editingProject, budget: Number(e.target.value) || 0 })}
                    className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Realisasi (Rp)</label>
                  <input
                    type="number"
                    value={editingProject.realization}
                    onChange={(e) => setEditingProject({ ...editingProject, realization: Number(e.target.value) || 0 })}
                    className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Tugas Selesai</label>
                  <input
                    type="number"
                    min={0}
                    max={editingProject.totalTasks}
                    value={editingProject.completedTasks}
                    onChange={(e) => setEditingProject({ ...editingProject, completedTasks: Number(e.target.value) || 0 })}
                    className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Total Tugas</label>
                  <input
                    type="number"
                    min={1}
                    value={editingProject.totalTasks}
                    onChange={(e) => setEditingProject({ ...editingProject, totalTasks: Math.max(1, Number(e.target.value) || 1) })}
                    className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Hasil / Catatan Evaluasi</label>
                <input
                  type="text"
                  value={editingProject.evaluationNote}
                  onChange={(e) => setEditingProject({ ...editingProject, evaluationNote: e.target.value })}
                  className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="px-3.5 py-2 rounded border border-[#EAEAE5] text-xs text-[#777973]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#282925] text-white text-xs font-medium hover:bg-[#3A3B36]"
              >
                Simpan ke Database
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* Modal Tambah Masalah & Tindak Lanjut */}
      {/* ========================================================= */}
      {showAddIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddIssue}
            className="bg-white dark:bg-[#181816] w-full max-w-md rounded-xl p-6 shadow-2xl border border-[#EAEAE5] dark:border-[#2B2B28] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
                Tambah Masalah &amp; Tindak Lanjut
              </h3>
              <button
                type="button"
                onClick={() => setShowAddIssueModal(false)}
                className="p-1 text-[#777973] hover:text-[#282925]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Judul Masalah</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Waktu muat gambar masih lambat"
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Proyek Terkait</label>
                  <select
                    value={newIssueProject}
                    onChange={(e) => setNewIssueProject(e.target.value)}
                    className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                  >
                    {evaluationData.projects.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Prioritas</label>
                  <select
                    value={newIssuePriority}
                    onChange={(e) => setNewIssuePriority(e.target.value as 'Tinggi' | 'Sedang' | 'Rendah')}
                    className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                  >
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Langkah Penanganan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kompres aset dan aktifkan lazy loading."
                  value={newIssueAction}
                  onChange={(e) => setNewIssueAction(e.target.value)}
                  className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Penanggung Jawab</label>
                  <input
                    type="text"
                    value={newIssueOwner}
                    onChange={(e) => setNewIssueOwner(e.target.value)}
                    className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Target</label>
                  <input
                    type="text"
                    value={newIssueTarget}
                    onChange={(e) => setNewIssueTarget(e.target.value)}
                    className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddIssueModal(false)}
                className="px-3.5 py-2 rounded border border-[#EAEAE5] text-xs text-[#777973]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#282925] text-white text-xs font-medium hover:bg-[#3A3B36]"
              >
                Simpan Masalah
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* Modal Edit Catatan Retrospektif */}
      {/* ========================================================= */}
      {editingLearning && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditedLearning}
            className="bg-white dark:bg-[#181816] w-full max-w-md rounded-xl p-6 shadow-2xl border border-[#EAEAE5] dark:border-[#2B2B28] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
                Ubah Catatan Retrospektif
              </h3>
              <button
                type="button"
                onClick={() => setEditingLearning(null)}
                className="p-1 text-[#777973] hover:text-[#282925]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-medium text-[#777973] uppercase">{editingLearning.tag}</span>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Judul</label>
                <input
                  type="text"
                  value={editingLearning.title}
                  onChange={(e) => setEditingLearning({ ...editingLearning, title: e.target.value })}
                  className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8]">Deskripsi</label>
                <textarea
                  rows={3}
                  value={editingLearning.description}
                  onChange={(e) => setEditingLearning({ ...editingLearning, description: e.target.value })}
                  className="px-3 py-2 rounded border border-[#EAEAE5] dark:border-[#333] bg-white dark:bg-[#1E1E1C] text-xs text-[#282925] dark:text-[#EDEDE8]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingLearning(null)}
                className="px-3.5 py-2 rounded border border-[#EAEAE5] text-xs text-[#777973]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#282925] text-white text-xs font-medium hover:bg-[#3A3B36]"
              >
                Simpan Catatan
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
