import { WorkStatus } from "../value-objects/work-status";
import { repetitiveWork, WorkType } from "../value-objects/work-type";
import { Subtask } from "./subtask";

/**
 * Task Entity
 *
 * Represents a work item that needs to be completed.
 * Follows immutability pattern - all updates return new instances.
 * Aggregates Subtasks as part of its consistency boundary.
 */
export class Task {
  constructor(
    public readonly id: string,
    public readonly projectId: string | null,
    public readonly title: string,
    public readonly description: string,
    public readonly note: string,
    public readonly workType: WorkType,
    public readonly status: WorkStatus,
    public readonly isImportant: boolean,
    public readonly isUrgent: boolean,
    public readonly subtasks: Subtask[],
    public readonly deadline: Date | null,
    public readonly completedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * Validates task invariants
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("Task id is required");
    }

    // if (!this.projectId || this.projectId.trim().length === 0) {
    //   throw new Error("Task projectId is required");
    // }

    if (!this.title || this.title.trim().length === 0) {
      throw new Error("Task title cannot be empty");
    }

    if (this.title.length > 200) {
      throw new Error("Task title cannot exceed 200 characters");
    }

    if (this.description && this.description.length > 2000) {
      throw new Error("Task description cannot exceed 2000 characters");
    }

    if (this.note && this.note.length > 5000) {
      throw new Error("Task note cannot exceed 5000 characters");
    }

    if (this.createdAt > this.updatedAt) {
      throw new Error("updatedAt cannot be before createdAt");
    }

    if (this.deadline && this.deadline < this.createdAt) {
      throw new Error("Deadline cannot be before task creation");
    }

    if (this.completedAt && this.completedAt < this.createdAt) {
      throw new Error("completedAt cannot be before createdAt");
    }

    if (this.status === WorkStatus.DONE && !this.completedAt) {
      throw new Error("Completed tasks must have a completedAt date");
    }

    if (this.status !== WorkStatus.DONE && this.completedAt) {
      throw new Error("Only completed tasks can have a completedAt date");
    }

