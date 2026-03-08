import { IUserCognitivePreferencesRepository } from "@workspace/application/interfaces/repositories/user-cognitive-preferences.repository.interface";
import { UserCognitivePreferences } from "@workspace/domain/entities/user-cognitive-preferences.entity";
import { UserCognitivePreferenceRow } from "@workspace/infrastructure/database/index.types";
import { supabase } from "@workspace/infrastructure/database/supabase.client";

export class UserCognitivePreferencesRepository implements IUserCognitivePreferencesRepository {
  private mapRowToEntity(
    row: UserCognitivePreferenceRow,
  ): UserCognitivePreferences {
    return {
      userId: row.user_id,
      optimalArousalCenter: row.optimal_arousal_center,
      arousalSpread: row.arousal_spread,
      taskTypeOffsets: row.task_type_offsets as Record<string, number>,
      confidence: row.confidence,
      updatedAt: new Date(row.updated_at),
    };
  }

  async findByUserId(userId: string): Promise<UserCognitivePreferences | null> {
    const { data, error } = await supabase
      .from("user_cognitive_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;
    return this.mapRowToEntity(data);
  }

  async save(prefs: UserCognitivePreferences): Promise<void> {
    const { error } = await supabase.from("user_cognitive_preferences").insert({
      user_id: prefs.userId,
      optimal_arousal_center: prefs.optimalArousalCenter,
      arousal_spread: prefs.arousalSpread,
      task_type_offsets: prefs.taskTypeOffsets,
      confidence: prefs.confidence,
      updated_at: prefs.updatedAt.toISOString(),
    });

    if (error) {
      throw new Error(`Failed to save cognitive preferences: ${error.message}`);
    }
  }

  async update(prefs: UserCognitivePreferences): Promise<void> {
    const { error } = await supabase
      .from("user_cognitive_preferences")
      .update({
        optimal_arousal_center: prefs.optimalArousalCenter,
        arousal_spread: prefs.arousalSpread,
        task_type_offsets: prefs.taskTypeOffsets,
        confidence: prefs.confidence,
        updated_at: prefs.updatedAt.toISOString(),
      })
      .eq("user_id", prefs.userId);

    if (error) {
      throw new Error(
        `Failed to update cognitive preferences: ${error.message}`,
      );
    }
  }

  async delete(userId: string): Promise<void> {
    const { error } = await supabase
      .from("user_cognitive_preferences")
      .delete()
      .eq("user_id", userId);

    if (error) {
      throw new Error(
        `Failed to delete cognitive preferences: ${error.message}`,
      );
    }
  }
}
