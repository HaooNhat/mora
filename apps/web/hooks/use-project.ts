import { useProjectSelectors, useProjectStore } from "@/stores/project-store";
import { Project, Subtask, Task } from "@workspace/domain/project/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";

/**
 * Hook for project operations with the active project
 */
export function useProject(projectId?: string) {
  const {
    createProject,
    updateProject,
    deleteProject,
    setActiveProject,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    reorderTasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    toggleSubtaskComplete,
    reorderSubtasks,
    clearError,
  } = useProjectStore(
    useShallow((state) => ({
      createProject: state.createProject,
      updateProject: state.updateProject,
      deleteProject: state.deleteProject,
      setActiveProject: state.setActiveProject,
      createTask: state.createTask,
      updateTask: state.updateTask,
      deleteTask: state.deleteTask,
      toggleTaskComplete: state.toggleTaskComplete,
      reorderTasks: state.reorderTasks,
      createSubtask: state.createSubtask,
      updateSubtask: state.updateSubtask,
      deleteSubtask: state.deleteSubtask,
      toggleSubtaskComplete: state.toggleSubtaskComplete,
      reorderSubtasks: state.reorderSubtasks,
      clearError: state.clearError,
    })),
  );

  // Get project data
  const project = projectId
    ? useProjectSelectors.useProject(projectId)
    : useProjectSelectors.useActiveProject();

  const projects = useProjectSelectors.useProjects();
  const loading = useProjectSelectors.useLoading();
  const error = useProjectSelectors.useError();

  /* ================================
     Project Operations
  ================================ */
  const createProjectSafe = useCallback(
    (name: string) => {
      createProject(name);
    },
    [createProject],
  );

  const updateProjectSafe = useCallback(
    (updates: Partial<Project>) => {
      if (!project) return;
      updateProject(project.id, updates);
    },
    [updateProject, project],
  );

  const deleteProjectSafe = useCallback(() => {
    if (!project) return;
    deleteProject(project.id);
  }, [deleteProject, project]);

  const setActiveSafe = useCallback(
    (id: string | null) => {
      setActiveProject(id);
    },
    [setActiveProject],
  );

  /* ================================
     Task Operations
  ================================ */
  const createTaskSafe = useCallback(
    (taskData: Omit<Task, "id">) => {
      if (!project) return;
      createTask(project.id, taskData);
    },
    [createTask, project],
  );

  const updateTaskSafe = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      if (!project) return;
      updateTask(project.id, taskId, updates);
    },
    [updateTask, project],
  );

  const deleteTaskSafe = useCallback(
    (taskId: string) => {
      if (!project) return;
      deleteTask(project.id, taskId);
    },
    [deleteTask, project],
  );

  const toggleTaskCompleteSafe = useCallback(
    (taskId: string) => {
      if (!project) return;
      toggleTaskComplete(project.id, taskId);
    },
    [toggleTaskComplete, project],
  );

  const reorderTasksSafe = useCallback(
    (taskIds: string[]) => {
      if (!project) return;
      reorderTasks(project.id, taskIds);
    },
    [reorderTasks, project],
  );

  /* ================================
     Subtask Operations
  ================================ */
  const createSubtaskSafe = useCallback(
    (taskId: string, title: string) => {
      if (!project) return;
      createSubtask(project.id, taskId, title);
    },
    [createSubtask, project],
  );

  const updateSubtaskSafe = useCallback(
    (taskId: string, subtaskId: string, updates: Partial<Subtask>) => {
      if (!project) return;
      updateSubtask(project.id, taskId, subtaskId, updates);
    },
    [updateSubtask, project],
  );

  const deleteSubtaskSafe = useCallback(
    (taskId: string, subtaskId: string) => {
      if (!project) return;
      deleteSubtask(project.id, taskId, subtaskId);
    },
    [deleteSubtask, project],
  );

  const toggleSubtaskCompleteSafe = useCallback(
    (taskId: string, subtaskId: string) => {
      if (!project) return;
      toggleSubtaskComplete(project.id, taskId, subtaskId);
    },
    [toggleSubtaskComplete, project],
  );

  const reorderSubtasksSafe = useCallback(
    (taskId: string, subtaskIds: string[]) => {
      if (!project) return;
      reorderSubtasks(project.id, taskId, subtaskIds);
    },
    [reorderSubtasks, project],
  );

  /* ================================
   Computed Values
================================ */
  const tasks = useMemo(() => {
    return project?.tasks ?? [];
  }, [project]);

  const { taskCount, completedTaskCount, progress } = useMemo(() => {
    const taskCount = tasks.length;
    const completedTaskCount = tasks.filter((t) => t.completed).length;
    const progress = taskCount > 0 ? (completedTaskCount / taskCount) * 100 : 0;

    return { taskCount, completedTaskCount, progress };
  }, [tasks]);

  // Sort tasks by priority
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const scoreA =
        (a.urgent ? 2 : 0) + (a.important ? 1 : 0) + (a.completed ? -4 : 0);
      const scoreB =
        (b.urgent ? 2 : 0) + (b.important ? 1 : 0) + (b.completed ? -4 : 0);
      return scoreB - scoreA;
    });
  }, [tasks]);

  return {
    // State
    project,
    projects,
    loading,
    error,

    // Computed
    tasks: sortedTasks,
    taskCount,
    completedTaskCount,
    progress,

    // Project actions
    createProject: createProjectSafe,
    updateProject: updateProjectSafe,
    deleteProject: deleteProjectSafe,
    setActive: setActiveSafe,

    // Task actions
    createTask: createTaskSafe,
    updateTask: updateTaskSafe,
    deleteTask: deleteTaskSafe,
    toggleTaskComplete: toggleTaskCompleteSafe,
    reorderTasks: reorderTasksSafe,

    // Subtask actions
    createSubtask: createSubtaskSafe,
    updateSubtask: updateSubtaskSafe,
    deleteSubtask: deleteSubtaskSafe,
    toggleSubtaskComplete: toggleSubtaskCompleteSafe,
    reorderSubtasks: reorderSubtasksSafe,

    // Utility
    clearError: clearError,
  };
}

