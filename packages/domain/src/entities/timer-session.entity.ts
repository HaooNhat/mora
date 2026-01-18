import { z } from "zod";
import { ArousalLevelSchema } from "@workspace/domain/entities/arousal-entry.entity";

/** Timer mode */
export const TimerModeSchema = z.enum(["pomodoro", "stopwatch"]);
export type TimerMode = z.infer<typeof TimerModeSchema>;

/** Base schema for a single work session (one focus block) */
const TimerSessionBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),

  /** Optional: session may or may not be tied to a task */
  taskId: z.string().uuid().optional(),

  /** How this session was timed */
  mode: TimerModeSchema,

  /** Time boundaries */
  startedAt: z.date(),
  endedAt: z.date().optional(),

  /** Duration control (seconds) */
  plannedDuration: z.number().positive().optional(),
  pausedDuration: z.number().min(0).default(0),
  actualDuration: z.number().positive().optional(),

  /** Single arousal snapshot for this focus block */
  sessionArousal: ArousalLevelSchema.optional(),

  /** Session outcome */
  completed: z.boolean(),
  interruptions: z.number().min(0).default(0).optional(),

  /** Optional reflection (never required) */
  perceivedFocus: z.number().min(1).max(5).optional(),
  perceivedProductivity: z.number().min(1).max(5).optional(),

  createdAt: z.date(),
});

/** Full schema with invariants */
export const TimerSessionSchema = TimerSessionBaseSchema.refine(
  (t) => !t.endedAt || t.endedAt >= t.startedAt,
  { message: "endedAt cannot be before startedAt" },
);

/** Schema for creation input */
export const CreateTimerSessionSchema = TimerSessionBaseSchema.omit({
  id: true,
  endedAt: true,
  actualDuration: true,
  completed: true,
  createdAt: true,
});

export type TimerSession = z.infer<typeof TimerSessionSchema>;

export class TimerSessionEntity {
  private props: TimerSession;

  private constructor(props: TimerSession) {
    this.props = TimerSessionSchema.parse(props);
  }

  /** Create a new focus session */
  static create(input: unknown): TimerSessionEntity {
    const data = CreateTimerSessionSchema.parse(input);

    return new TimerSessionEntity({
      ...data,
      id: crypto.randomUUID(),
      completed: false,
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

  get mode(): TimerMode {
    return this.props.mode;
  }

  get completed(): boolean {
    return this.props.completed;
  }

  /** Effective duration in seconds */
  get duration(): number {
    if (this.props.actualDuration) return this.props.actualDuration;
    if (!this.props.endedAt) return 0;

    const elapsed =
      (this.props.endedAt.getTime() - this.props.startedAt.getTime()) / 1000;

    return Math.max(0, elapsed - this.props.pausedDuration);
  }

  /** Interruption handling */

  addInterruption(): void {
    if (!this.props.interruptions) this.props.interruptions = 0;
    this.props.interruptions += 1;
  }

  addPausedTime(seconds: number): void {
    if (seconds <= 0) {
      throw new Error("Paused time must be positive");
    }
    this.props.pausedDuration += seconds;
  }

  /** Complete the session */
  complete(ratings?: { focus?: number; productivity?: number }): void {
    this.props.endedAt = new Date();
    this.props.actualDuration = this.duration;
    this.props.completed = true;

    if (ratings?.focus !== undefined) {
      if (ratings.focus < 1 || ratings.focus > 5) {
        throw new Error("Focus rating must be between 1 and 5");
      }
      this.props.perceivedFocus = ratings.focus;
    }

    if (ratings?.productivity !== undefined) {
      if (ratings.productivity < 1 || ratings.productivity > 5) {
        throw new Error("Productivity rating must be between 1 and 5");
      }
      this.props.perceivedProductivity = ratings.productivity;
    }
  }

  /** Serialize */
  toJSON(): TimerSession {
    return { ...this.props };
  }
}
