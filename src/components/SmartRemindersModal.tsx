import { formatNumber } from '../i18n/format';
import React, { useState, useMemo } from 'react';
import { STORAGE_KEYS, saveJson } from '../data/storage';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  MessageSquare, 
  Flame, 
  Sparkles, 
  X, 
  User, 
  Building2, 
  DollarSign, 
  Share2, 
  BellRing,
  ChevronDown
} from 'lucide-react';
import { FollowUpTask, TeamMember, KanbanStage } from '../types';

interface SmartRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: FollowUpTask[];
  onUpdateTasks: (tasks: FollowUpTask[]) => void;
  team: TeamMember[];
  isArabic: boolean;
  theme?: 'dark' | 'light';
  onNavigateToTask?: (taskId: string) => void;
}

export const SmartRemindersModal: React.FC<SmartRemindersModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onUpdateTasks,
  team,
  isArabic,
  theme = 'dark',
  onNavigateToTask
}) => {
  const isDark = theme === 'dark';
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'today' | 'p1'>('p1');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [dontShowToday, setDontShowToday] = useState(false);
  const [reschedulingTaskId, setReschedulingTaskId] = useState<string | null>(null);
  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);

  // Analyze Tasks for Overdue, Due Today, and calculate urgency scores
  const analyzedTasks = useMemo(() => {
    const todayMidnight = new Date(todayStr);

    return tasks.map(task => {
      const isCompleted = task.stage === 'completed' || Boolean(task.completedAt);
      const dueDateObj = task.dueDate ? new Date(task.dueDate) : new Date();
      
      // Calculate days difference (negative = overdue)
      const diffTime = dueDateObj.getTime() - todayMidnight.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      
      const isOverdue = !isCompleted && diffDays < 0;
      const isDueToday = !isCompleted && diffDays === 0;
      const daysOverdue = isOverdue ? Math.abs(diffDays) : 0;

      // Calculate Priority Execution Score (0 - 100)
      let score = 20; // baseline

      if (isOverdue) {
        score += Math.min(40, daysOverdue * 15); // +15 pts per day overdue
      } else if (isDueToday) {
        score += 25; // due today urgency
      }

      // Priority Level bonus
      if (task.priority === 'urgent') score += 30;
      else if (task.priority === 'high') score += 20;
      else if (task.priority === 'medium') score += 10;
      else score += 5;

      // Deal Value impact
      const dealVal = task.dealValue || 0;
      if (dealVal >= 20000000) score += 20;
      else if (dealVal >= 10000000) score += 15;
      else if (dealVal >= 5000000) score += 10;

      // Stage criticality
      if (task.stage === 'contract') score += 15;
      else if (task.stage === 'negotiation') score += 12;
      else if (task.stage === 'viewing') score += 10;

      // Tier categorization
      let tier: 'P1' | 'P2' | 'P3' = 'P3';
      if (isOverdue || (task.priority === 'urgent' && isDueToday) || (dealVal >= 15000000 && isDueToday)) {
        tier = 'P1'; // Immediate Urgency
      } else if (isDueToday || task.priority === 'urgent') {
        tier = 'P2'; // Today's Commitment
      } else {
        tier = 'P3'; // Pipeline Progression
      }

      return {
        ...task,
        isCompleted,
        isOverdue,
        isDueToday,
        daysOverdue,
        executionScore: Math.min(100, score),
        tier
      };
    });
  }, [tasks, todayStr]);

  // Overall statistics
  const stats = useMemo(() => {
    const overdue = analyzedTasks.filter(t => t.isOverdue);
    const dueToday = analyzedTasks.filter(t => t.isDueToday);
    const p1Tasks = analyzedTasks.filter(t => t.tier === 'P1' && !t.isCompleted);
    
    const valueAtRisk = overdue.reduce((sum, t) => sum + (t.dealValue || 0), 0);
    const todayValue = dueToday.reduce((sum, t) => sum + (t.dealValue || 0), 0);

    // Agents with overdue tasks (Bottlenecks)
    const agentOverdueMap: Record<string, number> = {};
    overdue.forEach(t => {
      const ag = t.agent || 'غير محدد';
      agentOverdueMap[ag] = (agentOverdueMap[ag] || 0) + 1;
    });

    return {
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      p1Count: p1Tasks.length,
      valueAtRisk,
      todayValue,
      agentOverdueMap
    };
  }, [analyzedTasks]);

  // Filtered list sorted by execution score
  const displayTasks = useMemo(() => {
    let list = analyzedTasks.filter(t => !t.isCompleted);

    if (selectedAgentFilter !== 'all') {
      list = list.filter(t => t.agent === selectedAgentFilter);
    }

    if (activeTab === 'p1') {
      list = list.filter(t => t.tier === 'P1');
    } else if (activeTab === 'overdue') {
      list = list.filter(t => t.isOverdue);
    } else if (activeTab === 'today') {
      list = list.filter(t => t.isDueToday);
    }

    // Sort descending by execution score
    return list.sort((a, b) => b.executionScore - a.executionScore);
  }, [analyzedTasks, activeTab, selectedAgentFilter]);

  // Handle Mark Completed
  const handleMarkComplete = (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          stage: 'completed' as KanbanStage,
          completedAt: new Date().toISOString()
        };
      }
      return t;
    });
    onUpdateTasks(updated);
  };

  // Handle Reschedule
  const handleReschedule = (taskId: string, daysToAdd: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    const newDueDate = targetDate.toISOString().slice(0, 10);

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          dueDate: newDueDate,
          notes: `${t.notes || ''} [تم تأجيل الموعد إلى ${newDueDate}]`
        };
      }
      return t;
    });

    onUpdateTasks(updated);
    setReschedulingTaskId(null);
  };

  // Handle Reassign
  const handleReassign = (taskId: string, newAgent: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          agent: newAgent,
          notes: `${t.notes || ''} [تمت إعادة التعيين إلى المستشار ${newAgent}]`
        };
      }
      return t;
    });

    onUpdateTasks(updated);
    setReassigningTaskId(null);
  };

  // Handle Close & Remember Preference
  const handleCloseModal = () => {
    if (dontShowToday) {
      saveJson(STORAGE_KEYS.remindersSuppressed, todayStr);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-surface backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark 
            ? 'bg-surface border-border text-text shadow-blue-500/10' 
            : 'bg-white border-border text-text shadow-xl'
        }`}
      >
        {/* Modal Top Header with Priority AI Banner */}
        <div className={`p-5 border-b relative ${
          isDark 
            ? 'bg-gradient-to-r from-surface via-surface to-indigo-950/60 border-border' 
            : 'bg-gradient-to-r from-blue-50 via-indigo-50/50 to-accent border-border'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative p-3 rounded-2xl bg-gradient-to-tr from-accent via-rose-500 to-indigo-600 text-white shadow-lg shadow-rose-500/20 shrink-0">
                <BellRing className="w-6 h-6 animate-pulse" />
                {stats.overdueCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 border-2 border-white rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                    {stats.overdueCount}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold">
                    {isArabic ? 'لوحة التذكيرات الذكية وتنسيق الأولويات' : 'Smart Reminders & Priority Engine'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-accent text-accent border border-accent flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Worklenz AI
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-text-muted' : 'text-text-muted'}`}>
                  {isArabic 
                    ? 'تحليل لحظي للمهام المتأخرة، وتأمين الصفقات الكبرى، واقتراح خطة العمل اليومية للمستشارين'
                    : 'Real-time analysis of overdue tasks, high-value deals protection, and daily action roadmap'}
                </p>
              </div>
            </div>

            <button
              onClick={handleCloseModal}
              className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                isDark ? 'hover:bg-surface-raised text-text-muted hover:text-white' : 'hover:bg-surface-raised text-text-muted hover:text-text'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {/* Overdue Count */}
            <div className={`p-3 rounded-2xl border transition ${
              stats.overdueCount > 0 
                ? isDark ? 'bg-rose-950/40 border-rose-800/60' : 'bg-rose-50 border-rose-200' 
                : isDark ? 'bg-surface-raised border-border' : 'bg-surface-raised border-border'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-medium ${isDark ? 'text-text-muted' : 'text-text-muted'}`}>
                  {isArabic ? 'مهام متأخرة' : 'Overdue Tasks'}
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-rose-500">{stats.overdueCount}</span>
                <span className="text-[10px] text-text-muted">{isArabic ? 'مهمة' : 'tasks'}</span>
              </div>
            </div>

            {/* Due Today */}
            <div className={`p-3 rounded-2xl border transition ${
              isDark ? 'bg-accent border-accent' : 'bg-accent border-accent'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-medium ${isDark ? 'text-text-muted' : 'text-text-muted'}`}>
                  {isArabic ? 'تستحق اليوم' : 'Due Today'}
                </span>
                <Clock className="w-4 h-4 text-accent" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-accent">{stats.dueTodayCount}</span>
                <span className="text-[10px] text-text-muted">{isArabic ? 'مهمة' : 'tasks'}</span>
              </div>
            </div>

            {/* Pipeline Value at Risk */}
            <div className={`p-3 rounded-2xl border transition ${
              isDark ? 'bg-indigo-950/40 border-indigo-800/50' : 'bg-indigo-50 border-indigo-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-medium ${isDark ? 'text-text-muted' : 'text-text-muted'}`}>
                  {isArabic ? 'صفقات تحت المتابعة' : 'Deals Value at Risk'}
                </span>
                <DollarSign className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-indigo-400">
                  {stats.valueAtRisk > 0 ? (stats.valueAtRisk / 1000000).toFixed(1) : '0'}
                </span>
                <span className="text-[10px] text-text-muted">{isArabic ? 'مليون ج.م' : 'M EGP'}</span>
              </div>
            </div>

            {/* Immediate Action Needed */}
            <div className={`p-3 rounded-2xl border transition ${
              isDark ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-medium ${isDark ? 'text-text-muted' : 'text-text-muted'}`}>
                  {isArabic ? 'أولوية قصوى P1' : 'P1 High Urgency'}
                </span>
                <Flame className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-emerald-500">{stats.p1Count}</span>
                <span className="text-[10px] text-text-muted">{isArabic ? 'عنصر حاسم' : 'items'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Roadmap Filter Tabs & Agent Selector */}
        <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-surface border-border' : 'bg-surface border-border'
        }`}>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('p1')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'p1'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : isDark ? 'text-text-muted hover:text-white hover:bg-surface-raised' : 'text-text-muted hover:bg-surface-raised'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isArabic ? 'الخطة العاجلة (P1)' : 'Immediate P1'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {stats.p1Count}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('overdue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'overdue'
                  ? 'bg-accent text-white shadow-md shadow-accent/20'
                  : isDark ? 'text-text-muted hover:text-white hover:bg-surface-raised' : 'text-text-muted hover:bg-surface-raised'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isArabic ? 'المتأخرات فقط' : 'Overdue Only'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {stats.overdueCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : isDark ? 'text-text-muted hover:text-white hover:bg-surface-raised' : 'text-text-muted hover:bg-surface-raised'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isArabic ? 'مواعيد اليوم' : 'Due Today'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {stats.dueTodayCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'all'
                  ? isDark ? 'bg-surface-raised text-white' : 'bg-surface-raised text-text'
                  : isDark ? 'text-text-muted hover:text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              <span>{isArabic ? 'كافة المهام المعلقة' : 'All Pending'}</span>
            </button>
          </div>

          {/* Agent Filter */}
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isDark ? 'text-text-muted' : 'text-text-muted'}`}>
              {isArabic ? 'المستشار:' : 'Agent:'}
            </span>
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className={`px-2.5 py-1 text-xs rounded-xl border font-medium focus:outline-none cursor-pointer ${
                isDark ? 'bg-surface-raised border-border text-text' : 'bg-white border-border text-text'
              }`}
            >
              <option value="all">{isArabic ? 'كافة الفريق' : 'All Agents'}</option>
              {team.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Task Recommendation List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {displayTasks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold">
                {isArabic ? 'لا توجد مهام متأخرة أو حرجة في هذا التصنيف!' : 'No overdue or urgent tasks found!'}
              </h3>
              <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-text-muted' : 'text-text-muted'}`}>
                {isArabic 
                  ? 'رائع! كافة المواعيد منضبطة وجدول المتابعات يسير وفق الخطة الزمنية المعتمدة في 6 أكتوبر.'
                  : 'Great job! All team deadlines are respected and the schedule is moving smoothly.'}
              </p>
            </div>
          ) : (
            displayTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all hover:shadow-md ${
                  task.isOverdue
                    ? isDark 
                      ? 'bg-rose-950/20 border-rose-800/60 hover:border-rose-700' 
                      : 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                    : task.isDueToday
                    ? isDark 
                      ? 'bg-accent border-accent hover:border-accent' 
                      : 'bg-accent border-accent hover:border-accent'
                    : isDark 
                      ? 'bg-surface-raised border-border hover:border-border' 
                      : 'bg-surface border-border hover:border-border'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Title & Priority Badge */}
                  <div className="flex items-start gap-3 flex-1">
                    {/* Execution Priority Score Indicator */}
                    <div 
                      className={`px-2.5 py-1.5 rounded-xl flex flex-col items-center justify-center shrink-0 font-mono font-bold ${
                        task.executionScore >= 80 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                          : task.executionScore >= 60 
                          ? 'bg-accent text-accent border border-accent' 
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      }`}
                      title={isArabic ? 'مؤشر أولوية التنفيذ الذكي' : 'AI Execution Priority'}
                    >
                      <span className="text-xs">{task.executionScore}</span>
                      <span className="text-[8px] uppercase tracking-tighter">
                        {task.tier}
                      </span>
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm leading-snug hover:text-blue-400 transition cursor-pointer"
                          onClick={() => onNavigateToTask && onNavigateToTask(task.id)}
                        >
                          {task.title}
                        </h4>

                        {task.isOverdue && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
                            {isArabic ? `متأخرة ${task.daysOverdue} يوم` : `${task.daysOverdue}d overdue`}
                          </span>
                        )}

                        {task.isDueToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-accent text-text font-sans">
                            {isArabic ? 'موعد اليوم' : 'Due Today'}
                          </span>
                        )}
                      </div>

                      {/* Client, Compound, & Agent details */}
                      <div className={`flex items-center gap-3 text-xs flex-wrap ${isDark ? 'text-text-muted' : 'text-text-muted'}`}>
                        {task.clientName && (
                          <span className="flex items-center gap-1 font-medium">
                            <User className="w-3 h-3 text-blue-400" />
                            {task.clientName}
                          </span>
                        )}

                        {task.compound && (
                          <span className="flex items-center gap-1 font-medium">
                            <Building2 className="w-3 h-3 text-accent" />
                            {task.compound}
                          </span>
                        )}

                        {task.agent && (
                          <span className="flex items-center gap-1 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            {task.agent}
                          </span>
                        )}

                        {task.dealValue && (
                          <span className="font-mono font-bold text-emerald-400">
                            {formatNumber(task.dealValue)} {isArabic ? 'ج.م' : 'EGP'}
                          </span>
                        )}

                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3 h-3" />
                            {task.dueDate} {task.dueTime ? `@ ${task.dueTime}` : ''}
                          </span>
                        )}
                      </div>

                      {task.notes && (
                        <p className={`text-[11px] line-clamp-1 italic ${isDark ? 'text-text-muted' : 'text-text-muted'}`}>
                          &quot;{task.notes}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Immediate Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 flex-wrap">
                    {/* Mark Done */}
                    <button
                      onClick={() => handleMarkComplete(task.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-600/30"
                      title={isArabic ? 'إنجاز المهمة فوراً' : 'Mark as completed'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'إنجاز' : 'Done'}</span>
                    </button>

                    {/* WhatsApp Fast Contact */}
                    {task.clientPhone && (
                      <a
                        href={`https://wa.me/${task.clientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          isArabic 
                            ? `تحياتنا من شركة عقارات 6 أكتوبر، بخصوص متابعة ${task.title} لمشروع ${task.compound || '6 أكتوبر'}...`
                            : `Hello from 6th of October Real Estate regarding ${task.title}...`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                        title={isArabic ? 'مراسلة العميل واتساب' : 'WhatsApp Client'}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Quick Reschedule Dropdown Toggle */}
                    <div className="relative">
                      <button
                        onClick={() => setReschedulingTaskId(reschedulingTaskId === task.id ? null : task.id)}
                        className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                          isDark ? 'border-border bg-surface-raised hover:bg-surface-raised text-text-muted' : 'border-border bg-white hover:bg-surface-raised text-text'
                        }`}
                        title={isArabic ? 'تأجيل الموعد' : 'Reschedule'}
                      >
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        <span>{isArabic ? 'تأجيل' : 'Delay'}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {reschedulingTaskId === task.id && (
                        <div className={`absolute left-0 sm:right-0 sm:left-auto mt-1 w-40 rounded-xl border shadow-xl p-1.5 z-30 animate-in fade-in ${
                          isDark ? 'bg-surface-raised border-border text-text' : 'bg-white border-border text-text'
                        }`}>
                          <button
                            onClick={() => handleReschedule(task.id, 1)}
                            className="w-full text-right rtl:text-right ltr:text-left px-2.5 py-1 text-xs rounded-lg hover:bg-blue-600 hover:text-white transition cursor-pointer"
                          >
                            {isArabic ? 'إلى الغد (+1 يوم)' : 'Tomorrow (+1 day)'}
                          </button>
                          <button
                            onClick={() => handleReschedule(task.id, 3)}
                            className="w-full text-right rtl:text-right ltr:text-left px-2.5 py-1 text-xs rounded-lg hover:bg-blue-600 hover:text-white transition cursor-pointer"
                          >
                            {isArabic ? 'بعد 3 أيام' : 'In 3 days'}
                          </button>
                          <button
                            onClick={() => handleReschedule(task.id, 7)}
                            className="w-full text-right rtl:text-right ltr:text-left px-2.5 py-1 text-xs rounded-lg hover:bg-blue-600 hover:text-white transition cursor-pointer"
                          >
                            {isArabic ? 'الأسبوع القادم (+7)' : 'Next week (+7)'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Reassign to another agent */}
                    <div className="relative">
                      <button
                        onClick={() => setReassigningTaskId(reassigningTaskId === task.id ? null : task.id)}
                        className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
                          isDark ? 'border-border bg-surface-raised hover:bg-surface-raised text-text-muted' : 'border-border bg-white hover:bg-surface-raised text-text'
                        }`}
                        title={isArabic ? 'إعادة توجيه المهمة لمستشار آخر' : 'Reassign Agent'}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {reassigningTaskId === task.id && (
                        <div className={`absolute left-0 sm:right-0 sm:left-auto mt-1 w-44 rounded-xl border shadow-xl p-1.5 z-30 animate-in fade-in ${
                          isDark ? 'bg-surface-raised border-border text-text' : 'bg-white border-border text-text'
                        }`}>
                          <p className="text-[10px] text-text-muted px-2 py-1 border-b border-border mb-1">
                            {isArabic ? 'اختر مستشاراً بديلاً:' : 'Assign alternative agent:'}
                          </p>
                          {team.map(member => (
                            <button
                              key={member.id}
                              onClick={() => handleReassign(task.id, member.name)}
                              className="w-full text-right rtl:text-right ltr:text-left px-2.5 py-1 text-xs rounded-lg hover:bg-blue-600 hover:text-white transition flex items-center justify-between cursor-pointer"
                            >
                              <span>{member.name}</span>
                              <span className="text-[9px] text-text-muted">{member.role}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Bottom Footer with Auto-show Checkbox and Close */}
        <div className={`p-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDark ? 'bg-surface border-border' : 'bg-surface border-border'
        }`}>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-text-muted hover:text-text-muted">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>{isArabic ? 'عدم الإظهار تلقائياً عند تسجيل الدخول حتى الغد' : "Don't auto-show again today"}</span>
          </label>

          <div className="flex items-center gap-2.5 self-end">
            <button
              onClick={handleCloseModal}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isDark ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30' : 'bg-surface hover:bg-surface-raised text-white'
              }`}
            >
              {isArabic ? 'متابعة العمل في المنصة' : 'Continue to Workspace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
