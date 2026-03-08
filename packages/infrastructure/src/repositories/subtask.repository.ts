// import { SubtaskRow } from "@workspace/infrastructure/database/index.types";
// import { ISubtaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
// import { Subtask } from "@workspace/domain/entities/subtask.entity";
// import { supabase } from "@workspace/infrastructure/database/supabase-client";
//
// export class SubtaskRepository implements ISubtaskRepository {
//   private mapRowToEntity(row: SubtaskRow): Subtask {
//     return {
//       id: row.id,
//       taskId: row.task_id,
//       title: row.title,
//       completed: row.completed ?? false,
//       createdAt: row.created_at ? new Date(row.created_at) : new Date(),
//       updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
//     };
//   }
//
//   async findById(id: string): Promise<Subtask | null> {
//     const { data, error } = await supabase
//       .from("subtasks")
//       .select("*")
//       .eq("id", id)
//       .single();
//
//     if (error || !data) return null;
//     return this.mapRowToEntity(data);
//   }
//
//   async findByTaskId(taskId: string): Promise<Subtask[]> {
//     const { data, error } = await supabase
//       .from("subtasks")
//       .select("*")
//       .eq("task_id", taskId)
//       .order("created_at", { ascending: true });
//
//     if (error || !data) return [];
//     return data.map(this.mapRowToEntity);
//   }
//
//   async save(subtask: Subtask): Promise<void> {
//     const { error } = await supabase.from("subtasks").insert({
//       id: subtask.id,
//       task_id: subtask.taskId,
//       title: subtask.title,
//       completed: subtask.completed,
//     });
//
//     if (error) {
//       throw new Error(`Failed to save subtask: ${error.message}`);
//     }
//   }
//
//   async update(subtask: Subtask): Promise<void> {
//     const { error } = await supabase
//       .from("subtasks")
//       .update({
//         title: subtask.title,
//         completed: subtask.completed,
//       })
//       .eq("id", subtask.id);
//
//     if (error) {
//       throw new Error(`Failed to update subtask: ${error.message}`);
//     }
//   }
//
//   async delete(id: string): Promise<void> {
//     const { error } = await supabase.from("subtasks").delete().eq("id", id);
//
//     if (error) {
//       throw new Error(`Failed to delete subtask: ${error.message}`);
//     }
//   }
// }
