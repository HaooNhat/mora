import { IProjectRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import { Project } from "@workspace/domain/entities/project.entity";
import { ProjectRow } from "@workspace/infrastructure/database/index.types";
import { supabase } from "@workspace/infrastructure/database/supabase.client";

export class ProjectRepository implements IProjectRepository {
  private mapRowToEntity(row: ProjectRow): Project {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description ?? undefined,
      color: row.color ?? undefined,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  async findById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return this.mapRowToEntity(data);
  }

  async findByUserId(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapRowToEntity);
  }

  async save(project: Project): Promise<void> {
    const { error } = await supabase.from("projects").insert({
      id: project.id,
      user_id: project.userId,
      name: project.name,
      description: project.description ?? null,
      color: project.color ?? null,
    });

    if (error) {
      throw new Error(`Failed to save project: ${error.message}`);
    }
  }

  async update(project: Project): Promise<void> {
    const { error } = await supabase
      .from("projects")
      .update({
        name: project.name,
        description: project.description ?? null,
        color: project.color ?? null,
      })
      .eq("id", project.id);

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }
}
