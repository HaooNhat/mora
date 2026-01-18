"use client";

import { useProjects, useDeleteProject } from "@/hooks/api/use-projects";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@workspace/ui/components/button";
import { FolderOpen, Trash2 } from "lucide-react";
import { useAuthOld } from "@/hooks/use-auth";

export function ProjectList() {
  const { user } = useAuthOld();
  const { data, isLoading, error, refetch } = useProjects(user?.id || "");
  const deleteProject = useDeleteProject();

  if (isLoading) {
    return <LoadingState message="Loading projects..." />;
  }

  if (error) {
    return (
      <ErrorState message="Failed to load projects" onRetry={() => refetch()} />
    );
  }

  if (!data?.projects || data.projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen className="h-12 w-12" />}
        title="No projects yet"
        description="Create your first project to get started"
        action={{
          label: "Create Project",
          onClick: () => {
            // Open create modal
          },
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {data.projects.map((project: any) => (
        <div
          key={project.id}
          className="flex items-center justify-between p-4 rounded-lg border"
        >
          <div>
            <h3 className="font-semibold">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteProject.mutate(project.id)}
            disabled={deleteProject.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
