import React, { useState, useMemo, useRef, useEffect } from 'react';
import { STORAGE_KEYS, saveJson } from '../data/storage';
import { 
  FollowUpTask, 
  KanbanStage, 
  TaskPriority, 
  TaskType,
  TaskCategoryConfig,
  UnitNature,
  Unit,
  TeamMember,
  ClientLead,
  InteractionLog
} from '../types';
import { INITIAL_TEAM } from '../data/mockTeam';
import { getWorklenzSuggestions } from '../services/worklenzSuggestionService';
import { 
  Search, 
  Plus, 
  Clock, 
  Calendar, 
  PhoneCall, 
  MessageSquare, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Users,
  Building2, 
  Eye, 
  DollarSign, 
  ArrowLeft, 
  ArrowRight, 
  Trash2, 
  Download, 
  Printer, 
  Sparkles, 
  Check, 
  X,
  FileSignature,
  Camera,
  SlidersHorizontal,
  Flame,
  CheckCheck,
  Link2,
  GitBranch,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  CheckSquare,
  Square,
  Palette,
  Tag,
  RotateCcw,
  Zap,
  ShoppingBag,
  Key,
  ClipboardList,
  FolderKanban,
  LayoutGrid,
  BarChart3
} from 'lucide-react';
import { RealEstateProjectGanttChart } from './RealEstateProjectGanttChart';

interface TaskKanbanBoardProps {
  tasks: FollowUpTask[];
  onUpdateTasks: (tasks: FollowUpTask[]) => void;
  units: Unit[];
  isArabic: boolean;
  team?: TeamMember[];
  clients?: ClientLead[];
  onUpdateClients?: (clients: ClientLead[]) => void;
  initialEditingTask?: FollowUpTask | null;
  onClearInitialEditingTask?: () => void;
  onNavigateToGantt?: () => void;
  onNavigateToPerformance?: () => void;
}

interface ColumnConfig {
  id: KanbanStage;
  labelEn: string;
  labelAr: string;
  badgeColor: string;
  headerBorder: string;
  bgGlow: string;
  dotColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'lead',
    labelEn: 'New Inquiries',
    labelAr: 'طلبات جديدة',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    headerBorder: 'border-blue-500/40',
    bgGlow: 'hover:border-blue-500/30',
    dotColor: 'rgb(59, 130, 246)'
  },
  {
    id: 'contacted',
    labelEn: 'In Discussion',
    labelAr: 'تم التواصل والمتابعة',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    headerBorder: 'border-indigo-500/40',
    bgGlow: 'hover:border-indigo-500/30',
    dotColor: 'rgb(99, 102, 241)'
  },
  {
    id: 'viewing',
    labelEn: 'Viewing Scheduled',
    labelAr: 'معاينة مجدولة',
    badgeColor: 'bg-accent text-accent border-accent',
    headerBorder: 'border-accent',
    bgGlow: 'hover:border-accent',
    dotColor: 'rgb(245, 158, 11)'
  },
  {
    id: 'negotiation',
    labelEn: 'Negotiation & Offer',
    labelAr: 'مفاوضات وعرض سعر',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    headerBorder: 'border-purple-500/40',
    bgGlow: 'hover:border-purple-500/30',
    dotColor: 'rgb(168, 85, 247)'
  },
  {
    id: 'contract',
    labelEn: 'Contract & Closing',
    labelAr: 'تعاقد وتوقيع عقود',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    headerBorder: 'border-cyan-500/40',
    bgGlow: 'hover:border-cyan-500/30',
    dotColor: 'rgb(6, 182, 212)'
  },
  {
    id: 'completed',
    labelEn: 'Completed Deals',
    labelAr: 'منجزة ومكتملة',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    headerBorder: 'border-emerald-500/40',
    bgGlow: 'hover:border-emerald-500/30',
    dotColor: 'rgb(16, 185, 129)'
  }
];

export const DEFAULT_TASK_CATEGORIES: TaskCategoryConfig[] = [
  {
    id: 'meeting',
    nameAr: 'اجتماعات',
    nameEn: 'Meetings',
    color: 'rgb(239, 68, 68)', // أحمر للاجتماعات (Red for Meetings)
    bgBadge: 'bg-red-500/15',
    borderBadge: 'border-red-500/40',
    textBadge: 'text-red-400',
    iconName: 'meeting'
  },
  {
    id: 'call',
    nameAr: 'مكالمات',
    nameEn: 'Calls',
    color: 'rgb(59, 130, 246)', // أزرق للمكالمات (Blue for Calls)
    bgBadge: 'bg-blue-500/15',
    borderBadge: 'border-blue-500/40',
    textBadge: 'text-blue-400',
    iconName: 'call'
  },
  {
    id: 'followup',
    nameAr: 'متابعات',
    nameEn: 'Follow-ups',
    color: 'rgb(16, 185, 129)', // أخضر للمتابعات (Green for Follow-ups)
    bgBadge: 'bg-emerald-500/15',
    borderBadge: 'border-emerald-500/40',
    textBadge: 'text-emerald-400',
    iconName: 'followup'
  },
  {
    id: 'visit',
    nameAr: 'معاينات',
    nameEn: 'Site Visits',
    color: 'rgb(245, 158, 11)', // كهرماني للمعاينات الميدانية
    bgBadge: 'bg-accent',
    borderBadge: 'border-accent',
    textBadge: 'text-accent',
    iconName: 'visit'
  },
  {
    id: 'contract',
    nameAr: 'عقود وتوثيق',
    nameEn: 'Contracts',
    color: 'rgb(139, 92, 246)', // بنفسجي للعقود والتوثيق
    bgBadge: 'bg-purple-500/15',
    borderBadge: 'border-purple-500/40',
    textBadge: 'text-purple-400',
    iconName: 'contract'
  },
  {
    id: 'payment',
    nameAr: 'دفعات وتحصيل',
    nameEn: 'Payments',
    color: 'rgb(6, 182, 212)', // سماوي للتحصيل والدفعات
    bgBadge: 'bg-cyan-500/15',
    borderBadge: 'border-cyan-500/40',
    textBadge: 'text-cyan-400',
    iconName: 'payment'
  }
];

