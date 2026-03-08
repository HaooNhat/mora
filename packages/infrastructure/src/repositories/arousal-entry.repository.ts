// import { supabase } from "@workspace/infrastructure/database/supabase-client";
// import { ArousalEntry } from "@workspace/domain/entities/arousal-entry.entity";
//
// export interface IArousalEntryRepository {
//   findById(id: string): Promise<ArousalEntry | null>;
//   findByUserId(userId: string): Promise<ArousalEntry[]>;
//   findByUserIdAndDateRange(
//     userId: string,
//     startDate: Date,
//     endDate: Date,
//   ): Promise<ArousalEntry[]>;
//   findLatestByUserId(userId: string): Promise<ArousalEntry | null>;
//   save(entry: ArousalEntry): Promise<void>;
//   delete(id: string): Promise<void>;
// }
//
// export class ArousalEntryRepository implements IArousalEntryRepository {
//   private mapRowToEntity(row: any): ArousalEntry {
//     return {
//       id: row.id,
//       userId: row.user_id,
//       arousal: row.arousal,
//       note: row.note ?? undefined,
//       createdAt: new Date(row.created_at),
//     };
//   }
//
//   async findById(id: string): Promise<ArousalEntry | null> {
//     const { data, error } = await supabase
//       .from("arousal_entries")
//       .select("*")
//       .eq("id", id)
//       .single();
//
//     if (error || !data) return null;
//     return this.mapRowToEntity(data);
//   }
//
//   async findByUserId(userId: string): Promise<ArousalEntry[]> {
//     const { data, error } = await supabase
//       .from("arousal_entries")
//       .select("*")
//       .eq("user_id", userId)
//       .order("created_at", { ascending: false });
//
//     if (error || !data) return [];
//     return data.map(this.mapRowToEntity);
//   }
//
//   async findByUserIdAndDateRange(
//     userId: string,
//     startDate: Date,
//     endDate: Date,
//   ): Promise<ArousalEntry[]> {
//     const { data, error } = await supabase
//       .from("arousal_entries")
//       .select("*")
//       .eq("user_id", userId)
//       .gte("created_at", startDate.toISOString())
//       .lte("created_at", endDate.toISOString())
//       .order("created_at", { ascending: false });
//
//     if (error || !data) return [];
//     return data.map(this.mapRowToEntity);
//   }
//
//   async findLatestByUserId(userId: string): Promise<ArousalEntry | null> {
//     const { data, error } = await supabase
//       .from("arousal_entries")
//       .select("*")
//       .eq("user_id", userId)
//       .order("created_at", { ascending: false })
//       .limit(1)
//       .single();
//
//     if (error || !data) return null;
//     return this.mapRowToEntity(data);
//   }
//
//   async save(entry: ArousalEntry): Promise<void> {
//     const { error } = await supabase.from("arousal_entries").insert({
//       id: entry.id,
//       user_id: entry.userId,
//       arousal: entry.arousal,
//       note: entry.note ?? null,
//       created_at: entry.createdAt.toISOString(),
//     });
//
//     if (error) {
//       throw new Error(`Failed to save arousal entry: ${error.message}`);
//     }
//   }
//
//   async delete(id: string): Promise<void> {
//     const { error } = await supabase
//       .from("arousal_entries")
//       .delete()
//       .eq("id", id);
//
//     if (error) {
//       throw new Error(`Failed to delete arousal entry: ${error.message}`);
//     }
//   }
// }
