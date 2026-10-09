import type { UnitStatus } from '../types';

export type { UnitStatus };

export function normalizeUnitStatus(raw: string): UnitStatus {
  const s = (raw || '').toLowerCase();
  if (/reserved|محجوز|حجز/.test(s)) return 'Reserved';
  if (/sold|تم البيع|مباع/.test(s)) return 'Sold';
  return 'Available';
}
