"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 10,

            retry: (failureCount, error) => {
              if (
                error instanceof Error &&
                error.message.includes("UNAUTHENTICATED")
              ) {
                return false;
              }
              return failureCount < 2;
            },

            // Explicit user refresh is preferred over automatic background refetches
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            refetchOnReconnect: true,
            networkMode: "online",
          },
          mutations: {
            retry: 0,
            networkMode: "online",
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Dev tools - only shows in development */}
      {IS_DEVELOPMENT && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
