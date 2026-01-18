import { ArousalLevel } from "@workspace/domain/entities/arousal-entry.entity";
import { TimerConfiguration } from "@workspace/domain/value-objects/timer-configuration.vo";

/**
 * Recommends a work–rest rhythm based on arousal.
 * Does NOT control execution — only suggests configuration.
 */
export class TimerRecommenderService {
  recommendConfiguration(params: {
    arousal?: ArousalLevel;
    // currentHour?: number;
  }): TimerConfiguration {
    const { arousal } = params;

    // Defaults (classic pomodoro)
    let workDuration = 25;
    let shortBreakDuration = 5;
    let longBreakDuration = 15;
    let sessionsUntilLongBreak = 4;

    /** Arousal-based adjustment */
    switch (arousal) {
      case "very_low":
        workDuration = 10;
        shortBreakDuration = 10;
        longBreakDuration = 20;
        sessionsUntilLongBreak = 1;
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
        break;

      case "overloaded":
        workDuration = 5;
        shortBreakDuration = 10;
        longBreakDuration = 30;
        sessionsUntilLongBreak = 1;
        break;

      default:
        // Unknown arousal → conservative default
        workDuration = 25;
        shortBreakDuration = 5;
        longBreakDuration = 15;
        sessionsUntilLongBreak = 4;
    }

    /** Time-of-day safety adjustments */
    // if (currentHour !== undefined) {
    //   // Late night / early morning
    //   if (currentHour >= 22 || currentHour <= 6) {
    //     workDuration = Math.min(workDuration, 15);
    //     shortBreakDuration = Math.max(shortBreakDuration, 8);
    //   }
    //
    //   // Post-lunch dip
    //   if (currentHour >= 13 && currentHour <= 15) {
    //     workDuration = Math.min(workDuration, 20);
    //     shortBreakDuration = Math.max(shortBreakDuration, 8);
    //   }
    // }

    return {
      workDuration,
      shortBreakDuration,
      longBreakDuration,
      sessionsUntilLongBreak,
    };
  }
}
