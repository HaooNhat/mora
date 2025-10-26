import { useCallback, useState } from "react";
import type {
  Project,
  CreateProject,
  UpdateProject,
} from "@workspace/types/Project";

interface UseProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
}

export function useProject(userId: string) {
  const [state, setState] = useState<UseProjectState>({
    projects: [],
    loading: false,
    error: null,
  });

  // Generate unique ID (temporary while waiting for backend)
  const generateId = useCallback(() => {
    return crypto.randomUUID();
  }, []);

  // Get all projects for a user
  const getProjects = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/projects?userId=${userId}`);
      // const projects = await response.json();

      // For now, return mock data or localStorage
      const storedProjects = localStorage.getItem(`projects_${userId}`);
      const projects = storedProjects ? JSON.parse(storedProjects) : [];

      setState((prev) => ({
        ...prev,
        projects: projects.map((p: Project) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          color: p.color || `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
        })),
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to fetch projects",
        loading: false,
      }));
    }
  }, [userId]);

  // Create a new project
  const createProject = useCallback(
    async (projectData: CreateProject) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const now = new Date();
        const newProject: Project = {
          ...projectData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };

        // TODO: Replace with actual API call
        // const response = await fetch('/api/projects', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(newProject),
        // });

        setState((prev) => {
          const updatedProjects = [...prev.projects, newProject];

          // For now, use localStorage
          localStorage.setItem(
            `projects_${userId}`,
            JSON.stringify(updatedProjects),
          );

          return {
            ...prev,
            projects: updatedProjects,
            loading: false,
          };
        });

        return newProject;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to create project",
          loading: false,
        }));
        throw error;
      }
    },
    [generateId, userId],
  );

  // Update an existing project
  const updateProject = useCallback(
    async (projectData: UpdateProject) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        let updatedProject: Project | null = null;

        // TODO: Replace with actual API call
        // const response = await fetch(`/api/projects/${projectData.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(updatedProject),
        // });

        setState((prev) => {
          const updatedProjects = prev.projects.map((p) => {
            if (p.id === projectData.id) {
              const updated = {
                ...p,
                ...projectData,
                updatedAt: new Date(),
              } as Project;
              updatedProject = updated;
              return updated;
            }
            return p;
          });

          // For now, use localStorage
          localStorage.setItem(
            `projects_${userId}`,
            JSON.stringify(updatedProjects),
          );

          return {
            ...prev,
            projects: updatedProjects,
            loading: false,
          };
        });

        return updatedProject!;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to update project",
          loading: false,
        }));
        throw error;
      }
    },
    [userId],
  );

  // Delete a project
  const deleteProject = useCallback(
    async (projectId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // TODO: Replace with actual API call
        // await fetch(`/api/projects/${projectId}`, {
        //   method: 'DELETE',
        // });

        setState((prev) => {
          const updatedProjects = prev.projects.filter(
            (p) => p.id !== projectId,
          );

          // For now, use localStorage
          localStorage.setItem(
            `projects_${userId}`,
            JSON.stringify(updatedProjects),
          );

          return {
            ...prev,
            projects: updatedProjects,
            loading: false,
          };
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to delete project",
          loading: false,
        }));
        throw error;
      }
    },
    [userId],
  );

  // Get a specific project by ID
  const getProject = useCallback(
    (projectId: string): Project | undefined => {
      return state.projects.find((p) => p.id === projectId);
    },
    [state.projects],
  );

  // Clear error state
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    projects: state.projects,
    loading: state.loading,
    error: state.error,

    // Actions
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    clearError,
  };
}
