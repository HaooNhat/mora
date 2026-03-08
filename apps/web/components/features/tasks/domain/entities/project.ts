/**
 * Project Entity
 *
 * Represents a collection of related tasks.
 * Acts as a container and organizational unit for tasks.
 * Follows immutability pattern - all updates return new instances.
 */
export class Project {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly color: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * Validates project invariants
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("Project id is required");
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error("Project userId is required");
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new Error("Project name cannot be empty");
    }

    if (this.name.length > 100) {
      throw new Error("Project name cannot exceed 100 characters");
    }

    if (this.description && this.description.length > 1000) {
      throw new Error("Project description cannot exceed 1000 characters");
    }

    if (this.color && !this.isValidColor(this.color)) {
      throw new Error("Project color must be a valid hex color code");
    }

    if (this.createdAt > this.updatedAt) {
      throw new Error("updatedAt cannot be before createdAt");
    }
  }

  /**
   * Validates hex color format
   */
  private isValidColor(color: string): boolean {
    // Allow empty string or valid hex color (#RGB or #RRGGBB)
    if (!color) return true;
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * Creates a new Project
   */
  static create(
    userId: string,
    name: string,
    options: {
      description?: string;
      color?: string;
    } = {},
  ): Project {
    const now = new Date();
    const id = crypto.randomUUID();

    return new Project(
      id,
      userId,
      name.trim(),
      options.description?.trim() ?? "",
      options.color ?? "#3B82F6", // Default blue
      now,
      now,
    );
  }

  /**
   * Rehydrates a Project from persistence
   */
  static fromPersistence(
    id: string,
    userId: string,
    name: string,
    description: string,
    color: string,
    createdAt: Date,
    updatedAt: Date,
  ): Project {
    return new Project(
      id,
      userId,
      name,
      description,
      color,
      createdAt,
      updatedAt,
    );
  }

  /**
   * Updates project properties
   */
  update(updates: {
    name?: string;
    description?: string;
    color?: string;
  }): Project {
    return new Project(
      this.id,
      this.userId,
      updates.name?.trim() ?? this.name,
      updates.description?.trim() ?? this.description,
      updates.color ?? this.color,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Updates the project name
   */
  updateName(name: string): Project {
    return this.update({ name });
  }

  /**
   * Updates the project description
   */
  updateDescription(description: string): Project {
    return this.update({ description });
  }

  /**
   * Updates the project color
   */
  updateColor(color: string): Project {
    return this.update({ color });
  }

  /**
   * Returns a plain object representation for persistence
   */
  toPersistence(): {
    id: string;
    userId: string;
    name: string;
    description: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      description: this.description,
      color: this.color,
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
      userId: this.userId,
      name: this.name,
      description: this.description,
      color: this.color,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  // TODO: consider changing to duplicate
  /**
   * Creates a copy of the project
   */
  // clone(): Project {
  //   return new Project(
  //     this.id,
  //     this.userId,
  //     this.name,
  //     this.description,
  //     this.color,
  //     this.createdAt,
  //     this.updatedAt,
  //   );
  // }
}
