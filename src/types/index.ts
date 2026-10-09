export interface UnitAuditLogEntry {
  id: string;
  timestamp: string;
  action: 'created' | 'status_change' | 'price_update' | 'agent_assigned' | 'notes_updated' | 'inspection_completed';
  field?: string;
  oldValue?: string | number;
  newValue?: string | number;
  changedBy: string;
  notes?: string;
}

export interface UnitFollowUpReminder {
  id: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  title: string;
  assignedAgent: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  completed: boolean;
  completedAt?: string;
  clientName?: string;
}

export interface UnitInteractionLog {
  id: string;
  type: 'call' | 'whatsapp' | 'meeting' | 'viewing' | 'offer' | 'note' | 'contract';
  clientName?: string;
  clientPhone?: string;
  agent: string;
  date: string;
  time?: string;
  summary: string;
  outcome?: string;
}

export interface UnitCommentEntry {
  id: string;
  unitId: string;
  author: string;
  authorRole?: string;
  createdAt: string; // ISO string
  updatedAt?: string;
  content: string; // Rich-text formatted content (supports markdown/formatting tags)
  isPinned: boolean;
  pinnedAt?: string;
  category: 'internal_note' | 'client_interaction' | 'inspection' | 'legal_contract' | 'price_negotiation' | 'reminder';
  tags?: string[];
  reminder?: UnitFollowUpReminder;
  interaction?: UnitInteractionLog;
}

export type UnitStatus = 'Available' | 'Reserved' | 'Sold';

export interface Unit {
  id: string;
  status: UnitStatus;
  compound: string;
  area: string;
  propertyType: string;
  unitType: string;
  size: string | number;
  beds: string | number;
  baths?: string | number;
  floor?: string | number;
  price: number;
  currency: string;
  notes?: string;
  ownerName?: string;
  ownerPhone?: string;
  deliveryDate?: string;
  agent?: string;
  category?: 'sales' | 'rent';
  auditLog?: UnitAuditLogEntry[];
  comments?: UnitCommentEntry[];
  qrCodeUrl?: string;
  images?: string[];
  videoUrl?: string;
}

export interface DashboardKPIs {
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  soldUnits: number;
  totalMarketValue: number;
  avgUnitPrice: number;
  activeClientsCount?: number;
  ownersCount?: number;
  todayFollowUpsCount?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestedAction?: {
    type: 'filter' | 'search';
    payload: string;
  };
}

export type OwnerClientStatus = 'Active' | 'Inactive' | 'Prospect';

export interface Owner {
  id: string;
  name: string;
  phone: string;
  phone2?: string;
  whatsapp?: string;
  email?: string;
  area?: string;
  address?: string;
  company?: string;
  unitsCount?: number | string;
  preferredContact?: string;
  notes?: string;
  category?: 'individual' | 'developer' | 'investor';
  clientCategory?: 'individual' | 'developer' | 'investor'; // 'مالك فردي' | 'شركة تطوير' | 'مستثمر'
  status?: 'Active' | 'Inactive' | 'Prospect' | 'active' | 'inactive' | 'prospect' | string;
  clientStatus?: 'Active' | 'Inactive' | 'Prospect'; // 'Active' | 'Inactive' | 'Prospect'
  avatar?: string;
  photoUrl?: string;
  profileImage?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  requiredArea?: string;
  propertyType?: string;
  unitType?: string;
  purpose?: string;
  status?: string;
  agent?: string;
  notes?: string;
}

export type KanbanStage = 'lead' | 'contacted' | 'viewing' | 'negotiation' | 'contract' | 'completed';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskType = 'call' | 'visit' | 'whatsapp' | 'meeting' | 'contract' | 'payment' | 'photo';
export type TaskCategoryType = 'meeting' | 'call' | 'followup' | 'visit' | 'contract' | 'payment' | 'custom' | string;
export type UnitNature = 'sale' | 'rent' | 'followup';

export interface TaskCategoryConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  color: string; // Color code or CSS variable
  bgBadge: string;
  borderBadge: string;
  textBadge: string;
  iconName: string;
  isCustom?: boolean;
}

export interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface FollowUpTask {
  id: string;
  title: string;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  unitId?: string;
  compound?: string;
  dealValue?: number;
  stage: KanbanStage;
  type: TaskType;
  priority: TaskPriority;
  dueDate: string;
  dueTime?: string;
  agent: string;
  notes?: string;
  completedAt?: string;
  createdAt?: string;

  // Task Classification & Custom Color
  category?: TaskCategoryType;
  categoryColor?: string; // Optional custom hex color override

  // Unit Nature Auto-Classification (بيع / إيجار / متابعة)
  unitNature?: UnitNature;
  autoClassified?: boolean;

  // Worklenz Interconnected & Overlapping Tasks fields
  dependsOnTaskId?: string;
  dependsOnTitle?: string;
  relatedDealId?: string;
  subtasks?: SubtaskItem[];
  timeInStageDays?: number;

  // Legacy compatibility fields
  nextDate?: string;
  required?: string;
  status?: string;
}

// ==========================================
// SuiteCRM Inspired: Enterprise CRM Models
// ==========================================
export type LeadRating = 'hot' | 'warm' | 'cold';
export type LeadSource = 'facebook' | 'google' | 'property_finder' | 'aqarmap' | 'referral' | 'direct' | 'campaign';
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'viewing' | 'negotiation' | 'won' | 'lost';

export interface InteractionLog {
  id: string;
  date: string;
  time?: string;
  type: 'call' | 'whatsapp' | 'meeting' | 'viewing' | 'note' | 'proposal';
  agent: string;
  summary: string;
  outcome?: string;
}

export interface ClientLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  rating: LeadRating; // Hot, Warm, Cold
  source: LeadSource; // Facebook, Google, Property Finder...
  stage: LeadStage;
  targetBudgetMin: number;
  targetBudgetMax: number;
  purpose: 'buy' | 'rent' | 'invest';
  targetPropertyType?: string;
  targetCompound?: string;
  assignedAgent: string;
  dealValue?: number;
  probability?: number; // e.g., 20, 60, 90%
  expectedCloseDate?: string;
  notes?: string;
  interactionLogs: InteractionLog[];
  createdAt: string;
}

// ==========================================
// Worklenz Inspired: Team & Workload Models
// ==========================================
export type MemberRole = 'team_leader' | 'senior_broker' | 'property_consultant' | 'legal_contracts' | 'viewing_media';
export type MemberStatus = 'available' | 'on_viewing' | 'in_meeting' | 'busy' | 'offline';

export interface TeamMember {
  id: string;
  name: string;
  role: MemberRole;
  roleTitleAr: string;
  roleTitleEn: string;
  phone: string;
  email: string;
  avatarBg: string;
  status: MemberStatus;
  maxCapacity: number; // Max deals / active tasks capacity
  activeTasksCount: number;
  closedDealsCount: number;
  closedVolumeEgp: number;
  winRatePercentage: number;
  onTimeRatePercentage: number;
  specialties: string[];
  joinedDate: string;
}

// ==========================================
// Notifications & UI Customization Types
// ==========================================
import type { TranslationKey } from '../locales/keys';

export type NotificationType = 'sold' | 'reserved' | 'info' | 'sync' | 'visit' | 'task_due' | 'urgent' | 'alert';

export interface AppNotification {
  id: string;
  /** Literal text — data-driven notifications (calendar, imports) keep their own copy. */
  title?: string;
  message?: string;
  /** Catalog key — preferred over the literal when present (shell-generated notifications). */
  titleKey?: TranslationKey;
  messageKey?: TranslationKey;
  /** Interpolation vars for `titleKey` / `messageKey`. */
  titleVars?: Record<string, string | number>;
  messageVars?: Record<string, string | number>;
  unitId?: string;
  taskId?: string;
  clientName?: string;
  dueTime?: string;
  compound?: string;
  price?: number;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
}

export type TableDensity = 'compact' | 'normal' | 'spacious';

export interface UISettings {
  theme: 'dark' | 'light';
  tableDensity: TableDensity;
  showAvatars: boolean;
  enableNotificationSound: boolean;
  autoSyncInterval: number; // 0 = off, 60 = 1m, 300 = 5m
}

