/**
 * Project Repository - Data Access Layer
 *
 * Following Repository Pattern (Clean Architecture)
 * - Single source of truth for data operations
 * - Abstracts Supabase implementation details
 * - Type-safe database operations
 * - Error handling and validation
 */

import { supabase } from "@workspace/api-client/supabase/client";
import type { Database } from "@workspace/api-client/supabase/database.types";
import type { Project, Task, Subtask } from "@workspace/core/project/types";

type DbProject = Database["public"]["Tables"]["projects"]["Row"];
type DbTask = Database["public"]["Tables"]["tasks"]["Row"];
type DbSubtask = Database["public"]["Tables"]["subtasks"]["Row"];

type InsertProject = Database["public"]["Tables"]["projects"]["Insert"];
type UpdateProject = Database["public"]["Tables"]["projects"]["Update"];
type InsertTask = Database["public"]["Tables"]["tasks"]["Insert"];
type UpdateTask = Database["public"]["Tables"]["tasks"]["Update"];
type InsertSubtask = Database["public"]["Tables"]["subtasks"]["Insert"];
type UpdateSubtask = Database["public"]["Tables"]["subtasks"]["Update"];

/**
 * Custom error class for repository operations
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

/**
 * Transform database project to domain model
 */
function mapDbProjectToDomain(
  dbProject: DbProject,
  tasks: Task[] = [],
): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    tasks,
  };
}

/**
 * Transform database task to domain model
 */
function mapDbTaskToDomain(dbTask: DbTask, subtasks: Subtask[] = []): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    icon: dbTask.icon ?? undefined,
    completed: dbTask.completed,
    deadline: dbTask.deadline ?? undefined,
    urgent: dbTask.urgent,
    important: dbTask.important,
    subtasks: subtasks.length > 0 ? subtasks : undefined,
  };
}

/**
 * Transform database subtask to domain model
 */
function mapDbSubtaskToDomain(dbSubtask: DbSubtask): Subtask {
  return {
    id: dbSubtask.id,
    title: dbSubtask.title,
    completed: dbSubtask.completed,
  };
}

/**
 * Project Repository
 */
