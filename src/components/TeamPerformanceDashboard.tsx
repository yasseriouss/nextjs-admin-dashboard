import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
} from 'recharts';
import { 
  FollowUpTask, 
  TeamMember, 
  KanbanStage 
} from '../types';
import { 
  CheckCircle2, 
  Clock, 
  Award, 
  Users, 
  BarChart3, 
  DollarSign, 
  ChevronRight,
  ArrowRightLeft,
  LayoutGrid,
  FolderKanban
} from 'lucide-react';

interface TeamPerformanceDashboardProps {
  tasks: FollowUpTask[];
  team: TeamMember[];
  isArabic: boolean;
  theme?: 'dark' | 'light';
  onNavigateToAgentTasks?: (agentName: string) => void;
  onOpenReassignModal?: () => void;
  onNavigateToGantt?: () => void;
  onNavigateToKanban?: () => void;
}

export const TeamPerformanceDashboard: React.FC<TeamPerformanceDashboardProps> = ({
  tasks,
  team,
  isArabic,
  onNavigateToAgentTasks,
  onOpenReassignModal,
  onNavigateToGantt,
  onNavigateToKanban
}) => {
  const [roleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rate' | 'completed' | 'volume' | 'total'>('rate');
  const [chartView, setChartView] = useState<'rates' | 'breakdown' | 'types'>('rates');

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Compute performance metrics for each team member
  const memberMetrics = useMemo(() => {
    return team.map((member) => {
      // Find all tasks assigned to this member
      const memberTasks = tasks.filter(
        (t) => (t.agent === member.name || t.agent === member.id)
      );

      const total = memberTasks.length;
      const completed = memberTasks.filter((t) => t.stage === 'completed').length;
      const inProgress = memberTasks.filter((t) => t.stage !== 'completed').length;
      const overdue = memberTasks.filter(
        (t) => t.dueDate < todayStr && t.stage !== 'completed'
      ).length;

      // Completion rate percentage
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Closed deals volume
      const closedDeals = memberTasks.filter((t) => t.stage === 'completed');
      const closedVolume = closedDeals.reduce((sum, t) => sum + (t.dealValue || 0), 0);
      const effectiveClosedVolume = closedVolume > 0 ? closedVolume : member.closedVolumeEgp;

      // On-time completion count (completed on or before due date)
      const onTimeCompleted = closedDeals.filter((t) => {
        if (!t.completedAt) return true;
        const compDate = t.completedAt.slice(0, 10);
        return compDate <= t.dueDate;
      }).length;
      const onTimeRate = completed > 0 ? Math.round((onTimeCompleted / completed) * 100) : 100;

      // Task types count breakdown
      const visits = memberTasks.filter(t => t.type === 'visit').length;
      const calls = memberTasks.filter(t => t.type === 'call').length;
      const contracts = memberTasks.filter(t => t.type === 'contract').length;
      const meetings = memberTasks.filter(t => t.type === 'meeting').length;

      return {
        ...member,
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        overdueTasks: overdue,
        completionRate,
        onTimeRate,
        effectiveClosedVolume,
        visitsCount: visits,
        callsCount: calls,
        contractsCount: contracts,
        meetingsCount: meetings
      };
    });
  }, [team, tasks, todayStr]);

  // Overall Team Aggregates
  const teamAggregates = useMemo(() => {
    const totalAllTasks = tasks.length;
    const completedAllTasks = tasks.filter((t) => t.stage === 'completed').length;
    const inProgressAllTasks = tasks.filter((t) => t.stage !== 'completed').length;
    const overdueAllTasks = tasks.filter(
      (t) => t.dueDate < todayStr && t.stage !== 'completed'
    ).length;

    const overallRate = totalAllTasks > 0 ? Math.round((completedAllTasks / totalAllTasks) * 100) : 0;
    const totalClosedVolume = tasks
      .filter((t) => t.stage === 'completed')
      .reduce((sum, t) => sum + (t.dealValue || 0), 0);

    // Top Performer by completion rate (with min 1 task)
    const candidates = [...memberMetrics].filter(m => m.totalTasks > 0);
    candidates.sort((a, b) => b.completionRate - a.completionRate || b.completedTasks - a.completedTasks);
    const topPerformer = candidates[0] || null;

    return {
      totalAllTasks,
      completedAllTasks,
      inProgressAllTasks,
      overdueAllTasks,
      overallRate,
      totalClosedVolume,
      topPerformer
    };
  }, [tasks, memberMetrics, todayStr]);

  // Filtered and Sorted Member List
  const displayedMembers = useMemo(() => {
    let list = memberMetrics;
    if (roleFilter !== 'all') {
      list = list.filter((m) => m.role === roleFilter);
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'rate') return b.completionRate - a.completionRate;
      if (sortBy === 'completed') return b.completedTasks - a.completedTasks;
      if (sortBy === 'volume') return b.effectiveClosedVolume - a.effectiveClosedVolume;
      return b.totalTasks - a.totalTasks;
    });
  }, [memberMetrics, roleFilter, sortBy]);

  // Chart Data: Completion Rates per Broker
  const barChartData = useMemo(() => {
    return displayedMembers.map((m) => ({
      name: m.name.split(' ')[0],
      fullName: m.name,
      completionRate: m.completionRate,
      completed: m.completedTasks,
      inProgress: m.inProgressTasks,
      overdue: m.overdueTasks,
      total: m.totalTasks
    }));
  }, [displayedMembers]);

  // Chart Data: Task Distribution by Stage
  const stageChartData = useMemo(() => {
    const stages: Record<KanbanStage, { nameAr: string; nameEn: string; color: string }> = {
      lead: { nameAr: 'طلبات جديدة', nameEn: 'New Leads', color: 'rgb(100, 116, 139)' },
      contacted: { nameAr: 'تواصل ومتابعة', nameEn: 'In Discussion', color: 'rgb(6, 182, 212)' },
      viewing: { nameAr: 'معاينات مجدولة', nameEn: 'Site Viewings', color: 'rgb(245, 158, 11)' },
      negotiation: { nameAr: 'مفاوضات جارية', nameEn: 'Negotiations', color: 'rgb(139, 92, 246)' },
      contract: { nameAr: 'توقيع عقود', nameEn: 'Contracts', color: 'rgb(59, 130, 246)' },
      completed: { nameAr: 'مهام منجزة', nameEn: 'Completed', color: 'rgb(16, 185, 129)' }
    };

    return Object.entries(stages).map(([stageKey, meta]) => {
      const count = tasks.filter((t) => t.stage === stageKey).length;
      return {
        key: stageKey,
        name: isArabic ? meta.nameAr : meta.nameEn,
        value: count,
        color: meta.color
      };
    }).filter(d => d.value > 0);
  }, [tasks, isArabic]);

  // Task Types Completion Data
  const taskTypeData = useMemo(() => {
    const types = [
      { key: 'visit', nameAr: 'معاينات ميدانية', nameEn: 'Site Visits', color: 'rgb(245, 158, 11)' },
      { key: 'call', nameAr: 'مكالمات هاتفية', nameEn: 'Phone Calls', color: 'rgb(59, 130, 246)' },
      { key: 'whatsapp', nameAr: 'متابعات واتساب', nameEn: 'WhatsApp Follow-ups', color: 'rgb(16, 185, 129)' },
      { key: 'contract', nameAr: 'توثيق عقود', nameEn: 'Contracts', color: 'rgb(139, 92, 246)' },
      { key: 'meeting', nameAr: 'اجتماعات بالمكتب', nameEn: 'Office Meetings', color: 'rgb(236, 72, 153)' }
    ];

    return types.map(t => {
      const typeTasks = tasks.filter(task => task.type === t.key);
      const done = typeTasks.filter(task => task.stage === 'completed').length;
      const rate = typeTasks.length > 0 ? Math.round((done / typeTasks.length) * 100) : 0;
      return {
        name: isArabic ? t.nameAr : t.nameEn,
        total: typeTasks.length,
        done,
        rate,
        color: t.color
      };
    }).filter(t => t.total > 0);
  }, [tasks, isArabic]);

  return (
    <div className="space-y-6">
      {/* Top Section Header & Quick View Navigators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{isArabic ? 'لوحة بيانات معدلات إنجاز المهام للوسطاء' : 'Team Task Completion Analytics'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                Worklenz Live
              </span>
            </h2>
            <p className="text-xs text-text-muted">
              {isArabic 
                ? 'مؤشرات الأداء اللحظية، معدلات الإنجاز الفردية للوسطاء، والرسوم البيانية التفاعلية'
                : 'Real-time broker performance KPIs, completion velocity, and interactive distribution charts'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {onNavigateToKanban && (
            <button
              type="button"
              onClick={onNavigateToKanban}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-raised hover:bg-surface-raised text-text border border-border text-xs font-semibold rounded-xl transition cursor-pointer"
              title={isArabic ? 'العودة إلى لوحة الكانبان' : 'Back to Kanban Board'}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
              <span>{isArabic ? 'لوحة الكانبان' : 'Kanban Board'}</span>
            </button>
          )}

          {onNavigateToGantt && (
            <button
              type="button"
              onClick={onNavigateToGantt}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              title={isArabic ? 'عرض مسارات المشاريع على الجدول الزمني (Gantt Chart)' : 'Real Estate Projects Gantt Timeline'}
            >
              <FolderKanban className="w-3.5 h-3.5 text-accent" />
              <span>{isArabic ? 'الجدول الزمني (Gantt)' : 'Gantt Roadmap'}</span>
            </button>
          )}

          {onOpenReassignModal && (
            <button
              type="button"
              onClick={onOpenReassignModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-raised hover:bg-surface-raised text-text border border-border text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-accent" />
              <span>{isArabic ? 'إعادة توزيع' : 'Reassign'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Banner & High-Level KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overall Completion Rate */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>{isArabic ? 'معدل إنجاز الفريق العام' : 'Overall Completion Rate'}</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {teamAggregates.overallRate}%
            </span>
            <span className="text-xs text-emerald-400 font-semibold">
              {teamAggregates.completedAllTasks} / {teamAggregates.totalAllTasks} {isArabic ? 'مهمة' : 'tasks'}
            </span>
          </div>

          {/* Mini Progress Bar */}
          <div className="w-full h-2 rounded-full bg-surface mt-3 overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              style={{ width: `${teamAggregates.overallRate}%` }}
            />
          </div>
          <div className="text-[10px] text-text-muted mt-2 font-mono flex items-center justify-between">
            <span>{isArabic ? 'المهام النشطة:' : 'Active:'} {teamAggregates.inProgressAllTasks}</span>
            <span className="text-red-400">{isArabic ? 'متأخرة:' : 'Overdue:'} {teamAggregates.overdueAllTasks}</span>
          </div>
        </div>

        {/* KPI 2: Top Performer Broker */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>{isArabic ? 'أنشط وسيط إنجازاً للمهام' : 'Top Completion Performer'}</span>
            <div className="p-2 rounded-xl bg-accent text-accent">
              <Award className="w-4 h-4" />
            </div>
          </div>

          {teamAggregates.topPerformer ? (
            <div>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl ${teamAggregates.topPerformer.avatarBg} text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0`}>
                  {teamAggregates.topPerformer.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <h4 className="text-sm font-bold text-white truncate">{teamAggregates.topPerformer.name}</h4>
                  <p className="text-[11px] text-accent font-mono font-bold">
                    {teamAggregates.topPerformer.completionRate}% {isArabic ? 'معدل إنجاز' : 'Completion'}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-text-muted mt-2">
                {isArabic 
                  ? `أنجز ${teamAggregates.topPerformer.completedTasks} من أصل ${teamAggregates.topPerformer.totalTasks} مهام بنجاح`
                  : `Completed ${teamAggregates.topPerformer.completedTasks} of ${teamAggregates.topPerformer.totalTasks} assigned tasks`}
              </p>
            </div>
          ) : (
            <p className="text-xs text-text-muted">{isArabic ? 'لا توجد بيانات كافية' : 'Insufficient data'}</p>
          )}
        </div>

        {/* KPI 3: Closed Deals Volume from Completed Tasks */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>{isArabic ? 'قيمة الصفقات المغلقة المنجزة' : 'Closed Deal Volume'}</span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-extrabold font-mono text-white">
              {(teamAggregates.totalClosedVolume / 1000000).toFixed(1)}M <span className="text-xs font-normal text-accent">EGP</span>
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              {isArabic ? 'صفقات تم توثيقها وإغلاقها بالكامل' : 'Signed and completed customer transactions'}
            </p>
          </div>

          <div className="text-[10px] text-text-muted pt-2 border-t border-border flex items-center justify-between">
            <span>{isArabic ? 'إجمالي المتابعات:' : 'Total Tasks:'}</span>
            <span className="font-mono text-text-muted font-bold">{teamAggregates.totalAllTasks}</span>
          </div>
        </div>

        {/* KPI 4: Pending & Overdue Urgency */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>{isArabic ? 'المتابعات قيد التنفيذ' : 'In-Progress Follow-ups'}</span>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-extrabold font-mono text-purple-400">
              {teamAggregates.inProgressAllTasks} <span className="text-xs font-normal text-text-muted">{isArabic ? 'مهمة نشطة' : 'active'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span className={`font-semibold ${teamAggregates.overdueAllTasks > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {teamAggregates.overdueAllTasks > 0 ? `⚠️ ${teamAggregates.overdueAllTasks} ${isArabic ? 'مهام متأخرة' : 'overdue'}` : (isArabic ? 'لا توجد متأخرات حرجة' : 'Zero overdue')}
              </span>
            </div>
          </div>

          {onOpenReassignModal && teamAggregates.overdueAllTasks > 0 && (
            <button
              onClick={onOpenReassignModal}
              className="mt-2 text-xs text-accent hover:text-accent font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isArabic ? 'إعادة توزيع المهام المتأخرة' : 'Reassign Overdue'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Charts Hub Container */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isArabic ? 'مخططات معدل الإنجاز وتوزيع المهام' : 'Completion Rate & Task Distribution Charts'}
              </h3>
              <p className="text-[11px] text-text-muted">
                {isArabic 
                  ? 'رؤية بيانية مقارنة لسرعة إنجاز كل وسيط عقاري ونسب المهام المنجزة'
                  : 'Comparative graphical analysis of broker completion velocity and status distribution'}
              </p>
            </div>
          </div>

          {/* Chart View Switcher Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center p-1 bg-surface border border-border rounded-xl text-xs">
              <button
                onClick={() => setChartView('rates')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  chartView === 'rates' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {isArabic ? 'معدل الإنجاز (%)' : 'Completion Rate (%)'}
              </button>
              <button
                onClick={() => setChartView('breakdown')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  chartView === 'breakdown' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {isArabic ? 'توزيع المراحل' : 'Stage Distribution'}
              </button>
              <button
                onClick={() => setChartView('types')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  chartView === 'types' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {isArabic ? 'أنواع المهام' : 'Task Types'}
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rate' | 'completed' | 'volume' | 'total')}
              className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-text-muted focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="rate">{isArabic ? 'ترتيب: معدل الإنجاز' : 'Sort: Completion Rate'}</option>
              <option value="completed">{isArabic ? 'ترتيب: المهام المكتملة' : 'Sort: Completed Tasks'}</option>
              <option value="volume">{isArabic ? 'ترتيب: قيمة المبيعات' : 'Sort: Deal Volume'}</option>
              <option value="total">{isArabic ? 'ترتيب: إجمالي المهام' : 'Sort: Total Tasks'}</option>
            </select>
          </div>
        </div>

        {/* VIEW 1: Member Completion Rates Bar Chart */}
        {chartView === 'rates' && (
          <div className="space-y-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--color-text-muted)" 
                    fontSize={11} 
                    tickLine={false} 
                    dy={10} 
                  />
                  <YAxis 
                    stroke="var(--color-text-muted)" 
                    fontSize={11} 
                    tickLine={false} 
                    unit="%" 
                    domain={[0, 100]} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface)', 
                      borderColor: 'var(--color-border)', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      color: 'var(--color-text)' 
                    }}
                    formatter={(val, _name, item) => [
                      `${val}% (${item.payload.completed}/${item.payload.total} ${isArabic ? 'مهام' : 'tasks'})`, 
                      isArabic ? 'معدل الإنجاز' : 'Completion Rate'
                    ]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  />
                  <Bar 
                    dataKey="completionRate" 
                    radius={[8, 8, 0, 0]} 
                    maxBarSize={48}
                  >
                    {barChartData.map((entry, index) => {
                      const color = entry.completionRate >= 70 
                        ? 'rgb(16, 185, 129)' 
                        : entry.completionRate >= 40 
                        ? 'rgb(245, 158, 11)' 
                        : 'rgb(239, 68, 68)';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Color Legend Bar */}
            <div className="flex items-center justify-center gap-4 text-xs text-text-muted pt-2 border-t border-border">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span>{isArabic ? 'إنجاز مرتفع (≥ 70%)' : 'High Completion (≥ 70%)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-accent" />
                <span>{isArabic ? 'إنجاز متوسط (40% - 69%)' : 'Moderate (40% - 69%)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500" />
                <span>{isArabic ? 'يحتاج متابعة (< 40%)' : 'Needs Attention (< 40%)'}</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Stage Distribution Donut & Volume Chart */}
        {chartView === 'breakdown' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Donut Chart */}
            <div className="h-64 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stageChartData.map((entry, index) => (
                      <Cell key={`cell-pie-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface)', 
                      borderColor: 'var(--color-border)', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      color: 'var(--color-text)' 
                    }}
                    formatter={(val) => [`${val} ${isArabic ? 'مهمة' : 'tasks'}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center KPI Ring */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold font-mono text-white">
                  {teamAggregates.overallRate}%
                </span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                  {isArabic ? 'مكتمل' : 'Completed'}
                </span>
              </div>
            </div>

            {/* Stages Legend Matrix */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                {isArabic ? 'توزيع المهام حسب المراحل:' : 'Tasks by Kanban Stage:'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stageChartData.map((stage) => {
                  const percent = teamAggregates.totalAllTasks > 0 
                    ? Math.round((stage.value / teamAggregates.totalAllTasks) * 100) 
                    : 0;
                  return (
                    <div 
                      key={stage.name}
                      className="p-2.5 rounded-xl bg-surface border border-border flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                        <span className="text-text-muted font-medium">{stage.name}</span>
                      </div>
                      <div className="font-mono text-right rtl:text-left">
                        <span className="font-bold text-white">{stage.value}</span>
                        <span className="text-[10px] text-text-muted ml-1">({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Task Types Completion Matrix */}
        {chartView === 'types' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {taskTypeData.map((type) => (
                <div 
                  key={type.name}
                  className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
                      <span>{type.name}</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {type.rate}% {isArabic ? 'إنجاز' : 'Done'}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${type.rate}%`, backgroundColor: type.color }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-muted font-mono">
                    <span>{isArabic ? 'المنجز:' : 'Completed:'} <strong className="text-white">{type.done}</strong></span>
                    <span>{isArabic ? 'الإجمالي:' : 'Total:'} <strong className="text-white">{type.total}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Team Members Detailed Scorecards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>{isArabic ? 'بطاقات أداء ومعدل إنجاز كل عضو في الفريق' : 'Individual Broker Performance Scorecards'}</span>
            </h3>
            <p className="text-xs text-text-muted">
              {isArabic 
                ? 'تحليل تفصيلي لمعدل إنجاز المهام، حجم المبيعات المحققة، وسرعة الاستجابة' 
                : 'Detailed metric breakdown of task velocity, closed sales volume, and responsiveness'}
            </p>
          </div>

          <span className="text-xs font-mono text-text-muted">
            {displayedMembers.length} {isArabic ? 'وسطاء' : 'Brokers'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedMembers.map((member) => {
            const isTop = teamAggregates.topPerformer?.id === member.id;
            const rateColor = member.completionRate >= 70 
              ? 'text-emerald-400' 
              : member.completionRate >= 40 
              ? 'text-accent' 
              : 'text-rose-400';

            const strokeColor = member.completionRate >= 70 
              ? 'rgb(16, 185, 129)' 
              : member.completionRate >= 40 
              ? 'rgb(245, 158, 11)' 
              : 'rgb(239, 68, 68)';

            // SVG Radial Gauge Calculation
            const radius = 28;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (member.completionRate / 100) * circumference;

            return (
              <div 
                key={member.id}
                className="bg-surface border border-border hover:border-border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group relative overflow-hidden"
              >
                {/* Top Performer Badge */}
                {isTop && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-accent to-accent text-text text-[10px] font-extrabold px-3 py-0.5 rounded-bl-xl shadow-md flex items-center gap-1">
                    <Award className="w-3 h-3 text-text" />
                    <span>{isArabic ? 'الأعلى إنجازاً' : '#1 Performer'}</span>
                  </div>
                )}

                <div>
                  {/* Header: Member Avatar, Name, Radial Gauge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl ${member.avatarBg} text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0`}>
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition flex items-center gap-1.5">
                          <span>{member.name}</span>
                          <span className="text-[10px] font-mono text-text-muted">({member.id})</span>
                        </h4>
                        <p className="text-[11px] text-text-muted">
                          {isArabic ? member.roleTitleAr : member.roleTitleEn}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{isArabic ? 'معدل الانضباط الزمني:' : 'On-time:'} {member.onTimeRate}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Circular Completion Rate Gauge */}
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 70 70">
                        <circle
                          cx="35"
                          cy="35"
                          r={radius}
                          stroke="var(--color-border)"
                          strokeWidth="6"
                          fill="transparent"
                        />
                        <circle
                          cx="35"
                          cy="35"
                          r={radius}
                          stroke={strokeColor}
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-xs font-mono font-extrabold ${rateColor}`}>
                          {member.completionRate}%
                        </span>
                        <span className="text-[8px] text-text-muted uppercase">
                          {isArabic ? 'إنجاز' : 'Rate'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Numbers Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                    <div className="p-2.5 rounded-xl bg-surface border border-border">
                      <span className="text-[10px] text-text-muted block">{isArabic ? 'المنجزة' : 'Done'}</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">{member.completedTasks}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface border border-border">
                      <span className="text-[10px] text-text-muted block">{isArabic ? 'النشطة' : 'Active'}</span>
                      <span className="text-sm font-bold text-blue-400 font-mono">{member.inProgressTasks}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface border border-border">
                      <span className="text-[10px] text-text-muted block">{isArabic ? 'المتأخرة' : 'Overdue'}</span>
                      <span className={`text-sm font-bold font-mono ${member.overdueTasks > 0 ? 'text-red-400' : 'text-text-muted'}`}>
                        {member.overdueTasks}
                      </span>
                    </div>
                  </div>

                  {/* Volume & Specialization */}
                  <div className="p-2.5 rounded-xl bg-surface border border-border mb-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">{isArabic ? 'قيمة المبيعات المحققة:' : 'Closed Volume:'}</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {(member.effectiveClosedVolume / 1000000).toFixed(1)}M EGP
                      </span>
                    </div>
                    {member.specialties && member.specialties.length > 0 && (
                      <div className="text-[10px] text-text-muted flex items-center justify-between pt-1 border-t border-border">
                        <span>{isArabic ? 'الخبرة الميدانية:' : 'Expertise:'}</span>
                        <span className="text-text-muted font-medium truncate max-w-[160px]">
                          {member.specialties.slice(0, 2).join(' • ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  {onNavigateToAgentTasks && (
                    <button
                      onClick={() => onNavigateToAgentTasks(member.name)}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>{isArabic ? `عرض مهام ${member.name.split(' ')[0]}` : 'View Tasks'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  <span className="text-[11px] font-mono text-text-muted">
                    {member.totalTasks} {isArabic ? 'مهمة إجمالاً' : 'total'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
