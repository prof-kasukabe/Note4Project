import React, { useState } from 'react';
import { 
  Table as TableIcon, 
  Kanban, 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Trash2,
  Tag as TagIcon
} from 'lucide-react';
import { DocItem, DocStatus, DocPriority, Language } from '../types';
import { translations } from '../utils/i18n';
import { formatTimeAgo } from '../utils/formatTime';

interface DatabaseViewProps {
  docs: DocItem[];
  currentMode: 'table' | 'board' | 'calendar';
  lang: Language;
  onSelectDoc: (id: string) => void;
  onUpdateDoc: (id: string, updated: Partial<DocItem>) => void;
  onCreateDoc: (date?: string) => void;
  onDeleteDoc: (id: string) => void;
}

const STATUS_COLUMNS: { key: DocStatus; labelId: string; dotColor: string }[] = [
  { key: 'not_started', labelId: 'notStarted', dotColor: 'bg-[#A1A29B]' },
  { key: 'in_progress', labelId: 'inProgress', dotColor: 'bg-[#5D748B]' },
  { key: 'completed', labelId: 'completed', dotColor: 'bg-[#567561]' },
  { key: 'archived', labelId: 'archived', dotColor: 'bg-[#777973]' },
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

  const getStatusBadgeStyle = (status: DocStatus) => {
    switch (status) {
      case 'in_progress':
        return 'bg-[#EBF0F5] text-[#5D748B] dark:bg-[#242A32] dark:text-[#9AB3CC]';
      case 'completed':
        return 'bg-[#EDF3EE] text-[#567561] dark:bg-[#1E2B22] dark:text-[#93BFA1]';
      case 'not_started':
        return 'bg-[#F4F4F0] text-[#777973] dark:bg-[#252522] dark:text-[#A1A29B]';
      case 'archived':
        return 'bg-[#F4F4F0] text-[#A1A29B] dark:bg-[#252522] dark:text-[#777973]';
      default:
        return 'bg-[#F4F4F0] text-[#777973]';
    }
  };

  const getPriorityBadgeStyle = (priority: DocPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-[#FFF0F0] text-[#D32F2F] dark:bg-[#331C1C] dark:text-[#FF8A80]';
      case 'medium':
        return 'bg-[#FFF8E7] text-[#B78103] dark:bg-[#332B14] dark:text-[#FDD835]';
      case 'low':
        return 'bg-[#F4F4F0] text-[#777973] dark:bg-[#252522] dark:text-[#A1A29B]';
      default:
        return 'bg-[#F4F4F0] text-[#777973]';
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-white dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] flex flex-col select-none font-sans">
      {/* Top Filter and Search Strip (Figma border #EAEAE5, height ~56px) */}
      <div className="px-6 py-3.5 bg-white dark:bg-[#121211] border-b border-[#EAEAE5] dark:border-[#2B2B28] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-[#777973]" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-48 sm:w-60 bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] py-1.5 pl-8 pr-3 text-xs text-[#282925] dark:text-[#EDEDE8] placeholder-[#777973] focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] px-2.5 py-1.5 text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none cursor-pointer"
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
            className="bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] px-2.5 py-1.5 text-xs text-[#282925] dark:text-[#EDEDE8] focus:outline-none cursor-pointer"
          >
            <option value="all">{t.priority}: Semua</option>
            <option value="high">{t.high}</option>
            <option value="medium">{t.medium}</option>
            <option value="low">{t.low}</option>
          </select>
        </div>

        {/* Create new document record (Figma dark button #282925) */}
        <button
          onClick={() => onCreateDoc()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#282925] hover:bg-[#3E3F3B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>{t.newDoc}</span>
        </button>
      </div>

      {/* Viewport Content */}
      <div className="flex-1 p-6 md:p-8 overflow-x-auto">
        {/* 1. TABLE VIEW */}
        {currentMode === 'table' && (
          <div className="bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[8px] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8F8F6] dark:bg-[#181816] border-b border-[#EAEAE5] dark:border-[#2B2B28] text-[#A1A29B] font-medium uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 min-w-[220px]">Proyek / Halaman</th>
                    <th className="py-3 px-3 min-w-[130px]">{t.status}</th>
                    <th className="py-3 px-3 min-w-[140px]">{lang === 'id' ? 'Diubah Oleh' : 'Updated By'}</th>
                    <th className="py-3 px-3 min-w-[110px]">{t.priority}</th>
                    <th className="py-3 px-3 min-w-[140px]">{t.tags}</th>
                    <th className="py-3 px-3 min-w-[130px]">{t.deadline}</th>
                    <th className="py-3 px-3 min-w-[120px]">{t.reminder}</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAE5] dark:divide-[#2B2B28]">
                  {filteredDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors group cursor-pointer h-[58px]"
                      onClick={() => onSelectDoc(doc.id)}
                    >
                      {/* Title */}
                      <td className="py-2.5 px-4 font-medium text-[#282925] dark:text-[#EDEDE8]">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-[4px] bg-[#F8F8F6] dark:bg-[#252522] border border-[#EAEAE5] dark:border-[#2B2B28] flex items-center justify-center text-sm shrink-0">
                            {doc.icon || '📄'}
                          </span>
                          <span className="truncate max-w-[200px] text-[13px]">{doc.title || t.emptyTitle}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={doc.status}
                          onChange={(e) => onUpdateDoc(doc.id, { status: e.target.value as DocStatus, updatedAt: Date.now() })}
                          className={`text-xs px-2.5 py-1 rounded-[4px] border border-[#EAEAE5] dark:border-[#2B2B28] font-medium cursor-pointer ${getStatusBadgeStyle(doc.status)}`}
                        >
                          <option value="not_started">{t.notStarted}</option>
                          <option value="in_progress">{t.inProgress}</option>
                          <option value="completed">{t.completed}</option>
                          <option value="archived">{t.archived}</option>
                        </select>
                      </td>

                      {/* Last Modified By (Audit Tracker) */}
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        {doc.lastModifiedBy ? (
                          <div 
                            className="flex items-center gap-1.5"
                            title={`${doc.lastModifiedBy.action || 'Diperbarui'} (${new Date(doc.lastModifiedBy.timestamp).toLocaleString()})`}
                          >
                            <div
                              style={{ backgroundColor: doc.lastModifiedBy.color || '#6366F1' }}
                              className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-xs"
                            >
                              {doc.lastModifiedBy.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] block truncate max-w-[100px]">
                                {doc.lastModifiedBy.name}
                              </span>
                              <span className="text-[10px] text-[#A1A29B] block truncate">
                                {formatTimeAgo(doc.lastModifiedBy.timestamp, lang)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#A1A29B] italic">-</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={doc.priority}
                          onChange={(e) => onUpdateDoc(doc.id, { priority: e.target.value as DocPriority, updatedAt: Date.now() })}
                          className={`text-xs px-2 py-0.5 rounded-[4px] border border-[#EAEAE5] dark:border-[#2B2B28] font-medium cursor-pointer ${getPriorityBadgeStyle(doc.priority)}`}
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
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#F4F4F0] dark:bg-[#252522] rounded-[4px] text-[#777973] dark:text-[#A1A29B]">
                              {tag}
                            </span>
                          ))}
                          {doc.tags.length > 2 && (
                            <span className="text-[10px] text-[#A1A29B]">+{doc.tags.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Deadline */}
                      <td className="py-2.5 px-3 font-mono tabular-nums text-[#777973]" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="date"
                          value={doc.deadline || ''}
                          onChange={(e) => onUpdateDoc(doc.id, { deadline: e.target.value || undefined, updatedAt: Date.now() })}
                          className="bg-transparent border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] px-1.5 py-0.5 text-xs text-[#282925] dark:text-[#EDEDE8]"
                        />
                      </td>

                      {/* Reminder */}
                      <td className="py-2.5 px-3 text-[#777973] font-mono text-[11px]">
                        {doc.reminderTime ? (
                          <span className="flex items-center gap-1 text-[#8CA796]">
                            <Clock size={11} />
                            {new Date(doc.reminderTime).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[#A1A29B]">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onDeleteDoc(doc.id)}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-1 rounded text-xs transition-opacity"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. KANBAN BOARD VIEW */}
        {currentMode === 'board' && (
          <div className="flex md:grid md:grid-cols-4 gap-4 items-start overflow-x-auto pb-4 snap-x">
            {STATUS_COLUMNS.map((col) => {
              const columnDocs = filteredDocs.filter((d) => d.status === col.key);
              return (
                <div
                  key={col.key}
                  className="bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[8px] p-3 flex flex-col min-h-[480px] min-w-[260px] md:min-w-0 w-72 md:w-auto shrink-0 md:shrink snap-start shadow-xs"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#EAEAE5] dark:border-[#2B2B28]">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                      <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">
                        {translations[lang][col.labelId as keyof typeof translations['id']]}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-[#EAEAE5] dark:bg-[#252522] text-[#777973] dark:text-[#A1A29B]">
                      {columnDocs.length}
                    </span>
                  </div>

                  {/* Cards in Column */}
                  <div className="space-y-2.5 flex-1">
                    {columnDocs.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onSelectDoc(item.id)}
                        className="p-3.5 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] shadow-xs hover:border-[#A1A29B] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base">{item.icon || '📄'}</span>
                            <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8] truncate">
                              {item.title || t.emptyTitle}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-[4px] font-medium uppercase ${getPriorityBadgeStyle(item.priority)}`}
                          >
                            {item.priority}
                          </span>
                        </div>

                        {/* Tags */}
                        {item.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap my-2">
                            {item.tags.map((tg) => (
                              <span key={tg} className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#F4F4F0] dark:bg-[#252522] text-[#777973] dark:text-[#A1A29B]">
                                {tg}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Who updated status audit badge */}
                        {item.lastModifiedBy && (
                          <div 
                            className="mt-2.5 pt-2 border-t border-[#EAEAE5] dark:border-[#2B2B28] flex items-center justify-between gap-1 text-[10px]"
                            title={`${item.lastModifiedBy.action || 'Diperbarui'} oleh ${item.lastModifiedBy.name} pada ${new Date(item.lastModifiedBy.timestamp).toLocaleTimeString()}`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div
                                style={{ backgroundColor: item.lastModifiedBy.color || '#6366F1' }}
                                className="w-4 h-4 rounded-full text-white text-[8px] font-bold flex items-center justify-center shrink-0 shadow-xs"
                              >
                                {item.lastModifiedBy.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate text-[#777973] font-medium">
                                {item.lastModifiedBy.name}
                              </span>
                            </div>
                            <span className="text-[9px] text-[#A1A29B] shrink-0 font-mono">
                              {formatTimeAgo(item.lastModifiedBy.timestamp, lang)}
                            </span>
                          </div>
                        )}

                        {/* Card footer: Deadline and Move status action */}
                        <div className="flex items-center justify-between pt-2 text-[10px] text-[#A1A29B]">
                          {item.deadline ? (
                            <span className="flex items-center gap-1 font-mono text-[#777973]">
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
                            className="bg-transparent border-0 text-[10px] font-medium text-[#777973] hover:text-[#282925] focus:outline-none cursor-pointer"
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
                    onClick={() => onCreateDoc()}
                    className="mt-2.5 w-full py-1.5 rounded-[6px] border border-dashed border-[#EAEAE5] dark:border-[#2B2B28] text-xs text-[#777973] hover:text-[#282925] hover:border-[#A1A29B] flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus size={13} />
                    <span>Tambah</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. CALENDAR VIEW */}
        {currentMode === 'calendar' && (
          <div className="bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[8px] p-4 sm:p-6 shadow-xs overflow-x-auto">
            {/* Calendar Month Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm sm:text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
                  {monthName} {year}
                </h3>
                <button
                  onClick={setToday}
                  className="px-2.5 py-1 text-xs font-medium rounded-[4px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] text-[#282925] dark:text-[#EDEDE8] hover:bg-[#EAEAE5] transition-colors"
                >
                  {t.today}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-[4px] hover:bg-[#F8F8F6] dark:hover:bg-[#252522] text-[#777973] hover:text-[#282925]"
                  title={t.prevMonth}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-[4px] hover:bg-[#F8F8F6] dark:hover:bg-[#252522] text-[#777973] hover:text-[#282925]"
                  title={t.nextMonth}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Day Header row */}
            <div className="grid grid-cols-7 border-b border-[#EAEAE5] dark:border-[#2B2B28] pb-2 text-center text-[11px] font-medium text-[#A1A29B] uppercase tracking-wider min-w-[320px]">
              {dayHeaders.map((dh) => (
                <div key={dh} className="py-1">
                  {dh}
                </div>
              ))}
            </div>

            {/* Month Day Grid */}
            <div className="grid grid-cols-7 border-l border-t border-[#EAEAE5] dark:border-[#2B2B28] min-w-[320px]">
              {/* Empty leading day slots */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[64px] sm:h-28 border-r border-b border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6]/40 dark:bg-[#181816]/30 p-1"
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
                    className={`min-h-[64px] sm:h-28 border-r border-b border-[#EAEAE5] dark:border-[#2B2B28] p-1.5 sm:p-2 flex flex-col justify-between group hover:bg-[#F8F8F6] dark:hover:bg-[#232320] transition-colors cursor-pointer ${
                      isToday ? 'bg-[#F8F8F6] dark:bg-[#181816]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-[4px] ${
                          isToday
                            ? 'bg-[#282925] text-white'
                            : 'text-[#282925] dark:text-[#EDEDE8]'
                        }`}
                      >
                        {dayNum}
                      </span>

                      <button
                        title="Tambah tugas di tanggal ini"
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-[#777973] hover:text-[#282925] hidden sm:block"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Events / tasks for day */}
                    <div className="space-y-1 overflow-y-auto max-h-14 sm:max-h-20 mt-1">
                      {dayDocs.map((d) => (
                        <div
                          key={d.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDoc(d.id);
                          }}
                          className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium truncate flex items-center gap-1 border border-[#EAEAE5] dark:border-[#2B2B28] shadow-2xs ${
                            d.status === 'completed'
                              ? 'bg-[#EDF3EE] text-[#567561]'
                              : 'bg-white dark:bg-[#1E1E1C] text-[#282925] dark:text-[#EDEDE8]'
                          }`}
                        >
                          <span className="hidden sm:inline text-xs">{d.icon || '📄'}</span>
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
