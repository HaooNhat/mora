import { z } from "zod";
import {
  ArousalLevelSchema,
  ArousalLevel,
} from "@workspace/domain/entities/arousal-entry.entity";

/** Base schema for Daily Intention */
const DailyIntentionBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),

  /** Date this intention applies to */
  date: z.date(),

  /** Morning planning (optional) */

  /** Target arousal for the day (soft constraint) */
  targetArousal: ArousalLevelSchema.optional(),

  /** Tasks the user intends to work on today */
  plannedTaskIds: z.array(z.string().uuid()).default([]),

  /** Soft effort expectation (minutes of focused work) */
  targetFocusMinutes: z.number().min(0).default(120),

  /** Evening reflection (all optional) */

  perceivedProductivity: z.number().min(1).max(5).optional(),
  whatWentWell: z.string().optional(),
  whatWasHard: z.string().optional(),
  tomorrowNote: z.string().optional(),

  /** Meta */

  isOffDay: z.boolean().default(false),
  reflectedAt: z.date().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const DailyIntentionSchema = DailyIntentionBaseSchema;
export type DailyIntention = z.infer<typeof DailyIntentionSchema>;

export const CreateDailyIntentionSchema = DailyIntentionBaseSchema.omit({
  id: true,
  reflectedAt: true,
  createdAt: true,
  updatedAt: true,
});

export class DailyIntentionEntity {
  private props: DailyIntention;

  private constructor(props: DailyIntention) {
    this.props = DailyIntentionSchema.parse(props);
  }

  /** Create a new daily intention */
  static create(input: unknown): DailyIntentionEntity {
    const data = CreateDailyIntentionSchema.parse(input);

    return new DailyIntentionEntity({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /** Rehydrate from persistence */
  static fromPersistence(input: unknown): DailyIntentionEntity {
    const data = DailyIntentionSchema.parse(input);
    return new DailyIntentionEntity(data);
  }

  /** Getters */

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get date(): Date {
    return this.props.date;
  }

  get isReflected(): boolean {
    return this.props.reflectedAt !== undefined;
  }

  /** Morning planning */

  setTargetArousal(arousal: ArousalLevel): void {
    this.props.targetArousal = arousal;
    this.props.updatedAt = new Date();
  }

  addPlannedTask(taskId: string): void {
    if (!this.props.plannedTaskIds.includes(taskId)) {
      this.props.plannedTaskIds.push(taskId);
      this.props.updatedAt = new Date();
    }
  }

  removePlannedTask(taskId: string): void {
    this.props.plannedTaskIds = this.props.plannedTaskIds.filter(
      (id) => id !== taskId,
    );
    this.props.updatedAt = new Date();
  }

  /** Evening reflection (fully optional) */

  reflect(reflection: {
    productivity?: number;
    whatWentWell?: string;
    whatWasHard?: string;
    tomorrowNote?: string;
  }): void {
    if (reflection.productivity !== undefined) {
      if (reflection.productivity < 1 || reflection.productivity > 5) {
        throw new Error("Productivity rating must be between 1 and 5");
      }
      this.props.perceivedProductivity = reflection.productivity;
    }

    if (reflection.whatWentWell)
      this.props.whatWentWell = reflection.whatWentWell;

    if (reflection.whatWasHard) this.props.whatWasHard = reflection.whatWasHard;

    if (reflection.tomorrowNote)
      this.props.tomorrowNote = reflection.tomorrowNote;

    this.props.reflectedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /** Serialize */
  toJSON(): DailyIntention {
    return { ...this.props };
  }
}
