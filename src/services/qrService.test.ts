import { describe, it, expect } from 'vitest';
import { getUnitDirectUrl, resolveLegacyUnitLocation } from './qrService';

describe('resolveLegacyUnitLocation', () => {
  it('maps ?unitId= to /units/:id', () => {
    expect(resolveLegacyUnitLocation('?unitId=U-1', '')).toBe('/units/U-1');
  });

  it('maps ?unit= to /units/:id', () => {
    expect(resolveLegacyUnitLocation('?unit=U-2', '')).toBe('/units/U-2');
  });

  it('returns null when no legacy param exists', () => {
    expect(resolveLegacyUnitLocation('', '')).toBeNull();
  });

  it('maps #unit= hash to /units/:id', () => {
    expect(resolveLegacyUnitLocation('', '#unit=U-3')).toBe('/units/U-3');
  });

  it('encodes the unit id', () => {
    expect(resolveLegacyUnitLocation('?unitId=U 1/A', '')).toBe('/units/U%201%2FA');
  });
});

describe('getUnitDirectUrl', () => {
  it('returns an origin-based /units/:id url in jsdom (window present)', () => {
    const url = getUnitDirectUrl('U-9');
    expect(url).toContain('/units/U-9');
    expect(url.startsWith(window.location.origin)).toBe(true);
  });
});