export const projectRepository = {
  /* ================================
     PROJECT OPERATIONS
  ================================ */

  /**
   * Fetch all projects for current user
   */
  async getAllProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new RepositoryError(
        "Failed to fetch projects",
        error.code,
        error.details,
      );
    }

    return data.map((dbProject) => mapDbProjectToDomain(dbProject));
  },

  /**
   * Fetch single project with all tasks and subtasks
   */
  async getProjectById(projectId: string): Promise<Project | null> {
    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) {
      if (projectError.code === "PGRST116") return null; // Not found
      throw new RepositoryError(
        "Failed to fetch project",
        projectError.code,
        projectError.details,
      );
    }

    // Fetch tasks for project
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (tasksError) {
      throw new RepositoryError(
        "Failed to fetch tasks",
        tasksError.code,
        tasksError.details,
      );
    }

    // Fetch subtasks for all tasks
    const taskIds = tasks.map((t) => t.id);
    const { data: subtasks, error: subtasksError } = await supabase
      .from("subtasks")
      .select("*")
      .in("task_id", taskIds)
      .order("position", { ascending: true });

    if (subtasksError) {
      throw new RepositoryError(
        "Failed to fetch subtasks",
        subtasksError.code,
        subtasksError.details,
      );
    }

    // Group subtasks by task_id
    const subtasksByTaskId = new Map<string, Subtask[]>();
    subtasks?.forEach((sub) => {
      const existing = subtasksByTaskId.get(sub.task_id) || [];
      existing.push(mapDbSubtaskToDomain(sub));
      subtasksByTaskId.set(sub.task_id, existing);
    });

    // Map tasks with their subtasks
    const domainTasks = tasks.map((task) =>
      mapDbTaskToDomain(task, subtasksByTaskId.get(task.id) || []),
    );

    return mapDbProjectToDomain(project, domainTasks);
  },

  /**
   * Create new project
   */
  async createProject(data: {
    name: string;
    userId: string;
  }): Promise<Project> {
    const insertData: InsertProject = {
      name: data.name,
      user_id: data.userId,
    };

    const { data: project, error } = await supabase
      .from("projects")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(
        "Failed to create project",
        error.code,
        error.details,
      );
    }

    return mapDbProjectToDomain(project);
  },

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    updates: { name?: string; description?: string; color?: string },
  ): Promise<Project> {
    const updateData: UpdateProject = updates;

    const { data: project, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(
        "Failed to update project",
        error.code,
        error.details,
      );
    }

    return mapDbProjectToDomain(project);
  },

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      throw new RepositoryError(
        "Failed to delete project",
        error.code,
        error.details,
      );
    }
  },

  /* ================================
     TASK OPERATIONS
  ================================ */

  /**
   * Fetch all tasks for a project
   */
  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (tasksError) {
      throw new RepositoryError(
        "Failed to fetch tasks",
        tasksError.code,
        tasksError.details,
      );
    }

    // Fetch subtasks
    const taskIds = tasks.map((t) => t.id);
    if (taskIds.length === 0) return [];

    const { data: subtasks, error: subtasksError } = await supabase
      .from("subtasks")
      .select("*")
      .in("task_id", taskIds)
      .order("position", { ascending: true });

    if (subtasksError) {
      throw new RepositoryError(
        "Failed to fetch subtasks",
        subtasksError.code,
        subtasksError.details,
      );
    }

    const subtasksByTaskId = new Map<string, Subtask[]>();
    subtasks?.forEach((sub) => {
      const existing = subtasksByTaskId.get(sub.task_id) || [];
      existing.push(mapDbSubtaskToDomain(sub));
      subtasksByTaskId.set(sub.task_id, existing);
    });

    return tasks.map((task) =>
      mapDbTaskToDomain(task, subtasksByTaskId.get(task.id) || []),
    );
  },

  /**
   * Create new task
   */
  async createTask(data: {
    projectId: string;
    title: string;
    icon?: string;
    completed?: boolean;
    deadline?: string;
    urgent?: boolean;
    important?: boolean;
  }): Promise<Task> {
    // Get max position for ordering
    const { data: maxPosData } = await supabase
      .from("tasks")
      .select("position")
      .eq("project_id", data.projectId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const position = (maxPosData?.position ?? -1) + 1;

    const insertData: InsertTask = {
      project_id: data.projectId,
      title: data.title,
      icon: data.icon,
      completed: data.completed ?? false,
      deadline: data.deadline,
      urgent: data.urgent ?? false,
      important: data.important ?? false,
      position,
    };

    const { data: task, error } = await supabase
      .from("tasks")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(
        "Failed to create task",
        error.code,
        error.details,
      );
    }

    return mapDbTaskToDomain(task);
  },

  /**
   * Update task
   */
  async updateTask(
    taskId: string,
    updates: Partial<Omit<Task, "id" | "subtasks">>,
  ): Promise<Task> {
    const updateData: UpdateTask = updates;

    const { data: task, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(
        "Failed to update task",
        error.code,
        error.details,
      );
    }

    return mapDbTaskToDomain(task);
  },

  /**
   * Delete task
   */
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      throw new RepositoryError(
        "Failed to delete task",
        error.code,
        error.details,
      );
    }
  },

  /**
   * Reorder tasks
   */
  async reorderTasks(taskIds: string[]): Promise<void> {
    const updates = taskIds.map((id, index) => ({
      id,
      position: index,
    }));

    const { error } = await supabase.from("tasks").upsert(updates);

    if (error) {
      throw new RepositoryError(
        "Failed to reorder tasks",
        error.code,
        error.details,
      );
    }
  },

  /* ================================
     SUBTASK OPERATIONS
  ================================ */

  /**
   * Create new subtask
   */
  async createSubtask(data: {
    taskId: string;
    title: string;
  }): Promise<Subtask> {
    // Get max position
    const { data: maxPosData } = await supabase
      .from("subtasks")
      .select("position")
      .eq("task_id", data.taskId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const position = (maxPosData?.position ?? -1) + 1;

    const insertData: InsertSubtask = {
      task_id: data.taskId,
      title: data.title,
      position,
    };

    const { data: subtask, error } = await supabase
      .from("subtasks")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(
        "Failed to create subtask",
        error.code,
        error.details,
      );
    }

    return mapDbSubtaskToDomain(subtask);
  },

  /**
   * Update subtask
   */
  async updateSubtask(
    subtaskId: string,
    updates: Partial<Omit<Subtask, "id">>,
  ): Promise<Subtask> {
    const updateData: UpdateSubtask = updates;

    const { data: subtask, error } = await supabase
      .from("subtasks")
      .update(updateData)
      .eq("id", subtaskId)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(
        "Failed to update subtask",
        error.code,
        error.details,
      );
    }

    return mapDbSubtaskToDomain(subtask);
  },

  /**
   * Delete subtask
   */
  async deleteSubtask(subtaskId: string): Promise<void> {
    const { error } = await supabase
      .from("subtasks")
      .delete()
      .eq("id", subtaskId);

    if (error) {
      throw new RepositoryError(
        "Failed to delete subtask",
        error.code,
        error.details,
      );
    }
  },

  /**
   * Reorder subtasks
   */
  async reorderSubtasks(subtaskIds: string[]): Promise<void> {
    const updates = subtaskIds.map((id, index) => ({
      id,
      position: index,
    }));

    const { error } = await supabase.from("subtasks").upsert(updates);

    if (error) {
      throw new RepositoryError(
        "Failed to reorder subtasks",
        error.code,
        error.details,
      );
    }
  },
};
