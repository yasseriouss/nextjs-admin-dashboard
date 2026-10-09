import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { I18nProvider, useI18n } from './I18nProvider';

const Probe = () => {
  const { lang, isArabic, t, setLang } = useI18n();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="dir">{document.documentElement.dir}</span>
      <span data-testid="htmllang">{document.documentElement.lang}</span>
      <span data-testid="saved">{t('common.save')}</span>
      <span data-testid="count">{t('common.itemCount', { n: 5 })}</span>
      <button data-testid="switch" onClick={() => setLang(isArabic ? 'en' : 'ar')}>go</button>
    </div>
  );
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
});

describe('i18n core', () => {
  it('defaults to Arabic and syncs <html lang dir>', () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByTestId('lang').textContent).toBe('ar');
    expect(screen.getByTestId('htmllang').textContent).toBe('ar');
    expect(screen.getByTestId('dir').textContent).toBe('rtl');
    expect(screen.getByTestId('saved').textContent).toBe('حفظ');
  });

  it('switches language, persists 6O_LANG, re-syncs html', async () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    act(() => screen.getByTestId('switch').click());
    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(screen.getByTestId('htmllang').textContent).toBe('en');
    expect(screen.getByTestId('dir').textContent).toBe('ltr');
    expect(screen.getByTestId('saved').textContent).toBe('Save');
    expect(localStorage.getItem('6O_LANG')).toBe('en');
  });

  it('a fresh provider instance reads persisted language', () => {
    localStorage.setItem('6O_LANG', 'en');
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('interpolates {placeholder} vars', () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByTestId('count').textContent).toBe('لديك 5 عنصر');
  });

  it('returns the key itself when a key is unknown (dev-visible, non-crashing)', () => {
    const Bad = () => {
      const { t } = useI18n();
      // cast is fine in a TEST to prove runtime behavior
      return <span data-testid="bad">{t('nope.missing' as never)}</span>;
    };
    render(<I18nProvider><Bad /></I18nProvider>);
    expect(screen.getByTestId('bad').textContent).toBe('nope.missing');
  });
});
