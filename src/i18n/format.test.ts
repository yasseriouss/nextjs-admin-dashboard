import { describe, it, expect } from 'vitest';
import { formatEGP, formatNumber, formatDate } from './format';

describe('format', () => {
  it('formats plain numbers per locale', () => {
    expect(formatNumber(1234.5678, 'en', 2)).toBe('1,234.57');
    expect(formatNumber(1234.5678, 'ar', 2)).toMatch(/1[٬،]234|١[٬،]٢٣٤/);
  });
  it('formats EGP currency', () => {
    expect(formatEGP(2500, 'en')).toMatch(/EGP|£/);
    expect(formatEGP(2500, 'ar')).toMatch(/ج\.?م\.?|EGP/);
  });
  it('handles non-finite and invalid dates safely', () => {
    expect(formatNumber(NaN, 'en')).toBe('0');
    expect(formatEGP(Infinity, 'en')).toBe(formatNumber(0, 'en'));
    expect(formatDate('not-a-date', 'en')).toBe('');
    expect(formatDate('2026-01-15', 'en')).toContain('2026');
  });
});
