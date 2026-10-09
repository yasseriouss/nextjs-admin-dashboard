import type { Owner } from '../../types';
import type { OwnerRepository } from '../types';
import { loadOwners, saveJson, STORAGE_KEYS } from '../../data/storage';

export class LocalOwnerRepository implements OwnerRepository {
  async list(): Promise<Owner[]> {
    return loadOwners();
  }

  async get(id: string): Promise<Owner | null> {
    const owners = loadOwners();
    return owners.find((o) => o.id === id) ?? null;
  }

  async create(owner: Owner): Promise<Owner> {
    const owners = loadOwners();
    const existingIndex = owners.findIndex((o) => o.id === owner.id);
    let next: Owner[];
    if (existingIndex >= 0) {
      next = [...owners];
      next[existingIndex] = owner;
    } else {
      next = [owner, ...owners];
    }
    saveJson(STORAGE_KEYS.owners, next);
    return owner;
  }

  async update(id: string, patch: Partial<Owner>): Promise<Owner> {
    const owners = loadOwners();
    const index = owners.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`[LocalOwnerRepository] Owner with id "${id}" not found.`);
    }
    const updated: Owner = { ...owners[index], ...patch, id };
    const next = [...owners];
    next[index] = updated;
    saveJson(STORAGE_KEYS.owners, next);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const owners = loadOwners();
    const next = owners.filter((o) => o.id !== id);
    saveJson(STORAGE_KEYS.owners, next);
    return next.length < owners.length;
  }
}