/**
 * Hook for managing all projects
 */
export function useProjects() {
  const { createProject, deleteProject, setActiveProject } = useProjectStore(
    useShallow((s) => ({
      createProject: s.createProject,
      deleteProject: s.deleteProject,
      setActiveProject: s.setActiveProject,
    })),
  );

  const projects = useProjectSelectors.useProjects();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const createProjectSafe = useCallback(
    (name: string) => {
      createProject(name);
    },
    [createProject],
  );

  const deleteProjectSafe = useCallback(
    (projectId: string) => {
      deleteProject(projectId);
    },
    [deleteProject],
  );

  const setActiveProjectSafe = useCallback(
    (projectId: string | null) => {
      setActiveProject(projectId);
    },
    [setActiveProject],
  );

  return {
    projects,
    activeProjectId,
    createProject: createProjectSafe,
    deleteProject: deleteProjectSafe,
    setActiveProject: setActiveProjectSafe,
  };
}

/**
 * Hook to initialize store with seed data (for first-time users)
 */
export function useInitializeProjects() {
  const projects = useProjectSelectors.useProjects();
  const createProject = useProjectStore((state) => state.createProject);
  const createTask = useProjectStore((state) => state.createTask);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only seed if store is empty and not yet initialized
    if (projects.length === 0 && !initialized) {
      // Create sample project
      createProject("Getting Started");

      // Wait for project to be created, then add tasks
      setTimeout(() => {
        const newProjects = useProjectStore.getState().projects;
        const firstProject = newProjects[0];

        if (firstProject) {
          createTask(firstProject.id, {
            title: "Welcome to Mora! 🎉",
            completed: false,
            important: true,
          });

          createTask(firstProject.id, {
            title: "Create your first task",
            completed: false,
            urgent: false,
            important: false,
          });

          createTask(firstProject.id, {
            title: "Start a focus session",
            completed: false,
            urgent: false,
            important: false,
          });
        }
      }, 0);

      setInitialized(true);
    }
  }, [projects.length, initialized, createProject, createTask]);
}
