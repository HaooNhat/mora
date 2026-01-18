import { ITaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import { Task } from "@workspace/domain/entities/task.entity";
import { supabase } from "@workspace/infrastructure/database/supabase-client";
import { TaskRow } from "@workspace/infrastructure/database/supabase-types";

export class TaskRepository implements ITaskRepository {
  private mapRowToEntity(row: TaskRow): Task {
    return {
      id: row.id,
      userId: row.userId,
      projectId: row.project_id,
      title: row.title,
      description: row.description ?? undefined,
      isImportant: row.isImportant,
      isUrgent: row.isUrgent,
      deadline: row.deadline ? new Date(row.deadline) : undefined,
      status: row.status,
      notes: row.notes ?? undefined,
      workType: row.workType,
      estimatedDuration: row.estimated_duration ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
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
    return data.map(this.mapRowToEntity);
  }

  async findByUserId(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        projects!inner(user_id)
      `,
      )
      .eq("projects.user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapRowToEntity);
  }

  async save(task: Task): Promise<void> {
    const { error } = await supabase.from("tasks").insert({
      id: task.id,
      project_id: task.projectId,
      title: task.title,
      description: task.description ?? null,
      isImportant: task.isImportant,
      isUrgent: task.isUrgent,
      deadline: task.deadline?.toISOString() ?? null,
      status: task.status,
      notes: task.notes ?? null,
      estimated_duration: task.estimatedDuration ?? null,
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
        isImporttant: task.isImportant,
        isUrgent: task.isUrgent,
        deadline: task.deadline?.toISOString() ?? null,
        status: task.status,
        notes: task.notes ?? null,
        estimated_duration: task.estimatedDuration ?? null,
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
}
