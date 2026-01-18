import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@workspace/shared/api-client";
import { toast } from "@workspace/ui/components/sonner";

export const timerKeys = {
  all: ["timer-sessions"] as const,
  byUser: (userId: string) => ["timer-sessions", userId] as const,
  byDateRange: (userId: string, startDate: string, endDate: string) =>
    ["timer-sessions", userId, startDate, endDate] as const,
};

// GET Timer Sessions
export function useTimerSessions(
  userId: string,
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey:
      startDate && endDate
        ? timerKeys.byDateRange(userId, startDate, endDate)
        : timerKeys.byUser(userId),
    queryFn: () => apiClient.getTimerSessions(userId, startDate, endDate),
    enabled: !!userId,
  });
}

// START Timer Session
export function useStartTimerSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.startTimerSession,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: timerKeys.byUser(variables.userId),
      });
      toast.success("Timer started!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start timer");
    },
  });
}

// COMPLETE Timer Session
export function useCompleteTimerSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      pausedDuration,
    }: {
      sessionId: string;
      pausedDuration?: number;
    }) => apiClient.completeTimerSession(sessionId, pausedDuration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timerKeys.all });
      toast.success("Timer session completed!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete timer session");
    },
  });
}
