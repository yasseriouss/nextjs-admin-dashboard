import { describe, it, expect } from 'vitest';
import {
  UNIT_STATUS_LABEL, KANBAN_STAGE_LABEL, TASK_PRIORITY_LABEL, LEAD_STAGE_LABEL,
  OWNER_CLIENT_STATUS_LABEL, MEMBER_STATUS_LABEL, PAYMENT_STATUS_LABEL, AUDIT_ACTION_LABEL,
} from './labels';
import { ar } from '../locales/ar';
import { en } from '../locales/en';

const MAPS = {
  UNIT_STATUS_LABEL, KANBAN_STAGE_LABEL, TASK_PRIORITY_LABEL, LEAD_STAGE_LABEL,
  OWNER_CLIENT_STATUS_LABEL, MEMBER_STATUS_LABEL, PAYMENT_STATUS_LABEL, AUDIT_ACTION_LABEL,
} as const;

describe('labels', () => {
  it('every label key exists in BOTH catalogs with a non-empty value', () => {
    for (const [name, map] of Object.entries(MAPS)) {
      for (const [code, key] of Object.entries(map)) {
        expect(ar[key as keyof typeof ar], `${name}.${code} in ar`).toBeTruthy();
        expect(en[key as keyof typeof en], `${name}.${code} in en`).toBeTruthy();
      }
    }
  });
  it('unit statuses are exactly Available/Reserved/Sold', () => {
    expect(Object.keys(UNIT_STATUS_LABEL).sort()).toEqual(['Available', 'Reserved', 'Sold']);
  });
  it('kanban stages cover the full union', () => {
    expect(Object.keys(KANBAN_STAGE_LABEL).sort()).toEqual(
      ['completed', 'contacted', 'contract', 'lead', 'negotiation', 'viewing'],
    );
  });
  it('task priorities cover the full union', () => {
    expect(Object.keys(TASK_PRIORITY_LABEL).sort()).toEqual(['high', 'low', 'medium', 'urgent']);
  });
});
