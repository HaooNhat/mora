/**
 * Project Service - Business Logic Layer
 *
 * Following Service Pattern (Clean Architecture)
 * - Orchestrates business operations
 * - Validates business rules
 * - Handles complex workflows
 * - Abstraction between repository and presentation
 */

import {
  projectRepository,
  RepositoryError,
} from "@workspace/api-client/repositories/project.repository";
import { getCurrentUserId } from "@workspace/api-client/supabase/client";
import type { Project, Task, Subtask } from "@workspace/core/project/types";

/**
 * Custom error class for service operations
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

/**
 * Validation helper
 */
function validateProjectName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new ServiceError("Project name cannot be empty", "INVALID_INPUT");
  }
  if (name.length > 100) {
    throw new ServiceError(
      "Project name cannot exceed 100 characters",
      "INVALID_INPUT",
    );
  }
}

function validateTaskTitle(title: string): void {
  if (!title || title.trim().length === 0) {
    throw new ServiceError("Task title cannot be empty", "INVALID_INPUT");
  }
  if (title.length > 200) {
    throw new ServiceError(
      "Task title cannot exceed 200 characters",
      "INVALID_INPUT",
    );
  }
}

function validateSubtaskTitle(title: string): void {
  if (!title || title.trim().length === 0) {
    throw new ServiceError("Subtask title cannot be empty", "INVALID_INPUT");
  }
  if (title.length > 200) {
    throw new ServiceError(
      "Subtask title cannot exceed 200 characters",
      "INVALID_INPUT",
    );
  }
}

/**
 * Authentication helper
 */
async function ensureAuthenticated(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new ServiceError("User must be authenticated", "UNAUTHENTICATED");
  }
  return userId;
}

/**
 * Project Service
 */
