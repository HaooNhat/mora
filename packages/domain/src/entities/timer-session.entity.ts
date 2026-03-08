import { z } from "zod";
import { ArousalLevelSchema } from "@workspace/domain/entities/arousal-entry.entity";

/** Timer type */
export const TimerTypeSchema = z.enum(["pomodoro", "stopwatch"]);
export type TimerType = z.infer<typeof TimerTypeSchema>;

/** Why did the session end? */
export const EndedReasonSchema = z.enum([
  "finished",
  "abandoned",
  "interrupted",
  "crashed",
]);
export type EndedReason = z.infer<typeof EndedReasonSchema>;

/** Base schema for a work session */
const TimerSessionBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),

  /** Optional: session may or may not be tied to a task */
  taskId: z.string().uuid().optional(),

  /** Timer type */
  timerType: TimerTypeSchema,

  /** Time tracking */
  startedAt: z.date(),
  endedAt: z.date().optional(),
  actualDuration: z.number().positive().optional(), // seconds

  /** Arousal snapshots */
  arousalStart: ArousalLevelSchema.optional(),
  arousalEnd: ArousalLevelSchema.optional(),

  /** Session outcome */
  endedReason: EndedReasonSchema.optional(),
  effectiveness: z.number().min(0).max(1).optional(), // 0-1 scale

  createdAt: z.date(),
});

export const TimerSessionSchema = TimerSessionBaseSchema.refine(
  (s) => !s.endedAt || s.endedAt >= s.startedAt,
  { message: "endedAt cannot be before startedAt" },
);

export const CreateTimerSessionSchema = TimerSessionBaseSchema.omit({
  id: true,
  endedAt: true,
  arousalEnd: true,
  endedReason: true,
  effectiveness: true,
  actualDuration: true,
  createdAt: true,
});

export type TimerSession = z.infer<typeof TimerSessionSchema>;

export class TimerSessionEntity {
  private props: TimerSession;

  private constructor(props: TimerSession) {
    this.props = TimerSessionSchema.parse(props);
  }

  /** Create a new session */
  static create(input: unknown): TimerSessionEntity {
    const data = CreateTimerSessionSchema.parse(input);

    return new TimerSessionEntity({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    });
  }

  /** Rehydrate from persistence */
  static fromPersistence(input: unknown): TimerSessionEntity {
    const data = TimerSessionSchema.parse(input);
    return new TimerSessionEntity(data);
  }

  /** Getters */
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get taskId(): string | undefined {
    return this.props.taskId;
  }

  get timerType(): TimerType {
    return this.props.timerType;
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get endedAt(): Date | undefined {
    return this.props.endedAt;
  }

  get actualDuration(): number | undefined {
    return this.props.actualDuration;
  }

  get arousalStart(): number | undefined {
    return this.props.arousalStart;
  }

  get arousalEnd(): number | undefined {
    return this.props.arousalEnd;
  }

  get endedReason(): EndedReason | undefined {
    return this.props.endedReason;
  }

  get effectiveness(): number | undefined {
    return this.props.effectiveness;
  }

  get isRunning(): boolean {
    return !this.props.endedAt;
  }

  /**
   * Calculate actual duration if session is complete
   */
  // calculateDuration(): number {
  //   if (this.props.actualDuration) return this.props.actualDuration;
  //
  //   if (!this.props.endedAt) {
  //     // Session still running
  //     const now = new Date();
  //     return Math.floor(
  //       (now.getTime() - this.props.startedAt.getTime()) / 1000,
  //     );
  //   }
  //
  //   return Math.floor(
  //     (this.props.endedAt.getTime() - this.props.startedAt.getTime()) / 1000,
  //   );
  // }

  /**
   * End the session
   */
  complete(params: {
    endedReason: EndedReason;
    actualDuration?: number;
    arousalEnd?: number;
    effectiveness?: number;
  }): void {
    if (this.props.endedAt) {
      throw new Error("Session already ended");
    }

    this.props.endedAt = new Date();
    this.props.actualDuration = params.actualDuration;
    this.props.endedReason = params.endedReason;

    if (params.arousalEnd !== undefined) {
      this.updateArousalEnd(params.arousalEnd);
    }

    if (params.effectiveness !== undefined) {
      this.updateEffectiveness(params.effectiveness);
    }
  }

  /**
   * Update arousal at end (for post-session reflection)
   */
  updateArousalEnd(arousal: number): void {
    this.props.arousalEnd = ArousalLevelSchema.parse(arousal);
  }

  /**
   * Update effectiveness rating
   */
  updateEffectiveness(rating: number): void {
    if (rating < 0 || rating > 1) {
      throw new Error("Effectiveness must be between 0 and 1");
    }
    this.props.effectiveness = rating;
  }

  /** Serialize */
  toJSON(): TimerSession {
    return { ...this.props };
  }
}
