import { z } from "zod";
import { WorkTypeSchema } from "@workspace/domain/entities/task.entity";

/**
 * Represents learned arousal preferences for a user.
 * This helps Mora understand what arousal levels work best for different task types.
 */

const TaskTypeOffsetsSchema = z.record(
  WorkTypeSchema,
  z.number().min(-0.3).max(0.3),
);

const UserCognitivePreferencesBaseSchema = z.object({
  userId: z.string().uuid(),

  // Center of the user's optimal arousal zone (default: 0.6)
  optimalArousalCenter: z.number().min(0.1).max(0.9).default(0.5),

  // How wide is their optimal zone? (default: 0.2 = ±0.1)
  arousalSpread: z.number().min(0.1).max(0.3).default(0.2),

  // Learned offsets for different task types
  // e.g., { "deep": -0.1, "creative": 0.05, "repetitive": -0.05, "light": 0.1 }
  taskTypeOffsets: TaskTypeOffsetsSchema.default({
    deep: 0,
    creative: 0,
    repetitive: 0,
    light: 0,
  }),

  // Confidence in these preferences (0-1, grows with data)
  confidence: z.number().min(0).max(1).default(0),

  updatedAt: z.date(),
});

export const UserCognitivePreferencesSchema =
  UserCognitivePreferencesBaseSchema;

export type UserCognitivePreferences = z.infer<
  typeof UserCognitivePreferencesSchema
>;

export const CreateUserCognitivePreferencesSchema =
  UserCognitivePreferencesBaseSchema.omit({
    updatedAt: true,
  });

export class UserCognitivePreferencesEntity {
  private props: UserCognitivePreferences;

  private constructor(props: UserCognitivePreferences) {
    this.props = UserCognitivePreferencesSchema.parse(props);
  }

  /**
   * Create default preferences for a new user
   */
  static create(input: unknown): UserCognitivePreferencesEntity {
    const data = CreateUserCognitivePreferencesSchema.parse(input);

    return new UserCognitivePreferencesEntity({
      ...data,
      updatedAt: new Date(),
    });
  }

  /**
   * Rehydrate from persistence
   */
  static fromPersistence(input: unknown): UserCognitivePreferencesEntity {
    const data = UserCognitivePreferencesSchema.parse(input);
    return new UserCognitivePreferencesEntity(data);
  }

  /** Getters */
  get userId(): string {
    return this.props.userId;
  }

  get optimalArousalCenter(): number {
    return this.props.optimalArousalCenter;
  }

  get arousalSpread(): number {
    return this.props.arousalSpread;
  }

  get taskTypeOffsets(): Record<string, number> {
    return this.props.taskTypeOffsets;
  }

  get confidence(): number {
    return this.props.confidence;
  }

  /**
   * Get optimal arousal range for a specific task type
   */
  getOptimalRangeForTask(taskType: keyof typeof this.props.taskTypeOffsets): {
    min: number;
    max: number;
    center: number;
  } {
    const offset = this.props.taskTypeOffsets[taskType] || 0;
    const center = this.props.optimalArousalCenter + offset;
    const halfSpread = this.props.arousalSpread / 2;

    return {
      min: Math.max(0.1, center - halfSpread),
      max: Math.min(0.9, center + halfSpread),
      center,
    };
  }

  /**
   * Update preferences based on session feedback
   */
  updateFromSessionFeedback(
    taskType: keyof typeof this.props.taskTypeOffsets,
    arousal: number,
    effectiveness: number, // range [0, 1]
  ): void {
    const learningRate = 0.1;
    const effectiveThreshold = 0.7;

    // Simple learning: if effectiveness > 0.7, shift optimal toward this arousal
    if (effectiveness >= effectiveThreshold) {
      const currentOffset = this.props.taskTypeOffsets[taskType] || 0;
      const targetOffset = arousal - this.props.optimalArousalCenter;

      // Gradual shift (learning rate: 0.1)
      const newOffset =
        currentOffset + learningRate * (targetOffset - currentOffset);

      this.props.taskTypeOffsets[taskType] = Math.max(
        -0.3,
        Math.min(0.3, newOffset),
      );

      // Increase confidence slightly
      this.props.confidence = Math.min(1, this.props.confidence + 0.05);
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Adjust center based on overall pattern
   */
  recalibrate(params: { newCenter?: number; newSpread?: number }): void {
    if (params.newCenter) {
      this.props.optimalArousalCenter = Math.max(
        0.1,
        Math.min(0.9, params.newCenter),
      );
    }

    if (params.newSpread) {
      this.props.arousalSpread = Math.max(0.1, Math.min(0.4, params.newSpread));
    }

    this.props.updatedAt = new Date();
  }

  /** Serialize */
  toJSON(): UserCognitivePreferences {
    return { ...this.props };
  }
}
