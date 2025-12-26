"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

/**
 * React Query Provider Configuration
 *
 * Configures:
 * - Default query options
 * - Cache behavior
 * - Retry logic
 * - Error handling
 */

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: How long data is considered fresh
            staleTime: 60 * 1000, // 1 minute

            // Cache time: How long unused data stays in cache
            gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)

            // Retry configuration
            retry: (failureCount, error) => {
              // Don't retry on auth errors
              if (
                error instanceof Error &&
                error.message.includes("UNAUTHENTICATED")
              ) {
                return false;
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },

            // Refetch configuration
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchOnReconnect: true,

            // Network mode
            networkMode: "online",
          },
          mutations: {
            // Retry mutations once
            retry: 1,

            // Network mode
            networkMode: "online",

            // Global error handler
            onError: (error) => {
              console.error("Mutation error:", error);
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Dev tools - only shows in development */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}
