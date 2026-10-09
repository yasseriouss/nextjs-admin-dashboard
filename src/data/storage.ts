import type { Unit, Owner, FollowUpTask, ClientLead, TeamMember, UISettings } from '../types';
import type { SalesContract } from './mockContracts';
import { INITIAL_UNITS } from './mockUnits';
import { INITIAL_OWNERS } from './mockOwners';
import { INITIAL_TASKS } from './mockTasks';
import { INITIAL_CLIENTS } from './mockClients';
import { INITIAL_TEAM } from './mockTeam';
import { INITIAL_CONTRACTS } from './mockContracts';
import { normalizeUnitStatus } from '../lib/units';

export const STORAGE_KEYS = {
  units: '6O_CRM_UNITS',
  owners: '6O_CRM_OWNERS',
  tasks: '6O_CRM_KANBAN_TASKS',
  clients: '6O_CRM_CLIENTS',
  team: '6O_CRM_TEAM',
  contracts: '6O_CRM_CONTRACTS',
  kanbanCategories: '6O_CRM_KANBAN_CATEGORIES',
  uiSettings: '6O_UI_SETTINGS',
  remindersSuppressed: '6O_DONT_AUTO_SHOW_REMINDERS',
  geminiChat: '6O_GEMINI_CHAT_HISTORY',
} as const;

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded / private mode — keep app running on in-memory state */
  }
}

export function loadUnits(): Unit[] {
  const parsed = loadJson<Unit[] | null>(STORAGE_KEYS.units, null);
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) return INITIAL_UNITS;
  return parsed.map(u => ({ ...u, status: normalizeUnitStatus(u.status) }));
}

export function loadOwners(): Owner[] {
  const parsed = loadJson<Owner[] | null>(STORAGE_KEYS.owners, null);
  if (!parsed || !Array.isArray(parsed) || parsed.length <= 1) return INITIAL_OWNERS;
  return parsed.map(o => {
    let cat = o.clientCategory;
    if (!cat) {
      const nameLower = (o.name || '').toLowerCase();
      if (nameLower.includes('شركة') || nameLower.includes('تطوير') || nameLower.includes('dev')) cat = 'developer';
      else if (nameLower.includes('صندوق') || nameLower.includes('استثمار') || nameLower.includes('invest')) cat = 'investor';
      else cat = 'individual';
    }
    const st: Owner['clientStatus'] =
      o.clientStatus ||
      (o.status && o.status.toLowerCase().includes('inact') ? 'Inactive'
        : o.status && o.status.toLowerCase().includes('prospect') ? 'Prospect'
        : 'Active');
    return { ...o, clientCategory: cat, category: cat, clientStatus: st, status: st };
  });
}

export function loadTasks(): FollowUpTask[] {
  const loaded = loadJson<FollowUpTask[]>(STORAGE_KEYS.tasks, INITIAL_TASKS);
  if (!Array.isArray(loaded) || loaded.length === 0) return INITIAL_TASKS;
  return loaded.map(t => {
    if (t.category) return t;
    const byType: Record<string, string> = {
      meeting: 'meeting', call: 'call', visit: 'visit', contract: 'contract', payment: 'payment',
    };
    return { ...t, category: (byType[t.type] ?? 'followup') as FollowUpTask['category'] };
  });
}

export const loadClients = (): ClientLead[] =>
  loadJson<ClientLead[]>(STORAGE_KEYS.clients, INITIAL_CLIENTS) || INITIAL_CLIENTS;

export const loadTeam = (): TeamMember[] =>
  loadJson<TeamMember[]>(STORAGE_KEYS.team, INITIAL_TEAM) || INITIAL_TEAM;

export const loadContracts = (): SalesContract[] =>
  loadJson<SalesContract[]>(STORAGE_KEYS.contracts, INITIAL_CONTRACTS) || INITIAL_CONTRACTS;

export const UI_SETTINGS_DEFAULTS: UISettings = {
  theme: 'light',
  tableDensity: 'normal',
  showAvatars: true,
  enableNotificationSound: true,
  autoSyncInterval: 0,
};

/**
 * Returns the raw parsed UISettings from localStorage, or `null` if nothing
 * has been stored yet (first visit). Used by AppUIContext to distinguish
 * "no preference stored → consult prefers-color-scheme" from "user explicitly
 * set a theme".
 */
export function loadUiSettingsRaw(): UISettings | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.uiSettings);
    if (!saved) return null;
    return JSON.parse(saved) as UISettings;
  } catch {
    return null;
  }
}

export const loadUiSettings = (): UISettings =>
  loadJson<UISettings>(STORAGE_KEYS.uiSettings, UI_SETTINGS_DEFAULTS);

