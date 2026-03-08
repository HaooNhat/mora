import { z } from "zod";

// Arousal level từ 0.1 (very low) đến 0.9 (overloaded)
export const ArousalLevelSchema = z.number().min(0.1).max(0.9);

export type ArousalLevel = z.infer<typeof ArousalLevelSchema>;

/**
 * Helper để phân loại arousal level
 */
export function categorizeArousal(
  arousal: ArousalLevel,
): "very_low" | "low" | "optimal" | "high" | "overloaded" {
  if (arousal < 0.3) return "very_low";
  if (arousal < 0.5) return "low";
  if (arousal < 0.7) return "optimal";
  if (arousal < 0.85) return "high";
  return "overloaded";
}

/** Base schema for ArousalEntry */
const ArousalEntryBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  arousal: ArousalLevelSchema,
  note: z.string().optional(),
  createdAt: z.date(),
});

export const ArousalEntrySchema = ArousalEntryBaseSchema;

export const CreateArousalEntrySchema = ArousalEntryBaseSchema.omit({
  id: true,
  createdAt: true,
});

export type ArousalEntry = z.infer<typeof ArousalEntrySchema>;

export class ArousalEntryEntity {
  private props: ArousalEntry;

  private constructor(props: ArousalEntry) {
    this.props = ArousalEntrySchema.parse(props);
  }

  /**
   * Create a new arousal entry.
   */
  static create(input: unknown): ArousalEntryEntity {
    const data = CreateArousalEntrySchema.parse(input);

    return new ArousalEntryEntity({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    });
  }

  /**
   * Rehydrate from persistence.
   */
  static fromPersistence(input: unknown): ArousalEntryEntity {
    const data = ArousalEntrySchema.parse(input);
    return new ArousalEntryEntity(data);
  }

  /** Getters */
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get arousal(): ArousalLevel {
    return this.props.arousal;
  }

  get arousalCategory(): ReturnType<typeof categorizeArousal> {
    return categorizeArousal(this.props.arousal);
  }

  get note(): string | undefined {
    return this.props.note;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /** Methods */
  updateArousal(arousal: ArousalLevel): void {
    this.props.arousal = ArousalLevelSchema.parse(arousal);
  }

  updateNote(note: string): void {
    this.props.note = note;
  }

  /** Serialize */
  toJSON(): ArousalEntry {
    return { ...this.props };
  }
}
