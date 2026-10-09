import type {
  Unit,
  UnitCommentEntry,
  UnitAuditLogEntry,
  ClientLead,
  FollowUpTask,
  Owner,
} from '../types';
import type { SalesContract } from '../data/mockContracts';

export interface UnitRepository {
  list(): Promise<Unit[]>;
  get(id: string): Promise<Unit | null>;
  create(unit: Unit): Promise<Unit>;
  update(id: string, patch: Partial<Unit>): Promise<Unit>;
  delete(id: string): Promise<boolean>;
  addComment(unitId: string, comment: Omit<UnitCommentEntry, 'id' | 'createdAt'>): Promise<UnitCommentEntry>;
  addAuditLog(unitId: string, log: Omit<UnitAuditLogEntry, 'id' | 'timestamp'>): Promise<UnitAuditLogEntry>;
}

export interface ClientRepository {
  list(): Promise<ClientLead[]>;
  get(id: string): Promise<ClientLead | null>;
  create(client: ClientLead): Promise<ClientLead>;
  update(id: string, patch: Partial<ClientLead>): Promise<ClientLead>;
  delete(id: string): Promise<boolean>;
}

export interface TaskRepository {
  list(): Promise<FollowUpTask[]>;
  get(id: string): Promise<FollowUpTask | null>;
  create(task: FollowUpTask): Promise<FollowUpTask>;
  update(id: string, patch: Partial<FollowUpTask>): Promise<FollowUpTask>;
  delete(id: string): Promise<boolean>;
}

export interface ContractRepository {
  list(): Promise<SalesContract[]>;
  get(id: string): Promise<SalesContract | null>;
  create(contract: SalesContract): Promise<SalesContract>;
  update(id: string, patch: Partial<SalesContract>): Promise<SalesContract>;
  delete(id: string): Promise<boolean>;
}

export interface OwnerRepository {
  list(): Promise<Owner[]>;
  get(id: string): Promise<Owner | null>;
  create(owner: Owner): Promise<Owner>;
  update(id: string, patch: Partial<Owner>): Promise<Owner>;
  delete(id: string): Promise<boolean>;
}
