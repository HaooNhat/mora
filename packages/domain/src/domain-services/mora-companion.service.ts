import {
  ArousalLevel,
  categorizeArousal,
} from "@workspace/domain/entities/arousal-entry.entity";
import { Task, WorkType } from "@workspace/domain/entities/task.entity";
import { UserCognitivePreferences } from "@workspace/domain/entities/user-cognitive-preferences.entity";
import { TimerConfiguration } from "@workspace/domain/value-objects/timer-configuration.vo";

type ArousalCategory = "very_low" | "low" | "optimal" | "high" | "overloaded";
type Compatibility = "safe" | "limited" | "blocked";

export interface TaskSuggestion {
  task: Task;
  reason: string;
  confidence: number; // 0-100
  compatibilityLevel: Compatibility;
}

export interface TimerSuggestion {
  configuration: TimerConfiguration;
  reason: string;
  warnings?: string[];
}

/**
 * Mora Companion - AI-powered task and timer recommendations
 * Based on current arousal level and learned preferences
 */
export class MoraCompanionService {
  /**
   * Compatibility matrix: arousal category × work type → compatibility
   */
  private readonly COMPATIBILITY_MATRIX: Record<
    ArousalCategory,
    Record<WorkType, Compatibility>
  > = {
    very_low: {
      deep: "blocked",
      creative: "blocked",
      repetitive: "limited",
      light: "safe",
    },
    low: {
      deep: "limited",
      creative: "limited",
      repetitive: "safe",
      light: "safe",
    },
    optimal: {
      deep: "safe",
      creative: "safe",
      repetitive: "safe",
      light: "limited",
    },
    high: {
      deep: "limited",
      creative: "blocked",
      repetitive: "safe",
      light: "limited",
    },
    overloaded: {
      deep: "blocked",
      creative: "blocked",
      repetitive: "limited",
      light: "blocked",
    },
  };

