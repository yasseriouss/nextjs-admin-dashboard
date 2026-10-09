'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUiSettings } from '../hooks/useStoredList';
import { loadUiSettings, loadUiSettingsRaw } from '../data/storage';
import { mergeNotifications } from '../lib/notifications';
import type { AppNotification, Unit } from '../types';
import { NAV_BY_ID, type NavTabId } from '../navigation/navConfig';
import { useI18n } from '../i18n/I18nProvider';

export interface AppUIContextValue {
  activeNavTab: NavTabId;
  isNotFound: boolean;
  setActiveNavTab: (t: NavTabId) => void;
  selectedUnit: Unit | null;
  setSelectedUnit: (u: Unit | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showAiPanel: boolean;
  setShowAiPanel: (v: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isArabic: boolean;
  setIsArabic: (v: boolean) => void;
  notifications: AppNotification[];
  setNotifications: Dispatch<SetStateAction<AppNotification[]>>;
  addNotifications: (incoming: AppNotification[]) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

const AppUIContext = createContext<AppUIContextValue | null>(null);

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'init-sold-sample',
    titleKey: 'notifications.seed.title',
    messageKey: 'notifications.seed.message',
    unitId: 'S-0012',
    compound: 'Mountain View iCity',
    price: 7850000,
    type: 'sold',
    timestamp: new Date(),
    read: false,
  },
];

export function AppUIProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();

  // Extract tab from pathname
  const cleanPath = pathname.replace(/^\/+/, '').split('/')[0] || '';
  const tabFromPath: NavTabId = cleanPath in NAV_BY_ID ? (cleanPath as NavTabId) : 'overview';

  const [activeNavTab, setActiveNavTabState] = useState<NavTabId>(tabFromPath);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const { isArabic, setLang } = useI18n();
  const setIsArabic = useCallback((v: boolean) => setLang(v ? 'ar' : 'en'), [setLang]);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    if (cleanPath in NAV_BY_ID) {
      setActiveNavTabState(cleanPath as NavTabId);
    } else if (cleanPath === '') {
      setActiveNavTabState('overview');
    }
  }, [cleanPath]);

  const setActiveNavTab = useCallback(
    (t: NavTabId) => {
      setActiveNavTabState(t);
      const target = t === 'overview' ? '/' : `/${t}`;
      router.push(target);
    },
    [router]
  );

  const { setData: setStoredUi } = useUiSettings();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = loadUiSettingsRaw();
      if (stored?.theme === 'dark' || stored?.theme === 'light') return stored.theme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      setStoredUi((old) => ({ ...(old ?? loadUiSettings()), theme: next }));
      return next;
    });
  }, [setStoredUi]);

  const addNotifications = useCallback((incoming: AppNotification[]) => {
    setNotifications((curr) => mergeNotifications(curr, incoming));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((curr) =>
      curr.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo<AppUIContextValue>(
    () => ({
      activeNavTab,
      isNotFound: false,
      setActiveNavTab,
      selectedUnit,
      setSelectedUnit,
      searchQuery,
      setSearchQuery,
      showAiPanel,
      setShowAiPanel,
      theme,
      toggleTheme,
      isArabic,
      setIsArabic,
      notifications,
      setNotifications,
      addNotifications,
      markNotificationRead,
      clearNotifications,
    }),
    [
      activeNavTab,
      setActiveNavTab,
      selectedUnit,
      searchQuery,
      showAiPanel,
      theme,
      toggleTheme,
      isArabic,
      setIsArabic,
      notifications,
      addNotifications,
      markNotificationRead,
      clearNotifications,
    ]
  );

  return <AppUIContext.Provider value={value}>{children}</AppUIContext.Provider>;
}

export function useAppUI(): AppUIContextValue {
  const ctx = useContext(AppUIContext);
  if (!ctx) {
    throw new Error('useAppUI must be used within an AppUIProvider');
  }
  return ctx;
}