export const COLOR_PALETTE_PRESETS = [
  { nameAr: 'أحمر قرمزي', nameEn: 'Red', hex: 'rgb(239, 68, 68)' },
  { nameAr: 'أزرق سماوي', nameEn: 'Blue', hex: 'rgb(59, 130, 246)' },
  { nameAr: 'أخضر زمردي', nameEn: 'Green', hex: 'rgb(16, 185, 129)' },
  { nameAr: 'كهرماني ذهبي', nameEn: 'Amber', hex: 'rgb(245, 158, 11)' },
  { nameAr: 'بنفسجي ملكي', nameEn: 'Purple', hex: 'rgb(139, 92, 246)' },
  { nameAr: 'سماوي بحري', nameEn: 'Cyan', hex: 'rgb(6, 182, 212)' },
  { nameAr: 'وردي فاقع', nameEn: 'Pink', hex: 'rgb(236, 72, 153)' },
  { nameAr: 'برتقالي مرجاني', nameEn: 'Orange', hex: 'rgb(249, 115, 22)' },
  { nameAr: 'نيلي فاخر', nameEn: 'Indigo', hex: 'rgb(99, 102, 241)' },
  { nameAr: 'رمادي احترافي', nameEn: 'Slate', hex: 'rgb(100, 116, 139)' }
];

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  onUpdateTasks,
  units,
  isArabic,
  team = [],
  clients = [],
  onUpdateClients,
  initialEditingTask,
  onClearInitialEditingTask,
  onNavigateToGantt,
  onNavigateToPerformance
}) => {
  // Helper to intelligently determine a task's unit nature (Sale / Rent / Followup)
  const determineTaskUnitNature = (task: FollowUpTask, unitsList: Unit[] = units): UnitNature => {
    if (task.unitNature) return task.unitNature;

    // 1. Check linked unitId
    if (task.unitId) {
      const cleanId = task.unitId.trim().toUpperCase();
      const u = unitsList.find(unit => unit.id.toUpperCase() === cleanId);
      if (u) {
        if (u.category === 'rent' || cleanId.startsWith('R-') || (typeof u.price === 'number' && u.price < 500000 && u.propertyType?.toLowerCase().includes('rent'))) {
          return 'rent';
        }
        return 'sale';
      }
      if (cleanId.startsWith('R-') || task.unitId.toLowerCase().includes('rent') || task.unitId.toLowerCase().includes('ايجار') || task.unitId.toLowerCase().includes('إيجار')) {
        return 'rent';
      }
      if (cleanId.startsWith('S-') || task.unitId.toLowerCase().includes('sale') || task.unitId.toLowerCase().includes('بيع')) {
        return 'sale';
      }
    }

    // 2. Check title & notes keywords
    const text = `${task.title} ${task.notes || ''} ${task.compound || ''}`.toLowerCase();
    if (text.includes('إيجار') || text.includes('ايجار') || text.includes('تأجير') || text.includes('rent') || text.includes('lease') || text.includes('مفروش')) {
      return 'rent';
    }
    if (text.includes('بيع') || text.includes('شراء') || text.includes('مشتري') || text.includes('تمليك') || text.includes('sale') || text.includes('buy') || text.includes('حجز') || text.includes('فيلا') || text.includes('شقة') || text.includes('دوبلكس')) {
      return 'sale';
    }

    // 3. Fallback
    return 'followup';
  };

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [unitNatureFilter, setUnitNatureFilter] = useState<string>('all'); // 'all' | 'sale' | 'rent' | 'followup'
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'overdue'>('all');
  const [autoClassifyFeedback, setAutoClassifyFeedback] = useState<{ show: boolean; message: string } | null>(null);

  // Task Categories with localStorage persistence
  const [categories, setCategories] = useState<TaskCategoryConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.kanbanCategories);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_TASK_CATEGORIES;
  });

  // Category Color Customization Modal state
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatColor, setNewCatColor] = useState('rgb(239, 68, 68)');
  const [newCatIcon] = useState('meeting');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  // Worklenz Horizontal Scroll & Interconnected Tracking States
  const boardScrollRef = useRef<HTMLDivElement>(null);
  const [activeThreadDeal, setActiveThreadDeal] = useState<{ id: string; name: string } | null>(null);
  const [worklenzFilter, setWorklenzFilter] = useState<'all' | 'conflicts' | 'connected' | 'dependencies'>('all');
  const [expandedSubtaskCards, setExpandedSubtaskCards] = useState<Set<string>>(new Set());

  // View Mode: Kanban columns vs Project Gantt Timeline
  const [viewMode, setViewMode] = useState<'board' | 'gantt'>('board');

  // Mobile focused column view
  const [mobileFocusStage, setMobileFocusStage] = useState<string | null>(null);

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStage | null>(null);

  // Modal State for New / Edit Task
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FollowUpTask | null>(null);
  const [, setTaskFormError] = useState<string | null>(null);

  // Form State inside Modal
  const [formTitle, setFormTitle] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formStage, setFormStage] = useState<KanbanStage>('lead');
  const [formType, setFormType] = useState<TaskType>('call');
  const [formCategory, setFormCategory] = useState<string>('call');
  const [formCategoryColor, setFormCategoryColor] = useState<string>('');
  const [formUnitNature, setFormUnitNature] = useState<UnitNature>('sale');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formCompound, setFormCompound] = useState('');
  const [formUnitId, setFormUnitId] = useState('');
  const [formDealValue, setFormDealValue] = useState<string>('');
  const [formDueDate, setFormDueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formDueTime, setFormDueTime] = useState<string>('12:00');
  const [formAgent, setFormAgent] = useState('سارة نبيل');
  const [formNotes, setFormNotes] = useState('');

  // Worklenz Team & Workload Integration
  const effectiveTeam = useMemo(() => {
    if (team && team.length > 0) return team;
    return INITIAL_TEAM;
  }, [team]);

  // Agents list derived from team and active tasks
  const availableAgents = useMemo(() => {
    const set = new Set<string>();
    effectiveTeam.forEach(m => set.add(m.name));
    tasks.forEach(t => { if (t.agent) set.add(t.agent); });
    units.forEach(u => { if (u.agent) set.add(u.agent); });
    set.add('سارة نبيل');
    set.add('عمر عادل');
    set.add('أحمد علي');
    set.add('نور طارق');
    return Array.from(set).filter(Boolean);
  }, [tasks, units, effectiveTeam]);

  // Worklenz Smart Suggestions based on compound expertise & workload load
  const worklenzSuggestions = useMemo(() => {
    return getWorklenzSuggestions(formCompound, effectiveTeam, tasks);
  }, [formCompound, effectiveTeam, tasks]);

  const topSuggestion = worklenzSuggestions[0] || null;
  const [hasManuallySelectedAgent, setHasManuallySelectedAgent] = useState(false);

  // SuiteCRM Direct Client Lead Sync State
  const [syncToSuiteCRM, setSyncToSuiteCRM] = useState(true);
  const [suiteCrmSyncToast, setSuiteCrmSyncToast] = useState<{ show: boolean; message: string } | null>(null);

  // Real-time check if current formClientName or formClientPhone matches an existing SuiteCRM lead
  const existingClientMatch = useMemo(() => {
    if (!formClientName.trim()) return null;
    const trimmedName = formClientName.trim().toLowerCase();
    const trimmedPhone = formClientPhone.trim().replace(/\D/g, '');
    return clients.find(c => 
      (c.name && c.name.toLowerCase() === trimmedName) ||
      (trimmedPhone && c.phone && c.phone.replace(/\D/g, '').endsWith(trimmedPhone.slice(-8)))
    ) || null;
  }, [formClientName, formClientPhone, clients]);

  // Automatic suggestion logic: suggest and pre-select best team member for new tasks based on compound and load
  React.useEffect(() => {
    if (isModalOpen && !editingTask && !hasManuallySelectedAgent && topSuggestion) {
      setFormAgent(topSuggestion.member.name);
    }
  }, [formCompound, isModalOpen, editingTask, hasManuallySelectedAgent, topSuggestion]);

  // Today ISO string for date comparisons
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Worklenz: Schedule Overlap Conflict Detector (Same agent, same date, same time slot)
  const scheduleConflictTaskIds = useMemo(() => {
    const conflictIds = new Set<string>();
    const slotMap = new Map<string, string[]>();
    tasks.forEach(t => {
      if (t.stage !== 'completed' && t.agent && t.dueDate && t.dueTime) {
        const slotKey = `${t.agent}__${t.dueDate}__${t.dueTime}`;
        const list = slotMap.get(slotKey) || [];
        list.push(t.id);
        slotMap.set(slotKey, list);
      }
    });
    slotMap.forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach(id => conflictIds.add(id));
      }
    });
    return conflictIds;
  }, [tasks]);

  // Worklenz: Interconnected tasks mapping (sharing unitId, clientName or dependsOn)
  const connectedTasksMap = useMemo(() => {
    const map = new Map<string, FollowUpTask[]>();
    tasks.forEach(t => {
      const related = tasks.filter(other => 
        other.id !== t.id && (
          (t.unitId && other.unitId === t.unitId) ||
          (t.clientName && other.clientName === t.clientName) ||
          (other.dependsOnTaskId === t.id) ||
          (t.dependsOnTaskId === other.id)
        )
      );
      map.set(t.id, related);
    });
    return map;
  }, [tasks]);

  const totalConflictsCount = scheduleConflictTaskIds.size;
  const totalConnectedCount = useMemo(() => {
    return tasks.filter(t => (connectedTasksMap.get(t.id)?.length || 0) > 0 || Boolean(t.dependsOnTaskId)).length;
  }, [tasks, connectedTasksMap]);

  // Horizontal scroll helpers
  const handleScrollHorizontally = (offset: number) => {
    if (boardScrollRef.current) {
      boardScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleScrollToColumn = (colId: string) => {
    const colElement = document.getElementById(`kanban-col-${colId}`);
    if (colElement) {
      colElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  // Toggle subtasks directly on card
  const handleToggleSubtaskItem = (e: React.MouseEvent, taskId: string, subtaskId: string) => {
    e.stopPropagation();
    const updated = tasks.map(t => {
      if (t.id !== taskId || !t.subtasks) return t;
      return {
        ...t,
        subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
      };
    });
    onUpdateTasks(updated);
  };

  const toggleSubtaskCardExpanded = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setExpandedSubtaskCards(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // Helper to get category icon element
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'meeting':
        return <Users className="w-3.5 h-3.5" />;
      case 'call':
        return <PhoneCall className="w-3.5 h-3.5" />;
      case 'followup':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'visit':
        return <Eye className="w-3.5 h-3.5" />;
      case 'contract':
        return <FileSignature className="w-3.5 h-3.5" />;
      case 'payment':
        return <DollarSign className="w-3.5 h-3.5" />;
      default:
        return <Tag className="w-3.5 h-3.5" />;
    }
  };

  // Helper to get a task's effective category (with smart default)
  const getTaskCategory = (task: FollowUpTask): string => {
    if (task.category) return task.category;
    if (task.type === 'meeting') return 'meeting';
    if (task.type === 'call') return 'call';
    if (task.type === 'visit') return 'visit';
    if (task.type === 'contract') return 'contract';
    if (task.type === 'payment') return 'payment';
    return 'followup';
  };

  // Helper to get category details with custom color support
  const getCategoryInfo = (taskOrCat: string | FollowUpTask) => {
    let catId: string;
    let customColor: string | undefined;

    if (typeof taskOrCat === 'string') {
      catId = taskOrCat;
    } else {
      catId = getTaskCategory(taskOrCat);
      customColor = taskOrCat.categoryColor;
    }

    const found = categories.find(c => c.id === catId);
    const color = customColor || found?.color || 'rgb(59, 130, 246)';
    const nameAr = found?.nameAr || catId;
    const nameEn = found?.nameEn || catId;
    const icon = getCategoryIcon(found?.iconName || catId);

    return {
      id: catId,
      nameAr,
      nameEn,
      color,
      icon,
      found
    };
  };

  // Category task counts for legend & filter pills
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(c => { counts[c.id] = 0; });
    tasks.forEach(t => {
      const cat = getTaskCategory(t);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [tasks, categories]);

  // Update a category's custom color
  const handleUpdateCategoryColor = (catId: string, newColor: string) => {
    const updated = categories.map(c => c.id === catId ? { ...c, color: newColor } : c);
    setCategories(updated);
    try {
      saveJson(STORAGE_KEYS.kanbanCategories, updated);
    } catch (e) {}
  };

  // Reset categories to defaults
  const handleResetDefaultCategories = () => {
    if (window.confirm(isArabic ? 'هل تريد استعادة ألوان وتصنيفات المهام الافتراضية؟' : 'Reset task categories and colors to defaults?')) {
      setCategories(DEFAULT_TASK_CATEGORIES);
      try {
        saveJson(STORAGE_KEYS.kanbanCategories, DEFAULT_TASK_CATEGORIES);
      } catch (e) {}
    }
  };

  // Add a new custom category
  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameAr.trim()) return;

    const newId = `custom_${Date.now().toString().slice(-4)}`;
    const newCategory: TaskCategoryConfig = {
      id: newId,
      nameAr: newCatNameAr.trim(),
      nameEn: newCatNameEn.trim() || newCatNameAr.trim(),
      color: newCatColor,
      bgBadge: 'bg-surface-raised',
      borderBadge: 'border-border',
      textBadge: 'text-white',
      iconName: newCatIcon,
      isCustom: true
    };

    const updated = [...categories, newCategory];
    setCategories(updated);
    try {
      saveJson(STORAGE_KEYS.kanbanCategories, updated);
    } catch (e) {}

    setNewCatNameAr('');
    setNewCatNameEn('');
    setIsAddingNewCategory(false);
  };

  // Delete custom category
  const handleDeleteCategory = (catId: string) => {
    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    if (categoryFilter === catId) setCategoryFilter('all');
    try {
      saveJson(STORAGE_KEYS.kanbanCategories, updated);
    } catch (e) {}
  };

  // Filter tasks based on search & filters
  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter(task => {
      // Search matches
      if (q) {
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesClient = task.clientName.toLowerCase().includes(q);
        const matchesCompound = task.compound?.toLowerCase().includes(q);
        const matchesAgent = task.agent.toLowerCase().includes(q);
        const matchesUnit = task.unitId?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesClient && !matchesCompound && !matchesAgent && !matchesUnit) {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

      // Type filter
      if (typeFilter !== 'all' && task.type !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== 'all') {
        const taskCat = getTaskCategory(task);
        if (taskCat !== categoryFilter) return false;
      }

      // Unit Nature filter (sale / rent / followup)
      if (unitNatureFilter !== 'all') {
        const nature = task.unitNature || determineTaskUnitNature(task, units);
        if (nature !== unitNatureFilter) return false;
      }

      // Agent filter
      if (agentFilter !== 'all' && task.agent !== agentFilter) return false;

      // Date filter
      if (dateFilter === 'today') {
        if (task.dueDate !== todayStr) return false;
      } else if (dateFilter === 'overdue') {
        if (task.stage !== 'completed' && task.dueDate < todayStr) return true;
        return false;
      }

      // Worklenz Active Thread Deal Filter
      if (activeThreadDeal) {
        const matchesUnit = task.unitId && task.unitId === activeThreadDeal.id;
        const matchesClient = task.clientName && task.clientName === activeThreadDeal.name;
        const matchesDep = task.dependsOnTaskId === activeThreadDeal.id || task.id === activeThreadDeal.id;
        if (!matchesUnit && !matchesClient && !matchesDep) return false;
      }

      // Worklenz Filter Mode
      if (worklenzFilter === 'conflicts') {
        if (!scheduleConflictTaskIds.has(task.id)) return false;
      } else if (worklenzFilter === 'dependencies') {
        const isDep = Boolean(task.dependsOnTaskId || tasks.some(o => o.dependsOnTaskId === task.id));
        if (!isDep) return false;
      } else if (worklenzFilter === 'connected') {
        const hasConnected = (connectedTasksMap.get(task.id)?.length || 0) > 0;
        if (!hasConnected) return false;
      }

      return true;
    });
  }, [
    tasks, 
    searchQuery, 
    priorityFilter, 
    typeFilter, 
    categoryFilter,
    unitNatureFilter,
    agentFilter, 
    dateFilter, 
    todayStr,
    activeThreadDeal,
    worklenzFilter,
    scheduleConflictTaskIds,
    connectedTasksMap,
    units
  ]);

  // Performance Report Accuracy Breakdown by Unit Nature (Sale / Rent / Followup)
  const natureMetrics = useMemo(() => {
    let salesCount = 0;
    let salesVolume = 0;
    let salesCompleted = 0;

    let rentCount = 0;
    let rentVolume = 0;
    let rentCompleted = 0;

    let followupCount = 0;
    let followupCompleted = 0;

    tasks.forEach(t => {
      const nature = t.unitNature || determineTaskUnitNature(t, units);
      const isComp = t.stage === 'completed';
      const val = t.dealValue || 0;

      if (nature === 'sale') {
        salesCount++;
        salesVolume += val;
        if (isComp) salesCompleted++;
      } else if (nature === 'rent') {
        rentCount++;
        rentVolume += val;
        if (isComp) rentCompleted++;
      } else {
        followupCount++;
        if (isComp) followupCompleted++;
      }
    });

    return {
      sales: {
        count: salesCount,
        volume: salesVolume,
        winRate: salesCount > 0 ? Math.round((salesCompleted / salesCount) * 100) : 0
      },
      rent: {
        count: rentCount,
        volume: rentVolume,
        winRate: rentCount > 0 ? Math.round((rentCompleted / rentCount) * 100) : 0
      },
      followup: {
        count: followupCount,
        winRate: followupCount > 0 ? Math.round((followupCompleted / followupCount) * 100) : 0
      }
    };
  }, [tasks, units]);

  // Auto-Classify All Tasks based on linked Unit nature (Sale / Rent / Followup)
  const handleAutoClassifyAllTasks = () => {
    let saleCnt = 0;
    let rentCnt = 0;
    let followCnt = 0;

    const updated = tasks.map(t => {
      const nature = determineTaskUnitNature(t, units);
      if (nature === 'sale') saleCnt++;
      else if (nature === 'rent') rentCnt++;
      else followCnt++;

      // Synchronize category intelligently if none or standard
      let effectiveCategory = t.category;
      if (!effectiveCategory || effectiveCategory === 'followup') {
        if (t.type === 'meeting') effectiveCategory = 'meeting';
        else if (t.type === 'call') effectiveCategory = 'call';
        else if (t.type === 'visit') effectiveCategory = 'visit';
        else if (t.type === 'contract') effectiveCategory = 'contract';
        else if (nature === 'sale' && t.stage === 'contract') effectiveCategory = 'contract';
      }

      return {
        ...t,
        unitNature: nature,
        autoClassified: true,
        category: effectiveCategory
      };
    });

    onUpdateTasks(updated);
    try {
      saveJson(STORAGE_KEYS.tasks, updated);
    } catch (e) {}

    setAutoClassifyFeedback({
      show: true,
      message: isArabic
        ? `⚡ تم التصنيف التلقائي الشامل لـ ${tasks.length} مهمة: (${saleCnt} صفقات بيع 🛒 | ${rentCnt} صفقات إيجار 🔑 | ${followCnt} متابعات عامة 📋) لتقليل التدخل اليدوي وزيادة دقة تقارير الأداء.`
        : `Auto-classified ${tasks.length} tasks: (${saleCnt} Sales 🛒 | ${rentCnt} Rentals 🔑 | ${followCnt} Follow-ups 📋) to reduce manual work and increase report accuracy.`
    });
    setTimeout(() => setAutoClassifyFeedback(null), 6000);
  };

  // Computed Kanban Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const dueToday = tasks.filter(t => t.dueDate === todayStr && t.stage !== 'completed').length;
    const overdue = tasks.filter(t => t.dueDate < todayStr && t.stage !== 'completed').length;
    const viewings = tasks.filter(t => t.stage === 'viewing').length;
    const negotiations = tasks.filter(t => t.stage === 'negotiation').length;
    const completed = tasks.filter(t => t.stage === 'completed').length;
    const totalPipelineValue = tasks.reduce((sum, t) => sum + (t.dealValue || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      dueToday,
      overdue,
      viewings,
      negotiations,
      completed,
      totalPipelineValue,
      completionRate
    };
  }, [tasks, todayStr]);

  // Stage change handler
  const handleMoveStage = (taskId: string, targetStage: KanbanStage) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          stage: targetStage,
          completedAt: targetStage === 'completed' ? new Date().toISOString() : undefined
        };
      }
      return t;
    });
    onUpdateTasks(updated);
  };

  // Step card forward/backward
  const handleShiftStage = (task: FollowUpTask, direction: 'prev' | 'next') => {
    const stageOrder: KanbanStage[] = ['lead', 'contacted', 'viewing', 'negotiation', 'contract', 'completed'];
    const currentIdx = stageOrder.indexOf(task.stage);
    if (direction === 'prev' && currentIdx > 0) {
      handleMoveStage(task.id, stageOrder[currentIdx - 1]);
    } else if (direction === 'next' && currentIdx < stageOrder.length - 1) {
      handleMoveStage(task.id, stageOrder[currentIdx + 1]);
    }
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm(isArabic ? 'هل تريد بالتأكيد حذف هذه المتابعة؟' : 'Are you sure you want to delete this follow-up?')) {
      onUpdateTasks(tasks.filter(t => t.id !== taskId));
      if (editingTask?.id === taskId) {
        setIsModalOpen(false);
        setEditingTask(null);
      }
    }
  };

  // Open modal for creating a new task
  const handleOpenNewModal = (defaultStage: KanbanStage = 'lead') => {
    setEditingTask(null);
    setHasManuallySelectedAgent(false);
    setFormTitle('');
    setFormClientName('');
    setFormClientPhone('');
    setFormStage(defaultStage);
    setFormType('call');
    setFormCategory('call');
    setFormCategoryColor('');
    setFormUnitNature('sale');
    setFormPriority('medium');
    setFormCompound('');
    setFormUnitId('');
    setFormDealValue('');
    setFormDueDate(new Date().toISOString().slice(0, 10));
    setFormDueTime('12:00');
    // Auto-suggest best team member based on lowest Worklenz active load
    const initialSuggestions = getWorklenzSuggestions('', effectiveTeam, tasks);
    setFormAgent(initialSuggestions[0]?.member.name || availableAgents[0] || 'سارة نبيل');
    setFormNotes('');
    setSyncToSuiteCRM(true);
    setTaskFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing task
  const handleOpenEditModal = (task: FollowUpTask) => {
    setEditingTask(task);
    setHasManuallySelectedAgent(true);
    setTaskFormError(null);
    setFormTitle(task.title);
    setFormClientName(task.clientName);
    setFormClientPhone(task.clientPhone || '');
    setFormStage(task.stage);
    setFormType(task.type);
    setFormCategory(task.category || getTaskCategory(task));
    setFormCategoryColor(task.categoryColor || '');
    setFormUnitNature(task.unitNature || determineTaskUnitNature(task, units));
    setFormPriority(task.priority);
    setFormCompound(task.compound || '');
    setFormUnitId(task.unitId || '');
    setFormDealValue(task.dealValue ? String(task.dealValue) : '');
    setFormDueDate(task.dueDate || new Date().toISOString().slice(0, 10));
    setFormDueTime(task.dueTime || '12:00');
    setFormAgent(task.agent || availableAgents[0] || 'سارة نبيل');
    setFormNotes(task.notes || '');
    setIsModalOpen(true);
  };

  // Automatically trigger edit modal if initialEditingTask prop is passed from Gantt or elsewhere
  useEffect(() => {
    if (initialEditingTask) {
      handleOpenEditModal(initialEditingTask);
      if (onClearInitialEditingTask) {
        onClearInitialEditingTask();
      }
    }
  }, [initialEditingTask]);

  // Save Modal Form
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formClientName.trim()) {
      setTaskFormError(isArabic ? 'يرجى إدخال عنوان المهمة واسم العميل' : 'Please provide task title and client name');
      return;
    }
    setTaskFormError(null);

    if (editingTask) {
      // Update existing
      const updated = tasks.map(t => {
        if (t.id === editingTask.id) {
          return {
            ...t,
            title: formTitle.trim(),
            clientName: formClientName.trim(),
            clientPhone: formClientPhone.trim() || undefined,
            stage: formStage,
            type: formType,
            category: formCategory,
            categoryColor: formCategoryColor ? formCategoryColor.trim() : undefined,
            unitNature: formUnitNature,
            priority: formPriority,
            compound: formCompound.trim() || undefined,
            unitId: formUnitId.trim() || undefined,
            dealValue: formDealValue ? Number(formDealValue) : undefined,
            dueDate: formDueDate,
            dueTime: formDueTime,
            agent: formAgent,
            notes: formNotes.trim() || undefined,
            completedAt: formStage === 'completed' && !t.completedAt ? new Date().toISOString() : t.completedAt
          };
        }
        return t;
      });
      onUpdateTasks(updated);
    } else {
      // Create new
      const newTask: FollowUpTask = {
        id: `TSK-${Date.now().toString().slice(-4)}`,
        title: formTitle.trim(),
        clientName: formClientName.trim(),
        clientPhone: formClientPhone.trim() || undefined,
        stage: formStage,
        type: formType,
        category: formCategory,
        categoryColor: formCategoryColor ? formCategoryColor.trim() : undefined,
        unitNature: formUnitNature,
        priority: formPriority,
        compound: formCompound.trim() || undefined,
        unitId: formUnitId.trim() || undefined,
        dealValue: formDealValue ? Number(formDealValue) : undefined,
        dueDate: formDueDate,
        dueTime: formDueTime,
        agent: formAgent,
        notes: formNotes.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      onUpdateTasks([newTask, ...tasks]);

      // Direct SuiteCRM Client Lead Sync upon Task Creation
      if (syncToSuiteCRM && formClientName.trim() && onUpdateClients) {
        const trimmedName = formClientName.trim().toLowerCase();
        const trimmedPhone = formClientPhone.trim().replace(/\D/g, '');

        const existingClient = clients.find(c => 
          (c.name && c.name.toLowerCase() === trimmedName) ||
          (trimmedPhone && c.phone && c.phone.replace(/\D/g, '').endsWith(trimmedPhone.slice(-8)))
        );

        if (existingClient) {
          const newLog = {
            id: `LOG-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            time: new Date().toTimeString().slice(0, 5),
            type: (formType === 'visit' ? 'visit' : formType === 'call' ? 'call' : formType === 'meeting' ? 'meeting' : 'note') as InteractionLog['type'],
            agent: formAgent,
            summary: isArabic 
              ? `تم ربط وتوثيق متابعة جديدة بالكانبان: "${formTitle.trim()}" (المشروع: ${formCompound || '-'})` 
              : `Follow-up task scheduled in Kanban: "${formTitle.trim()}" (${formCompound || '-'})`
          };
          const updatedClients = clients.map(c => {
            if (c.id === existingClient.id) {
              return {
                ...c,
                assignedAgent: formAgent || c.assignedAgent,
                targetCompound: formCompound.trim() || c.targetCompound,
                dealValue: formDealValue ? Number(formDealValue) : c.dealValue,
                interactionLogs: [newLog, ...(c.interactionLogs || [])]
              };
            }
            return c;
          });
          onUpdateClients(updatedClients);
          try {
            saveJson(STORAGE_KEYS.clients, updatedClients);
          } catch (e) {}
          setSuiteCrmSyncToast({
            show: true,
            message: isArabic 
              ? `تم ربط المهمة وتوثيقها في سجل عميل SuiteCRM "${existingClient.name}" بنجاح!` 
              : `Task linked and logged to SuiteCRM lead "${existingClient.name}" successfully!`
          });
        } else {
          const newLead: ClientLead = {
            id: `CLT-${Date.now().toString().slice(-4)}`,
            name: formClientName.trim(),
            phone: formClientPhone.trim() || '+201000000000',
            email: undefined,
            rating: 'warm',
            source: 'direct',
            stage: 'new',
            targetBudgetMin: formDealValue ? Math.round(Number(formDealValue) * 0.8) : 0,
            targetBudgetMax: formDealValue ? Number(formDealValue) : 0,
            purpose: formUnitNature === 'rent' ? 'rent' : 'invest',
            targetCompound: formCompound.trim() || undefined,
            assignedAgent: formAgent,
            dealValue: formDealValue ? Number(formDealValue) : undefined,
            probability: 50,
            notes: `تم الإنشاء والمزامنة المباشرة من مساحة مهام الكانبان: "${formTitle.trim()}"`,
            interactionLogs: [
              {
                id: `LOG-${Date.now()}`,
                date: new Date().toISOString().slice(0, 10),
                time: new Date().toTimeString().slice(0, 5),
                type: 'note',
                agent: formAgent,
                summary: isArabic 
                  ? `تسجيل عميل جديد مباشرة عبر إنشاء مهمة بالكانبان: "${formTitle.trim()}"` 
                  : `Direct lead registration via Kanban task: "${formTitle.trim()}"`
              }
            ],
            createdAt: new Date().toISOString().slice(0, 10)
          };
          const updatedClients = [newLead, ...clients];
          onUpdateClients(updatedClients);
          try {
            saveJson(STORAGE_KEYS.clients, updatedClients);
          } catch (e) {}
          setSuiteCrmSyncToast({
            show: true,
            message: isArabic 
              ? `تمت مزامنة العميل الجديد "${newLead.name}" مباشرة في وحدة SuiteCRM بنجاح (كود: ${newLead.id})!` 
              : `New client "${newLead.name}" directly synced into SuiteCRM module (ID: ${newLead.id})!`
          });
        }
        setTimeout(() => setSuiteCrmSyncToast(null), 4500);
      }
    }

    setIsModalOpen(false);
    setEditingTask(null);
  };

  // Helper for type icons & labels
  const getTypeInfo = (type: TaskType) => {
    switch (type) {
      case 'visit':
        return {
          icon: <Eye className="w-3.5 h-3.5 text-accent" />,
          labelEn: 'Site Inspection',
          labelAr: 'معاينة ميدانية',
          badge: 'bg-accent text-accent border-accent'
        };
      case 'call':
        return {
          icon: <PhoneCall className="w-3.5 h-3.5 text-blue-400" />,
          labelEn: 'Phone Call',
          labelAr: 'مكالمة هاتفية',
          badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20'
        };
      case 'whatsapp':
        return {
          icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />,
          labelEn: 'WhatsApp Chat',
          labelAr: 'متابعة واتساب',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
        };
      case 'meeting':
        return {
          icon: <Building2 className="w-3.5 h-3.5 text-purple-400" />,
          labelEn: 'Office Meeting',
          labelAr: 'اجتماع بالمكتب',
          badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20'
        };
      case 'contract':
        return {
          icon: <FileSignature className="w-3.5 h-3.5 text-cyan-400" />,
          labelEn: 'Contract Signing',
          labelAr: 'توقيع عقود',
          badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
        };
      case 'payment':
        return {
          icon: <DollarSign className="w-3.5 h-3.5 text-emerald-400" />,
          labelEn: 'Payment Follow-up',
          labelAr: 'تحصيل دفعة',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
        };
      case 'photo':
        return {
          icon: <Camera className="w-3.5 h-3.5 text-pink-400" />,
          labelEn: 'Listing Photo Shoot',
          labelAr: 'تصوير وحدة',
          badge: 'bg-pink-500/10 text-pink-300 border-pink-500/20'
        };
      default:
        return {
          icon: <Calendar className="w-3.5 h-3.5 text-text-muted" />,
          labelEn: 'Follow-up',
          labelAr: 'متابعة',
          badge: 'bg-surface-raised text-text-muted border-border'
        };
    }
  };

  // Helper for priority badges
  const getPriorityInfo = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return {
          labelEn: 'Urgent',
          labelAr: 'عاجل جداً',
          badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40 ring-1 ring-rose-500/30 font-bold',
          dot: 'bg-rose-500 animate-ping'
        };
      case 'high':
        return {
          labelEn: 'High',
          labelAr: 'أولوية عالية',
          badge: 'bg-accent text-accent border-accent font-semibold',
          dot: 'bg-accent'
        };
      case 'medium':
        return {
          labelEn: 'Medium',
          labelAr: 'متوسطة',
          badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-500'
        };
      case 'low':
        return {
          labelEn: 'Low',
          labelAr: 'عادية',
          badge: 'bg-surface-raised text-text-muted border-border',
          dot: 'bg-surface-raised'
        };
    }
  };

  // Export Tasks to CSV
  const handleExportCSV = () => {
    const headers = ['Task ID', 'Title', 'Category', 'Client Name', 'Phone', 'Stage', 'Priority', 'Type', 'Compound', 'Deal Value', 'Due Date', 'Due Time', 'Agent', 'Notes'];
    const rows = filteredTasks.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${isArabic ? getCategoryInfo(t).nameAr : getCategoryInfo(t).nameEn}"`,
      `"${t.clientName.replace(/"/g, '""')}"`,
      t.clientPhone || '',
      t.stage,
      t.priority,
      t.type,
      `"${(t.compound || '').replace(/"/g, '""')}"`,
      t.dealValue || '',
      t.dueDate,
      t.dueTime || '',
      `"${t.agent.replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm-followup-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // WhatsApp quick trigger
  const handleOpenWhatsApp = (e: React.MouseEvent, task: FollowUpTask) => {
    e.stopPropagation();
    if (!task.clientPhone) {
      setSuiteCrmSyncToast({
        show: true,
        message: isArabic ? 'لا يوجد رقم هاتف مسجل لهذا العميل لتشغيل واتساب' : 'No phone number saved for this client to trigger WhatsApp'
      });
      setTimeout(() => setSuiteCrmSyncToast(null), 3500);
      return;
    }
    const cleanPhone = task.clientPhone.replace(/[^0-9]/g, '');
    const greeting = isArabic
      ? `مرحباً ${task.clientName}، بخصوص ${task.title} في ${task.compound || '6 أكتوبر'}... نود التأكيد معكم.`
      : `Hello ${task.clientName}, regarding ${task.title} at ${task.compound || '6th of October'}...`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Analytics KPI Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>{isArabic ? 'لوحة كانبان الشاملة للمتابعات والمهام' : 'Comprehensive Real Estate Tasks & Follow-up Kanban'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Pipeline v2.0</span>
                </span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                {isArabic
                  ? 'إدارة دورة حياة المتابعات، المعاينات، المفاوضات، وتوقيع العقود مع السحب والإفلات وتنبيهات واتساب'
                  : 'Full deal lifecycle tracking, scheduled viewings, price negotiations, and contract closings with drag-and-drop'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher: Kanban Board vs Gantt Chart vs Performance Analytics */}
          <div className="flex items-center p-1 bg-surface border border-border rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{isArabic ? 'أعمدة الكانبان' : 'Kanban Board'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onNavigateToGantt) {
                  onNavigateToGantt();
                } else {
                  setViewMode('gantt');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                viewMode === 'gantt'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-bold'
                  : 'text-text-muted hover:text-white'
              }`}
              title={isArabic ? 'عرض مسارات المشاريع العقارية على الجدول الزمني (Gantt Chart)' : 'Real Estate Projects Gantt Timeline'}
            >
              <FolderKanban className="w-3.5 h-3.5 text-accent" />
              <span>{isArabic ? 'الجدول الزمني (Gantt)' : 'Gantt Chart'}</span>
            </button>
            {onNavigateToPerformance && (
              <button
                type="button"
                onClick={onNavigateToPerformance}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition text-text-muted hover:text-emerald-300 hover:bg-surface cursor-pointer"
                title={isArabic ? 'عرض لوحة بيانات معدل الإنجاز والمخططات البيانية' : 'Completion Rate & Broker Analytics'}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isArabic ? 'مخططات الإنجاز' : 'Analytics'}</span>
              </button>
            )}
          </div>

          {/* Auto-Classify All Tasks Button based on Unit Nature */}
          <button
            onClick={handleAutoClassifyAllTasks}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-accent via-indigo-600 to-blue-600 hover:from-accent hover:to-blue-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 cursor-pointer animate-pulse"
            title={isArabic ? 'تصنيف المهام تلقائياً بناءً على طبيعة الوحدة (بيع، إيجار، متابعة) لتقليل التدخل اليدوي' : 'Auto-classify tasks by unit nature (sale, rent, follow-up)'}
          >
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span>{isArabic ? '⚡ تصنيف تلقائي للمهام' : '⚡ Auto-Classify'}</span>
          </button>

          {/* Add New Task Button */}
          <button
            onClick={() => handleOpenNewModal('lead')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isArabic ? 'إضافة مهمة / متابعة' : '+ Add New Task'}</span>
          </button>

          {/* Export to CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-raised text-text-muted border border-border rounded-xl text-xs font-medium transition cursor-pointer"
            title={isArabic ? 'تصدير المهام إلى ملف CSV' : 'Export tasks as CSV spreadsheet'}
          >
            <Download className="w-3.5 h-3.5 text-text-muted" />
            <span className="hidden sm:inline">{isArabic ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>

          {/* Print Report */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-raised text-text-muted border border-border rounded-xl text-xs font-medium transition cursor-pointer"
            title={isArabic ? 'طباعة تقرير المتابعات' : 'Print task report'}
          >
            <Printer className="w-3.5 h-3.5 text-text-muted" />
            <span className="hidden sm:inline">{isArabic ? 'طباعة' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Auto-Classification Feedback Toast Banner */}
      {autoClassifyFeedback?.show && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-950/80 via-surface to-accent border border-indigo-500/40 rounded-xl flex items-center justify-between text-xs text-white shadow-lg animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Zap className="w-4 h-4 text-accent" />
            </span>
            <span className="font-semibold">{autoClassifyFeedback.message}</span>
          </div>
          <button onClick={() => setAutoClassifyFeedback(null)} className="text-text-muted hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {viewMode === 'gantt' && !onNavigateToGantt ? (
        <RealEstateProjectGanttChart
          tasks={tasks}
          onUpdateTasks={onUpdateTasks}
          units={units}
          team={effectiveTeam}
          isArabic={isArabic}
          theme="dark"
          onOpenTaskModal={(task) => {
            if (task) {
              handleOpenEditModal(task);
            } else {
              handleOpenNewModal('lead');
            }
          }}
        />
      ) : (
        <>
          {/* PERFORMANCE REPORT BY UNIT NATURE (بيع، إيجار، متابعة) */}
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ClipboardList className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                <span>{isArabic ? 'تقرير أداء المهام استناداً لطبيعة الوحدة' : 'Task Performance by Unit Nature'}</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold font-mono">
                  {isArabic ? 'دقة التقارير والتصنيف التلقائي' : 'Accuracy & Auto-Rules'}
                </span>
              </h3>
            </div>
          </div>
          <span className="text-[11px] text-text-muted">
            {isArabic ? 'توزيع المهام تلقائياً حسب طبيعة الوحدة لزيادة دقة تقارير الإنجاز' : 'Auto-classified tasks improve reporting precision'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Sales Tasks Breakdown */}
          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                <span>{isArabic ? 'صفقات بيع (Sales)' : 'Sales Tasks'}</span>
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-black">
                {natureMetrics.sales.count} {isArabic ? 'مهام' : 'tasks'}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs pt-1">
              <span className="text-text-muted text-[11px]">{isArabic ? 'حجم الصفقات:' : 'Pipeline Volume:'}</span>
              <strong className="font-mono text-white text-xs font-bold">
                {(natureMetrics.sales.volume / 1000000).toFixed(1)}M EGP
              </strong>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-text-muted text-[11px]">{isArabic ? 'نسبة الإنجاز:' : 'Win Rate:'}</span>
              <span className="font-mono text-emerald-400 font-bold text-xs">
                {natureMetrics.sales.winRate}%
              </span>
            </div>
          </div>

          {/* Rent Tasks Breakdown */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isArabic ? 'صفقات إيجار (Rent)' : 'Rent Tasks'}</span>
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black">
                {natureMetrics.rent.count} {isArabic ? 'مهام' : 'tasks'}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs pt-1">
              <span className="text-text-muted text-[11px]">{isArabic ? 'قيمة الإيجار المتوقعة:' : 'Expected Rent:'}</span>
              <strong className="font-mono text-white text-xs font-bold">
                {(natureMetrics.rent.volume / 1000).toFixed(1)}k EGP
              </strong>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-text-muted text-[11px]">{isArabic ? 'نسبة الإنجاز:' : 'Win Rate:'}</span>
              <span className="font-mono text-emerald-400 font-bold text-xs">
                {natureMetrics.rent.winRate}%
              </span>
            </div>
          </div>

          {/* Follow-up Tasks Breakdown */}
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-purple-400" />
                <span>{isArabic ? 'متابعات عامة (Follow-ups)' : 'General Follow-ups'}</span>
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-black">
                {natureMetrics.followup.count} {isArabic ? 'مهام' : 'tasks'}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs pt-1">
              <span className="text-text-muted text-[11px]">{isArabic ? 'طبيعة النشاط:' : 'Activity:'}</span>
              <span className="text-text-muted text-[11px]">{isArabic ? 'علاقات عملاء واستفسارات' : 'CRM & Inquiries'}</span>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-text-muted text-[11px]">{isArabic ? 'نسبة الاستجابة:' : 'Response Rate:'}</span>
              <span className="font-mono text-accent font-bold text-xs">
                {natureMetrics.followup.winRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tasks */}
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>{isArabic ? 'إجمالي المتابعات' : 'Total Tasks'}</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{metrics.total}</div>
          <div className="text-[10px] text-text-muted font-mono">
            {metrics.totalPipelineValue > 0 
              ? `${(metrics.totalPipelineValue / 1000000).toFixed(1)}M EGP` 
              : 'Active Pipeline'}
          </div>
        </div>

        {/* Due Today */}
        <div className={`border rounded-xl p-3.5 shadow-sm space-y-1 ${
          metrics.dueToday > 0 ? 'bg-accent border-accent' : 'bg-surface border-border'
        }`}>
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span className={metrics.dueToday > 0 ? 'text-accent font-bold' : ''}>
              {isArabic ? 'مطلوب اليوم' : 'Due Today'}
            </span>
            <Clock className={`w-4 h-4 ${metrics.dueToday > 0 ? 'text-accent animate-pulse' : 'text-text-muted'}`} />
          </div>
          <div className={`text-xl font-bold font-mono ${metrics.dueToday > 0 ? 'text-accent' : 'text-white'}`}>
            {metrics.dueToday}
          </div>
          <div className="text-[10px] text-text-muted">
            {isArabic ? 'تتطلب إجراء سريع' : 'Action needed'}
          </div>
        </div>

        {/* Overdue */}
        <div className={`border rounded-xl p-3.5 shadow-sm space-y-1 ${
          metrics.overdue > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-surface border-border'
        }`}>
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span className={metrics.overdue > 0 ? 'text-rose-300 font-bold' : ''}>
              {isArabic ? 'متأخرة' : 'Overdue'}
            </span>
            <AlertCircle className={`w-4 h-4 ${metrics.overdue > 0 ? 'text-rose-400 animate-bounce' : 'text-text-muted'}`} />
          </div>
          <div className={`text-xl font-bold font-mono ${metrics.overdue > 0 ? 'text-rose-400' : 'text-white'}`}>
            {metrics.overdue}
          </div>
          <div className="text-[10px] text-text-muted">
            {isArabic ? 'فات موعدها' : 'Past deadline'}
          </div>
        </div>

        {/* Viewings Scheduled */}
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>{isArabic ? 'معاينات ميدانية' : 'Viewings'}</span>
            <Eye className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold font-mono text-accent">{metrics.viewings}</div>
          <div className="text-[10px] text-text-muted">{isArabic ? 'زيارات وحدات' : 'Site tours'}</div>
        </div>

        {/* Active Negotiations */}
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>{isArabic ? 'مفاوضات جارية' : 'Negotiations'}</span>
            <Flame className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-400">{metrics.negotiations}</div>
          <div className="text-[10px] text-text-muted">{isArabic ? 'عروض أسعار' : 'Deal offers'}</div>
        </div>

        {/* Completed Deals */}
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>{isArabic ? 'منجزة بنجاح' : 'Completed'}</span>
            <CheckCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">{metrics.completed}</div>
          <div className="text-[10px] text-emerald-400/80 font-mono font-semibold">
            {metrics.completionRate}% {isArabic ? 'نسبة الإنجاز' : 'Win rate'}
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Toolbar */}
      <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            placeholder={isArabic ? 'بحث بالعميل، المهمة، الكمبوند، أو الوسيط...' : 'Search by client, title, compound, or agent...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 rtl:pl-4 rtl:pr-9 text-text placeholder-text-muted text-xs focus:outline-none focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white rtl:right-auto rtl:left-2.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Nature Filter (بيع، إيجار، متابعة) */}
          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-text-muted">
            <span className="text-text-muted text-[11px]">{isArabic ? 'طبيعة الوحدة:' : 'Unit Nature:'}</span>
            <select
              value={unitNatureFilter}
              onChange={(e) => setUnitNatureFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1 text-xs"
            >
              <option value="all">{isArabic ? 'كافة الطبيعات (الكل)' : 'All Natures'}</option>
              <option value="sale">{isArabic ? '🛒 صفقات بيع (Sales)' : 'Sales Deals'}</option>
              <option value="rent">{isArabic ? '🔑 صفقات إيجار (Rent)' : 'Rent Deals'}</option>
              <option value="followup">{isArabic ? '📋 متابعات عامة (Follow-up)' : 'Follow-ups'}</option>
            </select>
          </div>
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-text-muted">
            <span className="text-text-muted text-[11px]">{isArabic ? 'الأولوية:' : 'Priority:'}</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1 text-xs"
            >
              <option value="all" className="bg-surface">{isArabic ? 'الكل' : 'All Priorities'}</option>
              <option value="urgent" className="bg-surface">{isArabic ? 'عاجل جداً' : 'Urgent'}</option>
              <option value="high" className="bg-surface">{isArabic ? 'أولوية عالية' : 'High'}</option>
              <option value="medium" className="bg-surface">{isArabic ? 'متوسطة' : 'Medium'}</option>
              <option value="low" className="bg-surface">{isArabic ? 'عادية' : 'Low'}</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-text-muted">
            <span className="text-text-muted text-[11px]">{isArabic ? 'النوع:' : 'Type:'}</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1 text-xs"
            >
              <option value="all" className="bg-surface">{isArabic ? 'جميع الأنواع' : 'All Types'}</option>
              <option value="visit" className="bg-surface">{isArabic ? 'معاينة ميدانية' : 'Site Visit'}</option>
              <option value="call" className="bg-surface">{isArabic ? 'مكالمة هاتفية' : 'Phone Call'}</option>
              <option value="whatsapp" className="bg-surface">{isArabic ? 'متابعة واتساب' : 'WhatsApp'}</option>
              <option value="contract" className="bg-surface">{isArabic ? 'توقيع عقود' : 'Contract Signing'}</option>
              <option value="meeting" className="bg-surface">{isArabic ? 'اجتماع بالمكتب' : 'Meeting'}</option>
              <option value="payment" className="bg-surface">{isArabic ? 'تحصيل دفعة' : 'Payment'}</option>
              <option value="photo" className="bg-surface">{isArabic ? 'تصوير وحدة' : 'Photo Shoot'}</option>
            </select>
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-text-muted">
            <span className="text-text-muted text-[11px]">{isArabic ? 'التصنيف:' : 'Category:'}</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1 text-xs"
            >
              <option value="all" className="bg-surface">{isArabic ? 'جميع التصنيفات' : 'All Categories'}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-surface">
                  {isArabic ? cat.nameAr : cat.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Agent Filter */}
          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-text-muted">
            <span className="text-text-muted text-[11px]">{isArabic ? 'المسؤول:' : 'Agent:'}</span>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1 text-xs max-w-[130px] truncate"
            >
              <option value="all" className="bg-surface">{isArabic ? 'جميع الوسطاء' : 'All Agents'}</option>
              {availableAgents.map(ag => (
                <option key={ag} value={ag} className="bg-surface">{ag}</option>
              ))}
            </select>
          </div>

          {/* Quick Date Pills */}
          <div className="flex items-center bg-surface border border-border rounded-lg p-0.5">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                dateFilter === 'all' ? 'bg-blue-600 text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              {isArabic ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                dateFilter === 'today' ? 'bg-accent text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              {isArabic ? 'اليوم' : 'Today'}
            </button>
            <button
              onClick={() => setDateFilter('overdue')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                dateFilter === 'overdue' ? 'bg-rose-600 text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              {isArabic ? 'المتأخرة' : 'Overdue'}
            </button>
          </div>
        </div>
      </div>

      {/* Task Classifications & Custom Colors Legend Toolbar */}
      <div className="bg-surface border border-border rounded-2xl p-3 sm:p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-bold pl-1 rtl:pl-0 rtl:pr-1 shrink-0">
            <Tag className="w-3.5 h-3.5 text-blue-400" />
            <span>{isArabic ? 'تصنيفات المهام والألوان:' : 'Task Categories:'}</span>
          </div>

          {/* All filter pill */}
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'all'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-surface text-text-muted hover:text-white border-border hover:bg-surface-raised'
            }`}
          >
            <span>{isArabic ? 'كافة التصنيفات' : 'All Categories'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-raised text-text-muted text-[10px] font-mono">
              {tasks.length}
            </span>
          </button>

          {/* Dynamic Category Color Pills with Counts */}
          {categories.map(cat => {
            const isSelected = categoryFilter === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(isSelected ? 'all' : cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'ring-2 text-white shadow-lg'
                    : 'bg-surface text-text-muted hover:text-white border-border hover:bg-surface-raised'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: cat.color, borderColor: cat.color, boxShadow: `0 0 16px ${cat.color}40` }
                    : { borderInlineStartColor: cat.color, borderInlineStartWidth: '3.5px' }
                }
                title={isArabic ? `تصفية حسب: ${cat.nameAr} (${cat.color})` : `Filter by: ${cat.nameEn}`}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: isSelected ? 'white' : cat.color }}
                />
                {getCategoryIcon(cat.iconName)}
                <span>{isArabic ? cat.nameAr : cat.nameEn}</span>
                <span 
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-surface-raised text-text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category & Color Customization Action Button */}
        <button
          type="button"
          onClick={() => setIsColorModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-surface-raised to-surface-raised hover:from-surface-raised hover:to-surface-raised text-text hover:text-white border border-border transition cursor-pointer text-xs font-semibold shadow-sm hover:shadow"
          title={isArabic ? 'تخصيص ألوان وتصنيفات المهام (أحمر، أزرق، أخضر...)' : 'Customize task classification colors'}
        >
          <Palette className="w-4 h-4 text-accent animate-pulse" />
          <span>{isArabic ? 'تخصيص ألوان التصنيفات' : 'Customize Colors'}</span>
        </button>
      </div>

      {/* Worklenz Principles: Interconnected & Overlapping Tasks Toolbar */}
      <div className="bg-surface border border-border rounded-2xl p-3.5 shadow-lg space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Worklenz Focus Mode Filters (Conflicts, Connected Deals, Dependencies) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-text-muted font-semibold text-[11px] flex items-center gap-1.5 shrink-0">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" />
              <span>{isArabic ? 'فلتر Worklenz للترابط:' : 'Worklenz Flow:'}</span>
            </span>

            {/* All Tasks */}
            <button
              onClick={() => {
                setWorklenzFilter('all');
                setActiveThreadDeal(null);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                worklenzFilter === 'all' && !activeThreadDeal
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-surface text-text-muted hover:text-white border-border hover:bg-surface-raised'
              }`}
            >
              <span>{isArabic ? 'كافة المهام' : 'All Tasks'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-raised text-text-muted text-[10px] font-mono">
                {tasks.length}
              </span>
            </button>

            {/* Schedule Overlaps Conflict Filter */}
            <button
              onClick={() => setWorklenzFilter(worklenzFilter === 'conflicts' ? 'all' : 'conflicts')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                worklenzFilter === 'conflicts'
                  ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                  : 'bg-surface text-accent/90 hover:text-accent border-accent hover:bg-accent'
              }`}
              title={isArabic ? 'تصفية المهام المتداخلة زمنياً لنفس الوسيط' : 'Filter schedule overlapping conflicts'}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${totalConflictsCount > 0 ? 'animate-bounce text-accent' : ''}`} />
              <span>{isArabic ? 'تداخل زمني (مواعيد متضاربة)' : 'Schedule Overlaps'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                totalConflictsCount > 0 ? 'bg-accent text-accent' : 'bg-surface-raised text-text-muted'
              }`}>
                {totalConflictsCount}
              </span>
            </button>

            {/* Connected Deals & Dependencies Filter */}
            <button
              onClick={() => setWorklenzFilter(worklenzFilter === 'connected' ? 'all' : 'connected')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                worklenzFilter === 'connected'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                  : 'bg-surface text-purple-300 hover:text-white border-purple-500/30 hover:bg-purple-500/10'
              }`}
              title={isArabic ? 'عرض المهام المترابطة بوحدات وعملاء مشتركين' : 'Show interconnected tasks across pipeline'}
            >
              <Link2 className="w-3.5 h-3.5 text-purple-400" />
              <span>{isArabic ? 'مهام مترابطة ومعتمدة' : 'Interconnected Deals'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-mono font-bold">
                {totalConnectedCount}
              </span>
            </button>
          </div>

          {/* Horizontal Scroll Controls (Left / Right Arrows & Scroll Hints) */}
          <div className="flex items-center gap-2 self-end lg:self-center">
            <span className="text-[11px] text-text-muted font-mono hidden sm:inline">
              {isArabic ? 'تمرير المراحل:' : 'Scroll stages:'}
            </span>

            {/* Scroll Right / Prev (RTL aware) */}
            <button
              type="button"
              onClick={() => handleScrollHorizontally(isArabic ? 360 : -360)}
              className="p-2 rounded-xl bg-surface-raised hover:bg-surface-raised text-text-muted hover:text-white border border-border transition cursor-pointer shadow"
              title={isArabic ? 'تمرير لليمين' : 'Scroll Left'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Scroll Left / Next (RTL aware) */}
            <button
              type="button"
              onClick={() => handleScrollHorizontally(isArabic ? -360 : 360)}
              className="p-2 rounded-xl bg-surface-raised hover:bg-surface-raised text-text-muted hover:text-white border border-border transition cursor-pointer shadow"
              title={isArabic ? 'تمرير لليسار' : 'Scroll Right'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Column Stage Jumper Pills (Worklenz Stage Header) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-t border-border pt-2.5 scrollbar-thin">
          <span className="text-[10px] uppercase font-mono text-text-muted font-bold shrink-0">
            {isArabic ? 'انتقال سريع:' : 'Jump to:'}
          </span>
          {COLUMNS.map((c) => {
            const count = filteredTasks.filter(t => t.stage === c.id).length;
            const isSelectedMobile = mobileFocusStage === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  handleScrollToColumn(c.id);
                  setMobileFocusStage(mobileFocusStage === c.id ? null : c.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                  isSelectedMobile
                    ? 'bg-blue-600/20 border-blue-400 text-white ring-1 ring-blue-400/30'
                    : 'bg-surface hover:bg-surface-raised text-text-muted hover:text-white border-border'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.dotColor }} />
                <span>{isArabic ? c.labelAr : c.labelEn}</span>
                <span className="text-[10px] font-mono px-1 rounded bg-surface-raised text-text-muted font-bold">
                  {count}
                </span>
              </button>
            );
          })}
          {mobileFocusStage && (
            <button
              onClick={() => setMobileFocusStage(null)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-dashed border-blue-500/40 text-[11px] text-blue-400 font-semibold cursor-pointer shrink-0 md:hidden"
            >
              {isArabic ? 'عرض كل المراحل' : 'Show All'}
            </button>
          )}
        </div>

        {/* Active Connected Deal Thread Indicator Banner */}
        {activeThreadDeal && (
          <div className="flex items-center justify-between p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 animate-in fade-in">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                {isArabic ? 'مسار تتبع المهام المترابطة للصفقة:' : 'Tracing interconnected deal thread:'}
              </span>
              <strong className="text-white font-mono px-2 py-0.5 rounded bg-blue-600/30 border border-blue-500/40">
                {activeThreadDeal.name || activeThreadDeal.id}
              </strong>
            </div>
            <button
              onClick={() => setActiveThreadDeal(null)}
              className="text-[11px] text-blue-400 hover:text-white underline font-semibold cursor-pointer"
            >
              {isArabic ? 'إلغاء التتبع وعرض كافة الصفقات' : 'Clear Deal Thread'}
            </button>
          </div>
        )}
      </div>

      {/* Main Kanban Columns Container with Smooth Horizontal Scroll (Worklenz Enterprise) */}
      <div 
        ref={boardScrollRef}
        className="w-full overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-border scrollbar-track-surface-raised -mx-1 px-1 scroll-smooth"
      >
        <div className={`flex items-start gap-4 ${mobileFocusStage ? 'w-full flex-col md:flex-row md:min-w-max' : 'flex-row min-w-max'}`}>
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter(t => t.stage === col.id);
          const colVolume = colTasks.reduce((sum, t) => sum + (t.dealValue || 0), 0);
          const isDragOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              id={`kanban-col-${col.id}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(col.id);
              }}
              onDragLeave={() => {
                setDragOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverColumn(null);
                if (draggedTaskId) {
                  handleMoveStage(draggedTaskId, col.id);
                  setDraggedTaskId(null);
                }
              }}
              className={`${mobileFocusStage && mobileFocusStage !== col.id ? 'hidden md:flex' : 'flex'} ${
                mobileFocusStage ? 'w-full min-w-0 md:w-[340px] md:min-w-[320px]' : 'w-[340px] min-w-[320px]'
              } shrink-0 flex-col bg-surface rounded-2xl border transition-all duration-200 min-h-[640px] ${
                isDragOver 
                  ? 'border-blue-400 ring-2 ring-blue-500/20 bg-surface-raised shadow-2xl scale-[1.01]' 
                  : 'border-border shadow-md'
              }`}
            >
              {/* Column Header */}
              <div className={`p-3.5 border-b border-border rounded-t-2xl bg-surface flex items-center justify-between`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: col.dotColor }}
                  />
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                    {isArabic ? col.labelAr : col.labelEn}
                  </h3>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-surface-raised text-text-muted font-bold">
                    {colTasks.length}
                  </span>
                </div>

                {/* Quick Add Button */}
                <button
                  onClick={() => handleOpenNewModal(col.id)}
                  title={isArabic ? 'إضافة مهمة في هذه المرحلة' : 'Add task to this stage'}
                  className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-surface-raised transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Column Volume Subheader */}
              {colVolume > 0 && (
                <div className="px-3.5 py-1.5 bg-surface border-b border-border flex items-center justify-between text-[10px] text-text-muted font-mono">
                  <span>{isArabic ? 'حجم الصفقات:' : 'Volume:'}</span>
                  <strong className="text-accent/90">{(colVolume / 1000000).toFixed(1)}M EGP</strong>
                </div>
              )}

              {/* Cards Container */}
              <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[750px] scrollbar-thin">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-3 border-2 border-dashed border-border rounded-xl text-text-muted text-xs">
                    <p className="text-[11px] text-text-muted font-medium">
                      {isArabic ? 'لا توجد مهام حالياً' : 'No tasks in this stage'}
                    </p>
                    <span className="text-[10px] text-text-muted mt-1">
                      {isArabic ? 'اسحب مهمة إلى هنا' : 'Drag a task here'}
                    </span>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const typeInfo = getTypeInfo(task.type);
                    const priorityInfo = getPriorityInfo(task.priority);
                    const catInfo = getCategoryInfo(task);
                    const isDueToday = task.dueDate === todayStr;
                    const isOverdue = task.stage !== 'completed' && task.dueDate < todayStr;
                    const isScheduleConflict = scheduleConflictTaskIds.has(task.id);
                    const relatedTasks = connectedTasksMap.get(task.id) || [];
                    const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
                    const totalSubtasks = task.subtasks?.length || 0;
                    const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
                    const isSubtasksExpanded = expandedSubtaskCards.has(task.id);

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onDragEnd={() => setDraggedTaskId(null)}
                        onClick={() => handleOpenEditModal(task)}
                        className={`group bg-surface hover:bg-surface border rounded-xl p-3 shadow-md hover:shadow-xl transition-all duration-150 cursor-grab active:cursor-grabbing space-y-2.5 relative overflow-hidden ${
                          isScheduleConflict
                            ? 'border-accent ring-1 ring-accent'
                            : isOverdue 
                            ? 'border-rose-500/50 ring-1 ring-rose-500/20' 
                            : isDueToday 
                            ? 'border-accent ring-1 ring-accent' 
                            : 'border-border hover:border-border'
                        }`}
                        style={{
                          borderInlineStart: `4px solid ${catInfo.color}`,
                          boxShadow: `inset 0 1px 0 0 ${catInfo.color}35`
                        }}
                      >
                        {/* Task Header: Category Classification Badge, Priority, Type & Time in stage */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            {/* High Visibility Classification Badge with custom color */}
                            <span 
                              className="text-[10px] px-2 py-0.5 rounded-md font-bold border flex items-center gap-1.5 shadow-sm transition-transform group-hover:scale-105 shrink-0"
                              style={{
                                backgroundColor: `${catInfo.color}18`,
                                borderColor: `${catInfo.color}50`,
                                color: catInfo.color
                              }}
                              title={isArabic ? `تصنيف المهمة: ${catInfo.nameAr}` : `Classification: ${catInfo.nameEn}`}
                            >
                              <span 
                                className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: catInfo.color }}
                              />
                              {catInfo.icon}
                              <span className="font-extrabold">{isArabic ? catInfo.nameAr : catInfo.nameEn}</span>
                            </span>

                            {/* Unit Nature Auto-Classification Badge (Sale / Rent / Followup) */}
                            {(() => {
                              const nature = task.unitNature || determineTaskUnitNature(task, units);
                              if (nature === 'sale') {
                                return (
                                  <span 
                                    className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1 shrink-0" 
                                    title={isArabic ? 'طبيعة الوحدة: صفقة بيع (تم التصنيف تلقائياً)' : 'Unit Nature: Sale (Auto-classified)'}
                                  >
                                    <ShoppingBag className="w-2.5 h-2.5" />
                                    <span>{isArabic ? 'بيع' : 'Sale'}</span>
                                    {task.autoClassified && <span className="text-[8px] opacity-80">⚡</span>}
                                  </span>
                                );
                              }
                              if (nature === 'rent') {
                                return (
                                  <span 
                                    className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0" 
                                    title={isArabic ? 'طبيعة الوحدة: صفقة إيجار (تم التصنيف تلقائياً)' : 'Unit Nature: Rent (Auto-classified)'}
                                  >
                                    <Key className="w-2.5 h-2.5" />
                                    <span>{isArabic ? 'إيجار' : 'Rent'}</span>
                                    {task.autoClassified && <span className="text-[8px] opacity-80">⚡</span>}
                                  </span>
                                );
                              }
                              return (
                                <span 
                                  className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1 shrink-0" 
                                  title={isArabic ? 'طبيعة الوحدة: متابعة عامة (تم التصنيف تلقائياً)' : 'Unit Nature: Follow-up'}
                                >
                                  <ClipboardList className="w-2.5 h-2.5" />
                                  <span>{isArabic ? 'متابعة' : 'Followup'}</span>
                                  {task.autoClassified && <span className="text-[8px] opacity-80">⚡</span>}
                                </span>
                              );
                            })()}

                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border flex items-center gap-1 shrink-0 ${priorityInfo.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`} />
                              <span>{isArabic ? priorityInfo.labelAr : priorityInfo.labelEn}</span>
                            </span>

                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 truncate ${typeInfo.badge}`}>
                              {typeInfo.icon}
                              <span className="truncate">{isArabic ? typeInfo.labelAr : typeInfo.labelEn}</span>
                            </span>
                          </div>

                          {/* Worklenz Stage Aging tag */}
                          <span className="text-[9px] font-mono text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border shrink-0" title={isArabic ? 'عمر المهمة في هذه المرحلة' : 'Time in this stage'}>
                            ⏱️ {task.timeInStageDays || 1}{isArabic ? ' يوم' : 'd'}
                          </span>
                        </div>

                        {/* Worklenz Schedule Conflict Alert */}
                        {isScheduleConflict && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent border border-accent text-accent text-[10px] font-semibold animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-accent shrink-0" />
                            <span className="truncate">
                              {isArabic ? 'تنبيه: تداخل موعد زمني لنفس الوسيط اليوم!' : 'Schedule conflict: Agent double-booked!'}
                            </span>
                          </div>
                        )}

                        {/* Worklenz Dependency Preceding Task */}
                        {task.dependsOnTaskId && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-200 text-[10px] truncate">
                            <Link2 className="w-3 h-3 text-purple-400 shrink-0" />
                            <span className="font-semibold text-purple-300 shrink-0">{isArabic ? 'معتمدة على:' : 'Blocked by:'}</span>
                            <span className="truncate font-mono">{task.dependsOnTitle || task.dependsOnTaskId}</span>
                          </div>
                        )}

                        {/* Task Title */}
                        <h4 className="font-bold text-xs text-white leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors">
                          {task.title}
                        </h4>

                        {/* Client Name & Quick Contact Actions */}
                        <div className="bg-surface p-2 rounded-lg border border-border space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-text truncate flex items-center gap-1">
                              <User className="w-3 h-3 text-text-muted shrink-0" />
                              <span className="truncate">{task.clientName}</span>
                            </span>

                            {/* Direct WhatsApp Action */}
                            {task.clientPhone && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => handleOpenWhatsApp(e, task)}
                                  title={isArabic ? 'محادثة وتذكير واتساب' : 'WhatsApp Client'}
                                  className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </button>
                                <a
                                  href={`tel:${task.clientPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  title={isArabic ? 'اتصال بالعميل' : 'Call Client'}
                                  className="p-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition cursor-pointer"
                                >
                                  <PhoneCall className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Compound & Unit Tag */}
                          {(task.compound || task.unitId) && (
                            <div className="flex items-center gap-1 text-[10px] text-text-muted truncate">
                              <MapPin className="w-2.5 h-2.5 text-accent shrink-0" />
                              <span className="truncate">{task.compound || ''}</span>
                              {task.unitId && (
                                <span className="font-mono text-text-muted font-bold bg-surface-raised px-1 rounded shrink-0">
                                  {task.unitId}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Deal Value if available */}
                          {task.dealValue && (
                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border">
                              <span className="text-text-muted">{isArabic ? 'القيمة:' : 'Value:'}</span>
                              <strong className="text-accent font-mono">
                                {(task.dealValue / 1000000).toFixed(2)}M EGP
                              </strong>
                            </div>
                          )}
                        </div>

                        {/* Worklenz Interconnected Deal Thread Button */}
                        {relatedTasks.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveThreadDeal({ id: task.unitId || task.id, name: task.clientName });
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-300 text-[10px] transition cursor-pointer"
                            title={isArabic ? 'تتبع مسار كافة المهام المترابطة لهذه الصفقة' : 'Trace interconnected deal workflow'}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <GitBranch className="w-3 h-3 text-blue-400 shrink-0" />
                              <span className="truncate font-semibold">
                                {isArabic ? `${relatedTasks.length} مهام مترابطة بالصفقة` : `${relatedTasks.length} Connected Tasks`}
                              </span>
                            </div>
                            <span className="text-[9px] text-blue-400 font-bold hover:underline shrink-0">
                              {isArabic ? 'تتبع المسار ↗' : 'Trace ↗'}
                            </span>
                          </button>
                        )}

                        {/* Worklenz Subtasks Checklist & Progress Bar */}
                        {totalSubtasks > 0 && (
                          <div className="space-y-1.5 pt-1 border-t border-border">
                            <div className="flex items-center justify-between text-[10px] text-text-muted">
                              <span className="flex items-center gap-1">
                                <ListChecks className="w-3 h-3 text-cyan-400" />
                                <span>{isArabic ? 'خطوات التنفيذ:' : 'Subtasks:'}</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => toggleSubtaskCardExpanded(e, task.id)}
                                className="font-mono text-cyan-300 hover:text-white font-bold cursor-pointer"
                              >
                                {completedSubtasks}/{totalSubtasks} ({subtaskPercent}%) {isSubtasksExpanded ? '▲' : '▼'}
                              </button>
                            </div>

                            {/* Mini Progress Bar */}
                            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                                style={{ width: `${subtaskPercent}%` }}
                              />
                            </div>

                            {/* Expandable Subtask List */}
                            {isSubtasksExpanded && task.subtasks && (
                              <div className="pt-1 space-y-1 bg-surface p-2 rounded-lg border border-border animate-in fade-in">
                                {task.subtasks.map((st) => (
                                  <div 
                                    key={st.id}
                                    onClick={(e) => handleToggleSubtaskItem(e, task.id, st.id)}
                                    className={`flex items-start gap-1.5 p-1 rounded hover:bg-surface text-[10px] cursor-pointer transition ${
                                      st.completed ? 'text-text-muted line-through' : 'text-text-muted'
                                    }`}
                                  >
                                    {st.completed ? (
                                      <CheckSquare className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                                    ) : (
                                      <Square className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
                                    )}
                                    <span className="leading-tight">{st.title}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Due Date & Assigned Agent Footer */}
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border text-text-muted">
                          {/* Due Date Badge */}
                          <div className={`flex items-center gap-1 font-mono ${
                            isOverdue 
                              ? 'text-rose-400 font-bold' 
                              : isDueToday 
                              ? 'text-accent font-bold' 
                              : 'text-text-muted'
                          }`}>
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                              {isDueToday ? (isArabic ? 'اليوم' : 'Today') : task.dueDate}
                              {task.dueTime ? ` ${task.dueTime}` : ''}
                            </span>
                          </div>

                          {/* Agent Avatar / Name */}
                          <div className="flex items-center gap-1 text-text-muted font-medium truncate max-w-[85px]">
                            <span className="w-4 h-4 rounded-full bg-blue-600/30 border border-blue-500/40 text-[9px] flex items-center justify-center font-bold text-blue-300 shrink-0">
                              {task.agent.slice(0, 1)}
                            </span>
                            <span className="truncate text-[10px]">{task.agent.split(' ')[0]}</span>
                          </div>
                        </div>

                        {/* Quick Interactive Stage Stepper Controls (Left/Right arrow + Complete) */}
                        <div className="flex items-center justify-between pt-1 border-t border-border text-[10px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftStage(task, 'prev');
                            }}
                            disabled={col.id === 'lead'}
                            title={isArabic ? 'المرحلة السابقة' : 'Previous stage'}
                            className="p-1 rounded text-text-muted hover:text-white hover:bg-surface-raised disabled:opacity-20 disabled:hover:bg-transparent transition cursor-pointer"
                          >
                            {isArabic ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
                          </button>

                          {/* Quick Mark Complete Button */}
                          {task.stage !== 'completed' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveStage(task.id, 'completed');
                              }}
                              title={isArabic ? 'إتمام المهمة والصفقة بنجاح' : 'Mark completed'}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-semibold transition cursor-pointer"
                            >
                              <Check className="w-2.5 h-2.5" />
                              <span>{isArabic ? 'إنجاز' : 'Win'}</span>
                            </button>
                          ) : (
                            <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isArabic ? 'مكتملة ✓' : 'Done ✓'}</span>
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftStage(task, 'next');
                            }}
                            disabled={col.id === 'completed'}
                            title={isArabic ? 'المرحلة التالية' : 'Next stage'}
                            className="p-1 rounded text-text-muted hover:text-white hover:bg-surface-raised disabled:opacity-20 disabled:hover:bg-transparent transition cursor-pointer"
                          >
                            {isArabic ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
      </>
      )}

      {/* NEW / EDIT TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <SlidersHorizontal className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingTask 
                      ? (isArabic ? 'تعديل تفاصيل المهمة والمتابعة' : 'Edit Follow-up & Deal')
                      : (isArabic ? 'إضافة مهمة / متابعة جديدة' : 'Add New Real Estate Follow-up')}
                  </h3>
                  <span className="text-xs text-text-muted font-mono">
                    {editingTask ? editingTask.id : 'Auto ID Generated'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-text-muted hover:text-white hover:bg-surface-raised rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-text-muted font-semibold mb-1">
                  {isArabic ? 'عنوان المتابعة / الهدف المطلوب *' : 'Task Title / Action Objective *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isArabic ? 'مثال: معاينة فيلا ماونتن فيو، توقيع عقد ابتدائي...' : 'e.g., Site inspection at Palm Hills, contract signing...'}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Client Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'اسم العميل *' : 'Client Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isArabic ? 'اسم المشتري أو المستأجر' : 'Client / Buyer Name'}
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}
                  </label>
                  <input
                    type="tel"
                    placeholder="+201001234567"
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Task Classification (Category) & Custom Color Selection */}
              <div className="bg-surface border border-border rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-text font-semibold text-xs flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isArabic ? 'تصنيف المهمة ولون التمييز *' : 'Task Classification & Accent Color *'}</span>
                  </label>
                  <span className="text-[10px] text-text-muted">
                    {isArabic ? 'أحمر للاجتماعات، أزرق للمكالمات، أخضر للمتابعات...' : 'Red meetings, blue calls, green follow-ups...'}
                  </span>
                </div>

                {/* Category Selection Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map(cat => {
                    const isSelected = formCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setFormCategory(cat.id);
                          setFormCategoryColor('');
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-left rtl:text-right ${
                          isSelected
                            ? 'ring-2 text-white shadow-md'
                            : 'bg-surface text-text-muted hover:text-white border-border hover:border-border'
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: `${cat.color}25`, borderColor: cat.color, boxShadow: `0 0 0 2px ${cat.color}` }
                            : { borderInlineStartColor: cat.color, borderInlineStartWidth: '3.5px' }
                        }
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate">{isArabic ? cat.nameAr : cat.nameEn}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Live Badge Preview & Custom Color Override */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted text-[11px]">{isArabic ? 'معاينة شارة التصنيف:' : 'Badge Preview:'}</span>
                    {(() => {
                      const previewCat = categories.find(c => c.id === formCategory) || categories[0];
                      const previewColor = formCategoryColor || previewCat?.color || 'rgb(59, 130, 246)';
                      return (
                        <span
                          className="px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1.5 shadow-sm"
                          style={{
                            backgroundColor: `${previewColor}20`,
                            borderColor: `${previewColor}50`,
                            color: previewColor
                          }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: previewColor }} />
                          {getCategoryIcon(previewCat?.iconName || formCategory)}
                          <span>{isArabic ? previewCat?.nameAr : previewCat?.nameEn}</span>
                        </span>
                      );
                    })()}
                  </div>

                  {/* Custom Color Override for this specific task */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-text-muted text-[10px]">{isArabic ? 'تخصيص لون خاص للمهمة:' : 'Task custom color:'}</span>
                    <input
                      type="color"
                      value={formCategoryColor || categories.find(c => c.id === formCategory)?.color || 'rgb(239, 68, 68)'}
                      onChange={(e) => setFormCategoryColor(e.target.value)}
                      className="w-7 h-7 rounded border border-border bg-transparent cursor-pointer p-0.5"
                      title={isArabic ? 'اختر لوناً مخصصاً لهذه المهمة' : 'Pick custom color for this task'}
                    />
                    {formCategoryColor && (
                      <button
                        type="button"
                        onClick={() => setFormCategoryColor('')}
                        className="text-[10px] text-text-muted hover:text-white underline cursor-pointer"
                      >
                        {isArabic ? 'استعادة' : 'Reset'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stage & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'المرحلة في الكانبان' : 'Kanban Stage'}
                  </label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value as KanbanStage)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {COLUMNS.map(col => (
                      <option key={col.id} value={col.id}>
                        {isArabic ? col.labelAr : col.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'درجة الأولوية' : 'Priority Level'}
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="urgent">{isArabic ? 'عاجل جداً (أعلى أولوية)' : 'Urgent (Highest)'}</option>
                    <option value="high">{isArabic ? 'أولوية عالية' : 'High Priority'}</option>
                    <option value="medium">{isArabic ? 'أولوية متوسطة' : 'Medium'}</option>
                    <option value="low">{isArabic ? 'أولوية عادية' : 'Low'}</option>
                  </select>
                </div>
              </div>

              {/* Task Type & Assigned Agent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'نوع الإجراء' : 'Action Type'}
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as TaskType)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="visit">{isArabic ? 'معاينة ميدانية بالكمبوند' : 'Site Visit / Viewing'}</option>
                    <option value="call">{isArabic ? 'مكالمة هاتفية' : 'Phone Call'}</option>
                    <option value="whatsapp">{isArabic ? 'محادثة وتذكير واتساب' : 'WhatsApp Follow-up'}</option>
                    <option value="contract">{isArabic ? 'توقيع عقود وتوثيق' : 'Contract Signing'}</option>
                    <option value="meeting">{isArabic ? 'اجتماع بالمكتب' : 'Office Meeting'}</option>
                    <option value="payment">{isArabic ? 'تحصيل دفعة مقدمة / شيك' : 'Payment / Downpayment'}</option>
                    <option value="photo">{isArabic ? 'تصوير وحدة جديدة' : 'Photography'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'الوسيط / الموظف المسؤول' : 'Assigned Agent'}
                  </label>
                  <select
                    value={formAgent}
                    onChange={(e) => {
                      setFormAgent(e.target.value);
                      setHasManuallySelectedAgent(true);
                    }}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {availableAgents.map(ag => (
                      <option key={ag} value={ag}>{ag}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Worklenz Automated Suggestion Engine Widget */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-surface to-indigo-950/30 border border-blue-500/30 shadow-md space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{isArabic ? 'ترشيح Worklenz الذكي للوسيط الأنسب (الحمولة والخبرة):' : 'Worklenz Smart Agent Suggestion (Load & Expertise):'}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">Worklenz v2</span>
                      </h4>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {topSuggestion ? (isArabic ? topSuggestion.reasonAr : topSuggestion.reasonEn) : ''}
                      </p>
                    </div>
                  </div>

                  {topSuggestion && (
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        topSuggestion.score >= 80 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                          : 'bg-accent text-accent border-accent'
                      }`}>
                        {topSuggestion.score}% {isArabic ? 'ملاءمة' : 'Match'}
                      </span>

                      {formAgent !== topSuggestion.member.name && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormAgent(topSuggestion.member.name);
                            setHasManuallySelectedAgent(false);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold rounded-lg shadow-sm transition cursor-pointer"
                          title={isArabic ? 'تطبيق الترشيح الذكي واختيار هذا الوسيط' : 'Apply smart suggestion and assign this agent'}
                        >
                          <Zap className="w-3 h-3 text-accent" />
                          <span>{isArabic ? `تعيين ${topSuggestion.member.name.split(' ')[0]}` : `Assign ${topSuggestion.member.name.split(' ')[0]}`}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Broker Cards (Top Ranked Candidates by Workload & Compound) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border">
                  {worklenzSuggestions.slice(0, 4).map((sugg, idx) => {
                    const isSelected = formAgent === sugg.member.name;
                    const loadPercent = Math.min(100, Math.round((sugg.activeCount / sugg.capacity) * 100));
                    return (
                      <button
                        key={sugg.member.id}
                        type="button"
                        onClick={() => {
                          setFormAgent(sugg.member.name);
                          setHasManuallySelectedAgent(true);
                        }}
                        className={`p-2 rounded-lg text-left rtl:text-right border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-600/25 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/30'
                            : 'bg-surface border-border text-text-muted hover:border-border hover:bg-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-xs truncate">{sugg.member.name}</span>
                          {idx === 0 && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-accent text-accent font-bold">#1 Best</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-text-muted font-mono">
                          <span>{sugg.activeCount}/{sugg.capacity} {isArabic ? 'مهام' : 'tasks'}</span>
                          <span className={loadPercent >= 80 ? 'text-red-400' : 'text-emerald-400'}>{loadPercent}%</span>
                        </div>
                        <div className="w-full h-1 bg-surface-raised rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full ${loadPercent >= 80 ? 'bg-red-500' : loadPercent > 50 ? 'bg-accent' : 'bg-emerald-500'}`} 
                            style={{ width: `${loadPercent}%` }} 
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Linked Compound & Deal Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'المشروع / الكمبوند' : 'Compound'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Palm Hills, Mountain View"
                    value={formCompound}
                    onChange={(e) => setFormCompound(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  {/* Quick Compound Preset Chips */}
                  <div className="flex items-center gap-1 flex-wrap mt-1.5">
                    {[
                      { ar: 'ماونتن فيو', en: 'Mountain View' },
                      { ar: 'بالم هيلز', en: 'Palm Hills' },
                      { ar: 'سوديك', en: 'SODIC' },
                      { ar: 'بادية', en: 'Badya' },
                      { ar: 'أبراج زد', en: 'Zed' }
                    ].map(cp => (
                      <button
                        key={cp.en}
                        type="button"
                        onClick={() => {
                          setFormCompound(isArabic ? cp.ar : cp.en);
                          if (!hasManuallySelectedAgent) {
                            const autoSugg = getWorklenzSuggestions(isArabic ? cp.ar : cp.en, effectiveTeam, tasks);
                            if (autoSugg[0]) {
                              setFormAgent(autoSugg[0].member.name);
                            }
                          }
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                          formCompound.toLowerCase().includes(cp.en.toLowerCase()) || formCompound.includes(cp.ar)
                            ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 font-bold'
                            : 'bg-surface text-text-muted border-border hover:border-border hover:text-text'
                        }`}
                      >
                        {isArabic ? cp.ar : cp.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'كود الوحدة المرتبطة' : 'Linked Unit ID'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. S-0001, PH-01"
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'قيمة الصفقة (ج.م)' : 'Deal Value (EGP)'}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 8750000"
                    value={formDealValue}
                    onChange={(e) => setFormDealValue(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Due Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'تاريخ الاستحقاق *' : 'Due Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-semibold mb-1">
                    {isArabic ? 'الوقت المحدد' : 'Due Time'}
                  </label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-text-muted font-semibold mb-1">
                  {isArabic ? 'ملاحظات وتفاصيل المتابعة' : 'Notes & Key Deal Details'}
                </label>
                <textarea
                  rows={3}
                  placeholder={isArabic ? 'سجل تفاصيل رغبة العميل، شروط السداد، أو نتيجة المكالمة...' : 'Log client preferences, payment conditions, or call outcome...'}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Direct SuiteCRM Clients Sync Card */}
              <div className="p-3.5 rounded-xl bg-surface border border-indigo-500/30 flex items-start gap-3 shadow-md">
                <input
                  type="checkbox"
                  id="syncToSuiteCRM"
                  checked={syncToSuiteCRM}
                  onChange={(e) => setSyncToSuiteCRM(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-surface cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="syncToSuiteCRM" className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isArabic ? 'مزامنة العميل مباشرة في قسم SuiteCRM Clients' : 'Directly sync client lead into SuiteCRM module upon creation'}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">SuiteCRM v8</span>
                  </label>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    {formClientName.trim() ? (
                      existingClientMatch ? (
                        <span className="text-accent font-medium">
                          {isArabic 
                            ? `✓ سيتم توثيق المهمة كنشاط متابعة فوري في سجل العميل الموجود "${existingClientMatch.name}" في SuiteCRM وتحديث الوسيط والكمبوند.`
                            : `✓ Will link and append this task to existing SuiteCRM lead "${existingClientMatch.name}".`}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium">
                          {isArabic 
                            ? `+ سيتم إنشاء وتوثيق عميل وفرصة بيعية جديدة باسم "${formClientName.trim()}" في قسم عملاء SuiteCRM مباشرة بمجرد الضغط على إضافة المهمة.`
                            : `+ Will automatically create and sync new client lead "${formClientName.trim()}" into SuiteCRM Clients upon clicking Create Task.`}
                        </span>
                      )
                    ) : (
                      <span className="text-text-muted">
                        {isArabic 
                          ? 'عند كتابة اسم العميل، سيتم مزامنته تلقائياً إما كعميل جديد في SuiteCRM أو توثيق المتابعة في سجله الحالي.' 
                          : 'Upon entering client details, new leads will be directly registered and synced into the SuiteCRM module.'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(editingTask.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'حذف المهمة' : 'Delete Task'}</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-surface-raised hover:bg-surface-raised text-text-muted font-medium rounded-lg transition cursor-pointer"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingTask ? (isArabic ? 'حفظ التعديلات' : 'Save Changes') : (isArabic ? 'إضافة المهمة' : 'Create Task')}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY & COLOR CUSTOMIZATION MODAL */}
      {isColorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-accent text-accent border border-accent">
                  <Palette className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {isArabic ? 'إدارة وتخصيص ألوان تصنيفات المهام' : 'Manage & Customize Task Categories & Colors'}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {isArabic 
                      ? 'حدد الألوان المخصصة لكل تصنيف (مثل: أحمر للاجتماعات، أزرق للمكالمات، أخضر للمتابعات)' 
                      : 'Assign custom colors for each category (e.g. Red for Meetings, Blue for Calls, Green for Follow-ups)'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsColorModalOpen(false)}
                className="p-1.5 text-text-muted hover:text-white hover:bg-surface-raised rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Categories List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-text-muted block">
                {isArabic ? 'التصنيفات المتاحة والألوان المخصصة:' : 'Categories & Custom Colors:'}
              </span>

              <div className="space-y-2.5">
                {categories.map((cat) => {
                  return (
                    <div 
                      key={cat.id}
                      className="bg-surface border border-border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                    >
                      {/* Category Identity & Live Badge */}
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-4 h-4 rounded-full shrink-0 shadow-md ring-2 ring-white/10"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white flex items-center gap-1.5">
                              {getCategoryIcon(cat.iconName)}
                              <span>{isArabic ? cat.nameAr : cat.nameEn}</span>
                            </span>
                            <span 
                              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border"
                              style={{ 
                                backgroundColor: `${cat.color}15`, 
                                borderColor: `${cat.color}40`,
                                color: cat.color 
                              }}
                            >
                              {cat.color}
                            </span>
                          </div>
                          <span className="text-[10px] text-text-muted">
                            {isArabic ? cat.nameEn : cat.nameAr}
                          </span>
                        </div>
                      </div>

                      {/* Color Palette Presets & HTML Color Picker */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Preset Color Swatches */}
                        <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border">
                          {COLOR_PALETTE_PRESETS.slice(0, 5).map((preset) => (
                            <button
                              key={preset.hex}
                              type="button"
                              onClick={() => handleUpdateCategoryColor(cat.id, preset.hex)}
                              className={`w-5 h-5 rounded-full transition-transform hover:scale-125 cursor-pointer ${
                                cat.color.toLowerCase() === preset.hex.toLowerCase() ? 'ring-2 ring-white ring-offset-1 ring-offset-surface scale-110' : ''
                              }`}
                              style={{ backgroundColor: preset.hex }}
                              title={`${isArabic ? preset.nameAr : preset.nameEn} (${preset.hex})`}
                            />
                          ))}
                        </div>

                        {/* Native Color Picker */}
                        <div className="relative flex items-center gap-1">
                          <input
                            type="color"
                            value={cat.color}
                            onChange={(e) => handleUpdateCategoryColor(cat.id, e.target.value)}
                            className="w-7 h-7 rounded border border-border bg-transparent cursor-pointer p-0.5"
                            title={isArabic ? 'اختر لوناً مخصصاً (Hex)' : 'Custom Hex Color'}
                          />
                        </div>

                        {/* Delete Custom Category */}
                        {cat.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                            title={isArabic ? 'حذف هذا التصنيف' : 'Delete category'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add New Custom Category Section */}
            <div className="pt-2 border-t border-border">
              {!isAddingNewCategory ? (
                <button
                  type="button"
                  onClick={() => setIsAddingNewCategory(true)}
                  className="w-full py-2.5 px-3 border border-dashed border-border hover:border-blue-500 rounded-xl text-text-muted hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer bg-surface"
                >
                  <Plus className="w-4 h-4 text-blue-400" />
                  <span>{isArabic ? '+ إضافة تصنيف مخصص جديد' : '+ Add New Custom Category'}</span>
                </button>
              ) : (
                <form onSubmit={handleAddNewCategory} className="bg-surface p-3.5 rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-400" />
                      <span>{isArabic ? 'إضافة تصنيف جديد' : 'New Custom Category'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCategory(false)}
                      className="text-text-muted hover:text-white text-xs cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-text-muted block mb-1">{isArabic ? 'الاسم بالعربية *' : 'Arabic Name *'}</label>
                      <input
                        type="text"
                        required
                        placeholder={isArabic ? 'مثال: تسويق وتصوير' : 'e.g., Marketing'}
                        value={newCatNameAr}
                        onChange={(e) => setNewCatNameAr(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-text-muted block mb-1">{isArabic ? 'الاسم بالإنجليزية' : 'English Name'}</label>
                      <input
                        type="text"
                        placeholder="e.g., Marketing & Photos"
                        value={newCatNameEn}
                        onChange={(e) => setNewCatNameEn(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-text-muted">{isArabic ? 'اللون:' : 'Color:'}</span>
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        className="w-7 h-7 rounded border border-border bg-transparent cursor-pointer p-0.5"
                      />
                      <span className="font-mono text-text-muted text-xs">{newCatColor}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCategory(false)}
                        className="px-3 py-1.5 rounded-lg bg-surface-raised text-text-muted text-xs hover:bg-surface-raised cursor-pointer"
                      >
                        {isArabic ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        {isArabic ? 'إضافة' : 'Add'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                type="button"
                onClick={handleResetDefaultCategories}
                className="flex items-center gap-1.5 text-text-muted hover:text-white text-xs py-1.5 px-2.5 rounded-lg hover:bg-surface-raised transition cursor-pointer"
                title={isArabic ? 'استعادة ألوان التصنيفات الافتراضية' : 'Reset categories to defaults'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isArabic ? 'استعادة الألوان الافتراضية' : 'Reset Defaults'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsColorModalOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-blue-600/20"
              >
                {isArabic ? 'حفظ وإغلاق' : 'Save & Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct SuiteCRM Sync Success Toast Notification */}
      {suiteCrmSyncToast && suiteCrmSyncToast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-surface border border-emerald-500/40 text-white px-4 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md backdrop-blur-md">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span>SuiteCRM Clients Sync</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 font-mono">Live Sync</span>
              </div>
              <p className="text-xs text-text mt-0.5 leading-snug">{suiteCrmSyncToast.message}</p>
            </div>
            <button 
              onClick={() => setSuiteCrmSyncToast(null)}
              className="text-text-muted hover:text-white p-1 rounded-lg hover:bg-surface-raised transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
