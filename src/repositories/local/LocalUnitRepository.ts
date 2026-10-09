import type { Unit, UnitCommentEntry, UnitAuditLogEntry } from '../../types';
import type { UnitRepository } from '../types';
import { loadUnits, saveJson, STORAGE_KEYS } from '../../data/storage';

export class LocalUnitRepository implements UnitRepository {
  async list(): Promise<Unit[]> {
    return loadUnits();
  }

  async get(id: string): Promise<Unit | null> {
    const units = loadUnits();
    const found = units.find(u => u.id === id);
    return found ?? null;
  }

  async create(unit: Unit): Promise<Unit> {
    const units = loadUnits();
    const existingIndex = units.findIndex(u => u.id === unit.id);
    let nextUnits: Unit[];
    if (existingIndex >= 0) {
      nextUnits = [...units];
      nextUnits[existingIndex] = unit;
    } else {
      nextUnits = [unit, ...units];
    }
    saveJson(STORAGE_KEYS.units, nextUnits);
    return unit;
  }

  async update(id: string, patch: Partial<Unit>): Promise<Unit> {
    const units = loadUnits();
    const index = units.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`[LocalUnitRepository] Unit with id "${id}" not found.`);
    }
    const updated: Unit = { ...units[index], ...patch, id };
    const nextUnits = [...units];
    nextUnits[index] = updated;
    saveJson(STORAGE_KEYS.units, nextUnits);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const units = loadUnits();
    const nextUnits = units.filter(u => u.id !== id);
    saveJson(STORAGE_KEYS.units, nextUnits);
    return nextUnits.length < units.length;
  }

  async addComment(
    unitId: string,
    comment: Omit<UnitCommentEntry, 'id' | 'createdAt'>
  ): Promise<UnitCommentEntry> {
    const unit = await this.get(unitId);
    if (!unit) {
      throw new Error(`[LocalUnitRepository] Unit "${unitId}" not found.`);
    }
    const newComment: UnitCommentEntry = {
      ...comment,
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const nextComments = [...(unit.comments || []), newComment];
    await this.update(unitId, { comments: nextComments });
    return newComment;
  }

  async addAuditLog(
    unitId: string,
    log: Omit<UnitAuditLogEntry, 'id' | 'timestamp'>
  ): Promise<UnitAuditLogEntry> {
    const unit = await this.get(unitId);
    if (!unit) {
      throw new Error(`[LocalUnitRepository] Unit "${unitId}" not found.`);
    }
    const newEntry: UnitAuditLogEntry = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    const nextLogs = [newEntry, ...(unit.auditLog || [])];
    await this.update(unitId, { auditLog: nextLogs });
    return newEntry;
  }
}
