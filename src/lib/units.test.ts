import { describe, it, expect } from 'vitest';
import { normalizeUnitStatus } from './units';

describe('normalizeUnitStatus', () => {
  it('passes through canonical values case-insensitively', () => {
    expect(normalizeUnitStatus('available')).toBe('Available');
    expect(normalizeUnitStatus('RESERVED')).toBe('Reserved');
    expect(normalizeUnitStatus('Sold')).toBe('Sold');
  });
  it('normalizes Arabic status keywords', () => {
    expect(normalizeUnitStatus('محجوز')).toBe('Reserved');
    expect(normalizeUnitStatus('تم البيع')).toBe('Sold');
    expect(normalizeUnitStatus('مباع')).toBe('Sold');
    expect(normalizeUnitStatus('متاح')).toBe('Available');
  });
  it('falls back to Available for unknown values', () => {
    expect(normalizeUnitStatus('')).toBe('Available');
    expect(normalizeUnitStatus('under negotiation')).toBe('Available');
    expect(normalizeUnitStatus('رخصة')).toBe('Available');
  });
});
