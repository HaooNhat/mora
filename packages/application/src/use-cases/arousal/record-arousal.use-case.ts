import { ArousalEntryEntity } from "@workspace/domain/entities/arousal-entry.entity";
import { IArousalEntryRepository } from "@workspace/application/interfaces/repositories/arousal-entry.repository.interface";
import { IUserCognitivePreferencesRepository } from "@workspace/application/interfaces/repositories/user-cognitive-preferences.repository.interface";

export interface RecordArousalInput {
  userId: string;
  arousal: number;
  note?: string;
}

/**
 * Records a new arousal entry and optionally updates user cognitive preferences
 */
export class RecordArousalUseCase {
  constructor(
    private arousalRepository: IArousalEntryRepository,
    private cognitivePrefsRepository: IUserCognitivePreferencesRepository,
  ) {}

  async execute(input: RecordArousalInput): Promise<{ entryId: string }> {
    // Create and save arousal entry
    const entry = ArousalEntryEntity.create({
      userId: input.userId,
      arousal: input.arousal,
      note: input.note,
    });

    await this.arousalRepository.save(entry.toJSON());

    // Optionally: Update running average in cognitive preferences
    // This could be done periodically instead of on every entry
    try {
      const prefs = await this.cognitivePrefsRepository.findByUserId(
        input.userId,
      );

      if (prefs && prefs.confidence > 0.5) {
        // Get recent entries to calculate trend
        const recentEntries = await this.arousalRepository.findByUserId(
          input.userId,
        );
        const last10 = recentEntries.slice(0, 10);

        if (last10.length >= 5) {
          const avgArousal =
            last10.reduce((sum, e) => sum + e.arousal, 0) / last10.length;

          // Subtle adjustment toward observed average
          const currentCenter = prefs.optimalArousalCenter;
          const newCenter = currentCenter + 0.05 * (avgArousal - currentCenter);

          const prefsEntity =
            await import("@workspace/domain/entities/user-cognitive-preferences.entity").then(
              (m) => m.UserCognitivePreferencesEntity.fromPersistence(prefs),
            );

          prefsEntity.recalibrate({ newCenter });
          await this.cognitivePrefsRepository.update(prefsEntity.toJSON());
        }
      }
    } catch (error) {
      // Don't fail the whole operation if preference update fails
      console.error("Failed to update cognitive preferences:", error);
    }

    return { entryId: entry.id };
  }
}
