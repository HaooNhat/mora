import { z } from "zod";

export const WorkTypeSchema = z.enum([
  "deep",
  "creative",
  "repetitive",
  "light",
]);
export type WorkType = z.infer<typeof WorkTypeSchema>;

export const TaskStatusSchema = z.enum([
  "todo",
  "in_progress",
  "paused",
  "done",
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

/** Base schema for Task */
const TaskBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  notes: z.string().optional(),
  workType: WorkTypeSchema,
  status: TaskStatusSchema,

  isImportant: z.boolean().default(false),
  isUrgent: z.boolean().default(false),

  // Not require for now
  // mentalLoad: z.number().min(1).max(5).optional(), // nullable, learned
  // energyRequired: z.number().min(1).max(5).optional(), // nullable, learned

  deferredUntil: z.date().optional(),
  abandonedAt: z.date().optional(),
  deadline: z.date().optional(),
  estimatedDuration: z.number().positive().optional(),

  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Full Task schema.
 * Represents a fully-initialized, persisted Task.
 */
export const TaskSchema = TaskBaseSchema.refine(
  (t) => t.updatedAt >= t.createdAt,
  { message: "updatedAt cannot be before createdAt" },
).refine((t) => !t.deadline || t.deadline >= t.createdAt, {
  message: "Deadline cannot be before task creation",
});

export type Task = z.infer<typeof TaskSchema>;

/**
 * Schema for creating a new Task.
 * Excludes fields controlled by the domain itself.
 */
const CreateTaskSchema = TaskBaseSchema.omit({
  id: true,
  status: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export class TaskEntity {
  private props: Task;

  /**
   * Private constructor ensures all Task instances
   * are validated and created through factory methods.
   */
  private constructor(props: Task) {
    this.props = TaskSchema.parse(props);
  }

  /**
   * Creates a brand-new Task.
   *
   * Responsibilities:
   * - validates external input
   * - applies domain defaults
   * - generates identity and timestamps
   */
  static create(input: unknown): TaskEntity {
    const data = CreateTaskSchema.parse(input);

    return new TaskEntity({
      ...data,
      id: crypto.randomUUID(),
      status: "todo",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Rehydrates a Task from persistence.
   *
   * No defaults or transformations are applied here —
   * the data must already represent a valid Task.
   */
  static fromPersistence(input: unknown): TaskEntity {
    const data = TaskSchema.parse(input);
    return new TaskEntity(data);
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get projectId(): string | undefined {
    return this.props.projectId;
  }
  get title(): string {
    return this.props.title;
  }
  get workType(): WorkType {
    return this.props.workType;
  }
  get status(): TaskStatus {
    return this.props.status;
  }
  get isImportant(): boolean {
    return this.props.isImportant;
  }
  get isUrgent(): boolean {
    return this.props.isUrgent;
  }
  // get mentalLoad(): number | undefined {
  //   return this.props.mentalLoad;
  // }
  // get energyRequired(): number | undefined {
  //   return this.props.energyRequired;
  // }

  /**
   * Updates the task title.
   */
  updateTitle(title: string): void {
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  updateWorkType(workType: WorkType): void {
    this.props.workType = workType;
    this.props.updatedAt = new Date();
  }

  /**
   * Updates Eisenhower-style priority flags.
   */
  setPriority(isImportant: boolean, isUrgent: boolean): void {
    this.props.isImportant = isImportant;
    this.props.isUrgent = isUrgent;
    this.props.updatedAt = new Date();
  }

  // updateCognitiveProfile(mentalLoad?: number, energyRequired?: number): void {
  //   if (mentalLoad !== undefined) {
  //     if (mentalLoad < 1 || mentalLoad > 5) {
  //       throw new Error("Mental load must be between 1 and 5");
  //     }
  //     this.props.mentalLoad = mentalLoad;
  //   }
  //   if (energyRequired !== undefined) {
  //     if (energyRequired < 1 || energyRequired > 5) {
  //       throw new Error("Energy required must be between 1 and 5");
  //     }
  //     this.props.energyRequired = energyRequired;
  //   }
  //   this.props.updatedAt = new Date();
  // }

  setStatus(status: TaskStatus): void {
    this.props.status = status;
    if (status === "done") {
      this.props.completedAt = new Date();
    }
    this.props.updatedAt = new Date();
  }

  markAsCompleted(): void {
    this.setStatus("done");
  }

  markAsAbandoned(): void {
    this.props.abandonedAt = new Date();
  }

  pause(): void {
    if (this.props.status !== "in_progress") {
      throw new Error("Can only pause tasks that are in progress");
    }
    this.setStatus("paused");
  }

  resume(): void {
    if (this.props.status !== "paused") {
      throw new Error("Can only resume paused tasks");
    }
    this.setStatus("in_progress");
  }

  /**
   * Returns a plain object representation
   * suitable for persistence or serialization.
   */
  toJSON(): Task {
    return { ...this.props };
  }
}
