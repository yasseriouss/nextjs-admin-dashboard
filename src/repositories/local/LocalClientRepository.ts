import type { ClientLead } from '../../types';
import type { ClientRepository } from '../types';
import { loadClients, saveJson, STORAGE_KEYS } from '../../data/storage';

export class LocalClientRepository implements ClientRepository {
  async list(): Promise<ClientLead[]> {
    return loadClients();
  }

  async get(id: string): Promise<ClientLead | null> {
    const clients = loadClients();
    return clients.find((c) => c.id === id) ?? null;
  }

  async create(client: ClientLead): Promise<ClientLead> {
    const clients = loadClients();
    const existingIndex = clients.findIndex((c) => c.id === client.id);
    let next: ClientLead[];
    if (existingIndex >= 0) {
      next = [...clients];
      next[existingIndex] = client;
    } else {
      next = [client, ...clients];
    }
    saveJson(STORAGE_KEYS.clients, next);
    return client;
  }

  async update(id: string, patch: Partial<ClientLead>): Promise<ClientLead> {
    const clients = loadClients();
    const index = clients.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`[LocalClientRepository] Client with id "${id}" not found.`);
    }
    const updated: ClientLead = { ...clients[index], ...patch, id };
    const next = [...clients];
    next[index] = updated;
    saveJson(STORAGE_KEYS.clients, next);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const clients = loadClients();
    const next = clients.filter((c) => c.id !== id);
    saveJson(STORAGE_KEYS.clients, next);
    return next.length < clients.length;
  }
}
