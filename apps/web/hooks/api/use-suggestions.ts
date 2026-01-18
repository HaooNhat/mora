import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@workspace/shared/api-client";

export const suggestionKeys = {
  task: (userId: string) => ["suggestions", "task", userId] as const,
  timer: (userId: string) => ["suggestions", "timer", userId] as const,
};

// GET Task Suggestion
export function useTaskSuggestion(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: suggestionKeys.task(userId),
    queryFn: () => apiClient.getTaskSuggestion(userId),
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// GET Timer Recommendation
export function useTimerRecommendation(
  userId: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: suggestionKeys.timer(userId),
    queryFn: () => apiClient.getTimerRecommendation(userId),
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
