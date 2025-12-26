/**
 * React Query Hooks for Journal Entries
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  journalService,
  ServiceError,
} from "@workspace/api-client/services/journal.service";
import type { JournalEntry, MoodType } from "@workspace/core/mood/types";

/**
 * Query Keys Factory
 */
export const journalKeys = {
  all: ["journals"] as const,
  lists: () => [...journalKeys.all, "list"] as const,
  list: () => [...journalKeys.lists()] as const,
  byMood: (mood: MoodType) => [...journalKeys.all, "mood", mood] as const,
  byDateRange: (start: Date, end: Date) =>
    [
      ...journalKeys.all,
      "date-range",
      start.toISOString(),
      end.toISOString(),
    ] as const,
  search: (term: string) => [...journalKeys.all, "search", term] as const,
};

/* ================================
   JOURNAL QUERIES
================================ */

/**
 * Fetch all journal entries
 */
export function useJournalEntries(
  options?: Omit<
    UseQueryOptions<JournalEntry[], ServiceError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: journalKeys.list(),
    queryFn: () => journalService.getAllEntries(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

/**
 * Fetch journal entries by mood
 */
export function useJournalEntriesByMood(
  mood: MoodType,
  options?: Omit<
    UseQueryOptions<JournalEntry[], ServiceError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: journalKeys.byMood(mood),
    queryFn: () => journalService.getEntriesByMood(mood),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch journal entries by date range
 */
export function useJournalEntriesByDateRange(
  startDate: Date,
  endDate: Date,
  options?: Omit<
    UseQueryOptions<JournalEntry[], ServiceError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: journalKeys.byDateRange(startDate, endDate),
    queryFn: () => journalService.getEntriesByDateRange(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Search journal entries
 */
export function useSearchJournalEntries(
  searchTerm: string,
  options?: Omit<
    UseQueryOptions<JournalEntry[], ServiceError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: journalKeys.search(searchTerm),
    queryFn: () => journalService.searchEntries(searchTerm),
    enabled: searchTerm.trim().length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
}

/* ================================
   JOURNAL MUTATIONS
================================ */

/**
 * Create journal entry mutation
 */
export function useCreateJournalEntry(
  options?: UseMutationOptions<
    JournalEntry,
    ServiceError,
    {
      title?: string;
      content: string;
      mood?: MoodType;
      tags?: string[];
    }
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => journalService.createEntry(data),
    onSuccess: (newEntry) => {
      // Invalidate and refetch journal list
      queryClient.invalidateQueries({ queryKey: journalKeys.list() });

      // If entry has mood, invalidate mood-specific queries
      if (newEntry.mood) {
        queryClient.invalidateQueries({
          queryKey: journalKeys.byMood(newEntry.mood),
        });
      }
    },
    ...options,
  });
}

/**
 * Update journal entry mutation
 */
export function useUpdateJournalEntry(
  options?: UseMutationOptions<
    JournalEntry,
    ServiceError,
    {
      entryId: string;
      updates: {
        title?: string;
        content?: string;
        mood?: MoodType;
        tags?: string[];
      };
    }
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, updates }) =>
      journalService.updateEntry(entryId, updates),
    onMutate: async ({ entryId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: journalKeys.list() });

      // Snapshot previous value
      const previousEntries = queryClient.getQueryData<JournalEntry[]>(
        journalKeys.list(),
      );

      // Optimistically update
      if (previousEntries) {
        queryClient.setQueryData<JournalEntry[]>(
          journalKeys.list(),
          previousEntries.map((entry) =>
            entry.id === entryId
              ? { ...entry, ...updates, updatedAt: new Date() }
              : entry,
          ),
        );
      }

      return { previousEntries };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousEntries) {
        queryClient.setQueryData(journalKeys.list(), context.previousEntries);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: journalKeys.list() });
    },
    ...options,
  });
}

/**
 * Delete journal entry mutation
 */
export function useDeleteJournalEntry(
  options?: UseMutationOptions<void, ServiceError, string>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => journalService.deleteEntry(entryId),
    onMutate: async (entryId) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: journalKeys.list() });

      // Snapshot
      const previousEntries = queryClient.getQueryData<JournalEntry[]>(
        journalKeys.list(),
      );

      // Optimistically remove
      if (previousEntries) {
        queryClient.setQueryData<JournalEntry[]>(
          journalKeys.list(),
          previousEntries.filter((entry) => entry.id !== entryId),
        );
      }

      return { previousEntries };
    },
    onError: (err, entryId, context) => {
      // Rollback
      if (context?.previousEntries) {
        queryClient.setQueryData(journalKeys.list(), context.previousEntries);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.list() });
    },
    ...options,
  });
}
