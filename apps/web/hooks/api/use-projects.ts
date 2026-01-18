import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@workspace/shared/api-client";
import { toast } from "@workspace/ui/components/sonner";

// Query Keys
export const projectKeys = {
  all: ["projects"] as const,
  byUser: (userId: string) => ["projects", userId] as const,
  detail: (id: string) => ["projects", id] as const,
};

// GET Projects
export function useProjects(userId: string) {
  return useQuery({
    queryKey: projectKeys.byUser(userId),
    queryFn: () => apiClient.getProjects(userId),
    enabled: !!userId, // Only fetch if userId exists
  });
}

// CREATE Project
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createProject,
    onSuccess: (data, variables) => {
      // Invalidate and refetch projects
      queryClient.invalidateQueries({
        queryKey: projectKeys.byUser(variables.userId),
      });
      toast.success("Project created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create project");
    },
  });
}

// UPDATE Project
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.id),
      });
      // Also invalidate user's projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success("Project updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update project");
    },
  });
}

// DELETE Project
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success("Project deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete project");
    },
  });
}
