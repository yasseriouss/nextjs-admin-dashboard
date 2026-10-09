import { describe, it, expect } from 'vitest';
import { computeDashboardKpis } from './kpis';
import { INITIAL_UNITS } from '../data/mockUnits';
import { INITIAL_OWNERS } from '../data/mockOwners';
import { INITIAL_CLIENTS } from '../data/mockClients';
import { INITIAL_TASKS } from '../data/mockTasks';

const base = (over: Partial<Parameters<typeof computeDashboardKpis>[0]>) => ({
  units: INITIAL_UNITS, owners: INITIAL_OWNERS, clients: INITIAL_CLIENTS, tasks: INITIAL_TASKS, mode: 'sales' as const,
  ...over,
});

describe('computeDashboardKpis', () => {
  it('counts real units by status for sales mode (excludes rent)', () => {
    const k = computeDashboardKpis(base({}));
    const expectedSales = INITIAL_UNITS.filter(u => u.category !== 'rent');
    expect(k.totalUnits).toBe(expectedSales.length);
    const statuses = expectedSales.map(u => u.status);
    expect(k.availableUnits).toBe(statuses.filter(s => s === 'Available').length);
    expect(k.reservedUnits).toBe(statuses.filter(s => s === 'Reserved').length);
    expect(k.soldUnits).toBe(statuses.filter(s => s === 'Sold').length);
  });

  it('counts only rent units in rent mode', () => {
    const k = computeDashboardKpis(base({ mode: 'rent' }));
    expect(k.totalUnits).toBe(INITIAL_UNITS.filter(u => u.category === 'rent').length);
  });

  it('reports actual client/owner counts — zero clients shows 0, never a fabricated fallback', () => {
    const k = computeDashboardKpis(base({ clients: [] }));
    expect(k.activeClientsCount).toBe(0);
    expect(k.ownersCount).toBe(INITIAL_OWNERS.length);
  });

  it('counts only tasks actually due today and not completed', () => {
    const today = new Date().toISOString().slice(0, 10);
    const dueToday = { ...INITIAL_TASKS[0], id: 'DUE-1', dueDate: today, stage: 'viewing' as const };
    const doneToday = { ...INITIAL_TASKS[1], id: 'DONE-1', dueDate: today, stage: 'completed' as const };
    const later = { ...INITIAL_TASKS[2], id: 'LATER-1', dueDate: '2099-01-01', stage: 'lead' as const };
    const k = computeDashboardKpis(base({ tasks: [dueToday, doneToday, later] }));
    expect(k.todayFollowUpsCount).toBe(1);
  });

  it('computes market value and average price from priced units only', () => {
    const k = computeDashboardKpis(base({}));
    const sales = INITIAL_UNITS.filter(u => u.category !== 'rent');
    const priced = sales.filter(u => Number(u.price) > 0);
    const total = priced.reduce((s, u) => s + Number(u.price), 0);
    expect(k.totalMarketValue).toBe(total);
    expect(k.avgUnitPrice).toBe(priced.length ? Math.round(total / priced.length) : 0);
  });
});
