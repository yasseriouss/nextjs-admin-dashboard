import { describe, it, expect } from 'vitest';
import { ar } from '../locales/ar';
import { en } from '../locales/en';

describe('locale parity', () => {
  it('ar and en have identical key sets', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ar).sort());
  });
  it('no empty values in either catalog', () => {
    for (const [k, v] of Object.entries(ar)) expect(v, `ar.${k}`).not.toBe('');
    for (const [k, v] of Object.entries(en)) expect(v, `en.${k}`).not.toBe('');
  });
});
