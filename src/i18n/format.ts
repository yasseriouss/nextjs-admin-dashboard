import type { Lang } from './I18nProvider';

const LOCALES: Record<Lang, string> = { ar: 'ar-EG', en: 'en-EG' };

export function formatNumber(value: number | string, lang: Lang = 'en', maxFrac = 2): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat(LOCALES[lang] || 'en-EG', { maximumFractionDigits: maxFrac }).format(num);
}

export function formatEGP(value: number | string, lang: Lang = 'ar'): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return formatNumber(0, lang);
  return new Intl.NumberFormat(LOCALES[lang] || 'ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(d: Date | string | number, lang: Lang = 'en'): string {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(LOCALES[lang] || 'en-EG', { dateStyle: 'medium' }).format(date);
}
