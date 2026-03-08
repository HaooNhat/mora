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

/**
 * Simple subtask - embedded in task
 * No separate entity, just data structure
 */
export const SubtaskItemSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int().min(0),
  text: z.string().min(1),
  done: z.boolean(),
});

export type SubtaskItem = z.infer<typeof SubtaskItemSchema>;

/** Base schema for Task */
const TaskBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),

  projectId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  note: z.string().optional(),

  workType: WorkTypeSchema.default("repetitive"),
  status: TaskStatusSchema.default("todo"),

  isImportant: z.boolean().default(false),
  isUrgent: z.boolean().default(false),

  // Embedded subtasks
  subtasks: z.array(SubtaskItemSchema).default([]),

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

  private constructor(props: Task) {
    this.props = TaskSchema.parse(props);
  }

  /**
   * Creates a brand-new Task.
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
   */
  static fromPersistence(input: unknown): TaskEntity {
    const data = TaskSchema.parse(input);
    return new TaskEntity(data);
  }

  // ========================================================================
  // Getters
  // ========================================================================

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

  get description(): string | undefined {
    return this.props.description;
  }

  get note(): string | undefined {
    return this.props.note;
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

  get subtasks(): SubtaskItem[] {
    return [...this.props.subtasks];
  }

  get deadline(): Date | undefined {
    return this.props.deadline;
  }

  get estimatedDuration(): number | undefined {
    return this.props.estimatedDuration;
  }

  get deferredUntil(): Date | undefined {
    return this.props.deferredUntil;
  }

  get abandonedAt(): Date | undefined {
    return this.props.abandonedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ========================================================================
  // Basic Updates
  // ========================================================================

  updateTitle(title: string): void {
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  updateNote(note: string): void {
    this.props.note = note;
    this.props.updatedAt = new Date();
  }

  updateWorkType(workType: WorkType): void {
    this.props.workType = workType;
    this.props.updatedAt = new Date();
  }

  setImportant(value: boolean): void {
    this.props.isImportant = value;
    this.props.updatedAt = new Date();
  }

  setUrgent(value: boolean): void {
    this.props.isUrgent = value;
    this.props.updatedAt = new Date();
  }

  updateDeadline(deadline: Date | undefined): void {
    if (deadline && deadline < this.props.createdAt) {
      throw new Error("Deadline cannot be before task creation");
    }
    this.props.deadline = deadline;
    this.props.updatedAt = new Date();
  }

  updateEstimatedDuration(duration: number | undefined): void {
    if (duration !== undefined && duration <= 0) {
      throw new Error("Estimated duration must be positive");
    }
    this.props.estimatedDuration = duration;
    this.props.updatedAt = new Date();
  }

  // ========================================================================
  // Status Management
  // ========================================================================

  setStatus(status: TaskStatus): void {
    // if (this.props.status === "done") {
    //   throw new Error("Cannot change status of a completed task");
    // }

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
    this.props.updatedAt = new Date();
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

  defer(until: Date): void {
    if (until < new Date()) {
      throw new Error("Cannot defer to a past date");
    }
    this.props.deferredUntil = until;
    this.props.updatedAt = new Date();
  }

  clearDefer(): void {
    this.props.deferredUntil = undefined;
    this.props.updatedAt = new Date();
  }

  // ========================================================================
  // Subtask Management
  // ========================================================================

  /**
   * Add a new subtask
   */
  addSubtask(text: string): SubtaskItem {
    const newSubtask: SubtaskItem = {
      id: crypto.randomUUID(),
      order: this.props.subtasks.length,
      text,
      done: false,
    };

    this.props.subtasks.push(newSubtask);
    this.props.updatedAt = new Date();

    return newSubtask;
  }

  /**
   * Update subtask text
   */
  updateSubtask(subtaskId: string, text: string): void {
    const subtask = this.props.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) {
      throw new Error(`Subtask ${subtaskId} not found`);
    }

    subtask.text = text;
    this.props.updatedAt = new Date();
  }

  /**
   * Toggle subtask done status
   */
  toggleSubtask(subtaskId: string): void {
    const subtask = this.props.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) {
      throw new Error(`Subtask ${subtaskId} not found`);
    }

    subtask.done = !subtask.done;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark subtask as done
   */
  markSubtaskDone(subtaskId: string): void {
    const subtask = this.props.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) {
      throw new Error(`Subtask ${subtaskId} not found`);
    }

    subtask.done = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Delete a subtask
   */
  deleteSubtask(subtaskId: string): void {
    const index = this.props.subtasks.findIndex((s) => s.id === subtaskId);
    if (index === -1) {
      throw new Error(`Subtask ${subtaskId} not found`);
    }

    this.props.subtasks.splice(index, 1);

    // Reorder remaining subtasks
    this.props.subtasks.forEach((s, i) => {
      s.order = i;
    });

    this.props.updatedAt = new Date();
  }

  /**
   * Reorder subtasks
   */
  reorderSubtasks(subtaskIds: string[]): void {
    if (subtaskIds.length !== this.props.subtasks.length) {
      throw new Error("Must provide all subtask IDs for reordering");
    }

    const newOrder: SubtaskItem[] = [];

    for (const id of subtaskIds) {
      const subtask = this.props.subtasks.find((s) => s.id === id);
      if (!subtask) {
        throw new Error(`Subtask ${id} not found`);
      }
      newOrder.push(subtask);
    }

    // Update orders
    newOrder.forEach((s, i) => {
      s.order = i;
    });

    this.props.subtasks = newOrder;
    this.props.updatedAt = new Date();
  }

  /**
   * Get subtask completion percentage
   */
  getSubtaskCompletionRate(): number {
    if (this.props.subtasks.length === 0) return 0;

    const completed = this.props.subtasks.filter((s) => s.done).length;
    return (completed / this.props.subtasks.length) * 100;
  }

  /**
   * Check if all subtasks are done
   */
  areAllSubtasksDone(): boolean {
    return (
      this.props.subtasks.length > 0 && this.props.subtasks.every((s) => s.done)
    );
  }

  // ========================================================================
  // Serialization
  // ========================================================================

  toJSON(): Task {
    return { ...this.props };
  }
}
