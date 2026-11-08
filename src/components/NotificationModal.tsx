import React from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  X, 
  Volume2, 
  AlertTriangle, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { DocItem, Language } from '../types';
import { translations } from '../utils/i18n';
import { 
  playReminderChime, 
  requestNotificationPermission, 
  hasNotificationPermission 
} from '../utils/notifications';

interface NotificationModalProps {
  isOpen: boolean;
  docs: DocItem[];
  lang: Language;
  onClose: () => void;
  onSelectDoc: (id: string) => void;
  onSnoozeReminder: (id: string, minutes: number) => void;
  onDismissReminder: (id: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  docs,
  lang,
  onClose,
  onSelectDoc,
  onSnoozeReminder,
  onDismissReminder,
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  // Filter docs with reminderTime
  const reminderDocs = docs.filter((d) => d.reminderTime);
  const now = Date.now();

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      playReminderChime();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.reminders}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {reminderDocs.length} tugas & catatan terjadwal
              </span>
            </div>
          </div>

          <button
            onClick={() => playReminderChime()}
            title="Uji Suara Lonceng Audio Web"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-xs transition-colors"
          >
            <Volume2 size={14} className="text-indigo-500" />
            <span className="hidden sm:inline">Tes Suara</span>
          </button>
        </div>

        {/* Browser notification permission banner */}
        {!hasNotificationPermission() && (
          <div className="p-3 mb-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
            <span>Dapatkan alarm tepat waktu langsung di browser Anda.</span>
            <button
              onClick={handleRequestPermission}
              className="px-2.5 py-1 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shrink-0"
            >
              {t.enableBrowserNotifs}
            </button>
          </div>
        )}

        {/* Reminder Items List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {reminderDocs.length > 0 ? (
            reminderDocs.map((item) => {
              const reminderTimestamp = item.reminderTime ? new Date(item.reminderTime).getTime() : 0;
              const isPast = reminderTimestamp <= now;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isPast
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div 
                      onClick={() => {
                        onSelectDoc(item.id);
                        onClose();
                      }}
                      className="cursor-pointer flex items-center gap-2 min-w-0 flex-1"
                    >
                      <span className="text-lg">{item.icon || '📄'}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title || t.emptyTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Clock size={11} className={isPast ? 'text-rose-500' : 'text-amber-500'} />
                          <span className="font-mono">
                            {new Date(reminderTimestamp).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')}
                          </span>
                          {isPast && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">
                              (Waktunya Tiba!)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDismissReminder(item.id)}
                      title={t.markDone}
                      className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  </div>

                  {/* Action buttons: Snooze & Mark Done */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => onSnoozeReminder(item.id, 5)}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px]"
                    >
                      {t.snooze5m}
                    </button>
                    <button
                      onClick={() => onSnoozeReminder(item.id, 15)}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px]"
                    >
                      {t.snooze15m}
                    </button>
                    <button
                      onClick={() => onDismissReminder(item.id)}
                      className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]"
                    >
                      {t.markDone}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-xs text-slate-400">
              {t.noReminders}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
