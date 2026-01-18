// /**
//  * Journal Service - Business Logic Layer
//  */
//
// import { journalRepository } from "@workspace/infrastructure/repositories/journal.repository";
// import { getCurrentUserId } from "@workspace/infrastructure/supabase/client";
// import { ServiceError } from "@workspace/infrastructure/services/project.service";
// import type { JournalEntry, MoodType } from "@workspace/domain/mood/types";
//
// /**
//  * Validation helpers
//  */
// function validateContent(content: string): void {
//   if (!content || content.trim().length === 0) {
//     throw new ServiceError("Journal content cannot be empty", "INVALID_INPUT");
//   }
//   if (content.length > 10000) {
//     throw new ServiceError(
//       "Journal content cannot exceed 10,000 characters",
//       "INVALID_INPUT",
//     );
//   }
// }
//
// function validateTitle(title: string): void {
//   if (title && title.length > 200) {
//     throw new ServiceError(
//       "Journal title cannot exceed 200 characters",
//       "INVALID_INPUT",
//     );
//   }
// }
//
// /**
//  * Authentication helper
//  */
// async function ensureAuthenticated(): Promise<string> {
//   const userId = await getCurrentUserId();
//   if (!userId) {
//     throw new ServiceError("User must be authenticated", "UNAUTHENTICATED");
//   }
//   return userId;
// }
//
// /**
//  * Journal Service
//  */
// export const journalService = {
//   /**
//    * Get all journal entries for current user
//    */
//   async getAllEntries(): Promise<JournalEntry[]> {
//     try {
//       await ensureAuthenticated();
//       return await journalRepository.getAllEntries();
//     } catch (error) {
//       if (error instanceof ServiceError) {
//         throw error;
//       }
//       throw new ServiceError(
//         "Failed to fetch journal entries",
//         "UNKNOWN_ERROR",
//         error,
//       );
//     }
//   },
//
//   /**
//    * Get journal entries for date range
//    */
//   async getEntriesByDateRange(
//     startDate: Date,
//     endDate: Date,
//   ): Promise<JournalEntry[]> {
//     try {
//       await ensureAuthenticated();
//
//       if (startDate > endDate) {
//         throw new ServiceError(
//           "Start date cannot be after end date",
//           "INVALID_INPUT",
//         );
//       }
//
//       return await journalRepository.getEntriesByDateRange(startDate, endDate);
//     } catch (error) {
//       if (error instanceof ServiceError) {
//         throw error;
//       }
//       throw new ServiceError(
//         "Failed to fetch journal entries by date",
//         "UNKNOWN_ERROR",
//         error,
//       );
//     }
//   },
//
//   /**
//    * Get journal entries by mood
//    */
//   async getEntriesByMood(mood: MoodType): Promise<JournalEntry[]> {
//     try {
//       await ensureAuthenticated();
//       return await journalRepository.getEntriesByMood(mood);
//     } catch (error) {
//       if (error instanceof ServiceError) {
//         throw error;
//       }
//       throw new ServiceError(
//         "Failed to fetch journal entries by mood",
//         "UNKNOWN_ERROR",
//         error,
//       );
//     }
//   },
//
//   /**
//    * Create new journal entry
//    */
//   async createEntry(data: {
//     title?: string;
//     content: string;
//     mood?: MoodType;
//     tags?: string[];
//   }): Promise<JournalEntry> {
//     try {
//       validateContent(data.content);
//       if (data.title) {
//         validateTitle(data.title);
//       }
//
//       const userId = await ensureAuthenticated();
//
//       return await journalRepository.createEntry({
//         userId,
//         title: data.title?.trim(),
//         content: data.content.trim(),
//         mood: data.mood,
//         tags: data.tags?.filter((tag) => tag.trim().length > 0),
//       });
//     } catch (error) {
//       if (error instanceof ServiceError) {
//         throw error;
//       }
//       throw new ServiceError(
//         "Failed to create journal entry",
//         "UNKNOWN_ERROR",
//         error,
//       );
//     }
//   },
//
//   /**
//    * Update journal entry
//    */
//   async updateEntry(
//     entryId: string,
//     updates: {
//       title?: string;
//       content?: string;
//       mood?: MoodType;
//       tags?: string[];
//     },
//   ): Promise<JournalEntry> {
//     try {
//       await ensureAuthenticated();
//
//       if (updates.content !== undefined) {
//         validateContent(updates.content);
//         updates.content = updates.content.trim();
//       }
//
//       if (updates.title !== undefined) {
//         validateTitle(updates.title);
//         updates.title = updates.title.trim();
//       }
//
//       if (updates.tags) {
//         updates.tags = updates.tags.filter((tag) => tag.trim().length > 0);
//       }
//
//       return await journalRepository.updateEntry(entryId, updates);
//     } catch (error) {
//       if (error instanceof ServiceError) {
//         throw error;
//       }
//       throw new ServiceError(
//         "Failed to update journal entry",
//         "UNKNOWN_ERROR",
//         error,
//       );
//     }
//   },
//
//   /**
//    * Delete journal entry
//    */
//   async deleteEntry(entryId: string): Promise<void> {
//     try {
//       await ensureAuthenticated();
//       await journalRepository.deleteEntry(entryId);
//     } catch (error) {
//       if (error instanceof ServiceError) {
//         throw error;
//       }
//       throw new ServiceError(
//         "Failed to delete journal entry",
//         "UNKNOWN_ERROR",
//         error,
//       );
//     }
//   },
//
//   /**
//    * Search journal entries
//    */
//   async searchEntries(searchTerm: string): Promise<JournalEntry[]> {
//     try {
//       await ensureAuthenticated();
//
//       if (!searchTerm || searchTerm.trim().length === 0) {
//         throw new ServiceError("Search term cannot be empty", "INVALID_INPUT");
//       }
//
//       return await journalRepository.searchEntries(searchTerm.trim());
//     } catch (error) {
//       if (error instanceof ServiceError) {
//         throw error;
//       }
//       throw new ServiceError(
//         "Failed to search journal entries",
//         "UNKNOWN_ERROR",
//         error,
//       );
//     }
//   },
// };
