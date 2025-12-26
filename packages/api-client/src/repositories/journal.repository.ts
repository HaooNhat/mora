/**
 * Journal Repository - Data Access Layer
 */

import { supabase } from "@workspace/api-client/supabase/client";
import { RepositoryError } from "@workspace/api-client/repositories/project.repository";
import type { JournalEntry, MoodType } from "@workspace/core/mood/types";

type DbJournalEntry = {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: MoodType | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};

type InsertJournalEntry = {
  user_id: string;
  title?: string;
  content: string;
  mood?: MoodType;
  tags?: string[];
};

type UpdateJournalEntry = {
  title?: string;
  content?: string;
  mood?: MoodType;
  tags?: string[];
};

/**
 * Transform database journal entry to domain model
 */
function mapDbJournalToDomain(dbEntry: DbJournalEntry): JournalEntry {
  return {
    id: dbEntry.id,
    userId: dbEntry.user_id,
    title: dbEntry.title ?? undefined,
    content: dbEntry.content,
    mood: dbEntry.mood ?? undefined,
    tags: dbEntry.tags ?? undefined,
    createdAt: new Date(dbEntry.created_at),
    updatedAt: new Date(dbEntry.updated_at),
  };
}

/**
 * Journal Repository
 */
export const journalRepository = {
  /**
   * Fetch all journal entries for current user
   */
  async getAllEntries(): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new RepositoryError(
        "Failed to fetch journal entries",
        error.code,
        error.details,
      );
    }

    return data.map(mapDbJournalToDomain);
  },

  /**
   * Fetch journal entries for a specific date range
   */
  async getEntriesByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      throw new RepositoryError(
        "Failed to fetch journal entries by date",
        error.code,
        error.details,
      );
    }

    return data.map(mapDbJournalToDomain);
  },

  /**
   * Fetch journal entries by mood
   */
  async getEntriesByMood(mood: MoodType): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("mood", mood)
      .order("created_at", { ascending: false });

    if (error) {
      throw new RepositoryError(
        "Failed to fetch journal entries by mood",
        error.code,
        error.details,
      );
    }

    return data.map(mapDbJournalToDomain);
  },

  /**
   * Create new journal entry
   */
  async createEntry(data: {
    userId: string;
    title?: string;
    content: string;
    mood?: MoodType;
    tags?: string[];
  }): Promise<JournalEntry> {
    const insertData: InsertJournalEntry = {
      user_id: data.userId,
      title: data.title,
      content: data.content,
      mood: data.mood,
      tags: data.tags,
    };

    const { data: entry, error } = await supabase
      .from("journal_entries")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(
        "Failed to create journal entry",
        error.code,
        error.details,
      );
    }

    return mapDbJournalToDomain(entry);
  },

  /**
   * Update journal entry
   */
  async updateEntry(
    entryId: string,
    updates: UpdateJournalEntry,
  ): Promise<JournalEntry> {
    const { data: entry, error } = await supabase
      .from("journal_entries")
      .update(updates)
      .eq("id", entryId)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(
        "Failed to update journal entry",
        error.code,
        error.details,
      );
    }

    return mapDbJournalToDomain(entry);
  },

  /**
   * Delete journal entry
   */
  async deleteEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryId);

    if (error) {
      throw new RepositoryError(
        "Failed to delete journal entry",
        error.code,
        error.details,
      );
    }
  },

  /**
   * Search journal entries by content or title
   */
  async searchEntries(searchTerm: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false });

    if (error) {
      throw new RepositoryError(
        "Failed to search journal entries",
        error.code,
        error.details,
      );
    }

    return data.map(mapDbJournalToDomain);
  },
};
export { RepositoryError };
