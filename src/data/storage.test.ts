import { describe, it, expect, beforeEach } from 'vitest';
import { STORAGE_KEYS, loadJson, saveJson, loadUnits, loadTasks, loadOwners, loadUiSettings } from './storage';
import { INITIAL_UNITS } from './mockUnits';
import { INITIAL_OWNERS } from './mockOwners';
import { INITIAL_TASKS } from './mockTasks';

beforeEach(() => localStorage.clear());

describe('loadJson / saveJson', () => {
  it('round-trips values', () => {
    saveJson('k', [1, 2, 3]);
    expect(loadJson<number[]>('k', [])).toEqual([1, 2, 3]);
  });
  it('returns fallback on corrupt JSON', () => {
    localStorage.setItem('k', '{not json');
    expect(loadJson<number[]>('k', [7])).toEqual([7]);
  });
  it('returns fallback when key missing', () => {
    expect(loadJson<number[]>('k', [7])).toEqual([7]);
  });
});

describe('loadUnits', () => {
  it('falls back to INITIAL_UNITS when nothing stored', () => {
    expect(loadUnits()).toEqual(INITIAL_UNITS);
  });
  it('normalizes non-canonical legacy statuses', () => {
    const base = structuredClone(INITIAL_UNITS[0]);
    (base as { status: string }).status = 'under negotiation';
    saveJson(STORAGE_KEYS.units, [base]);
    expect(loadUnits()[0].status).toBe('Available');
  });
  it('keeps canonical statuses', () => {
    const base = structuredClone(INITIAL_UNITS[0]);
    base.status = 'Reserved';
    saveJson(STORAGE_KEYS.units, [base]);
    expect(loadUnits()[0].status).toBe('Reserved');
  });
});

describe('loadTasks', () => {
  it('backfills category from type for legacy tasks', () => {
    const base = structuredClone(INITIAL_TASKS[0]);
    delete base.category;
    base.type = 'meeting';
    saveJson(STORAGE_KEYS.tasks, [base]);
    expect(loadTasks()[0].category).toBe('meeting');
  });
  it('does NOT fabricate an imminent TSK-1001 deadline (demo hack removed)', () => {
    const base = structuredClone(INITIAL_TASKS.find(t => t.id === 'TSK-1001') ?? INITIAL_TASKS[0]);
    base.dueDate = '2020-01-01';
    base.dueTime = '10:00';
    saveJson(STORAGE_KEYS.tasks, [base]);
    const loaded = loadTasks().find(t => t.id === base.id)!;
    expect(loaded.dueDate).toBe('2020-01-01');
    expect(loaded.dueTime).toBe('10:00');
  });
});

describe('loadOwners', () => {
  it('replaces a lone legacy owner record with the full seed set', () => {
    saveJson(STORAGE_KEYS.owners, [structuredClone(INITIAL_OWNERS[0])]);
    expect(loadOwners()).toEqual(INITIAL_OWNERS);
  });
  it('derives missing clientCategory from the owner name', () => {
    const withCompany = { ...structuredClone(INITIAL_OWNERS[0]), name: 'شركة نيل للتطوير العقاري' };
    delete (withCompany as { clientCategory?: string }).clientCategory;
    saveJson(STORAGE_KEYS.owners, [withCompany, ...structuredClone(INITIAL_OWNERS).slice(1)]);
    expect(loadOwners()[0].clientCategory).toBe('developer');
  });
});

describe('loadUiSettings', () => {
  it('returns defaults when nothing stored', () => {
    const s = loadUiSettings();
    expect(s.theme).toBe('light');
    expect(s.tableDensity).toBe('normal');
  });
});
