"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AppUIProvider } from "@/context/AppUIContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AppUIProvider>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </AppUIProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
