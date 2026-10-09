import {
  LayoutDashboard,
  Building2,
  Key,
  Map,
  Users,
  UserCheck,
  Sparkles,
  Layers,
  BarChart3,
  Compass,
  Calendar,
  Wallet,
  Settings,
  Globe,
  FileText,
  type LucideIcon
} from 'lucide-react';
import type { TranslationKey } from '../locales/keys';

export type NavTabId =
  | 'overview'
  | 'sales'
  | 'rent'
  | 'reports'
  | 'map'
  | 'geo'
  | 'calendar'
  | 'contracts'
  | 'tasks'
  | 'clients'
  | 'owners'
  | 'gemini'
  | 'landing-page-cms'
  | 'articles'
  | 'settings'
  | 'team';

export type NavSectionId = 'properties' | 'operations' | 'ai';

export type NavLabelKey = `nav.${NavTabId}`;
export type NavSectionKey = `nav.section.${NavSectionId}`;

export const navLabelKey = (id: NavTabId): NavLabelKey => `nav.${id}`;
export const navSectionKey = (key: NavSectionId): NavSectionKey => `nav.section.${key}`;

/** Compile-time proof that every generated nav key exists in the catalog. */
type AssertTrue<T extends true> = T;
export type NavKeysExist = AssertTrue<
  NavLabelKey extends TranslationKey
    ? NavSectionKey extends TranslationKey
      ? true
      : false
    : false
>;

export interface NavItem {
  id: NavTabId;
  icon: LucideIcon;
  isNew?: boolean;
}

export interface NavSection {
  key: NavSectionId;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'properties',
    items: [
      {
        id: 'overview',
        icon: LayoutDashboard
      },
      {
        id: 'sales',
        icon: Building2
      },
      {
        id: 'rent',
        icon: Key
      },
      {
        id: 'reports',
        icon: BarChart3
      },
      {
        id: 'map',
        icon: Map
      }
    ]
  },
  {
    key: 'operations',
    items: [
      {
        id: 'calendar',
        icon: Calendar
      },
      {
        id: 'contracts',
        icon: Wallet
      },
      {
        id: 'tasks',
        icon: Layers
      },
      {
        id: 'clients',
        icon: Users
      },
      {
        id: 'owners',
        icon: UserCheck
      }
    ]
  },
  {
    key: 'ai',
    items: [
      {
        id: 'gemini',
        icon: Sparkles,
        isNew: true
      },
      {
        id: 'landing-page-cms',
        icon: Globe,
        isNew: true
      },
      {
        id: 'articles',
        icon: FileText,
        isNew: true
      }
    ]
  }
];

export const NAV_EXTRA: NavItem[] = [
  {
    id: 'settings',
    icon: Settings
  },
  {
    id: 'team',
    icon: Layers
  },
  {
    id: 'geo',
    icon: Compass
  }
];

export const NAV_FLAT: NavItem[] = NAV_SECTIONS.flatMap(s => s.items);

export const NAV_BY_ID = Object.fromEntries(
  [...NAV_FLAT, ...NAV_EXTRA].map(item => [item.id, item] as const)
) as Record<NavTabId, NavItem>;
