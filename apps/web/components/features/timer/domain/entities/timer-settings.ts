import { Duration } from "../value-objects/duration";
import { PomodoroPhase } from "../value-objects/timer-pomodoro-phase";

export class TimerSettings {
  constructor(
    public readonly focusDuration: Duration,
    public readonly shortBreakDuration: Duration,
    public readonly longBreakDuration: Duration,
    public readonly longBreakInterval: number,
    public readonly autoBreaks: boolean,
    public readonly autoFocus: boolean,
  ) {
    if (longBreakInterval < 1) {
      throw new Error("Long break interval must be at least 1");
    }
  }

  static createDefault(): TimerSettings {
    return new TimerSettings(
      Duration.fromMinutes(25),
      Duration.fromMinutes(5),
      Duration.fromMinutes(15),
      4,
      false,
      false,
    );
  }

  static fromPersistance({
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    longBreakInterval,
    autoBreaks,
    autoFocus,
  }: {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    longBreakInterval: number;
    autoBreaks: boolean;
    autoFocus: boolean;
  }): TimerSettings {
    return new TimerSettings(
      Duration.fromMinutes(focusDuration),
      Duration.fromMinutes(shortBreakDuration),
      Duration.fromMinutes(longBreakDuration),
      longBreakInterval,
      autoBreaks,
      autoFocus,
    );
  }

  getDurationFor(phase: PomodoroPhase): Duration {
    if (phase.equals(PomodoroPhase.Focus)) return this.focusDuration;
    if (phase.equals(PomodoroPhase.ShortBreak)) return this.shortBreakDuration;
    return this.longBreakDuration;
  }

  /**
   * Should auto-start for this mode?
   */
  shouldAutoStart(mode: PomodoroPhase): boolean {
    return mode.isFocus() ? this.autoFocus : this.autoBreaks;
  }

  /**
   * Create new settings with updates (immutable)
   */
  update(
    updates: Partial<{
      focusDuration: Duration;
      shortBreakDuration: Duration;
      longBreakDuration: Duration;
      longBreakInterval: number;
      autoStartBreaks: boolean;
      autoStartFocus: boolean;
    }>,
  ): TimerSettings {
    return new TimerSettings(
      updates.focusDuration ?? this.focusDuration,
      updates.shortBreakDuration ?? this.shortBreakDuration,
      updates.longBreakDuration ?? this.longBreakDuration,
      updates.longBreakInterval ?? this.longBreakInterval,
      updates.autoStartBreaks ?? this.autoBreaks,
      updates.autoStartFocus ?? this.autoFocus,
    );
  }

  /**
   * Serialize for persistence
   */
  toJSON() {
    return {
      focusDuration: this.focusDuration.toSeconds(),
      shortBreakDuration: this.shortBreakDuration.toSeconds(),
      longBreakDuration: this.longBreakDuration.toSeconds(),
      longBreakInterval: this.longBreakInterval,
      autoStartBreaks: this.autoBreaks,
      autoStartFocus: this.autoFocus,
    };
  }
}