    // Validate all subtasks belong to this task
    for (const subtask of this.subtasks) {
      if (subtask.taskId !== this.id) {
        throw new Error(
          `Subtask ${subtask.id} does not belong to task ${this.id}`,
        );
      }
    }
  }

  /**
   * Creates a new Task
   */
  static create(
    title: string,
    description: string = "",
    workType: WorkType = repetitiveWork(),
    options: {
      projectId?: string;
      note?: string;
      isImportant?: boolean;
      isUrgent?: boolean;
      deadline?: Date;
    } = {},
  ): Task {
    const now = new Date();
    const id = crypto.randomUUID();

    return new Task(
      id,
      options.projectId ?? null,
      title.trim(),
      description.trim(),
      options.note?.trim() ?? "",
      workType,
      WorkStatus.TODO,
      options.isImportant ?? false,
      options.isUrgent ?? false,
      [], // No subtasks initially
      options.deadline ?? null,
      null, // Not completed yet
      now,
      now,
    );
  }

  /**
   * Rehydrates a Task from persistence
   */
  static fromPersistence(
    id: string,
    projectId: string,
    title: string,
    description: string,
    note: string,
    workType: WorkType,
    status: WorkStatus,
    isImportant: boolean,
    isUrgent: boolean,
    subtasks: Subtask[],
    deadline: Date | null,
    completedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ): Task {
    return new Task(
      id,
      projectId,
      title,
      description,
      note,
      workType,
      status,
      isImportant,
      isUrgent,
      subtasks,
      deadline,
      completedAt,
      createdAt,
      updatedAt,
    );
  }

  /**
   * Updates task properties
   */
  update(updates: {
    title?: string;
    description?: string;
    note?: string;
    workType?: WorkType;
    status?: WorkStatus;
    isImportant?: boolean;
    isUrgent?: boolean;
    deadline?: Date | null;
  }): Task {
    const now = new Date();

    // Handle status changes that affect completedAt
    let newCompletedAt = this.completedAt;
    const newStatus = updates.status ?? this.status;

    if (newStatus === WorkStatus.DONE && !this.completedAt) {
      newCompletedAt = now;
    } else if (newStatus !== WorkStatus.DONE && this.completedAt) {
      newCompletedAt = null;
    }

    return new Task(
      this.id,
      this.projectId,
      updates.title?.trim() ?? this.title,
      updates.description?.trim() ?? this.description,
      updates.note?.trim() ?? this.note,
      updates.workType ?? this.workType,
      newStatus,
      updates.isImportant ?? this.isImportant,
      updates.isUrgent ?? this.isUrgent,
      this.subtasks,
      updates.deadline !== undefined ? updates.deadline : this.deadline,
      newCompletedAt,
      this.createdAt,
      now,
    );
  }

  /**
   * Updates the task status
   */
  updateStatus(status: WorkStatus): Task {
    return this.update({ status });
  }

  /**
   * Marks task as completed
   */
  markAsCompleted(): Task {
    return this.update({ status: WorkStatus.DONE });
  }

  /**
   * Marks task as in progress
   */
  start(): Task {
    if (this.status === WorkStatus.TODO || this.status === WorkStatus.PAUSED) {
      return this.update({ status: WorkStatus.IN_PROGRESS });
    }
    return this;
  }

  /**
   * Pauses the task
   */
  pause(): Task {
    if (this.status === WorkStatus.IN_PROGRESS) {
      return this.update({ status: WorkStatus.PAUSED });
    }
    throw new Error("Can only pause tasks that are in progress");
  }

  /**
   * Resumes a paused task
   */
  resume(): Task {
    if (this.status === WorkStatus.PAUSED) {
      return this.update({ status: WorkStatus.IN_PROGRESS });
    }
    throw new Error("Can only resume paused tasks");
  }

  /**
   * Toggles importance flag
   */
  toggleImportant(): Task {
    return this.update({ isImportant: !this.isImportant });
  }

  /**
   * Toggles urgency flag
   */
  toggleUrgent(): Task {
    return this.update({ isUrgent: !this.isUrgent });
  }

  /**
   * Adds a subtask to the task
   */
  addSubtask(title: string): Task {
    const subtask = Subtask.create(this.id, title);

    return new Task(
      this.id,
      this.projectId,
      this.title,
      this.description,
      this.note,
      this.workType,
      this.status,
      this.isImportant,
      this.isUrgent,
      [...this.subtasks, subtask],
      this.deadline,
      this.completedAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Updates a subtask
   */
  updateSubtask(subtaskId: string, title: string): Task {
    const subtaskIndex = this.subtasks.findIndex((s) => s.id === subtaskId);

    if (subtaskIndex === -1) {
      throw new Error(`Subtask ${subtaskId} not found in task ${this.id}`);
    }

    const updatedSubtask = this.subtasks[subtaskIndex]!.updateTitle(title);
    const newSubtasks = [...this.subtasks];
    newSubtasks[subtaskIndex] = updatedSubtask;

    return new Task(
      this.id,
      this.projectId,
      this.title,
      this.description,
      this.note,
      this.workType,
      this.status,
      this.isImportant,
      this.isUrgent,
      newSubtasks,
      this.deadline,
      this.completedAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Toggles a subtask's completion status
   */
  toggleSubtask(subtaskId: string): Task {
    const subtaskIndex = this.subtasks.findIndex((s) => s.id === subtaskId);

    if (subtaskIndex === -1) {
      throw new Error(`Subtask ${subtaskId} not found in task ${this.id}`);
    }

    const toggledSubtask = this.subtasks[subtaskIndex]!.toggle();
    const newSubtasks = [...this.subtasks];
    newSubtasks[subtaskIndex] = toggledSubtask;

    return new Task(
      this.id,
      this.projectId,
      this.title,
      this.description,
      this.note,
      this.workType,
      this.status,
      this.isImportant,
      this.isUrgent,
      newSubtasks,
      this.deadline,
      this.completedAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Deletes a subtask
   */
  deleteSubtask(subtaskId: string): Task {
    const filteredSubtasks = this.subtasks.filter((s) => s.id !== subtaskId);

    if (filteredSubtasks.length === this.subtasks.length) {
      throw new Error(`Subtask ${subtaskId} not found in task ${this.id}`);
    }

    return new Task(
      this.id,
      this.projectId,
      this.title,
      this.description,
      this.note,
      this.workType,
      this.status,
      this.isImportant,
      this.isUrgent,
      filteredSubtasks,
      this.deadline,
      this.completedAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Gets the subtask completion rate as a percentage
   */
  getSubtaskCompletionRate(): number {
    if (this.subtasks.length === 0) {
      return 0;
    }

    const completedCount = this.subtasks.filter((s) => s.isCompleted()).length;
    return Math.round((completedCount / this.subtasks.length) * 100);
  }

  /**
   * Checks if all subtasks are completed
   */
  areAllSubtasksCompleted(): boolean {
    if (this.subtasks.length === 0) {
      return false;
    }

    return this.subtasks.every((s) => s.isCompleted());
  }

  /**
   * Checks if the task is completed
   */
  isCompleted(): boolean {
    return this.status === WorkStatus.DONE;
  }

  /**
   * Checks if the task is overdue
   */
  isOverdue(): boolean {
    if (!this.deadline || this.isCompleted()) {
      return false;
    }

    return new Date() > this.deadline;
  }

  /**
   * Checks if task is in the Eisenhower "Do First" quadrant
   */
  isDoFirst(): boolean {
    return this.isImportant && this.isUrgent;
  }

  /**
   * Checks if task is in the Eisenhower "Schedule" quadrant
   */
  isSchedule(): boolean {
    return this.isImportant && !this.isUrgent;
  }

  /**
   * Checks if task is in the Eisenhower "Delegate" quadrant
   */
  isDelegate(): boolean {
    return !this.isImportant && this.isUrgent;
  }

  /**
   * Checks if task is in the Eisenhower "Eliminate" quadrant
   */
  isEliminate(): boolean {
    return !this.isImportant && !this.isUrgent;
  }

  /**
   * Gets the number of days until deadline
   */
  getDaysUntilDeadline(): number | null {
    if (!this.deadline) {
      return null;
    }

    const now = new Date();
    const diffTime = this.deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Returns a plain object representation for persistence
   */
  toPersistence(): {
    id: string;
    projectId: string | null;
    title: string;
    description: string;
    note: string;
    workType: WorkType;
    status: WorkStatus;
    isImportant: boolean;
    isUrgent: boolean;
    subtasks: ReturnType<Subtask["toPersistence"]>[];
    deadline: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      projectId: this.projectId,
      title: this.title,
      description: this.description,
      note: this.note,
      workType: this.workType,
      status: this.status,
      isImportant: this.isImportant,
      isUrgent: this.isUrgent,
      subtasks: this.subtasks.map((s) => s.toPersistence()),
      deadline: this.deadline,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Returns a JSON representation
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      projectId: this.projectId,
      title: this.title,
      description: this.description,
      note: this.note,
      workType: this.workType,
      status: this.status,
      isImportant: this.isImportant,
      isUrgent: this.isUrgent,
      subtasks: this.subtasks.map((s) => s.toJSON()),
      subtaskCompletionRate: this.getSubtaskCompletionRate(),
      deadline: this.deadline?.toISOString() ?? null,
      completedAt: this.completedAt?.toISOString() ?? null,
      isCompleted: this.isCompleted(),
      isOverdue: this.isOverdue(),
      eisenhowerQuadrant: this.getEisenhowerQuadrant(),
      daysUntilDeadline: this.getDaysUntilDeadline(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Gets the Eisenhower quadrant classification
   */
  private getEisenhowerQuadrant(): string {
    if (this.isDoFirst()) return "do-first";
    if (this.isSchedule()) return "schedule";
    if (this.isDelegate()) return "delegate";
    if (this.isEliminate()) return "eliminate";
    return "unknown";
  }

  /**
   * Creates a copy of the task
   */
  clone(): Task {
    return new Task(
      this.id,
      this.projectId,
      this.title,
      this.description,
      this.note,
      this.workType,
      this.status,
      this.isImportant,
      this.isUrgent,
      this.subtasks.map((s) => s.clone()),
      this.deadline,
      this.completedAt,
      this.createdAt,
      this.updatedAt,
    );
  }

  /**
   * Checks equality with another task
   */
  equals(other: Task): boolean {
    return this.id === other.id;
  }
}
