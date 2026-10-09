import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ar } from '../locales/ar';
import { en } from '../locales/en';
import type { TranslationKey } from '../locales/keys';

export type Lang = 'ar' | 'en';
export type TVars = Record<string, string | number>;
export type TFunction = (key: TranslationKey, vars?: TVars) => string;

const CATALOGS: Record<Lang, Record<TranslationKey, string>> = { ar, en };
const STORAGE_KEY = '6O_LANG';

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  isArabic: boolean;
  t: TFunction;
}

const I18nContext = createContext<I18nValue | null>(null);

function readStoredLang(): Lang {
  if (typeof window === 'undefined') return 'ar';
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'ar' || v === 'en') return v;
  } catch { /* storage unavailable — fall through */ }
  return 'ar';
}

function interpolate(msg: string, vars?: TVars): string {
  if (!vars) return msg;
  return msg.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  const t = useCallback<TFunction>((key, vars) => {
    const msg = CATALOGS[lang][key];
    if (msg === undefined) return key as string; // dev-visible fallback, never throws
    return interpolate(msg, vars);
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, isArabic: lang === 'ar', t }),
    [lang, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
