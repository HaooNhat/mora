import { randomUUID } from "crypto";

/**
 * Subtask Entity
 *
 * Represents a sub-item within a Task that can be completed independently.
 * Follows immutability pattern - all updates return new instances.
 */
export class Subtask {
  constructor(
    public readonly id: string,
    public readonly taskId: string,
    public readonly title: string,
    public readonly completedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * Validates subtask invariants
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("Subtask id is required");
    }

    if (!this.taskId || this.taskId.trim().length === 0) {
      throw new Error("Subtask taskId is required");
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new Error("Subtask title cannot be empty");
    }

    if (this.title.length > 500) {
      throw new Error("Subtask title cannot exceed 500 characters");
    }

    if (this.createdAt > this.updatedAt) {
      throw new Error("updatedAt cannot be before createdAt");
    }

    if (this.completedAt && this.completedAt < this.createdAt) {
      throw new Error("completedAt cannot be before createdAt");
    }
  }

  /**
   * Creates a new Subtask
   */
  static create(taskId: string, title: string): Subtask {
    const now = new Date();
    const id = randomUUID();

    return new Subtask(
      id,
      taskId,
      title.trim(),
      null, // Not completed yet
      now,
      now,
    );
  }

  /**
   * Rehydrates a Subtask from persistence
   */
  static fromPersistence(
    id: string,
    taskId: string,
    title: string,
    completedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ): Subtask {
    return new Subtask(id, taskId, title, completedAt, createdAt, updatedAt);
  }

  /**
   * Updates the subtask title
   */
  updateTitle(newTitle: string): Subtask {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new Error("Subtask title cannot be empty");
    }

    if (newTitle.length > 500) {
      throw new Error("Subtask title cannot exceed 500 characters");
    }

    return new Subtask(
      this.id,
      this.taskId,
      newTitle.trim(),
      this.completedAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Marks the subtask as completed
   */
  markAsCompleted(): Subtask {
    if (this.isCompleted()) {
      return this; // Already completed
    }

    return new Subtask(
      this.id,
      this.taskId,
      this.title,
      new Date(),
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Marks the subtask as incomplete
   */
  markAsIncomplete(): Subtask {
    if (!this.isCompleted()) {
      return this; // Already incomplete
    }

    return new Subtask(
      this.id,
      this.taskId,
      this.title,
      null,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Toggles the completion status
   */
  toggle(): Subtask {
    return this.isCompleted()
      ? this.markAsIncomplete()
      : this.markAsCompleted();
  }

  /**
   * Checks if the subtask is completed
   */
  isCompleted(): boolean {
    return this.completedAt !== null;
  }

  /**
   * Returns a plain object representation for persistence
   */
  toPersistence(): {
    id: string;
    taskId: string;
    title: string;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      taskId: this.taskId,
      title: this.title,
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
      taskId: this.taskId,
      title: this.title,
      completedAt: this.completedAt?.toISOString() ?? null,
      isCompleted: this.isCompleted(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Creates a copy of the subtask
   */
  clone(): Subtask {
    return new Subtask(
      this.id,
      this.taskId,
      this.title,
      this.completedAt,
      this.createdAt,
      this.updatedAt,
    );
  }
}