  /**
   * Suggest the best task based on current arousal
   */
  suggestTask(params: {
    tasks: Task[];
    currentArousal: ArousalLevel;
    userPreferences?: UserCognitivePreferences;
    now?: Date;
  }): TaskSuggestion | null {
    const { tasks, currentArousal, userPreferences, now = new Date() } = params;

    // Filter available tasks
    const candidates = tasks.filter(
      (t) => t.status !== "done" && !t.abandonedAt && !t.deferredUntil,
    );

    if (candidates.length === 0) return null;

    // Get arousal category
    const arousalCategory = categorizeArousal(currentArousal);

    // Apply compatibility matrix
    const compatible = candidates
      .map((task) => ({
        task,
        compatibility: this.getCompatibility(arousalCategory, task.workType),
      }))
      .filter((x) => x.compatibility !== "blocked");

    if (compatible.length === 0) {
      return null;
    }

    // Score tasks
    const scored = compatible.map(({ task, compatibility }) => {
      let score = 0;
      const reasons: string[] = [];

      // Base score from compatibility
      if (compatibility === "safe") {
        score += 40;
        reasons.push("Perfect match for your current state");
      } else {
        score += 20;
        reasons.push("Doable with some effort");
      }

      // Use learned preferences if available
      if (userPreferences && userPreferences.confidence > 0.3) {
        const optimalRange =
          userPreferences.taskTypeOffsets[task.workType] || 0;
        const distance = Math.abs(
          currentArousal -
            (userPreferences.optimalArousalCenter + optimalRange),
        );

        // Bonus for being in learned optimal zone
        if (distance < userPreferences.arousalSpread / 2) {
          score += 20;
          reasons.push("Matches your learned preferences");
        }
      }

      // Eisenhower priority
      if (task.isUrgent && task.isImportant) {
        score += 20;
        reasons.push("Urgent and important");
      } else if (task.isUrgent) {
        score += 15;
        reasons.push("Urgent");
      } else if (task.isImportant) {
        score += 10;
        reasons.push("Important");
      }

      // Deadline urgency
      if (task.deadline) {
        const hoursUntilDeadline =
          (task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilDeadline <= 24) {
          score += 15;
          reasons.push("Due within 24 hours");
        } else if (hoursUntilDeadline <= 72) {
          score += 8;
          reasons.push("Due soon");
        }
      }

      // Duration consideration
      if (task.estimatedDuration) {
        if (compatibility === "limited" && task.estimatedDuration > 30) {
          score -= 10;
          reasons.push("Might be too long for current state");
        } else if (task.estimatedDuration <= 25) {
          score += 5;
          reasons.push("Quick task");
        }
      }

      return {
        task,
        score,
        reason: reasons.join(". "),
        compatibility,
      };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0]!;

    return {
      task: best.task,
      reason: best.reason,
      confidence: this.normalizeConfidence(best.score),
      compatibilityLevel: best.compatibility,
    };
  }

  /**
   * Suggest timer configuration based on arousal
   */
  suggestTimer(params: {
    currentArousal: ArousalLevel;
    userPreferences?: UserCognitivePreferences;
  }): TimerSuggestion {
    const { currentArousal, userPreferences } = params;
    const category = categorizeArousal(currentArousal);

    let workDuration = 25;
    let shortBreakDuration = 5;
    let longBreakDuration = 15;
    let sessionsUntilLongBreak = 4;
    const warnings: string[] = [];

    // Base configuration by arousal
    switch (category) {
      case "very_low":
        workDuration = 10;
        shortBreakDuration = 10;
        longBreakDuration = 20;
        sessionsUntilLongBreak = 1;
        warnings.push(
          "Very low arousal detected. Consider taking a longer break or doing light activity first.",
        );
        break;

      case "low":
        workDuration = 15;
        shortBreakDuration = 8;
        longBreakDuration = 20;
        sessionsUntilLongBreak = 2;
        break;

      case "optimal":
        workDuration = 25;
        shortBreakDuration = 5;
        longBreakDuration = 15;
        sessionsUntilLongBreak = 4;
        break;

      case "high":
        workDuration = 20;
        shortBreakDuration = 8;
        longBreakDuration = 20;
        sessionsUntilLongBreak = 2;
        warnings.push(
          "High arousal detected. Consider calming activities during breaks.",
        );
        break;

      case "overloaded":
        workDuration = 5;
        shortBreakDuration = 10;
        longBreakDuration = 30;
        sessionsUntilLongBreak = 1;
        warnings.push(
          "You seem overloaded. Consider taking a proper break before working.",
        );
        break;
    }

    // Adjust based on learned preferences
    if (userPreferences && userPreferences.confidence > 0.5) {
      const spread = userPreferences.arousalSpread;

      // If user has narrow optimal zone, suggest shorter sessions
      if (spread < 0.15) {
        workDuration = Math.max(10, workDuration - 5);
      }
    }

    const reason = this.getTimerReason(category, workDuration);

    return {
      configuration: {
        workDuration,
        shortBreakDuration,
        longBreakDuration,
        sessionsUntilLongBreak,
      },
      reason,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get compatibility level
   */
  private getCompatibility(
    arousalCategory: ArousalCategory,
    workType: WorkType,
  ): Compatibility {
    return this.COMPATIBILITY_MATRIX[arousalCategory][workType];
  }

  /**
   * Normalize score to 0-100 confidence
   */
  private normalizeConfidence(score: number): number {
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate explanation for timer suggestion
   */
  private getTimerReason(category: ArousalCategory, duration: number): string {
    const reasons: Record<ArousalCategory, string> = {
      very_low: `Your arousal is very low. Starting with ${duration}-minute sessions to ease into work.`,
      low: `Your arousal is below optimal. Using ${duration}-minute sessions with longer breaks.`,
      optimal: `You're in the zone! Standard ${duration}-minute pomodoros will work great.`,
      high: `Your arousal is elevated. Slightly shorter ${duration}-minute sessions with calming breaks.`,
      overloaded: `You seem overwhelmed. Very short ${duration}-minute bursts with substantial recovery time.`,
    };

    return reasons[category];
  }
}
