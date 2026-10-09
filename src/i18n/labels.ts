import type { TranslationKey } from '../locales/keys';
import type {
  UnitStatus, KanbanStage, TaskPriority, LeadStage, OwnerClientStatus, MemberStatus,
} from '../types';

export const UNIT_STATUS_LABEL: Record<UnitStatus, TranslationKey> = {
  Available: 'units.status.available',
  Reserved: 'units.status.reserved',
  Sold: 'units.status.sold',
};

export const KANBAN_STAGE_LABEL: Record<KanbanStage, TranslationKey> = {
  lead: 'tasks.stage.lead',
  contacted: 'tasks.stage.contacted',
  viewing: 'tasks.stage.viewing',
  negotiation: 'tasks.stage.negotiation',
  contract: 'tasks.stage.contract',
  completed: 'tasks.stage.completed',
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, TranslationKey> = {
  urgent: 'tasks.priority.urgent',
  high: 'tasks.priority.high',
  medium: 'tasks.priority.medium',
  low: 'tasks.priority.low',
};

export const LEAD_STAGE_LABEL: Record<LeadStage, TranslationKey> = {
  new: 'leads.stage.new',
  contacted: 'leads.stage.contacted',
  qualified: 'leads.stage.qualified',
  viewing: 'leads.stage.viewing',
  negotiation: 'leads.stage.negotiation',
  won: 'leads.stage.won',
  lost: 'leads.stage.lost',
};

export const OWNER_CLIENT_STATUS_LABEL: Record<OwnerClientStatus, TranslationKey> = {
  Active: 'clients.status.active',
  Inactive: 'clients.status.inactive',
  Prospect: 'clients.status.prospect',
};

export const MEMBER_STATUS_LABEL: Record<MemberStatus, TranslationKey> = {
  available: 'team.status.available',
  on_viewing: 'team.status.on_viewing',
  in_meeting: 'team.status.in_meeting',
  busy: 'team.status.busy',
  offline: 'team.status.offline',
};

export const PAYMENT_STATUS_LABEL: Record<'paid' | 'approved' | 'pending', TranslationKey> = {
  paid: 'billing.status.paid',
  approved: 'billing.status.approved',
  pending: 'billing.status.pending',
};

export const AUDIT_ACTION_LABEL: Record<
  'created' | 'status_change' | 'price_update' | 'agent_assigned' | 'notes_updated' | 'inspection',
  TranslationKey
> = {
  created: 'audit.action.created',
  status_change: 'audit.action.status_change',
  price_update: 'audit.action.price_update',
  agent_assigned: 'audit.action.agent_assigned',
  notes_updated: 'audit.action.notes_updated',
  inspection: 'audit.action.inspection',
};