export const projectService = {
  /* ================================
     PROJECT OPERATIONS
  ================================ */

  /**
   * Get all projects for current user
   */
  async getAllProjects(): Promise<Project[]> {
    try {
      await ensureAuthenticated();
      return await projectRepository.getAllProjects();
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to fetch projects",
        "UNKNOWN_ERROR",
        error,
      );
    }
  },

  /**
   * Get single project with all nested data
   */
  async getProjectById(projectId: string): Promise<Project> {
    try {
      await ensureAuthenticated();

      const project = await projectRepository.getProjectById(projectId);

      if (!project) {
        throw new ServiceError("Project not found", "NOT_FOUND");
      }

      return project;
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError("Failed to fetch project", "UNKNOWN_ERROR", error);
    }
  },

  /**
   * Create new project
   */
  async createProject(name: string): Promise<Project> {
    try {
      validateProjectName(name);
      const userId = await ensureAuthenticated();

      const project = await projectRepository.createProject({
        name: name.trim(),
        userId,
      });

      return project;
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to create project",
        "UNKNOWN_ERROR",
        error,
      );
    }
  },

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    updates: { name?: string; description?: string; color?: string },
  ): Promise<Project> {
    try {
      await ensureAuthenticated();

      if (updates.name !== undefined) {
        validateProjectName(updates.name);
        updates.name = updates.name.trim();
      }

      const project = await projectRepository.updateProject(projectId, updates);
      return project;
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to update project",
        "UNKNOWN_ERROR",
        error,
      );
    }
  },

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      await ensureAuthenticated();
      await projectRepository.deleteProject(projectId);
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to delete project",
        "UNKNOWN_ERROR",
        error,
      );
    }
  },

  /* ================================
     TASK OPERATIONS
  ================================ */

  /**
   * Get all tasks for a project
   */
  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    try {
      await ensureAuthenticated();
      return await projectRepository.getTasksByProjectId(projectId);
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError("Failed to fetch tasks", "UNKNOWN_ERROR", error);
    }
  },

  /**
   * Create new task
   */
  async createTask(
    projectId: string,
    data: {
      title: string;
      icon?: string;
      completed?: boolean;
      deadline?: string;
      urgent?: boolean;
      important?: boolean;
    },
  ): Promise<Task> {
    try {
      await ensureAuthenticated();
      validateTaskTitle(data.title);

      const task = await projectRepository.createTask({
        projectId,
        title: data.title.trim(),
        icon: data.icon,
        completed: data.completed,
        deadline: data.deadline,
        urgent: data.urgent,
        important: data.important,
      });

      return task;
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError("Failed to create task", "UNKNOWN_ERROR", error);
    }
  },

  /**
   * Update task
   */
  async updateTask(
    taskId: string,
    updates: Partial<Omit<Task, "id" | "subtasks">>,
  ): Promise<Task> {
    try {
      await ensureAuthenticated();

      if (updates.title !== undefined) {
        validateTaskTitle(updates.title);
        updates.title = updates.title.trim();
      }

      const task = await projectRepository.updateTask(taskId, updates);
      return task;
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError("Failed to update task", "UNKNOWN_ERROR", error);
    }
  },

  /**
   * Delete task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      await ensureAuthenticated();
      await projectRepository.deleteTask(taskId);
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError("Failed to delete task", "UNKNOWN_ERROR", error);
    }
  },

  /**
   * Toggle task completion
   */
  async toggleTaskComplete(
    taskId: string,
    currentStatus: boolean,
  ): Promise<Task> {
    try {
      await ensureAuthenticated();
      return await projectRepository.updateTask(taskId, {
        completed: !currentStatus,
      });
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to toggle task completion",
        "UNKNOWN_ERROR",
        error,
      );
    }
  },

  /**
   * Reorder tasks
   */
  async reorderTasks(taskIds: string[]): Promise<void> {
    try {
      await ensureAuthenticated();
      await projectRepository.reorderTasks(taskIds);
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError("Failed to reorder tasks", "UNKNOWN_ERROR", error);
    }
  },

  /* ================================
     SUBTASK OPERATIONS
  ================================ */

  /**
   * Create new subtask
   */
  async createSubtask(taskId: string, title: string): Promise<Subtask> {
    try {
      await ensureAuthenticated();
      validateSubtaskTitle(title);

      const subtask = await projectRepository.createSubtask({
        taskId,
        title: title.trim(),
      });

      return subtask;
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to create subtask",
        "UNKNOWN_ERROR",
        error,
      );
    }
  },

  /**
   * Update subtask
   */
  async updateSubtask(
    subtaskId: string,
    updates: Partial<Omit<Subtask, "id">>,
  ): Promise<Subtask> {
    try {
      await ensureAuthenticated();

      if (updates.title !== undefined) {
        validateSubtaskTitle(updates.title);
        updates.title = updates.title.trim();
      }

      const subtask = await projectRepository.updateSubtask(subtaskId, updates);
      return subtask;
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to update subtask",
        "UNKNOWN_ERROR",
        error,
      );
    }
  },

  /**
   * Delete subtask
   */
  async deleteSubtask(subtaskId: string): Promise<void> {
    try {
      await ensureAuthenticated();
      await projectRepository.deleteSubtask(subtaskId);
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to delete subtask",
        "UNKNOWN_ERROR",
        error,
      );
    }
  },

  /**
   * Toggle subtask completion
   */
  async toggleSubtaskComplete(
    subtaskId: string,
    currentStatus: boolean,
  ): Promise<Subtask> {
    try {
      await ensureAuthenticated();
      return await projectRepository.updateSubtask(subtaskId, {
        completed: !currentStatus,
      });
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to toggle subtask completion",
        "UNKNOWN_ERROR",
        error,
      );
    }
  },

  /**
   * Reorder subtasks
   */
  async reorderSubtasks(subtaskIds: string[]): Promise<void> {
    try {
      await ensureAuthenticated();
      await projectRepository.reorderSubtasks(subtaskIds);
    } catch (error) {
      if (error instanceof ServiceError || error instanceof RepositoryError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to reorder subtasks",
        "UNKNOWN_ERROR",
        error,
      );
    }
  },
};
