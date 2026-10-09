import type {
  UnitRepository,
  ClientRepository,
  TaskRepository,
  ContractRepository,
  OwnerRepository,
} from './types';
import { LocalUnitRepository } from './local/LocalUnitRepository';
import { SupabaseUnitRepository } from './supabase/SupabaseUnitRepository';
import { LocalClientRepository } from './local/LocalClientRepository';
import { SupabaseClientRepository } from './supabase/SupabaseClientRepository';
import { LocalTaskRepository } from './local/LocalTaskRepository';
import { SupabaseTaskRepository } from './supabase/SupabaseTaskRepository';
import { LocalContractRepository } from './local/LocalContractRepository';
import { SupabaseContractRepository } from './supabase/SupabaseContractRepository';
import { LocalOwnerRepository } from './local/LocalOwnerRepository';
import { SupabaseOwnerRepository } from './supabase/SupabaseOwnerRepository';
import { isSupabaseConfigured } from '../services/supabase/client';

export * from './types';
export { LocalUnitRepository } from './local/LocalUnitRepository';
export { SupabaseUnitRepository } from './supabase/SupabaseUnitRepository';
export { LocalClientRepository } from './local/LocalClientRepository';
export { SupabaseClientRepository } from './supabase/SupabaseClientRepository';
export { LocalTaskRepository } from './local/LocalTaskRepository';
export { SupabaseTaskRepository } from './supabase/SupabaseTaskRepository';
export { LocalContractRepository } from './local/LocalContractRepository';
export { SupabaseContractRepository } from './supabase/SupabaseContractRepository';
export { LocalOwnerRepository } from './local/LocalOwnerRepository';
export { SupabaseOwnerRepository } from './supabase/SupabaseOwnerRepository';

let unitRepoInstance: UnitRepository | null = null;
let clientRepoInstance: ClientRepository | null = null;
let taskRepoInstance: TaskRepository | null = null;
let contractRepoInstance: ContractRepository | null = null;
let ownerRepoInstance: OwnerRepository | null = null;

export function isCloudConnected(): boolean {
  return isSupabaseConfigured();
}

export function getActiveBackendName(): 'supabase' | 'local' {
  const backend = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DATA_BACKEND : undefined) || 'supabase';
  if (backend === 'local') return 'local';
  return isSupabaseConfigured() ? 'supabase' : 'local';
}

function shouldDefaultToSupabase(): boolean {
  return getActiveBackendName() === 'supabase';
}

export function getUnitRepository(): UnitRepository {
  if (unitRepoInstance) return unitRepoInstance;
  unitRepoInstance = shouldDefaultToSupabase() ? new SupabaseUnitRepository() : new LocalUnitRepository();
  return unitRepoInstance;
}

export function setUnitRepository(repo: UnitRepository | null): void {
  unitRepoInstance = repo;
}

export function getClientRepository(): ClientRepository {
  if (clientRepoInstance) return clientRepoInstance;
  clientRepoInstance = shouldDefaultToSupabase() ? new SupabaseClientRepository() : new LocalClientRepository();
  return clientRepoInstance;
}

export function setClientRepository(repo: ClientRepository | null): void {
  clientRepoInstance = repo;
}

export function getTaskRepository(): TaskRepository {
  if (taskRepoInstance) return taskRepoInstance;
  taskRepoInstance = shouldDefaultToSupabase() ? new SupabaseTaskRepository() : new LocalTaskRepository();
  return taskRepoInstance;
}

export function setTaskRepository(repo: TaskRepository | null): void {
  taskRepoInstance = repo;
}

export function getContractRepository(): ContractRepository {
  if (contractRepoInstance) return contractRepoInstance;
  contractRepoInstance = shouldDefaultToSupabase() ? new SupabaseContractRepository() : new LocalContractRepository();
  return contractRepoInstance;
}

export function setContractRepository(repo: ContractRepository | null): void {
  contractRepoInstance = repo;
}

export function getOwnerRepository(): OwnerRepository {
  if (ownerRepoInstance) return ownerRepoInstance;
  ownerRepoInstance = shouldDefaultToSupabase() ? new SupabaseOwnerRepository() : new LocalOwnerRepository();
  return ownerRepoInstance;
}

export function setOwnerRepository(repo: OwnerRepository | null): void {
  ownerRepoInstance = repo;
}
