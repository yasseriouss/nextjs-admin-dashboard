import { formatNumber } from '../i18n/format';
import React, { useState, useMemo, useRef } from 'react';
import { 
  FollowUpTask, 
  KanbanStage, 
  TeamMember, 
  Unit, 
} from '../types';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Building2, 
  User, 
  Users, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Layers, 
  Eye, 
  Check, 
  ArrowRight, 
  Printer, 
  FolderKanban,
  Flag,
  LayoutGrid,
  BarChart3
} from 'lucide-react';

interface RealEstateProjectGanttChartProps {
  tasks: FollowUpTask[];
  onUpdateTasks: (tasks: FollowUpTask[]) => void;
  units?: Unit[];
  team?: TeamMember[];
  isArabic: boolean;
  theme?: 'dark' | 'light';
  onOpenTaskModal?: (task?: FollowUpTask) => void;
  onSelectCompound?: (compoundName: string) => void;
  onNavigateToKanban?: () => void;
  onNavigateToPerformance?: () => void;
}

type GroupByMode = 'compound' | 'agent' | 'stage';
type ZoomMode = 'days' | 'weeks' | 'months';

export const RealEstateProjectGanttChart: React.FC<RealEstateProjectGanttChartProps> = ({
  tasks,
  onUpdateTasks,
  units = [],
  team = [],
  isArabic,
  onOpenTaskModal,
  onSelectCompound,
  onNavigateToKanban,
  onNavigateToPerformance
}) => {
  // Navigation & View States
  const [currentStartDate, setCurrentStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3); // Start 3 days before today for nice historical context
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [dateRangeDays, setDateRangeDays] = useState<number>(30); // 14, 30, 60, 90
  const [groupBy, setGroupBy] = useState<GroupByMode>('compound');
  const [zoomMode] = useState<ZoomMode>('days');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompoundFilter, setSelectedCompoundFilter] = useState<string>('all');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [hoveredTask, setHoveredTask] = useState<FollowUpTask | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Today reference string
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Compute all unique compounds from tasks and units
  const availableCompounds = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.compound && t.compound.trim()) set.add(t.compound.trim());
    });
    units.forEach(u => {
      if (u.compound && u.compound.trim()) set.add(u.compound.trim());
    });
    return Array.from(set).sort();
  }, [tasks, units]);

  // Compute all unique agents
  const availableAgents = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.agent && t.agent.trim()) set.add(t.agent.trim());
    });
    team.forEach(m => {
      if (m.name && m.name.trim()) set.add(m.name.trim());
    });
    return Array.from(set).sort();
  }, [tasks, team]);

  // Filter tasks based on filters and search
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!showCompleted && task.stage === 'completed') return false;
      if (selectedCompoundFilter !== 'all' && (task.compound || '') !== selectedCompoundFilter) return false;
      if (selectedAgentFilter !== 'all' && task.agent !== selectedAgentFilter) return false;
      if (selectedStageFilter !== 'all' && task.stage !== selectedStageFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchClient = task.clientName?.toLowerCase().includes(q);
        const matchCompound = task.compound?.toLowerCase().includes(q);
        const matchAgent = task.agent?.toLowerCase().includes(q);
        if (!matchTitle && !matchClient && !matchCompound && !matchAgent) return false;
      }
      return true;
    });
  }, [tasks, showCompleted, selectedCompoundFilter, selectedAgentFilter, selectedStageFilter, searchQuery]);

  // Timeline Column Grid Dates calculation
  const timelineDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < dateRangeDays; i++) {
      const d = new Date(currentStartDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentStartDate, dateRangeDays]);

  const timelineEndDate = useMemo(() => {
    const end = new Date(currentStartDate);
    end.setDate(end.getDate() + dateRangeDays - 1);
    return end;
  }, [currentStartDate, dateRangeDays]);

  // Helper: calculate task start & end timestamps
  const getTaskDateRange = (task: FollowUpTask) => {
    const due = new Date(task.dueDate || todayStr);
    if (isNaN(due.getTime())) {
      due.setTime(new Date(todayStr).getTime());
    }

    // Determine start date: use createdAt or fallback to 3-5 days before due date
    let start: Date;
    if (task.createdAt) {
      start = new Date(task.createdAt);
      if (isNaN(start.getTime()) || start > due) {
        start = new Date(due);
        start.setDate(due.getDate() - 4);
      }
    } else {
      start = new Date(due);
      // Give a sensible duration according to stage
      const daysBack = task.stage === 'completed' ? 7 : task.stage === 'contract' ? 6 : task.stage === 'negotiation' ? 4 : 3;
      start.setDate(due.getDate() - daysBack);
    }

    start.setHours(0, 0, 0, 0);
    due.setHours(23, 59, 59, 999);

    return { start, end: due };
  };

  // Grouped Tasks based on groupBy state
  const groupedData = useMemo(() => {
    const groups: {
      id: string;
      title: string;
      subtitle?: string;
      badge?: string;
      iconType: 'compound' | 'agent' | 'stage';
      tasks: FollowUpTask[];
      totalVolume: number;
      completedCount: number;
      earliestDate?: Date;
      latestDate?: Date;
      progressPercent: number;
    }[] = [];

    if (groupBy === 'compound') {
      const compoundMap = new Map<string, FollowUpTask[]>();
      filteredTasks.forEach(task => {
        const cName = task.compound && task.compound.trim() ? task.compound.trim() : (isArabic ? 'كمبوندات أخرى / بدون تصنيف' : 'Other / Unassigned Project');
        if (!compoundMap.has(cName)) compoundMap.set(cName, []);
        compoundMap.get(cName)!.push(task);
      });

      compoundMap.forEach((gTasks, cName) => {
        const totalVolume = gTasks.reduce((sum, t) => sum + (t.dealValue || 0), 0);
        const completedCount = gTasks.filter(t => t.stage === 'completed').length;
        const progressPercent = gTasks.length > 0 ? Math.round((completedCount / gTasks.length) * 100) : 0;

        // Find date span
        let earliest: Date | undefined;
        let latest: Date | undefined;
        gTasks.forEach(t => {
          const { start, end } = getTaskDateRange(t);
          if (!earliest || start < earliest) earliest = start;
          if (!latest || end > latest) latest = end;
        });

        groups.push({
          id: `compound-${cName}`,
          title: cName,
          subtitle: `${gTasks.length} ${isArabic ? 'مسارات ومتابعات' : 'milestones'}`,
          badge: totalVolume > 0 ? `${(totalVolume / 1000000).toFixed(1)}M EGP` : undefined,
          iconType: 'compound',
          tasks: gTasks.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')),
          totalVolume,
          completedCount,
          earliestDate: earliest,
          latestDate: latest,
          progressPercent
        });
      });

      // Sort by volume descending or task count
      groups.sort((a, b) => b.totalVolume - a.totalVolume || b.tasks.length - a.tasks.length);

    } else if (groupBy === 'agent') {
      const agentMap = new Map<string, FollowUpTask[]>();
      filteredTasks.forEach(task => {
        const aName = task.agent && task.agent.trim() ? task.agent.trim() : (isArabic ? 'غير مسند' : 'Unassigned');
        if (!agentMap.has(aName)) agentMap.set(aName, []);
        agentMap.get(aName)!.push(task);
      });

      agentMap.forEach((gTasks, aName) => {
        const totalVolume = gTasks.reduce((sum, t) => sum + (t.dealValue || 0), 0);
        const completedCount = gTasks.filter(t => t.stage === 'completed').length;
        const progressPercent = gTasks.length > 0 ? Math.round((completedCount / gTasks.length) * 100) : 0;

        groups.push({
          id: `agent-${aName}`,
          title: aName,
          subtitle: `${gTasks.length} ${isArabic ? 'مهمة مسندة' : 'tasks assigned'}`,
          badge: `${progressPercent}% ${isArabic ? 'إنجاز' : 'Done'}`,
          iconType: 'agent',
          tasks: gTasks.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')),
          totalVolume,
          completedCount,
          progressPercent
        });
      });

      groups.sort((a, b) => b.tasks.length - a.tasks.length);

    } else {
      // By Stage
      const stageOrder: KanbanStage[] = ['lead', 'contacted', 'viewing', 'negotiation', 'contract', 'completed'];
      const stageTitles: Record<KanbanStage, { ar: string; en: string }> = {
        lead: { ar: 'طلبات جديدة (Leads)', en: 'New Inquiries' },
        contacted: { ar: 'تواصل ومتابعة', en: 'In Discussion' },
        viewing: { ar: 'معاينات مجدولة', en: 'Scheduled Viewings' },
        negotiation: { ar: 'مفاوضات وعروض أسعار', en: 'Negotiations & Offers' },
        contract: { ar: 'تعاقد وتوقيع عقود', en: 'Contract & Closing' },
        completed: { ar: 'منجزة ومكتملة', en: 'Completed Deals' }
      };

      stageOrder.forEach(st => {
        const gTasks = filteredTasks.filter(t => t.stage === st);
        if (gTasks.length > 0) {
          const totalVolume = gTasks.reduce((sum, t) => sum + (t.dealValue || 0), 0);
          const completedCount = st === 'completed' ? gTasks.length : 0;
          groups.push({
            id: `stage-${st}`,
            title: isArabic ? stageTitles[st].ar : stageTitles[st].en,
            subtitle: `${gTasks.length} ${isArabic ? 'مهمة' : 'tasks'}`,
            badge: totalVolume > 0 ? `${(totalVolume / 1000000).toFixed(1)}M EGP` : undefined,
            iconType: 'stage',
            tasks: gTasks.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')),
            totalVolume,
            completedCount,
            progressPercent: st === 'completed' ? 100 : Math.round((stageOrder.indexOf(st) / (stageOrder.length - 1)) * 100)
          });
        }
      });
    }

    return groups;
  }, [filteredTasks, groupBy, isArabic]);

  // Overall Timeline KPIs
  const kpis = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.stage === 'completed').length;
    const overdueTasks = tasks.filter(t => t.dueDate < todayStr && t.stage !== 'completed').length;
    const viewingTasks = tasks.filter(t => t.stage === 'viewing' || t.type === 'visit').length;
    const activeProjects = new Set(tasks.map(t => t.compound).filter(Boolean)).size;
    const totalVolume = tasks.reduce((sum, t) => sum + (t.dealValue || 0), 0);
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      viewingTasks,
      activeProjects,
      totalVolume,
      overallProgress
    };
  }, [tasks, todayStr]);

  // Timeline Navigation Controls
  const handleStepDate = (direction: 'prev' | 'next') => {
    const step = zoomMode === 'days' ? 7 : zoomMode === 'weeks' ? 14 : 30;
    setCurrentStartDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + (direction === 'next' ? step : -step));
      return d;
    });
  };

  const handleJumpToToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    d.setHours(0, 0, 0, 0);
    setCurrentStartDate(d);
  };

  // Stage Progression Quick Action
  const handleAdvanceStage = (task: FollowUpTask, e: React.MouseEvent) => {
    e.stopPropagation();
    const stageFlow: KanbanStage[] = ['lead', 'contacted', 'viewing', 'negotiation', 'contract', 'completed'];
    const curIdx = stageFlow.indexOf(task.stage);
    if (curIdx < stageFlow.length - 1) {
      const nextStage = stageFlow[curIdx + 1];
      const updated = tasks.map(t => t.id === task.id ? {
        ...t,
        stage: nextStage,
        completedAt: nextStage === 'completed' ? new Date().toISOString() : t.completedAt
      } : t);
      onUpdateTasks(updated);
    }
  };

  // Stage Color Helpers
  const getStageMeta = (stage: KanbanStage) => {
    switch (stage) {
      case 'lead':
        return { 
          bg: 'bg-blue-600', 
          border: 'border-blue-500', 
          text: 'text-blue-300', 
          progress: 20, 
          labelAr: 'طلب جديد', 
          labelEn: 'Lead' 
        };
      case 'contacted':
        return { 
          bg: 'bg-indigo-600', 
          border: 'border-indigo-500', 
          text: 'text-indigo-300', 
          progress: 40, 
          labelAr: 'تواصل', 
          labelEn: 'Discussion' 
        };
      case 'viewing':
        return { 
          bg: 'bg-accent', 
          border: 'border-accent', 
          text: 'text-accent', 
          progress: 60, 
          labelAr: 'معاينة موقع', 
          labelEn: 'Viewing' 
        };
      case 'negotiation':
        return { 
          bg: 'bg-purple-600', 
          border: 'border-purple-400', 
          text: 'text-purple-200', 
          progress: 80, 
          labelAr: 'مفاوضات', 
          labelEn: 'Negotiation' 
        };
      case 'contract':
        return { 
          bg: 'bg-cyan-600', 
          border: 'border-cyan-400', 
          text: 'text-cyan-200', 
          progress: 90, 
          labelAr: 'تعاقد', 
          labelEn: 'Contract' 
        };
      case 'completed':
        return { 
          bg: 'bg-emerald-600', 
          border: 'border-emerald-400', 
          text: 'text-emerald-200', 
          progress: 100, 
          labelAr: 'منجز', 
          labelEn: 'Completed' 
        };
      default:
        return { 
          bg: 'bg-surface-raised', 
          border: 'border-border', 
          text: 'text-text-muted', 
          progress: 10, 
          labelAr: 'مهمة', 
          labelEn: 'Task' 
        };
    }
  };

  // Calculate horizontal position for a task bar
  const calculateBarPosition = (task: FollowUpTask) => {
    const { start, end } = getTaskDateRange(task);
    const timelineStartMs = currentStartDate.getTime();
    const timelineEndMs = timelineEndDate.getTime();
    const totalTimelineDurationMs = timelineEndMs - timelineStartMs;

    if (totalTimelineDurationMs <= 0) return { left: 0, width: 0, isVisible: false };

    // Clamping to visible window
    const clampedStartMs = Math.max(timelineStartMs, start.getTime());
    const clampedEndMs = Math.min(timelineEndMs, end.getTime());

    if (clampedEndMs < timelineStartMs || clampedStartMs > timelineEndMs) {
      return { left: 0, width: 0, isVisible: false };
    }

    const leftPercent = ((clampedStartMs - timelineStartMs) / totalTimelineDurationMs) * 100;
    const durationPercent = Math.max(1.8, ((clampedEndMs - clampedStartMs) / totalTimelineDurationMs) * 100);

    return {
      left: Math.max(0, Math.min(98, leftPercent)),
      width: Math.min(100 - leftPercent, durationPercent),
      isVisible: true
    };
  };

  // Calculate today's line marker position
  const todayMarkerPosition = useMemo(() => {
    const todayMs = new Date(todayStr).getTime();
    const timelineStartMs = currentStartDate.getTime();
    const timelineEndMs = timelineEndDate.getTime();
    if (todayMs < timelineStartMs || todayMs > timelineEndMs) return null;

    const left = ((todayMs - timelineStartMs) / (timelineEndMs - timelineStartMs)) * 100;
    return left;
  }, [currentStartDate, timelineEndDate, todayStr]);

  return (
    <div className="space-y-6" ref={containerRef}>
      {/* 1. Header & KPI High-Level Real Estate Summary */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span>{isArabic ? 'الجدول الزمني ومسارات المشاريع العقارية (Gantt Chart)' : 'Real Estate Projects Gantt Timeline'}</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
                    Project Roadmap
                  </span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {isArabic
                    ? 'رؤية شاملة للمسارات الزمنية للمشاريع والكمبوندات، مواعيد المعاينات، وإغلاق الصفقات'
                    : 'Interactive chronological tracking of project milestones, property viewings, and closings'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Tools & Group Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Group By Selector */}
            <div className="flex items-center p-1 bg-surface border border-border rounded-xl text-xs">
              <span className="px-2 text-[11px] text-text-muted font-medium">
                {isArabic ? 'تجميع حسب:' : 'Group:'}
              </span>
              <button
                onClick={() => setGroupBy('compound')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                  groupBy === 'compound'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-text-muted hover:text-white'
                }`}
                title={isArabic ? 'تجميع حسب المشروع / الكمبوند' : 'Group by Compound Project'}
              >
                <Building2 className="w-3 h-3" />
                <span>{isArabic ? 'المشروع' : 'Project'}</span>
              </button>
              <button
                onClick={() => setGroupBy('agent')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                  groupBy === 'agent'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-text-muted hover:text-white'
                }`}
                title={isArabic ? 'تجميع حسب الوسيط العقاري' : 'Group by Assigned Broker'}
              >
                <Users className="w-3 h-3" />
                <span>{isArabic ? 'الوسيط' : 'Broker'}</span>
              </button>
              <button
                onClick={() => setGroupBy('stage')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                  groupBy === 'stage'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-text-muted hover:text-white'
                }`}
                title={isArabic ? 'تجميع حسب مرحلة الصفقة' : 'Group by Deal Stage'}
              >
                <Layers className="w-3 h-3" />
                <span>{isArabic ? 'المرحلة' : 'Stage'}</span>
              </button>
            </div>

            {/* Navigation Switchers: Return to Kanban / Open Performance Analytics */}
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

            {onNavigateToPerformance && (
              <button
                type="button"
                onClick={onNavigateToPerformance}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                title={isArabic ? 'عرض لوحة بيانات معدل الإنجاز والمخططات' : 'Completion Rate & Analytics Dashboard'}
              >
                <BarChart3 className="w-3.5 h-3.5 text-white" />
                <span>{isArabic ? 'مخططات الإنجاز' : 'Analytics'}</span>
              </button>
            )}

            {/* Quick Add Task */}
            {onOpenTaskModal && (
              <button
                onClick={() => onOpenTaskModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إضافة مسار / مهمة' : 'Add Milestone'}</span>
              </button>
            )}

            {/* Print Schedule */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-raised text-text-muted border border-border rounded-xl text-xs transition cursor-pointer"
              title={isArabic ? 'طباعة الجدول الزمني' : 'Print Gantt Timeline'}
            >
              <Printer className="w-3.5 h-3.5 text-text-muted" />
              <span className="hidden sm:inline">{isArabic ? 'طباعة' : 'Print'}</span>
            </button>
          </div>
        </div>

        {/* Real Estate Project Gantt Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-border">
          <div className="p-2.5 rounded-xl bg-surface border border-border">
            <span className="text-[10px] text-text-muted block">{isArabic ? 'مشاريع نشطة' : 'Active Projects'}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-sm font-bold text-white font-mono">{kpis.activeProjects}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface border border-border">
            <span className="text-[10px] text-text-muted block">{isArabic ? 'إجمالي المحطات' : 'Total Milestones'}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Flag className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-sm font-bold text-white font-mono">{kpis.totalTasks}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface border border-border">
            <span className="text-[10px] text-text-muted block">{isArabic ? 'معاينات موقع' : 'Site Viewings'}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Eye className="w-3.5 h-3.5 text-accent" />
              <span className="text-sm font-bold text-accent font-mono">{kpis.viewingTasks}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface border border-border">
            <span className="text-[10px] text-text-muted block">{isArabic ? 'صفقات منجزة' : 'Completed Deals'}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400 font-mono">{kpis.completedTasks}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface border border-border">
            <span className="text-[10px] text-text-muted block">{isArabic ? 'محطات متأخرة' : 'Overdue'}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AlertCircle className={`w-3.5 h-3.5 ${kpis.overdueTasks > 0 ? 'text-red-400 animate-pulse' : 'text-text-muted'}`} />
              <span className={`text-sm font-bold font-mono ${kpis.overdueTasks > 0 ? 'text-red-400' : 'text-text-muted'}`}>
                {kpis.overdueTasks}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface border border-border">
            <span className="text-[10px] text-text-muted block">{isArabic ? 'إجمالي المبيعات' : 'Pipeline Value'}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm font-bold text-white font-mono truncate">
                {(kpis.totalVolume / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Timeline Controls Bar (Navigation, Range, Search, Filters) */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-surface border border-border rounded-xl p-1">
              <button
                onClick={() => handleStepDate(isArabic ? 'next' : 'prev')}
                className="p-1.5 text-text-muted hover:text-white rounded-lg hover:bg-surface-raised transition cursor-pointer"
                title={isArabic ? 'الفترة السابقة' : 'Previous Period'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleJumpToToday}
                className="px-3 py-1 text-xs font-bold text-blue-400 hover:text-blue-300 rounded-lg hover:bg-surface-raised transition cursor-pointer flex items-center gap-1"
              >
                <Calendar className="w-3 h-3" />
                <span>{isArabic ? 'اليوم' : 'Today'}</span>
              </button>

              <button
                onClick={() => handleStepDate(isArabic ? 'prev' : 'next')}
                className="p-1.5 text-text-muted hover:text-white rounded-lg hover:bg-surface-raised transition cursor-pointer"
                title={isArabic ? 'الفترة التالية' : 'Next Period'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono font-bold text-text-muted px-2 flex items-center gap-1.5">
              <span className="text-accent">
                {currentStartDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-text-muted">&rarr;</span>
              <span className="text-accent">
                {timelineEndDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Time Span Picker (14, 30, 60 days) */}
            <div className="flex items-center p-1 bg-surface border border-border rounded-xl text-xs font-mono">
              {[14, 30, 60].map(days => (
                <button
                  key={days}
                  onClick={() => setDateRangeDays(days)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    dateRangeDays === days
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Search & Compound Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[160px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5 pointer-events-none rtl:left-auto rtl:right-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isArabic ? 'بحث بالمشروع، العميل، المهمة...' : 'Search task, project, client...'}
                className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-blue-500 rtl:pl-3 rtl:pr-9"
              />
            </div>

            {/* Compound Filter */}
            <select
              value={selectedCompoundFilter}
              onChange={e => setSelectedCompoundFilter(e.target.value)}
              className="bg-surface border border-border rounded-xl px-2.5 py-1.5 text-xs text-text-muted focus:outline-none focus:border-blue-500"
            >
              <option value="all">{isArabic ? 'كافة المشاريع' : 'All Projects'}</option>
              {availableCompounds.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Agent Filter */}
            <select
              value={selectedAgentFilter}
              onChange={e => setSelectedAgentFilter(e.target.value)}
              className="bg-surface border border-border rounded-xl px-2.5 py-1.5 text-xs text-text-muted focus:outline-none focus:border-blue-500"
            >
              <option value="all">{isArabic ? 'كافة الوسطاء' : 'All Brokers'}</option>
              {availableAgents.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Stage Filter */}
            <select
              value={selectedStageFilter}
              onChange={e => setSelectedStageFilter(e.target.value)}
              className="bg-surface border border-border rounded-xl px-2.5 py-1.5 text-xs text-text-muted focus:outline-none focus:border-blue-500"
            >
              <option value="all">{isArabic ? 'كافة المراحل' : 'All Stages'}</option>
              <option value="lead">{isArabic ? 'طلبات جديدة' : 'New Leads'}</option>
              <option value="contacted">{isArabic ? 'تواصل ومتابعة' : 'In Discussion'}</option>
              <option value="viewing">{isArabic ? 'معاينات مجدولة' : 'Viewings'}</option>
              <option value="negotiation">{isArabic ? 'مفاوضات وعروض' : 'Negotiations'}</option>
              <option value="contract">{isArabic ? 'تعاقد وتوقيع' : 'Contracts'}</option>
              <option value="completed">{isArabic ? 'منجزة ومكتملة' : 'Completed'}</option>
            </select>

            {/* Toggle Completed */}
            <button
              onClick={() => setShowCompleted(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showCompleted
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-border bg-surface text-text-muted'
              }`}
              title={isArabic ? 'إظهار / إخفاء المهام المنجزة' : 'Toggle Completed Tasks'}
            >
              <Check className="w-3 h-3" />
              <span>{isArabic ? 'المنجزة' : 'Done'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Gantt Chart Viewport & Timeline Grid */}
      <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Horizontal Scroll Wrapper */}
        <div className="overflow-x-auto min-w-full scrollbar-thin scrollbar-thumb-border scrollbar-track-surface-raised">
          <div className="min-w-[900px] select-none">
            {/* Timeline Header Row (Days & Dates) */}
            <div className="flex border-b border-border bg-surface text-xs font-medium text-text-muted sticky top-0 z-20">
              {/* Left Column Label Header */}
              <div className="w-72 sm:w-80 shrink-0 p-3.5 border-r border-border bg-surface flex items-center justify-between rtl:border-r-0 rtl:border-l">
                <span className="font-bold text-text-muted flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {groupBy === 'compound' 
                      ? (isArabic ? 'المشاريع والكمبوندات العقارية' : 'Real Estate Projects & Deals')
                      : groupBy === 'agent'
                      ? (isArabic ? 'الوسطاء والمستشارين' : 'Brokers & Consultants')
                      : (isArabic ? 'مراحل الصفقات' : 'Deal Stages')}
                  </span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface text-text-muted">
                  {groupedData.length} {isArabic ? 'مجموعات' : 'groups'}
                </span>
              </div>

              {/* Day Grid Headers */}
              <div className="flex-1 flex relative">
                {timelineDays.map((d, idx) => {
                  const dStr = d.toISOString().slice(0, 10);
                  const isToday = dStr === todayStr;
                  const dayNum = d.getDate();
                  const isWeekend = d.getDay() === 5 || d.getDay() === 6; // Friday/Saturday weekend in Egypt

                  return (
                    <div
                      key={idx}
                      className={`flex-1 text-center py-2 border-r border-border last:border-r-0 flex flex-col justify-center items-center relative transition ${
                        isToday ? 'bg-blue-950/40 text-blue-300 font-bold' : isWeekend ? 'bg-surface text-text-muted' : 'text-text-muted'
                      }`}
                      style={{ minWidth: '32px' }}
                    >
                      <span className="text-[9px] uppercase tracking-tighter block">
                        {d.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { weekday: 'narrow' })}
                      </span>
                      <span className={`text-xs font-mono font-bold mt-0.5 ${isToday ? 'text-blue-400 ring-1 ring-blue-500/50 rounded-full px-1 bg-blue-500/10' : ''}`}>
                        {dayNum}
                      </span>
                    </div>
                  );
                })}

                {/* Today Line Indicator in Header */}
                {todayMarkerPosition !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                    style={{ left: `${todayMarkerPosition}%` }}
                  >
                    <span className="absolute -top-1 -translate-x-1/2 bg-red-500 text-white font-bold text-[8px] px-1 rounded shadow-sm">
                      {isArabic ? 'اليوم' : 'Today'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Empty State */}
            {groupedData.length === 0 ? (
              <div className="p-16 text-center text-text-muted">
                <FolderKanban className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">
                  {isArabic ? 'لا توجد مسارات زمنية تطابق الفلترة الحالية' : 'No timeline milestones match your filter'}
                </h4>
                <p className="text-xs text-text-muted max-w-md mx-auto">
                  {isArabic ? 'جرّب تعديل معايير البحث أو تفعيل عرض المهام المنجزة.' : 'Try adjusting search terms or enabling completed tasks.'}
                </p>
              </div>
            ) : (
              /* Groups Rows Container */
              <div className="divide-y divide-border relative">
                {/* Global Today Marker Line Across the whole body */}
                {todayMarkerPosition !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500/80 z-10 pointer-events-none"
                    style={{ 
                      left: `calc(18rem + (100% - 18rem) * ${todayMarkerPosition / 100})` 
                    }}
                  />
                )}

                {groupedData.map(group => (
                  <div key={group.id} className="group/row hover:bg-surface-raised transition">
                    {/* Group Header Row */}
                    <div className="flex items-center bg-surface border-b border-border py-2.5 px-3">
                      <div className="w-72 sm:w-80 shrink-0 flex items-center justify-between pr-3 rtl:pr-0 rtl:pl-3">
                        <div className="flex items-center gap-2 truncate">
                          <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {group.iconType === 'compound' ? (
                              <Building2 className="w-3.5 h-3.5" />
                            ) : group.iconType === 'agent' ? (
                              <User className="w-3.5 h-3.5" />
                            ) : (
                              <Layers className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="truncate">
                            <h4 
                              onClick={() => onSelectCompound && group.iconType === 'compound' && onSelectCompound(group.title)}
                              className={`text-xs font-bold text-white truncate ${group.iconType === 'compound' && onSelectCompound ? 'hover:text-blue-400 cursor-pointer' : ''}`}
                            >
                              {group.title}
                            </h4>
                            <span className="text-[10px] text-text-muted block truncate">
                              {group.subtitle}
                            </span>
                          </div>
                        </div>

                        {group.badge && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface border border-border text-accent shrink-0">
                            {group.badge}
                          </span>
                        )}
                      </div>

                      {/* Group Progress Span Bar */}
                      <div className="flex-1 px-4 flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-surface overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                            style={{ width: `${group.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-text-muted shrink-0">
                          {group.progressPercent}% {isArabic ? 'منجز' : 'completed'}
                        </span>
                      </div>
                    </div>

                    {/* Task Rows under this Group */}
                    <div className="divide-y divide-border">
                      {group.tasks.map(task => {
                        const { left, width, isVisible } = calculateBarPosition(task);
                        const stageMeta = getStageMeta(task.stage);
                        const isOverdue = task.dueDate < todayStr && task.stage !== 'completed';

                        return (
                          <div
                            key={task.id}
                            className="flex items-center min-h-[46px] hover:bg-surface-raised transition text-xs relative"
                          >
                            {/* Left Meta Info */}
                            <div className="w-72 sm:w-80 shrink-0 p-2.5 border-r border-border bg-surface flex items-center justify-between gap-2 rtl:border-r-0 rtl:border-l">
                              <div className="truncate flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      task.stage === 'completed'
                                        ? 'bg-emerald-400'
                                        : isOverdue
                                        ? 'bg-red-500 animate-ping'
                                        : 'bg-blue-400'
                                    }`}
                                  />
                                  <h5 
                                    onClick={() => onOpenTaskModal && onOpenTaskModal(task)}
                                    className="font-semibold text-text truncate cursor-pointer hover:text-blue-300 text-xs"
                                    title={task.title}
                                  >
                                    {task.title}
                                  </h5>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5 truncate">
                                  <span className="text-accent font-medium truncate max-w-[90px]">
                                    {task.clientName}
                                  </span>
                                  <span>&bull;</span>
                                  <span className="text-text-muted font-mono">
                                    {task.agent}
                                  </span>
                                </div>
                              </div>

                              {/* Quick Advance Stage Button */}
                              {task.stage !== 'completed' && (
                                <button
                                  onClick={(e) => handleAdvanceStage(task, e)}
                                  className="p-1 text-text-muted hover:text-emerald-400 rounded-lg hover:bg-surface-raised transition cursor-pointer"
                                  title={isArabic ? 'نقل للمرحلة التالية' : 'Advance Stage'}
                                >
                                  <ArrowRight className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
                                </button>
                              )}
                            </div>

                            {/* Timeline Bar Canvas Area */}
                            <div className="flex-1 h-full min-h-[44px] relative flex items-center">
                              {/* Background Day Column Grid Lines */}
                              <div className="absolute inset-0 flex pointer-events-none">
                                {timelineDays.map((d, idx) => {
                                  const dStr = d.toISOString().slice(0, 10);
                                  const isColToday = dStr === todayStr;
                                  return (
                                    <div
                                      key={idx}
                                      className={`flex-1 border-r border-border last:border-r-0 ${
                                        isColToday ? 'bg-blue-500/5' : ''
                                      }`}
                                    />
                                  );
                                })}
                              </div>

                              {/* Interactive Gantt Milestone Task Bar */}
                              {isVisible && (
                                <div
                                  onClick={() => onOpenTaskModal && onOpenTaskModal(task)}
                                  onMouseEnter={(e) => {
                                    setHoveredTask(task);
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setTooltipPos({ x: rect.left, y: rect.bottom + 6 });
                                  }}
                                  onMouseLeave={() => setHoveredTask(null)}
                                  className={`absolute h-7 rounded-xl flex items-center px-2.5 text-xs text-white font-semibold cursor-pointer shadow-md transition-all duration-200 z-10 overflow-hidden border ${
                                    task.stage === 'completed'
                                      ? 'bg-emerald-600/90 border-emerald-400/60 hover:brightness-110 shadow-emerald-900/30'
                                      : isOverdue
                                      ? 'bg-gradient-to-r from-red-600 to-rose-700 border-red-400 hover:brightness-110 shadow-red-900/40'
                                      : task.stage === 'viewing'
                                      ? 'bg-gradient-to-r from-accent to-orange-600 border-accent shadow-accent/20'
                                      : task.stage === 'contract'
                                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400/80 shadow-cyan-900/30'
                                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400/60 shadow-blue-900/30'
                                  }`}
                                  style={{
                                    left: `${left}%`,
                                    width: `${Math.max(width, 4)}%`
                                  }}
                                >
                                  {/* Internal Stage Progress Fill */}
                                  <div
                                    className="absolute inset-y-0 left-0 bg-white/15 pointer-events-none"
                                    style={{ width: `${stageMeta.progress}%` }}
                                  />

                                  {/* Task Label Content */}
                                  <div className="relative z-10 flex items-center gap-1.5 truncate w-full">
                                    {task.stage === 'completed' ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                                    ) : task.stage === 'viewing' ? (
                                      <Eye className="w-3.5 h-3.5 text-accent shrink-0" />
                                    ) : (
                                      <Clock className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                                    )}

                                    <span className="truncate text-[11px] font-bold">
                                      {task.title}
                                    </span>

                                    {task.dealValue && task.dealValue > 0 && (
                                      <span className="font-mono text-[9px] px-1 rounded bg-black/30 text-white shrink-0 hidden sm:inline">
                                        {(task.dealValue / 1000000).toFixed(1)}M
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Rich Interactive Hover Tooltip Popover */}
      {hoveredTask && tooltipPos && (
        <div
          className="fixed z-50 bg-surface border border-border rounded-2xl p-4 shadow-2xl text-xs text-white w-72 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: Math.min(window.innerHeight - 240, tooltipPos.y),
            left: Math.min(window.innerWidth - 300, Math.max(16, tooltipPos.x))
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-border">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold">
                {hoveredTask.compound || (isArabic ? 'كمبوند غير محدد' : 'General Project')}
              </span>
              <h4 className="font-bold text-sm text-white mt-1">{hoveredTask.title}</h4>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              hoveredTask.stage === 'completed'
                ? 'bg-emerald-500/20 text-emerald-400'
                : hoveredTask.dueDate < todayStr
                ? 'bg-red-500/20 text-red-400'
                : 'bg-accent text-accent'
            }`}>
              {getStageMeta(hoveredTask.stage)[isArabic ? 'labelAr' : 'labelEn']}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] text-text-muted">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">{isArabic ? 'العميل:' : 'Client:'}</span>
              <span className="font-semibold text-white">{hoveredTask.clientName}</span>
            </div>

            {hoveredTask.clientPhone && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted">{isArabic ? 'رقم الهاتف:' : 'Phone:'}</span>
                <span className="font-mono text-emerald-400">{hoveredTask.clientPhone}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-text-muted">{isArabic ? 'الوسيط المسؤول:' : 'Broker:'}</span>
              <span className="font-semibold text-accent">{hoveredTask.agent}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-muted">{isArabic ? 'الموعد المحدد:' : 'Due Date:'}</span>
              <span className={`font-mono font-bold ${
                hoveredTask.dueDate < todayStr && hoveredTask.stage !== 'completed' ? 'text-red-400' : 'text-text'
              }`}>
                {hoveredTask.dueDate} {hoveredTask.dueTime ? `(${hoveredTask.dueTime})` : ''}
              </span>
            </div>

            {hoveredTask.dealValue && hoveredTask.dealValue > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-text-muted">{isArabic ? 'قيمة الصفقة:' : 'Deal Value:'}</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatNumber(hoveredTask.dealValue)} EGP
                </span>
              </div>
            )}

            {hoveredTask.notes && (
              <div className="pt-1.5 border-t border-border text-[10px] text-text-muted line-clamp-2">
                <span className="font-semibold text-text-muted">{isArabic ? 'ملاحظة:' : 'Note:'}</span> {hoveredTask.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Footer Legend & Stage Timeline Roadmap Guide */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-accent" />
          <span className="font-bold text-white">
            {isArabic ? 'دليل المسارات ومراحل الصفقات العقارية:' : 'Milestone Color Legend:'}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-text-muted text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <span>{isArabic ? 'طلب جديد (Leads)' : 'New Leads'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-accent" />
            <span>{isArabic ? 'معاينة موقع' : 'Site Viewings'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-600" />
            <span>{isArabic ? 'مفاوضات وعروض' : 'Negotiations'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-600" />
            <span>{isArabic ? 'تعاقد وتوقيع' : 'Contracts'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600" />
            <span>{isArabic ? 'منجزة ومكتملة' : 'Completed'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <span>{isArabic ? 'متأخرة عن الموعد' : 'Overdue'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
