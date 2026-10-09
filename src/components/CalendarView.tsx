import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Plus, 
  CheckCircle2, 
  CalendarDays, 
  ListOrdered, 
  MessageSquare, 
  Building2, 
  FileSignature, 
  Eye, 
  X,
  Bell,
  Sparkles,
} from 'lucide-react';
import { FollowUpTask, TaskType, Unit, TeamMember, AppNotification } from '../types';

interface CalendarViewProps {
  tasks: FollowUpTask[];
  onUpdateTasks: (tasks: FollowUpTask[]) => void;
  units?: Unit[];
  team?: TeamMember[];
  isArabic: boolean;
  theme?: 'dark' | 'light';
  onAddNotification?: (notification: AppNotification) => void;
  onSelectUnit?: (unitId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onUpdateTasks,
  team = [],
  isArabic,
  theme = 'dark',
  onAddNotification,
  onSelectUnit
}) => {
  const isDark = theme === 'dark';

  // Current viewed date
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');

  // Filters
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDayTasks, setSelectedDayTasks] = useState<{ date: string; tasks: FollowUpTask[] } | null>(null);

  // Selected Task Modal
  const [activeTaskDetail, setActiveTaskDetail] = useState<FollowUpTask | null>(null);

  // New Event Modal
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [newEventTime, setNewEventTime] = useState('11:00');
  const [newEventType, setNewEventType] = useState<TaskType>('visit');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventClient, setNewEventClient] = useState('');
  const [newEventPhone, setNewEventPhone] = useState('');
  const [newEventCompound, setNewEventCompound] = useState('');
  const [newEventUnitId, setNewEventUnitId] = useState('');
  const [newEventAgent, setNewEventAgent] = useState(team[0]?.name || 'سارة نبيل');
  const [newEventNotes, setNewEventNotes] = useState('');

  // Agents list
  const agentsList = useMemo(() => {
    const fromTeam = team.map(t => t.name);
    const fromTasks = tasks.map(t => t.agent);
    return Array.from(new Set([...fromTeam, ...fromTasks])).filter(Boolean);
  }, [team, tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (selectedAgent !== 'all' && t.agent !== selectedAgent) return false;
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      return true;
    });
  }, [tasks, selectedAgent, selectedType]);

  // Tasks grouped by date YYYY-MM-DD
  const tasksByDate = useMemo(() => {
    const map = new Map<string, FollowUpTask[]>();
    filteredTasks.forEach(task => {
      if (!task.dueDate) return;
      const dateKey = task.dueDate.slice(0, 10);
      const existing = map.get(dateKey) || [];
      existing.push(task);
      map.set(dateKey, existing);
    });
    return map;
  }, [filteredTasks]);

  // Today string
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Today and upcoming counts
  const todayTasks = useMemo(() => {
    return filteredTasks.filter(t => t.dueDate === todayStr);
  }, [filteredTasks, todayStr]);

  const siteVisitsCount = useMemo(() => {
    return filteredTasks.filter(t => t.type === 'visit').length;
  }, [filteredTasks]);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeekAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const daysOfWeekEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days in month calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Next month padding to fill grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  // Event Type Styler
  const getTypeBadge = (type: TaskType) => {
    switch (type) {
      case 'visit':
        return {
          icon: <Eye className="w-3 h-3 text-accent" />,
          label: isArabic ? 'معاينة ميدانية' : 'Site Viewing',
          color: 'bg-accent text-accent border-accent'
        };
      case 'meeting':
        return {
          icon: <Building2 className="w-3 h-3 text-purple-400" />,
          label: isArabic ? 'اجتماع عميل' : 'Client Meeting',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };
      case 'contract':
        return {
          icon: <FileSignature className="w-3 h-3 text-cyan-400" />,
          label: isArabic ? 'توقيع عقد' : 'Contract Signing',
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
        };
      case 'call':
        return {
          icon: <Phone className="w-3 h-3 text-blue-400" />,
          label: isArabic ? 'مكالمة متابعة' : 'Phone Call',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        };
      case 'whatsapp':
        return {
          icon: <MessageSquare className="w-3 h-3 text-emerald-400" />,
          label: isArabic ? 'تذكير واتساب' : 'WhatsApp',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        };
      default:
        return {
          icon: <Clock className="w-3 h-3 text-text-muted" />,
          label: isArabic ? 'متابعة عامة' : 'Follow-up',
          color: 'bg-surface-raised text-text-muted border-border'
        };
    }
  };

  // Quick WhatsApp trigger
  const handleOpenWhatsApp = (e: React.MouseEvent, task: FollowUpTask) => {
    e.stopPropagation();
    if (!task.clientPhone) return;
    const cleanPhone = task.clientPhone.replace(/[^0-9]/g, '');
    const greeting = isArabic
      ? `مرحباً أستاذ ${task.clientName}، نود تذكيركم بموعدنا ${task.title} يوم ${task.dueDate} الساعة ${task.dueTime || '12:00'} بخصوص كمبوند ${task.compound || '6 أكتوبر'}.`
      : `Hello ${task.clientName}, reminding you of our appointment ${task.title} on ${task.dueDate} at ${task.dueTime || '12:00'} regarding ${task.compound || '6 October'}.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting)}`, '_blank');
  };

  // Add Task Notification trigger
  const handleNotifyEvent = (e: React.MouseEvent, task: FollowUpTask) => {
    e.stopPropagation();
    if (onAddNotification) {
      onAddNotification({
        id: `cal-notif-${Date.now()}`,
        title: isArabic ? '⏰ تذكير بموعد معاينة / اجتماع' : 'Appointment Reminder',
        message: `${task.title} - ${task.clientName} (${task.agent}) في ${task.dueDate} ${task.dueTime || ''}`,
        type: 'visit',
        timestamp: new Date(),
        unitId: task.unitId,
        compound: task.compound,
        read: false
      });
    }
  };

  // Save New Event Form
  const handleCreateNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventClient.trim()) return;

    const createdTask: FollowUpTask = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      title: newEventTitle.trim(),
      clientName: newEventClient.trim(),
      clientPhone: newEventPhone.trim() || undefined,
      type: newEventType,
      stage: 'viewing',
      priority: newEventType === 'visit' || newEventType === 'contract' ? 'urgent' : 'high',
      dueDate: newEventDate,
      dueTime: newEventTime,
      agent: newEventAgent,
      compound: newEventCompound.trim() || undefined,
      unitId: newEventUnitId.trim() || undefined,
      notes: newEventNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    onUpdateTasks([createdTask, ...tasks]);

    // Send Notification to System
    if (onAddNotification) {
      onAddNotification({
        id: `cal-create-${Date.now()}`,
        title: isArabic ? '📅 تم جدولة موعد جديد بالتقويم' : 'New Calendar Event Scheduled',
        message: `${createdTask.title} مع ${createdTask.clientName} بواسطة ${createdTask.agent} يوم ${createdTask.dueDate} الساعة ${createdTask.dueTime}`,
        type: 'visit',
        timestamp: new Date(),
        unitId: createdTask.unitId,
        compound: createdTask.compound,
        read: false
      });
    }

    setIsNewEventModalOpen(false);
    setNewEventTitle('');
    setNewEventClient('');
    setNewEventPhone('');
    setNewEventCompound('');
    setNewEventUnitId('');
    setNewEventNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Ribbon */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        isDark ? 'bg-surface border-border' : 'bg-white border-border'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-blue-600 to-accent text-white shadow-lg shadow-blue-500/20">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-text'}`}>
                {isArabic ? 'تقويم المعاينات ومواعيد العملاء التفاعلي' : 'Interactive Calendar: Viewings & Client Meetings'}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent font-bold border border-accent flex items-center gap-1 font-mono">
                <Sparkles className="w-2.5 h-2.5" />
                Live Sync
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-text-muted' : 'text-text-muted'}`}>
              {isArabic 
                ? 'متابعة مواعيد زيارات الكمبوندات، اجتماعات الشراء، وتوزيع المواعيد على فريق الوسطاء مع تنبيهات لحظية' 
                : 'Manage on-site property viewings, office meetings, and broker schedules with real-time alerts'}
            </p>
          </div>
        </div>

        {/* Quick Action Ribbon & Metrics */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Today's Counter */}
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            todayTasks.length > 0 
              ? 'bg-accent border-accent text-accent' 
              : isDark ? 'bg-surface border-border text-text-muted' : 'bg-surface-raised border-border text-text-muted'
          }`}>
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>{isArabic ? 'مواعيد اليوم:' : 'Today:'}</span>
            <strong className="font-mono text-sm">{todayTasks.length}</strong>
          </div>

          {/* Site Visits Counter */}
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            isDark ? 'bg-surface border-border text-text-muted' : 'bg-surface-raised border-border text-text'
          }`}>
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>{isArabic ? 'معاينات ميدانية:' : 'Viewings:'}</span>
            <strong className="font-mono text-blue-400">{siteVisitsCount}</strong>
          </div>

          {/* Add Event Button */}
          <button
            onClick={() => {
              setNewEventDate(todayStr);
              setIsNewEventModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isArabic ? 'حجز موعد / معاينة جديدة' : '+ Schedule Event'}</span>
          </button>
        </div>
      </div>

      {/* Calendar Controls & Filter Toolbar */}
      <div className={`p-4 rounded-2xl border shadow-md space-y-3.5 ${
        isDark ? 'bg-surface border-border' : 'bg-white border-border'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Month / Year Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark 
                  ? 'bg-surface border-border text-text-muted hover:bg-surface-raised hover:text-white' 
                  : 'bg-surface-raised border-border text-text hover:bg-surface-raised'
              }`}
              title={isArabic ? 'الشهر السابق' : 'Previous Month'}
            >
              {isArabic ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-surface border-border">
              <CalendarIcon className="w-4 h-4 text-accent" />
              <h3 className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-text'}`}>
                {isArabic ? `${monthNamesAr[month]} ${year}` : `${monthNamesEn[month]} ${year}`}
              </h3>
            </div>

            <button
              onClick={handleNextMonth}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark 
                  ? 'bg-surface border-border text-text-muted hover:bg-surface-raised hover:text-white' 
                  : 'bg-surface-raised border-border text-text hover:bg-surface-raised'
              }`}
              title={isArabic ? 'الشهر التالي' : 'Next Month'}
            >
              {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            <button
              onClick={handleGoToday}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 transition cursor-pointer"
            >
              {isArabic ? 'اليوم' : 'Today'}
            </button>
          </div>

          {/* View Mode Toggle & Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* View Mode Toggle */}
            <div className={`p-1 rounded-xl border flex items-center ${
              isDark ? 'bg-surface border-border' : 'bg-surface-raised border-border'
            }`}>
              <button
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  viewMode === 'month' 
                    ? 'bg-blue-600 text-white shadow' 
                    : isDark ? 'text-text-muted hover:text-white' : 'text-text-muted hover:text-text'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{isArabic ? 'شهر' : 'Month'}</span>
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  viewMode === 'agenda' 
                    ? 'bg-blue-600 text-white shadow' 
                    : isDark ? 'text-text-muted hover:text-white' : 'text-text-muted hover:text-text'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>{isArabic ? 'أجندة المواعيد' : 'Agenda'}</span>
              </button>
            </div>

            {/* Agent Filter */}
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-blue-500 ${
                isDark ? 'bg-surface border-border text-text-muted' : 'bg-surface-raised border-border text-text'
              }`}
            >
              <option value="all">{isArabic ? 'جميع الوسطاء والوكلاء' : 'All Agents'}</option>
              {agentsList.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Event Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-blue-500 ${
                isDark ? 'bg-surface border-border text-text-muted' : 'bg-surface-raised border-border text-text'
              }`}
            >
              <option value="all">{isArabic ? 'كافة أنواع المواعيد' : 'All Types'}</option>
              <option value="visit">{isArabic ? 'معاينات ميدانية فقط' : 'Site Viewings'}</option>
              <option value="meeting">{isArabic ? 'اجتماعات عملاء فقط' : 'Meetings'}</option>
              <option value="contract">{isArabic ? 'توقيع عقود فقط' : 'Contracts'}</option>
              <option value="call">{isArabic ? 'مكالمات هاتفية' : 'Calls'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* MONTH VIEW GRID */}
      {viewMode === 'month' && (
        <div className={`rounded-2xl border shadow-xl overflow-hidden ${
          isDark ? 'bg-surface border-border' : 'bg-white border-border'
        }`}>
          {/* Days of Week Header */}
          <div className={`grid grid-cols-7 border-b text-center text-xs font-bold py-3 ${
            isDark ? 'bg-surface border-border text-text-muted' : 'bg-surface-raised border-border text-text-muted'
          }`}>
            {(isArabic ? daysOfWeekAr : daysOfWeekEn).map((day, idx) => (
              <div key={idx} className="truncate px-1">
                {day}
              </div>
            ))}
          </div>

          {/* Month Days Matrix */}
          <div className={`grid grid-cols-7 divide-x divide-y ${
            isDark ? 'divide-border' : 'divide-border'
          }`}>
            {calendarDays.map((cell, idx) => {
              const dayTasks = tasksByDate.get(cell.dateStr) || [];
              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (dayTasks.length > 0) {
                      setSelectedDayTasks({ date: cell.dateStr, tasks: dayTasks });
                    } else {
                      setNewEventDate(cell.dateStr);
                      setIsNewEventModalOpen(true);
                    }
                  }}
                  className={`min-h-[110px] sm:min-h-[130px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                    !cell.isCurrentMonth
                      ? isDark ? 'bg-surface opacity-40' : 'bg-surface opacity-40'
                      : isToday
                      ? isDark ? 'bg-blue-600/10 hover:bg-blue-600/15' : 'bg-blue-50/80 hover:bg-blue-100/50'
                      : isDark ? 'hover:bg-surface-raised' : 'hover:bg-surface'
                  }`}
                >
                  {/* Day Number Header & Badges */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : isDark ? 'text-text-muted' : 'text-text'
                    }`}>
                      {cell.dayNum}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-surface-raised text-accent border border-border">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Day Events Stack (max 3 displayed) */}
                  <div className="space-y-1 my-1 overflow-hidden flex-1">
                    {dayTasks.slice(0, 3).map((task) => {
                      const badge = getTypeBadge(task.type);
                      return (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTaskDetail(task);
                          }}
                          className={`px-1.5 py-1 rounded text-[10px] font-medium border truncate transition-all duration-150 flex items-center gap-1 ${badge.color} hover:brightness-125`}
                          title={`${task.title} - ${task.clientName} (${task.agent})`}
                        >
                          {badge.icon}
                          <span className="font-mono text-[9px] shrink-0 font-bold">{task.dueTime || ''}</span>
                          <span className="truncate">{task.title}</span>
                        </div>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <p className="text-[10px] text-text-muted font-mono text-center font-semibold">
                        +{dayTasks.length - 3} {isArabic ? 'مواعيد أخرى' : 'more'}
                      </p>
                    )}
                  </div>

                  {/* Quick Add Prompt on Hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end text-[10px] text-blue-400">
                    <Plus className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA VIEW (List View by Date) */}
      {viewMode === 'agenda' && (
        <div className={`p-4 rounded-2xl border shadow-xl space-y-4 ${
          isDark ? 'bg-surface border-border' : 'bg-white border-border'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-border">
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-text'}`}>
              {isArabic ? 'سجل المواعيد والزيارات القادمة' : 'Upcoming Schedule & Field Appointments'}
            </h3>
            <span className="text-xs text-text-muted font-mono">
              {filteredTasks.length} {isArabic ? 'موعد مسجل' : 'events total'}
            </span>
          </div>

          <div className="space-y-3">
            {Array.from(tasksByDate.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dateKey, dayTasks]) => {
                const isDateToday = dateKey === todayStr;
                return (
                  <div key={dateKey} className={`p-3.5 rounded-xl border space-y-2.5 ${
                    isDateToday 
                      ? 'bg-blue-600/10 border-blue-500/30' 
                      : isDark ? 'bg-surface border-border' : 'bg-surface border-border'
                  }`}>
                    {/* Date Subheader */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <h4 className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-text'}`}>
                          {dateKey} {isDateToday && <span className="text-accent font-bold">({isArabic ? 'اليوم' : 'Today'})</span>}
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-text-muted font-bold">
                        {dayTasks.length} {isArabic ? 'مواعيد' : 'events'}
                      </span>
                    </div>

                    {/* Events Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {dayTasks.map(task => {
                        const badge = getTypeBadge(task.type);
                        return (
                          <div
                            key={task.id}
                            onClick={() => setActiveTaskDetail(task)}
                            className={`p-3 rounded-xl border transition hover:shadow-md cursor-pointer space-y-2 ${
                              isDark ? 'bg-surface hover:bg-surface-raised border-border' : 'bg-white hover:bg-surface-raised border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${badge.color}`}>
                                {badge.icon}
                                <span>{badge.label}</span>
                              </span>
                              <span className="font-mono text-xs font-bold text-accent flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.dueTime || '12:00'}
                              </span>
                            </div>

                            <h5 className={`font-bold text-xs line-clamp-1 ${isDark ? 'text-white' : 'text-text'}`}>
                              {task.title}
                            </h5>

                            <div className="text-[11px] text-text-muted space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-text-muted" />
                                  <span className="truncate">{task.clientName}</span>
                                </span>
                                {task.clientPhone && (
                                  <button
                                    onClick={(e) => handleOpenWhatsApp(e, task)}
                                    title={isArabic ? 'محادثة وتذكير واتساب' : 'WhatsApp'}
                                    className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              {(task.compound || task.unitId) && (
                                <div className="flex items-center gap-1 truncate text-text-muted">
                                  <MapPin className="w-3 h-3 text-accent shrink-0" />
                                  <span className="truncate">{task.compound}</span>
                                  {task.unitId && <span className="font-mono font-bold text-blue-400">[{task.unitId}]</span>}
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
                              <span className="truncate">{task.agent}</span>
                              <span className="font-mono uppercase text-text-muted">{task.stage}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* DAY APPOINTMENTS MODAL */}
      {selectedDayTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto ${
            isDark ? 'bg-surface border-border' : 'bg-white border-border'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-accent" />
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-text'}`}>
                  {isArabic ? `مواعيد وزيارات يوم ${selectedDayTasks.date}` : `Schedule for ${selectedDayTasks.date}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayTasks(null)}
                className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-surface-raised transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedDayTasks.tasks.map(task => {
                const badge = getTypeBadge(task.type);
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      isDark ? 'bg-surface border-border' : 'bg-surface border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${badge.color}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-accent">
                        {task.dueTime || '12:00'}
                      </span>
                    </div>

                    <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-text'}`}>
                      {task.title}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
                      <div>
                        <span className="block text-[10px] text-text-muted">{isArabic ? 'العميل:' : 'Client:'}</span>
                        <strong className="text-text">{task.clientName}</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-text-muted">{isArabic ? 'الوسيط المسؤول:' : 'Broker:'}</span>
                        <strong className="text-text">{task.agent}</strong>
                      </div>
                    </div>

                    {(task.compound || task.unitId) && (
                      <div className="text-xs text-text-muted flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-accent" />
                        <span>{task.compound}</span>
                        {task.unitId && <span className="font-mono font-bold text-blue-400">({task.unitId})</span>}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {task.clientPhone && (
                          <button
                            onClick={(e) => handleOpenWhatsApp(e, task)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{isArabic ? 'واتساب' : 'WhatsApp'}</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => handleNotifyEvent(e, task)}
                          className="px-2.5 py-1 rounded-lg bg-accent hover:bg-accent text-accent border border-accent text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                          title={isArabic ? 'إرسال تنبيه فوري' : 'Trigger Notification'}
                        >
                          <Bell className="w-3 h-3" />
                          <span>{isArabic ? 'تنبيه' : 'Alert'}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedDayTasks(null);
                          setActiveTaskDetail(task);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
                      >
                        {isArabic ? 'عرض التفاصيل الكاملة ←' : 'View Full Details →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <button
                onClick={() => {
                  setNewEventDate(selectedDayTasks.date);
                  setSelectedDayTasks(null);
                  setIsNewEventModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إضافة موعد لهذا اليوم' : 'Add Event to this day'}</span>
              </button>

              <button
                onClick={() => setSelectedDayTasks(null)}
                className="px-4 py-2 bg-surface-raised hover:bg-surface-raised text-text-muted rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {activeTaskDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-5 space-y-4 ${
            isDark ? 'bg-surface border-border' : 'bg-white border-border'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${getTypeBadge(activeTaskDetail.type).color}`}>
                  {getTypeBadge(activeTaskDetail.type).icon}
                  <span>{getTypeBadge(activeTaskDetail.type).label}</span>
                </span>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-text'}`}>
                  {activeTaskDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveTaskDetail(null)}
                className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-surface-raised transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface border border-border">
                <div>
                  <span className="text-[10px] text-text-muted block">{isArabic ? 'العميل:' : 'Client:'}</span>
                  <strong className="text-white text-sm">{activeTaskDetail.clientName}</strong>
                  {activeTaskDetail.clientPhone && (
                    <span className="font-mono text-text-muted block mt-0.5">{activeTaskDetail.clientPhone}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">{isArabic ? 'الوسيط المسؤول:' : 'Assigned Agent:'}</span>
                  <strong className="text-blue-400 text-sm">{activeTaskDetail.agent}</strong>
                  <span className="font-mono text-text-muted block mt-0.5">
                    {activeTaskDetail.dueDate} {activeTaskDetail.dueTime}
                  </span>
                </div>
              </div>

              {(activeTaskDetail.compound || activeTaskDetail.unitId) && (
                <div className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" />
                    <div>
                      <span className="text-white font-semibold">{activeTaskDetail.compound || '6 أكتوبر'}</span>
                      {activeTaskDetail.unitId && (
                        <span className="font-mono text-accent font-bold ml-2">[{activeTaskDetail.unitId}]</span>
                      )}
                    </div>
                  </div>

                  {activeTaskDetail.unitId && onSelectUnit && (
                    <button
                      onClick={() => {
                        onSelectUnit(activeTaskDetail.unitId!);
                        setActiveTaskDetail(null);
                      }}
                      className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-xs font-semibold cursor-pointer"
                    >
                      {isArabic ? 'معاينة الوحدة ↗' : 'View Unit ↗'}
                    </button>
                  )}
                </div>
              )}

              {activeTaskDetail.notes && (
                <div className="p-3 rounded-xl bg-surface border border-border">
                  <span className="text-[10px] text-text-muted block mb-1">{isArabic ? 'ملاحظات وتفاصيل:' : 'Notes:'}</span>
                  <p className="text-text-muted leading-relaxed">{activeTaskDetail.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeTaskDetail.clientPhone && (
                  <button
                    onClick={(e) => handleOpenWhatsApp(e, activeTaskDetail)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'محادثة وتذكير واتساب' : 'WhatsApp'}</span>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    handleNotifyEvent(e, activeTaskDetail);
                    alert(isArabic ? 'تم إرسال إشعار التذكير بنجاح' : 'Reminder notification sent');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-accent hover:bg-accent text-accent border border-accent font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'تنبيه النظام' : 'System Alert'}</span>
                </button>
              </div>

              <button
                onClick={() => setActiveTaskDetail(null)}
                className="px-4 py-1.5 bg-surface-raised hover:bg-surface-raised text-text-muted rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE NEW EVENT MODAL */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-5 space-y-4 ${
            isDark ? 'bg-surface border-border' : 'bg-white border-border'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-500" />
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-text'}`}>
                  {isArabic ? 'جدولة موعد / معاينة جديدة بالتقويم' : 'Schedule New Event / Property Viewing'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewEventModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-surface-raised transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-muted font-semibold mb-1">
                  {isArabic ? 'عنوان الموعد / المعاينة *' : 'Event Title / Objective *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isArabic ? 'مثال: معاينة فيلا ماونتن فيو، جلسة تفاوض أسعار...' : 'e.g., Villa viewing at Palm Hills, Contract meeting...'}
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'اسم العميل *' : 'Client Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isArabic ? 'اسم المشتري أو المستأجر' : 'Client Name'}
                    value={newEventClient}
                    onChange={(e) => setNewEventClient(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}
                  </label>
                  <input
                    type="tel"
                    placeholder="+201001234567"
                    value={newEventPhone}
                    onChange={(e) => setNewEventPhone(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'نوع الموعد' : 'Event Type'}
                  </label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as TaskType)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  >
                    <option value="visit">{isArabic ? 'معاينة ميدانية بالكمبوند' : 'Site Viewing'}</option>
                    <option value="meeting">{isArabic ? 'اجتماع بالمكتب' : 'Office Meeting'}</option>
                    <option value="contract">{isArabic ? 'توقيع عقود وتوثيق' : 'Contract Signing'}</option>
                    <option value="call">{isArabic ? 'مكالمة هاتفية' : 'Phone Call'}</option>
                    <option value="whatsapp">{isArabic ? 'تذكير واتساب' : 'WhatsApp'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'تاريخ الموعد *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'وقت الموعد' : 'Time'}
                  </label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'الوسيط المسؤول' : 'Assigned Broker'}
                  </label>
                  <select
                    value={newEventAgent}
                    onChange={(e) => setNewEventAgent(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  >
                    {agentsList.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'المشروع / الكمبوند' : 'Compound'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Palm Hills, Mountain View"
                    value={newEventCompound}
                    onChange={(e) => setNewEventCompound(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'كود الوحدة المرتبطة' : 'Linked Unit ID'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. S-0001, PH-04"
                    value={newEventUnitId}
                    onChange={(e) => setNewEventUnitId(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-muted font-semibold mb-1">
                  {isArabic ? 'ملاحظات الموعد وتفضيلات العميل' : 'Meeting Notes & Instructions'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isArabic ? 'سجل مكان اللقاء، شروط البوابة أو رغبات المشتري...' : 'Entry instructions, meeting location, client budget...'}
                  value={newEventNotes}
                  onChange={(e) => setNewEventNotes(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-surface border-border text-white' : 'bg-surface border-border text-text'
                  }`}
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2 bg-surface-raised hover:bg-surface-raised text-text-muted rounded-xl font-semibold cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isArabic ? 'تأكيد وحفظ الموعد' : 'Confirm & Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
