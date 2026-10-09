import React, { useEffect } from 'react';
import { AppNotification } from '../types';
import { 
  Clock, 
  X, 
  Building2, 
  DollarSign, 
  ExternalLink,
  BellRing
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { notificationTitle, notificationMessage } from '../lib/notifications';

interface NotificationToastProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  onSelectUnit?: (unitId: string) => void;
  onSelectTask?: (taskId: string) => void;
  theme?: 'dark' | 'light';
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
  onSelectUnit,
  onSelectTask,
  theme = 'dark'
}) => {
  const { isArabic } = useI18n();
  if (notifications.length === 0) return null;

  // Safeguard: Ensure unique notification items by id
  const uniqueNotifications = Array.from(new Map(notifications.map(item => [item.id, item])).values());

  return (
    <div 
      className={`fixed z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none p-4 ${
        isArabic ? 'top-4 left-4' : 'top-4 right-4'
      }`}
    >
      {uniqueNotifications.map((item) => (
        <ToastItem
          key={item.id}
          item={item}
          onDismiss={onDismiss}
          onSelectUnit={onSelectUnit}
          onSelectTask={onSelectTask}
          theme={theme}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  item: AppNotification;
  onDismiss: (id: string) => void;
  onSelectUnit?: (unitId: string) => void;
  onSelectTask?: (taskId: string) => void;
  theme: 'dark' | 'light';
}

const ToastItem: React.FC<ToastItemProps> = ({
  item,
  onDismiss,
  onSelectUnit,
  onSelectTask,
  theme
}) => {
  const { t, isArabic } = useI18n();
  // Auto dismiss after 8 seconds (or 10 seconds for urgent tasks)
  const isUrgent = item.type === 'task_due' || item.type === 'urgent';
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(item.id);
    }, isUrgent ? 10000 : 7000);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss, isUrgent]);

  const isSold = item.type === 'sold';
  const isReserved = item.type === 'reserved';

  const iconBg = isUrgent
    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
    : isSold 
    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
    : isReserved 
    ? 'bg-accent text-accent border border-accent' 
    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';

  const containerBg = theme === 'light'
    ? 'bg-white text-text border-border shadow-2xl shadow-sm'
    : 'bg-surface text-text border-border shadow-2xl shadow-black/60 backdrop-blur-md';

  return (
    <div 
      className={`pointer-events-auto rounded-2xl border p-4 transition-all duration-300 transform translate-y-0 scale-100 ${containerBg} relative overflow-hidden`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Top accent glow line */}
      <div 
        className={`absolute top-0 left-0 right-0 h-1 ${
          isUrgent
            ? 'bg-gradient-to-r from-rose-500 via-accent to-rose-500 animate-pulse'
            : isSold 
            ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
            : isReserved 
            ? 'bg-gradient-to-r from-accent to-orange-500' 
            : 'bg-emerald-500'
        }`} 
      />

      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {isUrgent ? (
            <Clock className="w-5 h-5 text-rose-400 animate-spin-slow" />
          ) : isSold ? (
            <DollarSign className="w-5 h-5 animate-bounce" />
          ) : isReserved ? (
            <Clock className="w-5 h-5" />
          ) : (
            <BellRing className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-bold truncate flex items-center gap-1.5">
              <span>{notificationTitle(item, t)}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isUrgent
                  ? 'bg-rose-500/20 text-rose-400 font-bold'
                  : isSold 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-accent text-accent'
              }`}>
                {isUrgent 
                  ? t('toast.dueSoon') 
                  : isSold 
                  ? t('toast.sold') 
                  : t('toast.reserved')}
              </span>
            </h4>
            <button
              onClick={() => onDismiss(item.id)}
              className="text-text-muted hover:text-white p-1 rounded-lg transition"
              title={t('common.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            {notificationMessage(item, t)}
          </p>

          {/* Task Action details */}
          {item.taskId && (
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border text-[11px]">
              <div className="flex items-center gap-2 text-text-muted">
                <span className="font-mono bg-rose-500/15 text-rose-300 px-1.5 py-0.5 rounded text-[10px] border border-rose-500/20">
                  {item.taskId}
                </span>
                {item.clientName && (
                  <span className="text-text-muted truncate font-medium">
                    {item.clientName}
                  </span>
                )}
              </div>

              {onSelectTask && (
                <button
                  onClick={() => onSelectTask(item.taskId!)}
                  className="flex items-center gap-1 text-accent hover:text-accent font-bold cursor-pointer transition"
                >
                  <span>{t('toast.viewTask')}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Unit & Action Details */}
          {!item.taskId && (item.unitId || item.compound) && (
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border text-[11px]">
              <div className="flex items-center gap-2 text-text-muted">
                {item.unitId && (
                  <span className="font-mono bg-surface-raised px-1.5 py-0.5 rounded text-text">
                    {item.unitId}
                  </span>
                )}
                {item.compound && (
                  <span className="flex items-center gap-1 truncate text-text-muted">
                    <Building2 className="w-3 h-3 text-text-muted" />
                    <span>{item.compound}</span>
                  </span>
                )}
              </div>

              {item.unitId && onSelectUnit && (
                <button
                  onClick={() => onSelectUnit(item.unitId!)}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold cursor-pointer transition"
                >
                  <span>{t('toast.viewUnit')}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
