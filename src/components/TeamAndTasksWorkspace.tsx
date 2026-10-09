import React, { useState, useMemo } from 'react';
import { 
  FollowUpTask, 
  TeamMember, 
  MemberRole, 
  Unit, 
  KanbanStage, 
  ClientLead
} from '../types';
import { 
  TaskKanbanBoard 
} from './TaskKanbanBoard';
import { 
  TeamPerformanceDashboard 
} from './TeamPerformanceDashboard';
import { 
  RealEstateProjectGanttChart 
} from './RealEstateProjectGanttChart';
import { 
  Users, 
  Layers, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRightLeft, 
  MessageSquare, 
  Sparkles, 
  X, 
  ChevronRight,
  Activity,
  LayoutGrid,
  BarChart3,
  FolderKanban
} from 'lucide-react';

interface TeamAndTasksWorkspaceProps {
  tasks: FollowUpTask[];
  onUpdateTasks: (tasks: FollowUpTask[]) => void;
  team: TeamMember[];
  onUpdateTeam: (team: TeamMember[]) => void;
  units: Unit[];
  isArabic: boolean;
  theme?: 'dark' | 'light';
  onOpenSmartReminders?: () => void;
  clients?: ClientLead[];
  onUpdateClients?: (clients: ClientLead[]) => void;
}

