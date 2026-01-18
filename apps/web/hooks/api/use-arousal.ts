import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@workspace/shared/api-client";
import { toast } from "@workspace/ui/components/sonner";

export const arousalKeys = {
  all: ["mood"] as const,
  current: (userId: string) => ["mood", "current", userId] as const,
  insights: (userId: string, startDate: string, endDate: string) =>
    ["mood", "insights", userId, startDate, endDate] as const,
};

// GET Current Arousal
export function useCurrentArousal(userId: string) {
  return useQuery({
    queryKey: arousalKeys.current(userId),
    queryFn: () => apiClient.getCurrentArousal(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// RECORD Arousal
export function useRecordArousal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.recordArousal,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: arousalKeys.current(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: arousalKeys.all });
      toast.success("Arousal recorded!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to record mood");
    },
  });
}

// GET Arousal Insights
export function useArousalInsights(
  userId: string,
  startDate: string,
  endDate: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: arousalKeys.insights(userId, startDate, endDate),
    queryFn: () => apiClient.getArousalInsights(userId, startDate, endDate),
    enabled: enabled && !!userId && !!startDate && !!endDate,
  });
}
