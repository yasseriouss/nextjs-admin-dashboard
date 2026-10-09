import { describe, it, expect } from 'vitest';
import { mergeNotifications, makeImminentTaskNotification, makeContractExpiryNotification, makeUnitTransitionAlerts, makeSoldToast } from './notifications';
import { formatNumber } from '../i18n/format';
import type { AppNotification } from '../types';
import { INITIAL_UNITS } from '../data/mockUnits';
import { INITIAL_TASKS } from '../data/mockTasks';
import { INITIAL_CONTRACTS, calculateContractExpiryInfo } from '../data/mockContracts';
import type { Unit, FollowUpTask } from '../types';

const n = (over: Partial<AppNotification>): AppNotification => ({
  id: 'N-1', title: 'a', message: 'm', type: 'task_due',
  timestamp: new Date('2026-10-01T10:00:00.000Z'), read: false, ...over,
});

describe('mergeNotifications', () => {
  it('sorts newest-first and keeps both entries', () => {
    const existing = [n({ id: 'A', timestamp: new Date('2026-10-01T09:00:00.000Z') })];
    const incoming = [n({ id: 'B', timestamp: new Date('2026-10-01T10:00:00.000Z') })];
    expect(mergeNotifications(existing, incoming).map(x => x.id)).toEqual(['B', 'A']);
  });
  it('dedupes by id — existing (read-state) wins', () => {
    const existing = [n({ id: 'A', read: true })];
    const incoming = [n({ id: 'A', read: false })];
    const merged = mergeNotifications(existing, incoming);
    expect(merged).toHaveLength(1);
    expect(merged[0].read).toBe(true);
  });
  it('returns existing when incoming is empty; both empty → []', () => {
    const existing = [n({ id: 'A' })];
    expect(mergeNotifications(existing, [])).toEqual(existing);
    expect(mergeNotifications([], [])).toEqual([]);
  });
});

describe('makeImminentTaskNotification', () => {
  const task: FollowUpTask = { ...structuredClone(INITIAL_TASKS[0]), id: 'T-77', clientName: 'Sara' };
  it('uses stable id and carries task fields', () => {
    const item = makeImminentTaskNotification(task);
    expect(item.id).toBe('task-imminent-T-77');
    expect(item.type).toBe('task_due');
    expect(item.taskId).toBe('T-77');
    expect(item.clientName).toBe('Sara');
  });
  it('returns catalog keys with interpolation vars (no baked-in copy)', () => {
    const item = makeImminentTaskNotification(task);
    expect(item.titleKey).toBe('notifications.taskDue.title');
    expect(item.messageKey).toBe('notifications.taskDue.message');
    expect(item.title).toBeUndefined();
    expect(item.message).toBeUndefined();
    expect(item.messageVars).toEqual({
      title: task.title,
      client: 'Sara',
      due: task.dueTime || task.dueDate,
    });
  });
});

describe('makeContractExpiryNotification', () => {
  const cnt = { ...structuredClone(INITIAL_CONTRACTS[0]), expiryDate: '2020-01-01' };
  it('builds expired alert', () => {
    const info = calculateContractExpiryInfo(cnt.expiryDate);
    const item = makeContractExpiryNotification(cnt, info);
    expect(item.id).toBe(`cnt-expiry-${cnt.id}`);
    expect(item.type).toBe('alert');
    expect(info.isExpired).toBe(true);
    expect(item.titleKey).toBe('notifications.contractExpired.title');
    expect(item.titleVars).toEqual({ number: cnt.contractNumber });
  });
  it('builds expiring-soon alert with the days countdown as a var', () => {
    const d = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    const soon = { ...cnt, expiryDate: d };
    const info = calculateContractExpiryInfo(soon.expiryDate);
    expect(info.isExpiringSoon).toBe(true);
    const item = makeContractExpiryNotification(soon, info);
    expect(item.id).toBe(`cnt-expiry-${soon.id}`);
    expect(item.titleKey).toBe('notifications.contractExpiring.title');
    expect(item.titleVars?.days).toBe(info.daysRemaining);
    expect(item.messageKey).toBe('notifications.contract.message');
  });
});

describe('makeUnitTransitionAlerts', () => {
  const unit = (status: string, id = 'U-5'): Unit => ({ ...structuredClone(INITIAL_UNITS[0]), id, status } as Unit);
  it('fires sold alert on Available → Sold', () => {
    const alerts = makeUnitTransitionAlerts([unit('Available')], [unit('Sold')]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('sold');
    expect(alerts[0].id).toContain('U-5');
    expect(alerts[0].titleKey).toBe('notifications.sold.title');
    expect(alerts[0].messageKey).toBe('notifications.sold.message');
    expect(alerts[0].messageVars?.unit).toBe('U-5');
  });
  it('fires reserved alert on Available → Reserved', () => {
    const alerts = makeUnitTransitionAlerts([unit('Available')], [unit('Reserved')]);
    expect(alerts[0].type).toBe('reserved');
    expect(alerts[0].titleKey).toBe('notifications.reserved.title');
    expect(alerts[0].messageKey).toBe('notifications.reserved.message');
  });
  it('does not re-fire when already Sold → Sold, or for unknown units', () => {
    expect(makeUnitTransitionAlerts([unit('Sold')], [unit('Sold')])).toEqual([]);
    expect(makeUnitTransitionAlerts([], [unit('Sold')])).toEqual([]);
  });
});

describe('makeSoldToast', () => {
  it('returns sold toast for a Sold unit', () => {
    const u = { ...structuredClone(INITIAL_UNITS[0]), status: 'Sold' } as Unit;
    const toast = makeSoldToast(u);
    expect(toast).not.toBeNull();
    expect(toast!.type).toBe('sold');
    expect(toast!.id).toContain(u.id);
    expect(toast!.titleKey).toBe('notifications.soldMarked.title');
    expect(toast!.messageKey).toBe('notifications.soldMarked.message');
    expect(toast!.messageVars).toEqual({
      unit: u.id,
      compound: u.compound,
      value: formatNumber(u.price),
      currency: u.currency,
    });
  });
  it('returns null for a non-sold unit', () => {
    const u = { ...structuredClone(INITIAL_UNITS[0]), status: 'Available' } as Unit;
    expect(makeSoldToast(u)).toBeNull();
  });
});
