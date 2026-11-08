import React, { useState } from 'react';
import { 
  Table as TableIcon, 
  Kanban, 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  Tag as TagIcon
} from 'lucide-react';
import { DocItem, DocStatus, DocPriority, ActiveView, Language } from '../types';
import { translations } from '../utils/i18n';

interface DatabaseViewProps {
  docs: DocItem[];
  currentMode: 'table' | 'board' | 'calendar';
  lang: Language;
  onSelectDoc: (id: string) => void;
  onUpdateDoc: (id: string, updated: Partial<DocItem>) => void;
  onCreateDoc: (date?: string) => void;
  onDeleteDoc: (id: string) => void;
}

const STATUS_COLUMNS: { key: DocStatus; labelId: string; color: string }[] = [
  { key: 'not_started', labelId: 'notStarted', color: 'bg-slate-500' },
  { key: 'in_progress', labelId: 'inProgress', color: 'bg-indigo-500' },
  { key: 'completed', labelId: 'completed', color: 'bg-emerald-500' },
  { key: 'archived', labelId: 'archived', color: 'bg-amber-500' },
];

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  docs,
  currentMode,
  lang,
  onSelectDoc,
  onUpdateDoc,
  onCreateDoc,
  onDeleteDoc,
}) => {
  const t = translations[lang];
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Calendar month state
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  // Filtered docs
  const filteredDocs = docs.filter((doc) => {
    if (searchFilter && !doc.title.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && doc.status !== statusFilter) {
      return false;
    }
    if (priorityFilter !== 'all' && doc.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  // Calendar helpers
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const prevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };
  const setToday = () => {
    setCalendarDate(new Date());
  };

  const monthNamesId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthName = lang === 'id' ? monthNamesId[month] : monthNamesEn[month];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const dayHeaders = lang === 'id' 
    ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] 
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map docs by deadline YYYY-MM-DD
  const docsByDeadline: Record<string, DocItem[]> = {};
  docs.forEach((doc) => {
    if (doc.deadline) {
      const key = doc.deadline.slice(0, 10);
      if (!docsByDeadline[key]) docsByDeadline[key] = [];
      docsByDeadline[key].push(doc);
    }
  });

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col select-none">
      {/* Top Filter and Search Strip */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-48 sm:w-60 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">{t.status}: Semua</option>
            <option value="not_started">{t.notStarted}</option>
            <option value="in_progress">{t.inProgress}</option>
            <option value="completed">{t.completed}</option>
            <option value="archived">{t.archived}</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">{t.priority}: Semua</option>
            <option value="high">{t.high}</option>
            <option value="medium">{t.medium}</option>
            <option value="low">{t.low}</option>
          </select>
        </div>

        {/* Create new document record */}
        <button
          onClick={() => onCreateDoc()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus size={14} />
          <span>{t.newDoc}</span>
        </button>
      </div>

      {/* Viewport Content */}
      <div className="flex-1 p-6 overflow-x-auto">
        {/* TABLE VIEW */}
        {currentMode === 'table' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 min-w-[220px]">Catatan / Judul</th>
                    <th className="py-3 px-3 min-w-[130px]">{t.status}</th>
                    <th className="py-3 px-3 min-w-[110px]">{t.priority}</th>
                    <th className="py-3 px-3 min-w-[140px]">{t.tags}</th>
                    <th className="py-3 px-3 min-w-[130px]">{t.deadline}</th>
                    <th className="py-3 px-3 min-w-[120px]">{t.reminder}</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectDoc(doc.id)}
                    >
                      {/* Title */}
                      <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="text-base shrink-0">{doc.icon || '📄'}</span>
                          <span className="truncate max-w-[200px]">{doc.title || t.emptyTitle}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={doc.status}
                          onChange={(e) => onUpdateDoc(doc.id, { status: e.target.value as DocStatus, updatedAt: Date.now() })}
                          className={`text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${
                            doc.status === 'completed'
                              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                              : doc.status === 'in_progress'
                              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <option value="not_started">{t.notStarted}</option>
                          <option value="in_progress">{t.inProgress}</option>
                          <option value="completed">{t.completed}</option>
                          <option value="archived">{t.archived}</option>
                        </select>
                      </td>

                      {/* Priority */}
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={doc.priority}
                          onChange={(e) => onUpdateDoc(doc.id, { priority: e.target.value as DocPriority, updatedAt: Date.now() })}
                          className="text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          <option value="low">{t.low}</option>
                          <option value="medium">{t.medium}</option>
                          <option value="high">{t.high}</option>
                        </select>
                      </td>

                      {/* Tags */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {doc.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                              {tag}
                            </span>
                          ))}
                          {doc.tags.length > 2 && (
                            <span className="text-[10px] text-slate-400">+{doc.tags.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Deadline */}
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-400" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="date"
                          value={doc.deadline || ''}
                          onChange={(e) => onUpdateDoc(doc.id, { deadline: e.target.value || undefined, updatedAt: Date.now() })}
                          className="bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-slate-200"
                        />
                      </td>

                      {/* Reminder */}
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {doc.reminderTime ? (
                          <span className="flex items-center gap-1 text-amber-500">
                            <Clock size={11} />
                            {new Date(doc.reminderTime).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onDeleteDoc(doc.id)}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-1 rounded text-xs"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KANBAN BOARD VIEW */}
        {currentMode === 'board' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start min-w-[800px]">
            {STATUS_COLUMNS.map((col) => {
              const columnDocs = filteredDocs.filter((d) => d.status === col.key);
              return (
                <div
                  key={col.key}
                  className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 flex flex-col min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.color}`} />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {translations[lang][col.labelId as keyof typeof translations['id']]}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {columnDocs.length}
                    </span>
                  </div>

                  {/* Cards in Column */}
                  <div className="space-y-2 flex-1">
                    {columnDocs.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onSelectDoc(item.id)}
                        className="p-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-lg shadow-xs hover:shadow-md transition-shadow cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base">{item.icon || '📄'}</span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {item.title || t.emptyTitle}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              item.priority === 'high'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                                : item.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>

                        {/* Tags */}
                        {item.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap my-1.5">
                            {item.tags.map((tg) => (
                              <span key={tg} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {tg}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Card footer: Deadline and Move status action */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
                          {item.deadline ? (
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar size={11} />
                              {item.deadline}
                            </span>
                          ) : (
                            <span />
                          )}

                          {/* Quick change status dropdown */}
                          <select
                            value={item.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onUpdateDoc(item.id, { status: e.target.value as DocStatus, updatedAt: Date.now() })}
                            className="bg-transparent border-0 text-[10px] font-medium text-slate-500 hover:text-indigo-600 focus:outline-none cursor-pointer"
                          >
                            <option value="not_started">➔ Belum</option>
                            <option value="in_progress">➔ Jalan</option>
                            <option value="completed">➔ Selesai</option>
                            <option value="archived">➔ Arsip</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add card into this column */}
                  <button
                    onClick={() => {
                      onCreateDoc();
                    }}
                    className="mt-2 w-full py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 hover:text-indigo-600 hover:border-indigo-400 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus size={13} />
                    <span>Tambah</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* CALENDAR VIEW */}
        {currentMode === 'calendar' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            {/* Calendar Month Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {monthName} {year}
                </h3>
                <button
                  onClick={setToday}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  {t.today}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  title={t.prevMonth}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  title={t.nextMonth}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Day Header row */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 pb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              {dayHeaders.map((dh) => (
                <div key={dh} className="py-1">
                  {dh}
                </div>
              ))}
            </div>

            {/* Month Day Grid */}
            <div className="grid grid-cols-7 border-l border-t border-slate-200 dark:border-slate-800">
              {/* Empty leading day slots */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="h-28 border-r border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/30 p-1"
                />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayDocs = docsByDeadline[dateStr] || [];
                const isToday =
                  new Date().toDateString() === new Date(year, month, dayNum).toDateString();

                return (
                  <div
                    key={dateStr}
                    onClick={() => onCreateDoc(dateStr)}
                    className={`h-28 border-r border-b border-slate-200/80 dark:border-slate-800 p-1.5 flex flex-col justify-between group hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-colors cursor-pointer ${
                      isToday ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                          isToday
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {dayNum}
                      </span>

                      <button
                        title="Tambah tugas di tanggal ini"
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Events / tasks for day */}
                    <div className="space-y-1 overflow-y-auto max-h-18 mt-1">
                      {dayDocs.map((d) => (
                        <div
                          key={d.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDoc(d.id);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 border shadow-2xs ${
                            d.status === 'completed'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span>{d.icon || '📄'}</span>
                          <span className="truncate">{d.title || t.emptyTitle}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
