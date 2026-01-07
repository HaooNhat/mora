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
import { journalService } from "@workspace/api-client/services/journal.service";
import { ServiceError } from "@workspace/api-client/services/project.service";
import type { JournalEntry, MoodType } from "@workspace/core/mood/types";

type JournalMutationContext = {
  previousEntries?: JournalEntry[];
};

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
    },
    JournalMutationContext
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<
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
    },
    JournalMutationContext
  >({
    mutationFn: ({ entryId, updates }) =>
      journalService.updateEntry(entryId, updates),

    onMutate: async ({ entryId, updates }) => {
      await queryClient.cancelQueries({ queryKey: journalKeys.list() });

      const previousEntries = queryClient.getQueryData<JournalEntry[]>(
        journalKeys.list(),
      );

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

    onError: (_err, _variables, context) => {
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

/**
 * Delete journal entry mutation
 */
export function useDeleteJournalEntry(
  options?: UseMutationOptions<
    void,
    ServiceError,
    string,
    JournalMutationContext
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<void, ServiceError, string, JournalMutationContext>({
    mutationFn: (entryId) => journalService.deleteEntry(entryId),

    onMutate: async (entryId) => {
      await queryClient.cancelQueries({ queryKey: journalKeys.list() });

      const previousEntries = queryClient.getQueryData<JournalEntry[]>(
        journalKeys.list(),
      );

      if (previousEntries) {
        queryClient.setQueryData<JournalEntry[]>(
          journalKeys.list(),
          previousEntries.filter((entry) => entry.id !== entryId),
        );
      }

      return { previousEntries };
    },

    onError: (_err, _entryId, context) => {
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
