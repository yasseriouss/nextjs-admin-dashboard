import type { SalesContract } from '../../data/mockContracts';
import type { ContractRepository } from '../types';
import { loadContracts, saveJson, STORAGE_KEYS } from '../../data/storage';

export class LocalContractRepository implements ContractRepository {
  async list(): Promise<SalesContract[]> {
    return loadContracts();
  }

  async get(id: string): Promise<SalesContract | null> {
    const contracts = loadContracts();
    return contracts.find((c) => c.id === id) ?? null;
  }

  async create(contract: SalesContract): Promise<SalesContract> {
    const contracts = loadContracts();
    const existingIndex = contracts.findIndex((c) => c.id === contract.id);
    let next: SalesContract[];
    if (existingIndex >= 0) {
      next = [...contracts];
      next[existingIndex] = contract;
    } else {
      next = [contract, ...contracts];
    }
    saveJson(STORAGE_KEYS.contracts, next);
    return contract;
  }

  async update(id: string, patch: Partial<SalesContract>): Promise<SalesContract> {
    const contracts = loadContracts();
    const index = contracts.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`[LocalContractRepository] Contract with id "${id}" not found.`);
    }
    const updated: SalesContract = { ...contracts[index], ...patch, id };
    const next = [...contracts];
    next[index] = updated;
    saveJson(STORAGE_KEYS.contracts, next);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const contracts = loadContracts();
    const next = contracts.filter((c) => c.id !== id);
    saveJson(STORAGE_KEYS.contracts, next);
    return next.length < contracts.length;
  }
}
