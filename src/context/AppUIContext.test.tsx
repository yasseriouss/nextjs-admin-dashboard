import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppUIProvider, useAppUI } from './AppUIContext';
import { I18nProvider } from '../i18n/I18nProvider';
import type { ReactNode } from 'react';

const makeWrapper = () => {
  const client = new QueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <I18nProvider>
        <AppUIProvider>{children}</AppUIProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
};

describe('AppUIContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toggles theme and persists via uiSettings storage', async () => {
    const { result } = renderHook(() => useAppUI(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.theme).toBeDefined());
    const initial = result.current.theme;
    act(() => result.current.toggleTheme());
    expect(result.current.theme).not.toBe(initial);
    expect(JSON.parse(localStorage.getItem('6O_UI_SETTINGS')!).theme).toBe(result.current.theme);
  });

  it('toggles isArabic true → false', () => {
    const { result } = renderHook(() => useAppUI(), { wrapper: makeWrapper() });
    expect(result.current.isArabic).toBe(true);
    act(() => result.current.setIsArabic(false));
    expect(result.current.isArabic).toBe(false);
  });

  it('markNotificationRead is safe on unknown ids', () => {
    const { result } = renderHook(() => useAppUI(), { wrapper: makeWrapper() });
    expect(() => act(() => result.current.markNotificationRead('nope'))).not.toThrow();
  });
});
