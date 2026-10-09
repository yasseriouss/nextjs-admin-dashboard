import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Building2, 
  ExternalLink, 
  BellRing, 
  X, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { FollowUpTask } from '../types';

interface TaskImminentBannerProps {
  tasks: FollowUpTask[];
  onNavigateToTasks: () => void;
  onOpenSmartReminders?: () => void;
  onRequestDesktopNotification?: () => void;
  desktopNotificationPermission?: NotificationPermission;
  isArabic: boolean;
  theme?: 'dark' | 'light';
}

export const TaskImminentBanner: React.FC<TaskImminentBannerProps> = ({
  tasks,
  onNavigateToTasks,
  onOpenSmartReminders,
  onRequestDesktopNotification,
  desktopNotificationPermission,
  isArabic,
  theme = 'dark'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || tasks.length === 0) return null;

  // Bound index safely
  const activeIndex = Math.min(currentIndex, tasks.length - 1);
  const currentTask = tasks[activeIndex];

  // Calculate remaining minutes
  const calculateRemainingMinutes = (dueDate: string, dueTime?: string) => {
    if (!dueDate) return null;
    const time = dueTime ? (dueTime.length === 5 ? `${dueTime}:00` : dueTime) : '23:59:00';
    const target = new Date(`${dueDate}T${time}`);
    if (isNaN(target.getTime())) return null;
    const diffMs = target.getTime() - Date.now();
    return Math.round(diffMs / 60000);
  };

  const remainingMins = calculateRemainingMinutes(currentTask.dueDate, currentTask.dueTime);

  const getRemainingTimeText = (mins: number | null) => {
    if (mins === null) return currentTask.dueTime ? `${currentTask.dueTime}` : '';
    if (mins < 0) {
      const pastMins = Math.abs(mins);
      if (pastMins < 60) {
        return isArabic ? `متأخرة منذ ${pastMins} دقيقة!` : `Overdue by ${pastMins}m!`;
      }
      return isArabic ? `متأخرة منذ ${Math.floor(pastMins / 60)} س و ${pastMins % 60} د!` : `Overdue by ${Math.floor(pastMins / 60)}h ${pastMins % 60}m!`;
    }
    if (mins === 0) return isArabic ? 'مستحقة الآن!' : 'Due right now!';
    if (mins < 60) {
      return isArabic ? `متبقي ${mins} دقيقة فقط` : `Only ${mins}m left`;
    }
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    return isArabic 
      ? `متبقي ساعة و ${m} دقيقة` 
      : `${hours}h ${m}m remaining`;
  };

  const isDark = theme === 'dark';

  return (
    <div 
      className={`relative w-full rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-r from-accent via-rose-950/30 to-accent border-accent text-text shadow-accent/20' 
          : 'bg-gradient-to-r from-accent via-rose-50 to-orange-50 border-accent text-text shadow-accent/20'
      }`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Top Warning Strip */}
      <div className="h-1 bg-gradient-to-r from-accent via-rose-500 to-accent w-full animate-pulse" />

      <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left side: Alert Badge & Task Details */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="relative shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-xl bg-accent border border-accent flex items-center justify-center text-accent shadow-sm shadow-accent/20">
              <Clock className="w-5 h-5 animate-pulse text-accent" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header row: Alert tag, remaining time, task counter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>{isArabic ? 'تنبيه عاجل: استحقاق خلال أقل من ساعتين' : 'Urgent: Due in < 2 Hours'}</span>
              </span>

              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-accent text-accent border border-accent">
                ⏰ {getRemainingTimeText(remainingMins)}
              </span>

              {tasks.length > 1 && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-text-muted bg-surface-raised px-2 py-0.5 rounded-full">
                  <span>{activeIndex + 1} / {tasks.length}</span>
                  <div className="flex items-center">
                    <button 
                      onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : tasks.length - 1))}
                      className="hover:text-white p-0.5 cursor-pointer"
                      title={isArabic ? 'السابق' : 'Previous'}
                    >
                      {isArabic ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                    </button>
                    <button 
                      onClick={() => setCurrentIndex(prev => (prev < tasks.length - 1 ? prev + 1 : 0))}
                      className="hover:text-white p-0.5 cursor-pointer"
                      title={isArabic ? 'التالي' : 'Next'}
                    >
                      {isArabic ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Task Title */}
            <h4 className="text-sm font-bold mt-1 text-white truncate flex items-center gap-2">
              <span>{currentTask.title}</span>
            </h4>

            {/* Sub-meta: Client, Compound, Due Time, Assigned Agent */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-text-muted">
              {currentTask.clientName && (
                <span className="flex items-center gap-1 font-medium">
                  <User className="w-3.5 h-3.5 text-accent" />
                  <span>{currentTask.clientName}</span>
                </span>
              )}

              {currentTask.dueTime && (
                <span className="flex items-center gap-1 font-mono text-accent">
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  <span>{isArabic ? 'الموعد المحدد:' : 'Due:'} {currentTask.dueTime}</span>
                </span>
              )}

              {currentTask.compound && (
                <span className="flex items-center gap-1 text-text-muted">
                  <Building2 className="w-3.5 h-3.5 text-text-muted" />
                  <span>{currentTask.compound}</span>
                </span>
              )}

              {currentTask.agent && (
                <span className="text-text-muted hidden sm:inline">
                  • {isArabic ? 'المسؤول:' : 'Agent:'} <strong className="text-text">{currentTask.agent}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
          {/* Desktop Notifications Toggle/Request button */}
          {onRequestDesktopNotification && desktopNotificationPermission !== 'granted' && (
            <button
              onClick={onRequestDesktopNotification}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                isDark 
                  ? 'bg-surface-raised hover:bg-surface-raised text-accent border-accent' 
                  : 'bg-white hover:bg-surface text-accent border-accent'
              }`}
              title={isArabic ? 'تفعيل إشعارات المتصفح لسطح المكتب للمهام المستعجلة' : 'Enable browser desktop notifications for imminent tasks'}
            >
              <BellRing className="w-3.5 h-3.5 text-accent animate-bounce" />
              <span>{isArabic ? 'تفعيل تنبيهات سطح المكتب' : 'Enable Desktop Alerts'}</span>
            </button>
          )}

          {desktopNotificationPermission === 'granted' && (
            <span 
              className="hidden lg:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium"
              title={isArabic ? 'إشعارات سطح المكتب مفعلة في المتصفح' : 'Desktop notifications are enabled'}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{isArabic ? 'إشعارات سطح المكتب نشطة' : 'Desktop Alerts Active'}</span>
            </span>
          )}

          {/* Jump to Tasks Board */}
          <button
            onClick={onNavigateToTasks}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-accent to-rose-600 hover:from-accent hover:to-rose-500 text-text font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-accent/20 cursor-pointer"
          >
            <span>{isArabic ? 'عرض المهمة' : 'View Task'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Smart Reminders button */}
          {onOpenSmartReminders && (
            <button
              onClick={onOpenSmartReminders}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                isDark 
                  ? 'bg-surface-raised hover:bg-surface-raised text-text border-border' 
                  : 'bg-white hover:bg-surface-raised text-text border-border'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">{isArabic ? 'جدول المتابعة' : 'Roadmap'}</span>
            </button>
          )}

          {/* Dismiss button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface-raised transition cursor-pointer"
            title={isArabic ? 'إخفاء التنبيه مؤقتاً' : 'Dismiss alert'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