export const TeamAndTasksWorkspace: React.FC<TeamAndTasksWorkspaceProps> = ({
  tasks,
  onUpdateTasks,
  team,
  onUpdateTeam,
  units,
  isArabic,
  theme = 'dark',
  onOpenSmartReminders,
  clients = [],
  onUpdateClients
}) => {
  // Main view switcher within the unified workspace
  const [activeSubTab, setActiveSubTab] = useState<'kanban' | 'gantt' | 'performance' | 'workload' | 'urgent'>('kanban');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<FollowUpTask | null>(null);
  
  // Reassignment Modal State
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [sourceMember, setSourceMember] = useState<string>('');
  const [targetMember, setTargetMember] = useState<string>('');

  // Add Member Modal State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<MemberRole>('property_consultant');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCapacity, setNewCapacity] = useState('8');
  const [newSpecialties, setNewSpecialties] = useState('');

  // Dynamic workload calculation tying tasks directly to team members
  const dynamicTeam = useMemo(() => {
    return team.map((member) => {
      // Find all active (non-completed) tasks assigned to this member
      const memberActiveTasks = tasks.filter(
        (t) => (t.agent === member.name || t.agent === member.id) && t.stage !== 'completed'
      );
      // Find completed deals
      const memberClosedDeals = tasks.filter(
        (t) => (t.agent === member.name || t.agent === member.id) && t.stage === 'completed'
      );
      const closedVolume = memberClosedDeals.reduce((sum, t) => sum + (t.dealValue || 0), 0);

      return {
        ...member,
        activeTasksCount: memberActiveTasks.length,
        closedDealsCount: memberClosedDeals.length,
        closedVolumeEgp: closedVolume > 0 ? closedVolume : member.closedVolumeEgp
      };
    });
  }, [team, tasks]);

  // Filtered tasks by selected agent if applied
  const displayedTasks = useMemo(() => {
    if (selectedAgentFilter === 'all') return tasks;
    return tasks.filter(t => t.agent === selectedAgentFilter);
  }, [tasks, selectedAgentFilter]);

  // Urgent & Overdue tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = useMemo(() => {
    return tasks.filter(t => t.dueDate < todayStr && t.stage !== 'completed');
  }, [tasks, todayStr]);

  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.dueDate === todayStr && t.stage !== 'completed');
  }, [tasks, todayStr]);

  // Handle reassigning deals from one member to another
  const handleExecuteReassignment = () => {
    if (!sourceMember || !targetMember || sourceMember === targetMember) return;

    const updatedTasks = tasks.map((task) => {
      if (task.agent === sourceMember && task.stage !== 'completed') {
        return {
          ...task,
          agent: targetMember,
          notes: (task.notes ? task.notes + ' | ' : '') + `[Reassigned from ${sourceMember} to ${targetMember}]`
        };
      }
      return task;
    });

    onUpdateTasks(updatedTasks);
    setIsReassignModalOpen(false);
    setSourceMember('');
    setTargetMember('');
  };

  // Handle adding new team member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-accent', 'bg-cyan-600', 'bg-rose-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const roleTitles: Record<MemberRole, { ar: string; en: string }> = {
      team_leader: { ar: 'قائد فريق مبيعات', en: 'Sales Team Leader' },
      senior_broker: { ar: 'وسيط عقاري أول', en: 'Senior Broker' },
      property_consultant: { ar: 'مستشار عقاري', en: 'Property Consultant' },
      legal_contracts: { ar: 'مسؤول عقود وشهر عقاري', en: 'Contracts & Legal' },
      viewing_media: { ar: 'مسؤول معاينات وميديا', en: 'Viewing & Media' }
    };

    const newMember: TeamMember = {
      id: `TM-${String(team.length + 1).padStart(3, '0')}`,
      name: newName.trim(),
      role: newRole,
      roleTitleAr: roleTitles[newRole].ar,
      roleTitleEn: roleTitles[newRole].en,
      phone: newPhone.trim() || '01000000000',
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '')}@6orealestate.com`,
      avatarBg: randomColor,
      status: 'available',
      maxCapacity: parseInt(newCapacity) || 8,
      activeTasksCount: 0,
      closedDealsCount: 0,
      closedVolumeEgp: 0,
      winRatePercentage: 70,
      onTimeRatePercentage: 90,
      specialties: newSpecialties ? newSpecialties.split(',').map(s => s.trim()) : ['6 October', 'Sheikh Zayed'],
      joinedDate: new Date().toISOString().split('T')[0]
    };

    onUpdateTeam([newMember, ...team]);
    setIsAddMemberModalOpen(false);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewSpecialties('');
  };

  return (
    <div className="space-y-6">
      {/* Unified Top Navigation & Interconnection Header */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-accent to-orange-500 text-text font-bold shadow-lg shadow-accent/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>{isArabic ? 'منظومة فريق العمل والمتابعات المتكاملة' : 'Team & Follow-ups Operations'}</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-accent text-accent border border-accent font-mono">
                  Unified Worklenz
                </span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                {isArabic 
                  ? 'ترابط لحظي بين مهام الكانبان، عبء المهام، وطاقة الوسطاء العقاريين'
                  : 'Interconnected Kanban stages, broker workload distribution, and deal tracking'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Sub-tab Switcher */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          {/* Quick Sub-Tabs */}
          <div className="flex items-center p-1 bg-surface border border-border rounded-xl text-xs flex-wrap">
            <button
              onClick={() => setActiveSubTab('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeSubTab === 'kanban' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{isArabic ? 'لوحة الكانبان' : 'Kanban Pipeline'}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('gantt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeSubTab === 'gantt' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-bold' 
                  : 'text-text-muted hover:text-white'
              }`}
              title={isArabic ? 'عرض الجدول الزمني ومسارات المشاريع العقارية (Gantt Chart)' : 'Real Estate Projects Gantt Timeline'}
            >
              <FolderKanban className="w-3.5 h-3.5 text-accent" />
              <span>{isArabic ? 'الجدول الزمني (Gantt)' : 'Gantt Roadmap'}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('performance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeSubTab === 'performance' 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-bold' 
                  : 'text-text-muted hover:text-white'
              }`}
              title={isArabic ? 'لوحة بيانات معدل إنجاز المهام لكل عضو في الفريق والمخططات البيانية' : 'Task Completion Rate & Broker Performance Charts'}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isArabic ? 'معدل الإنجاز والمخططات' : 'Completion Analytics'}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('workload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeSubTab === 'workload' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isArabic ? 'طاقة الوسطاء' : 'Team Workload'}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('urgent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeSubTab === 'urgent' 
                  ? 'bg-accent text-text font-bold shadow-sm' 
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isArabic ? 'المتأخرات' : 'Overdue'}</span>
              {(overdueTasks.length + todayTasks.length) > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-mono">
                  {overdueTasks.length + todayTasks.length}
                </span>
              )}
            </button>
          </div>

          {/* Smart Reminders Priority Button */}
          {onOpenSmartReminders && (
            <button
              onClick={onOpenSmartReminders}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-accent to-rose-500 hover:from-accent hover:to-rose-400 text-text text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 transition cursor-pointer"
              title={isArabic ? 'فتح لوحة التذكيرات الذكية للمهام المتأخرة وجدول الأولويات' : 'Smart Reminders & Worklenz Priority Roadmap'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isArabic ? 'التذكيرات الذكية' : 'Smart Reminders'}</span>
            </button>
          )}

          {/* Reassign Button */}
          <button
            onClick={() => setIsReassignModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-raised hover:bg-surface-raised text-text text-xs font-semibold rounded-xl border border-border transition cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">{isArabic ? 'إعادة توزيع المهام' : 'Reassign'}</span>
          </button>

          {/* Add Team Member Button */}
          <button
            onClick={() => setIsAddMemberModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isArabic ? 'عضو جديد' : 'Add Member'}</span>
          </button>
        </div>
      </div>

      {/* Quick Team Workload Bar (Visible in all tabs for live context) */}
      <div className="bg-surface border border-border rounded-2xl p-3.5 overflow-x-auto scrollbar-none flex items-center gap-3">
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isArabic ? 'فلترة حسب الوسيط:' : 'Filter by Broker:'}</span>
        </span>

        <button
          onClick={() => setSelectedAgentFilter('all')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
            selectedAgentFilter === 'all'
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-surface-raised text-text-muted hover:bg-surface-raised'
          }`}
        >
          {isArabic ? 'كافة الفريق' : 'All Team'} ({tasks.length})
        </button>

        {dynamicTeam.map((member) => {
          const loadPercent = Math.min(100, Math.round((member.activeTasksCount / member.maxCapacity) * 100));
          const isSelected = selectedAgentFilter === member.name;
          const isOverloaded = loadPercent >= 90;

          return (
            <button
              key={member.id}
              onClick={() => setSelectedAgentFilter(isSelected ? 'all' : member.name)}
              className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-medium transition shrink-0 border cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-600/20 text-white font-bold ring-1 ring-blue-500'
                  : 'border-border bg-surface text-text-muted hover:border-border'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${
                isOverloaded ? 'bg-red-500 animate-pulse' : loadPercent > 60 ? 'bg-accent' : 'bg-emerald-400'
              }`} />
              <span className="truncate max-w-[120px]">{member.name}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-raised text-text-muted">
                {member.activeTasksCount}/{member.maxCapacity}
              </span>
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 1: KANBAN BOARD */}
      {activeSubTab === 'kanban' && (
        <TaskKanbanBoard
          tasks={displayedTasks}
          onUpdateTasks={onUpdateTasks}
          units={units}
          isArabic={isArabic}
          team={dynamicTeam}
          clients={clients}
          onUpdateClients={onUpdateClients}
          initialEditingTask={selectedTaskForEdit}
          onClearInitialEditingTask={() => setSelectedTaskForEdit(null)}
          onNavigateToGantt={() => setActiveSubTab('gantt')}
          onNavigateToPerformance={() => setActiveSubTab('performance')}
        />
      )}

      {/* SUB-VIEW 2: GANTT CHART TIMELINE FOR REAL ESTATE PROJECTS */}
      {activeSubTab === 'gantt' && (
        <RealEstateProjectGanttChart
          tasks={displayedTasks}
          onUpdateTasks={onUpdateTasks}
          units={units}
          team={dynamicTeam}
          isArabic={isArabic}
          theme={theme}
          onOpenTaskModal={(task) => {
            if (task) {
              setSelectedTaskForEdit(task);
            }
            setActiveSubTab('kanban');
          }}
          onNavigateToKanban={() => setActiveSubTab('kanban')}
          onNavigateToPerformance={() => setActiveSubTab('performance')}
        />
      )}

      {/* SUB-VIEW 3: TASK COMPLETION RATE & PERFORMANCE SUB-DASHBOARD (CHARTS) */}
      {activeSubTab === 'performance' && (
        <TeamPerformanceDashboard
          tasks={tasks}
          team={dynamicTeam}
          isArabic={isArabic}
          theme={theme}
          onNavigateToAgentTasks={(agentName) => {
            setSelectedAgentFilter(agentName);
            setActiveSubTab('kanban');
          }}
          onNavigateToKanban={() => setActiveSubTab('kanban')}
          onNavigateToGantt={() => setActiveSubTab('gantt')}
          onOpenReassignModal={() => setIsReassignModalOpen(true)}
        />
      )}

      {/* SUB-VIEW 4: WORKLOAD MATRIX & TEAM CAPACITY */}
      {activeSubTab === 'workload' && (
        <div className="space-y-6">
          {/* Quick Nav Banner to Completion Analytics Dashboard */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-surface to-teal-950/60 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{isArabic ? 'لوحة بيانات معدلات إنجاز المهام والمخططات البيانية' : 'Task Completion Analytics & Chart Sub-Dashboard'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    New Analytics
                  </span>
                </h4>
                <p className="text-xs text-text-muted mt-0.5">
                  {isArabic 
                    ? 'تحليل بياني تفصيلي لمعدل إنجاز كل وسيط، توزيع مراحل الصفقات، وحجم المبيعات'
                    : 'Detailed chart breakdown of task completion rates, stage velocity, and closed volume'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveSubTab('performance')}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/30 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <span>{isArabic ? 'فتح لوحة المخططات' : 'Open Analytics Charts'}</span>
              <ChevronRight className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dynamicTeam.map((member) => {
              const loadPercent = Math.min(100, Math.round((member.activeTasksCount / member.maxCapacity) * 100));
              const isOverloaded = loadPercent >= 90;

              return (
                <div 
                  key={member.id}
                  className="bg-surface border border-border rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-border transition"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${member.avatarBg} text-white font-bold flex items-center justify-center text-sm shadow-md`}>
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{member.name}</span>
                            <span className="text-[10px] font-mono text-text-muted">({member.id})</span>
                          </h4>
                          <p className="text-[11px] text-text-muted">
                            {isArabic ? member.roleTitleAr : member.roleTitleEn}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isOverloaded 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {isOverloaded ? (isArabic ? 'مجهد' : 'Overloaded') : (isArabic ? 'متاح' : 'Available')}
                      </span>
                    </div>

                    {/* Workload Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1 font-mono">
                        <span className="text-text-muted">{isArabic ? 'عبء المتابعات النشطة:' : 'Active Tasks Load:'}</span>
                        <span className={`font-bold ${isOverloaded ? 'text-red-400' : 'text-emerald-400'}`}>
                          {member.activeTasksCount} / {member.maxCapacity} ({loadPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverloaded ? 'bg-red-500' : loadPercent > 60 ? 'bg-accent' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${loadPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="p-2.5 rounded-xl bg-surface border border-border">
                        <span className="text-[10px] text-text-muted block">{isArabic ? 'الصفقات المكتملة' : 'Closed Deals'}</span>
                        <span className="text-sm font-bold text-white font-mono">{member.closedDealsCount}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface border border-border">
                        <span className="text-[10px] text-text-muted block">{isArabic ? 'حجم المبيعات' : 'Closed Volume'}</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          {(member.closedVolumeEgp / 1000000).toFixed(1)}M EGP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setSelectedAgentFilter(member.name);
                        setActiveSubTab('kanban');
                      }}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isArabic ? 'عرض مهام العضو' : 'View Tasks'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
                    </button>

                    <a 
                      href={`https://wa.me/20${member.phone.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{member.phone}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: URGENT & OVERDUE ACTION HUB */}
      {activeSubTab === 'urgent' && (
        <div className="space-y-6">
          {/* Overdue Section */}
          <div className="bg-surface border border-red-900/30 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-base font-bold text-white">
                {isArabic ? 'المتابعات المتأخرة المستحقة' : 'Overdue Follow-up Tasks'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono text-xs font-bold">
                {overdueTasks.length} {isArabic ? 'مهمة' : 'tasks'}
              </span>
            </div>

            {overdueTasks.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p>{isArabic ? 'رائع! لا توجد مهام متأخرة حالياً في جدول الفريق.' : 'Great! No overdue tasks right now.'}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {overdueTasks.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold">
                          {t.dueDate}
                        </span>
                        <h4 className="text-xs font-bold text-white">{t.title}</h4>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1">
                        {isArabic ? 'العميل:' : 'Client:'} <span className="text-text font-semibold">{t.clientName}</span> &bull; {isArabic ? 'الوسيط:' : 'Agent:'} <span className="text-accent font-semibold">{t.agent}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const updated = tasks.map(item => item.id === t.id ? { ...item, stage: 'completed' as KanbanStage, completedAt: new Date().toISOString() } : item);
                          onUpdateTasks(updated);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                      >
                        {isArabic ? 'تم الإنجاز' : 'Mark Done'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today Tasks Section */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-accent" />
              <h3 className="text-base font-bold text-white">
                {isArabic ? 'مهام ومواعيد اليوم' : "Today's Schedule & Action Items"}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-accent text-accent font-mono text-xs font-bold">
                {todayTasks.length} {isArabic ? 'مهمة' : 'tasks'}
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-xs">
                <p>{isArabic ? 'لا توجد مواعيد أخرى مجدولة لليوم.' : 'No additional follow-ups due today.'}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {todayTasks.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h4 className="text-xs font-bold text-white">{t.title}</h4>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {t.clientName} &bull; {t.agent} &bull; {t.compound || '6 October'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const updated = tasks.map(item => item.id === t.id ? { ...item, stage: 'completed' as KanbanStage, completedAt: new Date().toISOString() } : item);
                        onUpdateTasks(updated);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      {isArabic ? 'إكمال' : 'Complete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REASSIGNMENT MODAL */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 text-text shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-accent" />
                <span>{isArabic ? 'إعادة توزيع المهام بين الوسطاء' : 'Bulk Task Reassignment'}</span>
              </h3>
              <button onClick={() => setIsReassignModalOpen(false)} className="text-text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-text-muted mb-4">
              {isArabic 
                ? 'نقل كافة المهام النشطة والمتابعات من وسيط مجهد إلى وسيط آخر لتسريع الإنجاز'
                : 'Transfer all active follow-up tasks from one broker to another to balance workload'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  {isArabic ? 'من الوسيط (المصدر):' : 'From Broker (Source):'}
                </label>
                <select
                  value={sourceMember}
                  onChange={(e) => setSourceMember(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl p-2.5 text-xs text-text"
                >
                  <option value="">{isArabic ? 'اختر الوسيط...' : 'Select Source...'}</option>
                  {team.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.activeTasksCount} {isArabic ? 'مهام نشطة' : 'tasks'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  {isArabic ? 'إلى الوسيط (الهدف):' : 'To Broker (Target):'}
                </label>
                <select
                  value={targetMember}
                  onChange={(e) => setTargetMember(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl p-2.5 text-xs text-text"
                >
                  <option value="">{isArabic ? 'اختر الوسيط البديل...' : 'Select Target...'}</option>
                  {team.filter(m => m.name !== sourceMember).map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.activeTasksCount}/{m.maxCapacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-surface-raised hover:bg-surface-raised text-text-muted"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!sourceMember || !targetMember}
                  onClick={handleExecuteReassignment}
                  className="px-4 py-2 text-xs rounded-xl bg-accent hover:bg-accent text-text font-bold disabled:opacity-50"
                >
                  {isArabic ? 'تنفيذ التوزيع' : 'Reassign Tasks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddMember} className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 text-text shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>{isArabic ? 'إضافة عضو جديد للفريق' : 'Add Team Member'}</span>
              </h3>
              <button type="button" onClick={() => setIsAddMemberModalOpen(false)} className="text-text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  {isArabic ? 'الاسم الكامل *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="محمد الشناوي"
                  className="w-full bg-surface border border-border rounded-xl p-2.5 text-xs text-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  {isArabic ? 'الدور الوظيفي' : 'Role'}
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as MemberRole)}
                  className="w-full bg-surface border border-border rounded-xl p-2.5 text-xs text-text"
                >
                  <option value="property_consultant">{isArabic ? 'مستشار عقاري' : 'Property Consultant'}</option>
                  <option value="senior_broker">{isArabic ? 'وسيط عقاري أول' : 'Senior Broker'}</option>
                  <option value="team_leader">{isArabic ? 'قائد فريق مبيعات' : 'Sales Team Leader'}</option>
                  <option value="legal_contracts">{isArabic ? 'مسؤول عقود وشهر عقاري' : 'Legal & Contracts'}</option>
                  <option value="viewing_media">{isArabic ? 'مسؤول معاينات وميديا' : 'Viewing & Media'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    {isArabic ? 'رقم الهاتف' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full bg-surface border border-border rounded-xl p-2.5 text-xs text-text font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    {isArabic ? 'طاقة المهام القصوى' : 'Max Capacity'}
                  </label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    min="1"
                    max="30"
                    className="w-full bg-surface border border-border rounded-xl p-2.5 text-xs text-text font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  {isArabic ? 'المناطق والكمبوندات المتخصص بها' : 'Specialties'}
                </label>
                <input
                  type="text"
                  value={newSpecialties}
                  onChange={(e) => setNewSpecialties(e.target.value)}
                  placeholder="Mountain View, Palm Hills, O West"
                  className="w-full bg-surface border border-border rounded-xl p-2.5 text-xs text-text"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-surface-raised hover:bg-surface-raised text-text-muted"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  {isArabic ? 'حفظ وإضافة' : 'Save Member'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeamAndTasksWorkspace;
