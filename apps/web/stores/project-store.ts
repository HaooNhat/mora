import {
  Project,
  ProjectState,
  Subtask,
  Task,
} from "@workspace/domain/project/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Project Store Actions
 */
interface ProjectActions {
  // Project CRUD
  createProject: (name: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  setActiveProject: (projectId: string | null) => void;

  // Task CRUD
  createTask: (projectId: string, task: Omit<Task, "id">) => void;
  updateTask: (
    projectId: string,
    taskId: string,
    updates: Partial<Task>,
  ) => void;
  deleteTask: (projectId: string, taskId: string) => void;
  toggleTaskComplete: (projectId: string, taskId: string) => void;
  reorderTasks: (projectId: string, taskIds: string[]) => void;

  // Subtask CRUD
  createSubtask: (projectId: string, taskId: string, title: string) => void;
  updateSubtask: (
    projectId: string,
    taskId: string,
    subtaskId: string,
    updates: Partial<Subtask>,
  ) => void;
  deleteSubtask: (projectId: string, taskId: string, subtaskId: string) => void;
  toggleSubtaskComplete: (
    projectId: string,
    taskId: string,
    subtaskId: string,
  ) => void;
  reorderSubtasks: (
    projectId: string,
    taskId: string,
    subtaskIds: string[],
  ) => void;

  // Utility
  clearError: () => void;
  resetStore: () => void;
}

/**
 * Helper: Generate UUID
 */
const generateId = () => crypto.randomUUID();

/**
 * Initial State
 */
const initialState: ProjectState = {
  projects: [],
  activeProjectId: null,
  loading: false,
  error: null,
};

/**
 * Project Store with localStorage persistence
 */
export const useProjectStore = create<ProjectState & ProjectActions>()(
  persist(
    (set) => ({
      ...initialState,

      /* ================================
         Project Actions
      ================================ */
      createProject: (name: string) => {
        const newProject: Project = {
          id: generateId(),
          name,
          tasks: [],
        };

        set((state) => ({
          projects: [...state.projects, newProject],
          activeProjectId: newProject.id,
        }));
      },

      updateProject: (projectId: string, updates: Partial<Project>) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates } : p,
          ),
        }));
      },

      deleteProject: (projectId: string) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          activeProjectId:
            state.activeProjectId === projectId ? null : state.activeProjectId,
        }));
      },

      setActiveProject: (projectId: string | null) => {
        set({ activeProjectId: projectId });
      },

      /* ================================
         Task Actions
      ================================ */
      createTask: (projectId: string, taskData: Omit<Task, "id">) => {
        const newTask: Task = {
          id: generateId(),
          ...taskData,
        };

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, tasks: [...p.tasks, newTask] } : p,
          ),
        }));
      },

      updateTask: (
        projectId: string,
        taskId: string,
        updates: Partial<Task>,
      ) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId ? { ...t, ...updates } : t,
                  ),
                }
              : p,
          ),
        }));
      },

      deleteTask: (projectId: string, taskId: string) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
              : p,
          ),
        }));
      },

      toggleTaskComplete: (projectId: string, taskId: string) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId ? { ...t, completed: !t.completed } : t,
                  ),
                }
              : p,
          ),
        }));
      },

      reorderTasks: (projectId: string, taskIds: string[]) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;

            const taskMap = new Map(p.tasks.map((t) => [t.id, t]));
            const reorderedTasks = taskIds
              .map((id) => taskMap.get(id))
              .filter((t): t is Task => t !== undefined);

            return { ...p, tasks: reorderedTasks };
          }),
        }));
      },

      /* ================================
         Subtask Actions
      ================================ */
      createSubtask: (projectId: string, taskId: string, title: string) => {
        const newSubtask: Subtask = {
          id: generateId(),
          title,
          completed: false,
        };

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          subtasks: [...(t.subtasks || []), newSubtask],
                        }
                      : t,
                  ),
                }
              : p,
          ),
        }));
      },

      updateSubtask: (
        projectId: string,
        taskId: string,
        subtaskId: string,
        updates: Partial<Subtask>,
      ) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          subtasks: t.subtasks?.map((s) =>
                            s.id === subtaskId ? { ...s, ...updates } : s,
                          ),
                        }
                      : t,
                  ),
                }
              : p,
          ),
        }));
      },

      deleteSubtask: (projectId: string, taskId: string, subtaskId: string) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          subtasks: t.subtasks?.filter(
                            (s) => s.id !== subtaskId,
                          ),
                        }
                      : t,
                  ),
                }
              : p,
          ),
        }));
      },

      toggleSubtaskComplete: (
        projectId: string,
        taskId: string,
        subtaskId: string,
      ) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          subtasks: t.subtasks?.map((s) =>
                            s.id === subtaskId
                              ? { ...s, completed: !s.completed }
                              : s,
                          ),
                        }
                      : t,
                  ),
                }
              : p,
          ),
        }));
      },

      reorderSubtasks: (
        projectId: string,
        taskId: string,
        subtaskIds: string[],
      ) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;

            return {
              ...p,
              tasks: p.tasks.map((t) => {
                if (t.id !== taskId || !t.subtasks) return t;

                const subtaskMap = new Map(t.subtasks.map((s) => [s.id, s]));
                const reorderedSubtasks = subtaskIds
                  .map((id) => subtaskMap.get(id))
                  .filter((s): s is Subtask => s !== undefined);

                return { ...t, subtasks: reorderedSubtasks };
              }),
            };
          }),
        }));
      },

      /* ================================
         Utility Actions
      ================================ */
      clearError: () => set({ error: null }),

      resetStore: () => set(initialState),
    }),
    {
      name: "mora-projects-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist projects and activeProjectId
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
    },
  ),
);

/**
 * Selectors for optimized component rendering
 */
export const useProjectSelectors = {
  // Get all projects
  useProjects: () => useProjectStore((state) => state.projects),

  // Get active project
  useActiveProject: () =>
    useProjectStore(
      (state) =>
        state.projects.find((p) => p.id === state.activeProjectId) ?? null,
    ),

  // Get project by ID
  useProject: (projectId: string) =>
    useProjectStore(
      (state) => state.projects.find((p) => p.id === projectId) ?? null,
    ),

  // Get tasks for a project
  useProjectTasks: (projectId: string) =>
    useProjectStore(
      (state) => state.projects.find((p) => p.id === projectId)?.tasks ?? [],
    ),

  // Get task by ID
  useTask: (projectId: string, taskId: string) =>
    useProjectStore(
      (state) =>
        state.projects
          .find((p) => p.id === projectId)
          ?.tasks.find((t) => t.id === taskId) ?? null,
    ),

  // Get loading state
  useLoading: () => useProjectStore((state) => state.loading),

  // Get error state
  useError: () => useProjectStore((state) => state.error),
};
