import { useCallback, useState } from "react";
import type {
  Task,
  CreateTask,
  UpdateTask,
  TaskStatus,
} from "@workspace/types/Task";

interface UseTaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

interface UseTaskFilters {
  projectId?: string;
  status?: TaskStatus;
  completedToday?: boolean;
}

export function useTask(userId: string) {
  const [state, setState] = useState<UseTaskState>({
    tasks: [],
    loading: false,
    error: null,
  });

  // Generate unique ID (in real app, this would come from backend)
  const generateId = useCallback(() => {
    return crypto.randomUUID();
  }, []);

  // Get all tasks for a user with optional filters
  const getTasks = useCallback(
    async (filters?: UseTaskFilters) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // TODO: Replace with actual API call
        // const queryParams = new URLSearchParams({ userId, ...filters });
        // const response = await fetch(`/api/tasks?${queryParams}`);
        // const tasks = await response.json();

        // For now, return mock data or localStorage
        const storedTasks = localStorage.getItem(`tasks_${userId}`);
        let tasks: Task[] = storedTasks ? JSON.parse(storedTasks) : [];

        // Convert string dates back to Date objects and add default values for missing fields
        tasks = tasks.map((t: Task) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
          startedAt: t.startedAt ? new Date(t.startedAt) : undefined,
          actualMinutesSpent: t.actualMinutesSpent || 0,
          tags: t.tags || [],
        }));

        // Apply filters
        if (filters) {
          if (filters.projectId) {
            tasks = tasks.filter((t) => t.projectId === filters.projectId);
          }
          if (filters.status) {
            tasks = tasks.filter((t) => t.status === filters.status);
          }
          if (filters.completedToday) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            tasks = tasks.filter(
              (t) =>
                t.completedAt &&
                t.completedAt >= today &&
                t.completedAt < tomorrow,
            );
          }
        }

        setState((prev) => ({
          ...prev,
          tasks,
          loading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to fetch tasks",
          loading: false,
        }));
      }
    },
    [userId],
  );

  // Create a new task
  const createTask = useCallback(
    async (taskData: CreateTask) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const now = new Date();
        const newTask: Task = {
          ...taskData,
          id: generateId(),
          status: taskData.status || "todo",
          createdAt: now,
          updatedAt: now,
        };

        // TODO: Replace with actual API call
        // const response = await fetch('/api/tasks', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(newTask),
        // });

        setState((prev) => {
          const updatedTasks = [...prev.tasks, newTask];

          // For now, use localStorage
          localStorage.setItem(`tasks_${userId}`, JSON.stringify(updatedTasks));

          return {
            ...prev,
            tasks: updatedTasks,
            loading: false,
          };
        });

        return newTask;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to create task",
          loading: false,
        }));
        throw error;
      }
    },
    [generateId, userId],
  );

  // Update an existing task
  const updateTask = useCallback(
    async (taskData: UpdateTask) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        let updatedTask: Task | null = null;

        setState((prev) => {
          const existingTask = prev.tasks.find((t) => t.id === taskData.id);
          if (!existingTask) {
            throw new Error("Task not found");
          }

          const updated = {
            ...existingTask,
            ...taskData,
            updatedAt: new Date(),
          } as Task;
          updatedTask = updated;

          const updatedTasks = prev.tasks.map((t) =>
            t.id === taskData.id ? updated : t,
          );

          // For now, use localStorage
          localStorage.setItem(`tasks_${userId}`, JSON.stringify(updatedTasks));

          return {
            ...prev,
            tasks: updatedTasks,
            loading: false,
          };
        });

        return updatedTask!;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to update task",
          loading: false,
        }));
        throw error;
      }
    },
    [userId],
  );

  // Delete a task
  const deleteTask = useCallback(
    async (taskId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // TODO: Replace with actual API call
        // await fetch(`/api/tasks/${taskId}`, {
        //   method: 'DELETE',
        // });

        setState((prev) => {
          const updatedTasks = prev.tasks.filter((t) => t.id !== taskId);

          // For now, use localStorage
          localStorage.setItem(`tasks_${userId}`, JSON.stringify(updatedTasks));

          return {
            ...prev,
            tasks: updatedTasks,
            loading: false,
          };
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to delete task",
          loading: false,
        }));
        throw error;
      }
    },
    [userId],
  );

  // Get a specific task by ID
  const getTask = useCallback(
    (taskId: string): Task | undefined => {
      return state.tasks.find((t) => t.id === taskId);
    },
    [state.tasks],
  );

  // Get tasks by project ID
  const getTasksByProject = useCallback(
    (projectId: string): Task[] => {
      return state.tasks.filter((t) => t.projectId === projectId);
    },
    [state.tasks],
  );

  // Mark task as completed with optional mood and note
  const completeTask = useCallback(
    async (taskId: string, mood?: Task["mood"], note?: string) => {
      return updateTask({
        id: taskId,
        status: "done",
        completedAt: new Date(),
        mood,
        note,
      });
    },
    [updateTask],
  );

  // Start working on a task (move to in_progress)
  const startTask = useCallback(
    async (taskId: string) => {
      return updateTask({
        id: taskId,
        status: "in_progress",
      });
    },
    [updateTask],
  );

  // Reset task back to todo
  const resetTask = useCallback(
    async (taskId: string) => {
      return updateTask({
        id: taskId,
        status: "todo",
        completedAt: undefined,
        mood: undefined,
        note: undefined,
      });
    },
    [updateTask],
  );

  // Get task statistics
  const getTaskStats = useCallback(() => {
    const total = state.tasks.length;
    const completed = state.tasks.filter((t) => t.status === "done").length;
    const inProgress = state.tasks.filter(
      (t) => t.status === "in_progress",
    ).length;
    const todo = state.tasks.filter((t) => t.status === "todo").length;

    // Today's completed tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completedToday = state.tasks.filter(
      (t) =>
        t.completedAt && t.completedAt >= today && t.completedAt < tomorrow,
    ).length;

    // Total estimated vs actual time (would need session tracking)
    const totalEstimatedMinutes = state.tasks.reduce(
      (sum, t) => sum + (t.estimatedMinutes || 0),
      0,
    );

    return {
      total,
      completed,
      inProgress,
      todo,
      completedToday,
      totalEstimatedMinutes,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [state.tasks]);

  // Clear error state
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,

    // Actions
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    getTask,
    getTasksByProject,
    completeTask,
    startTask,
    resetTask,
    getTaskStats,
    clearError,
  };
}
