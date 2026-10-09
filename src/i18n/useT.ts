import { useI18n } from './I18nProvider';

/** `const t = useT(); t('units.title')` */
export function useT() {
  return useI18n().t;
}
