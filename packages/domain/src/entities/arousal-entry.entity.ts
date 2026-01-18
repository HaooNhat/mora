import { z } from "zod";

export const ArousalLevelSchema = z.enum([
  "very_low",
  "low",
  "optimal",
  "high",
  "overloaded",
]);

export type ArousalLevel = z.infer<typeof ArousalLevelSchema>;

/** Base schema for ArousalEntry */
const ArousalEntryBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),

  arousal: ArousalLevelSchema,

  note: z.string().optional(),

  createdAt: z.date(),
});

/** Full schema */
export const ArousalEntrySchema = ArousalEntryBaseSchema;

/** Schema for creation input */
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
   * Represents a snapshot of the user's nervous-system state.
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

  get note(): string | undefined {
    return this.props.note;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /** Serialize */
  toJSON(): ArousalEntry {
    return { ...this.props };
  }
}
