import { describe, it, expect } from 'vitest';
import {
  NAV_SECTIONS,
  NAV_FLAT,
  NAV_BY_ID,
  NAV_EXTRA,
  navLabelKey,
  navSectionKey,
} from './navConfig';
import { ar } from '../locales/ar';
import { en } from '../locales/en';

describe('navConfig', () => {
  it('flat list matches sections and ids are unique', () => {
    const fromSections = NAV_SECTIONS.flatMap(s => s.items);
    expect(NAV_FLAT).toEqual(fromSections);
    const ids = NAV_FLAT.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('every item and section resolves to a non-empty catalog entry', () => {
    for (const item of [...NAV_FLAT, ...NAV_EXTRA]) {
      expect(ar[navLabelKey(item.id)], `ar.${navLabelKey(item.id)}`).toBeTruthy();
      expect(en[navLabelKey(item.id)], `en.${navLabelKey(item.id)}`).toBeTruthy();
    }
    for (const section of NAV_SECTIONS) {
      expect(ar[navSectionKey(section.key)], `ar.${navSectionKey(section.key)}`).toBeTruthy();
      expect(en[navSectionKey(section.key)], `en.${navSectionKey(section.key)}`).toBeTruthy();
    }
  });
  it('NAV_BY_ID covers every item', () => {
    for (const item of [...NAV_FLAT, ...NAV_EXTRA]) expect(NAV_BY_ID[item.id]).toBe(item);
    expect(Object.keys(NAV_BY_ID).length).toBe(NAV_FLAT.length + NAV_EXTRA.length);
  });
});
