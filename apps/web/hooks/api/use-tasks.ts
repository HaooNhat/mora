import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@workspace/shared/api-client";
import { toast } from "@workspace/ui/components/sonner";

export const taskKeys = {
  all: ["tasks"] as const,
  byProject: (projectId: string) => ["tasks", "project", projectId] as const,
  byArousal: (userId: string, arousal: string) =>
    ["tasks", "arousal", userId, arousal] as const,
  detail: (id: string) => ["tasks", id] as const,
};

// CREATE Task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createTask,
    onSuccess: (data, variables) => {
      // Invalidate tasks for this project
      queryClient.invalidateQueries({
        queryKey: taskKeys.byProject(variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Task created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create task");
    },
  });
}

// COMPLETE Task
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Task completed! 🎉");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete task");
    },
  });
}

// GET Tasks by Arousal
export function useTasksByArousal(
  userId: string,
  arousal: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: taskKeys.byArousal(userId, arousal),
    queryFn: () => apiClient.getTasksByArousal(userId, arousal),
    enabled: enabled && !!userId && !!arousal,
  });
}
