// /**
//  * Journal Repository - Data Access Layer
//  */
//
// import { supabase } from "@workspace/infrastructure/supabase/client";
// import type { JournalEntry, MoodType } from "@workspace/domain/mood/types";
//
// type DbJournalEntry = {
//   id: string;
//   user_id: string;
//   title: string | null;
//   content: string;
//   mood: string | null;
//   tags: string[] | null;
//   created_at: string;
//   updated_at: string;
// };
//
// type InsertJournalEntry = {
//   user_id: string;
//   title?: string;
//   content: string;
//   mood?: MoodType;
//   tags?: string[];
// };
//
// type UpdateJournalEntry = {
//   title?: string;
//   content?: string;
//   mood?: MoodType;
//   tags?: string[];
// };
//
// function parseMood(mood: string | null): MoodType | undefined {
//   if (!mood) return undefined;
//
//   const allowedMoods: readonly MoodType[] = [
//     "energized",
//     "focused",
//     "creative",
//     "tired",
//     "stressed",
//     "neutral",
//   ];
//
//   return allowedMoods.includes(mood as MoodType)
//     ? (mood as MoodType)
//     : undefined;
// }
//
// /**
//  * Transform database journal entry to domain model
//  */
// function mapDbJournalToDomain(dbEntry: DbJournalEntry): JournalEntry {
//   return {
//     id: dbEntry.id,
//     userId: dbEntry.user_id,
//     title: dbEntry.title ?? undefined,
//     content: dbEntry.content,
//     mood: parseMood(dbEntry.mood),
//     tags: dbEntry.tags ?? undefined,
//     createdAt: new Date(dbEntry.created_at),
//     updatedAt: new Date(dbEntry.updated_at),
//   };
// }
//
// /**
//  * Journal Repository
//  */
// export const journalRepository = {
//   /**
//    * Fetch all journal entries for current user
//    */
//   async getAllEntries(): Promise<JournalEntry[]> {
//     const { data, error } = await supabase
//       .from("journal_entries")
//       .select("*")
//       .order("created_at", { ascending: false });
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to fetch journal entries`,
//       );
//     }
//
//     return data.map(mapDbJournalToDomain);
//   },
//
//   /**
//    * Fetch journal entries for a specific date range
//    */
//   async getEntriesByDateRange(
//     startDate: Date,
//     endDate: Date,
//   ): Promise<JournalEntry[]> {
//     const { data, error } = await supabase
//       .from("journal_entries")
//       .select("*")
//       .gte("created_at", startDate.toISOString())
//       .lte("created_at", endDate.toISOString())
//       .order("created_at", { ascending: false });
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to fetch journal entries by date`,
//       );
//     }
//
//     return data.map(mapDbJournalToDomain);
//   },
//
//   /**
//    * Fetch journal entries by mood
//    */
//   async getEntriesByMood(mood: MoodType): Promise<JournalEntry[]> {
//     const { data, error } = await supabase
//       .from("journal_entries")
//       .select("*")
//       .eq("mood", mood)
//       .order("created_at", { ascending: false });
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to fetch journal entries by mood`,
//       );
//     }
//
//     return data.map(mapDbJournalToDomain);
//   },
//
//   /**
//    * Create new journal entry
//    */
//   async createEntry(data: {
//     userId: string;
//     title?: string;
//     content: string;
//     mood?: MoodType;
//     tags?: string[];
//   }): Promise<JournalEntry> {
//     const insertData: InsertJournalEntry = {
//       user_id: data.userId,
//       title: data.title,
//       content: data.content,
//       mood: data.mood,
//       tags: data.tags,
//     };
//
//     const { data: entry, error } = await supabase
//       .from("journal_entries")
//       .insert(insertData)
//       .select()
//       .single();
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to create journal entry`,
//       );
//     }
//
//     return mapDbJournalToDomain(entry);
//   },
//
//   /**
//    * Update journal entry
//    */
//   async updateEntry(
//     entryId: string,
//     updates: UpdateJournalEntry,
//   ): Promise<JournalEntry> {
//     const { data: entry, error } = await supabase
//       .from("journal_entries")
//       .update(updates)
//       .eq("id", entryId)
//       .select()
//       .single();
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to update journal entry`,
//       );
//     }
//
//     return mapDbJournalToDomain(entry);
//   },
//
//   /**
//    * Delete journal entry
//    */
//   async deleteEntry(entryId: string): Promise<void> {
//     const { error } = await supabase
//       .from("journal_entries")
//       .delete()
//       .eq("id", entryId);
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to delete journal entry`,
//       );
//     }
//   },
//
//   /**
//    * Search journal entries by content or title
//    */
//   async searchEntries(searchTerm: string): Promise<JournalEntry[]> {
//     const { data, error } = await supabase
//       .from("journal_entries")
//       .select("*")
//       .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
//       .order("created_at", { ascending: false });
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to search journal entries`,
//       );
//     }
//
//     return data.map(mapDbJournalToDomain);
//   },
// };
