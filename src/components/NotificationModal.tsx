import React from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  X, 
  Volume2
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none font-sans">
      <div className="bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[8px] max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#777973] hover:text-[#282925] transition-colors"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#EAEAE5] dark:border-[#2B2B28]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] flex items-center justify-center">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8]">
                {t.reminders}
              </h3>
              <span className="text-xs text-[#777973]">
                {reminderDocs.length} tugas & catatan terjadwal
              </span>
            </div>
          </div>

          <button
            onClick={() => playReminderChime()}
            title="Uji Suara Lonceng Audio Web"
            className="p-1.5 rounded-[4px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] hover:bg-[#EAEAE5] text-[#777973] hover:text-[#282925] flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
          >
            <Volume2 size={13} />
            <span className="hidden sm:inline">Tes Suara</span>
          </button>
        </div>

        {/* Browser notification permission banner */}
        {!hasNotificationPermission() && (
          <div className="p-3 mb-4 rounded-[6px] bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] flex items-center justify-between text-xs text-[#282925] dark:text-[#EDEDE8]">
            <span className="text-[11px] text-[#777973]">Dapatkan notifikasi pengingat tepat waktu langsung di browser Anda.</span>
            <button
              onClick={handleRequestPermission}
              className="px-2.5 py-1 rounded-[4px] bg-[#282925] text-white font-medium hover:bg-[#3E3F3B] transition-colors shrink-0 cursor-pointer text-xs"
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
                  className={`p-3.5 rounded-[6px] border transition-colors ${
                    isPast
                      ? 'bg-[#FFF0F0] dark:bg-[#331C1C] border-[#FFCDD2] dark:border-[#5C2424]'
                      : 'bg-[#F8F8F6] dark:bg-[#181816] border-[#EAEAE5] dark:border-[#2B2B28]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div 
                      onClick={() => {
                        onSelectDoc(item.id);
                        onClose();
                      }}
                      className="cursor-pointer flex items-center gap-2.5 min-w-0 flex-1"
                    >
                      <span className="text-base">{item.icon || '📄'}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8] truncate">
                          {item.title || t.emptyTitle}
                        </div>
                        <div className="text-[11px] text-[#777973] flex items-center gap-1.5 mt-0.5">
                          <Clock size={11} className={isPast ? 'text-rose-500' : 'text-[#8CA796]'} />
                          <span className="font-mono">
                            {new Date(reminderTimestamp).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')}
                          </span>
                          {isPast && (
                            <span className="text-[10px] text-rose-600 font-semibold uppercase">
                              (Waktunya Tiba!)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDismissReminder(item.id)}
                      title={t.markDone}
                      className="p-1 rounded text-[#777973] hover:text-[#567561] cursor-pointer"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  </div>

                  {/* Action buttons: Snooze & Mark Done */}
                  <div className="mt-2.5 pt-2 border-t border-[#EAEAE5] dark:border-[#2B2B28] flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => onSnoozeReminder(item.id, 5)}
                      className="px-2 py-0.5 rounded-[4px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-white dark:bg-[#1E1E1C] hover:bg-[#EAEAE5] text-[#282925] dark:text-[#EDEDE8] text-[11px] cursor-pointer"
                    >
                      {t.snooze5m}
                    </button>
                    <button
                      onClick={() => onSnoozeReminder(item.id, 15)}
                      className="px-2 py-0.5 rounded-[4px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-white dark:bg-[#1E1E1C] hover:bg-[#EAEAE5] text-[#282925] dark:text-[#EDEDE8] text-[11px] cursor-pointer"
                    >
                      {t.snooze15m}
                    </button>
                    <button
                      onClick={() => onDismissReminder(item.id)}
                      className="px-2.5 py-0.5 rounded-[4px] bg-[#282925] hover:bg-[#3E3F3B] text-white font-medium text-[11px] cursor-pointer"
                    >
                      {t.markDone}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-xs text-[#A1A29B]">
              {t.noReminders}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
