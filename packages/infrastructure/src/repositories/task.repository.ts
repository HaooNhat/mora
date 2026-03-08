import { ITaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import { SubtaskItem, Task } from "@workspace/domain/entities/task.entity";
import { TaskRow } from "@workspace/infrastructure/database/index.types";
import { supabase } from "@workspace/infrastructure/database/supabase.client";

export class TaskRepository implements ITaskRepository {
  private mapRowToEntity(row: TaskRow): Task {
    // Parse subtasks from JSONB
    let subtasks: SubtaskItem[] = [];
    if (row.subtasks) {
      try {
        const parsed =
          typeof row.subtasks === "string"
            ? JSON.parse(row.subtasks)
            : row.subtasks;
        subtasks = Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error("Failed to parse subtasks:", error);
        subtasks = [];
      }
    }

    return {
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id ?? undefined,
      title: row.title,
      description: row.description ?? undefined,
      note: row.note ?? undefined,
      workType: row.work_type,
      status: row.status,
      isImportant: row.is_important ?? false,
      isUrgent: row.is_urgent ?? false,
      subtasks,
      deadline: row.deadline ? new Date(row.deadline) : undefined,
      estimatedDuration: row.estimated_duration ?? undefined,
      deferredUntil: row.deferred_until
        ? new Date(row.deferred_until)
        : undefined,
      abandonedAt: row.abandoned_at ? new Date(row.abandoned_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  async findById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return this.mapRowToEntity(data);
  }

  async findByProjectId(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapRowToEntity.bind(this));
  }

  async findByUserId(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapRowToEntity.bind(this));
  }

  async save(task: Task): Promise<void> {
    const { error } = await supabase.from("tasks").insert({
      id: task.id,
      user_id: task.userId,
      project_id: task.projectId ?? null,
      title: task.title,
      description: task.description ?? null,
      note: task.note ?? null,
      work_type: task.workType,
      status: task.status,
      is_important: task.isImportant,
      is_urgent: task.isUrgent,
      subtasks: task.subtasks.length > 0 ? JSON.stringify(task.subtasks) : null,
      deadline: task.deadline?.toISOString() ?? null,
      estimated_duration: task.estimatedDuration ?? null,
      deferred_until: task.deferredUntil?.toISOString() ?? null,
      abandoned_at: task.abandonedAt?.toISOString() ?? null,
      completed_at: task.completedAt?.toISOString() ?? null,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
    });

    if (error) {
      throw new Error(`Failed to save task: ${error.message}`);
    }
  }

  async update(task: Task): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({
        title: task.title,
        description: task.description ?? null,
        note: task.note ?? null,
        work_type: task.workType,
        status: task.status,
        is_important: task.isImportant,
        is_urgent: task.isUrgent,
        subtasks:
          task.subtasks.length > 0 ? JSON.stringify(task.subtasks) : null,
        deadline: task.deadline?.toISOString() ?? null,
        estimated_duration: task.estimatedDuration ?? null,
        deferred_until: task.deferredUntil?.toISOString() ?? null,
        abandoned_at: task.abandonedAt?.toISOString() ?? null,
        completed_at: task.completedAt?.toISOString() ?? null,
        updated_at: task.updatedAt.toISOString(),
      })
      .eq("id", task.id);

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  /**
   * Clear project_id for all tasks in a project
   * Called when deleting a project
   */
  async clearProjectId(projectId: string): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({ project_id: null })
      .eq("project_id", projectId);

    if (error) {
      throw new Error(`Failed to clear project ID: ${error.message}`);
    }
  }
}
