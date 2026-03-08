export type TimerMode = "pomodoro" | "stopwatch";
export type PomodoroPhase = "focus" | "shortBreak" | "longBreak";
export type TimerStatus = "idle" | "running" | "paused";

export class Duration {
  private constructor(private readonly seconds: number) {}

  static fromSeconds(seconds: number): Duration {
    return new Duration(Math.max(0, seconds));
  }

  static fromMinutes(minutes: number): Duration {
    return new Duration(minutes * 60);
  }

  toSeconds(): number {
    return this.seconds;
  }

  format(): string {
    const totalMinutes = Math.floor(this.seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const secs = this.seconds % 60;

    const mm = minutes.toString().padStart(2, "0");
    const ss = secs.toString().padStart(2, "0");

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  }

  subtract(seconds: number): Duration {
    return Duration.fromSeconds(this.seconds - seconds);
  }

  add(seconds: number): Duration {
    return Duration.fromSeconds(this.seconds + seconds);
  }

  isZero(): boolean {
    return this.seconds === 0;
  }

  progressFrom(total: Duration): number {
    if (total.seconds === 0) return 0;
    return ((total.seconds - this.seconds) / total.seconds) * 100;
  }
}

export interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoBreaks: boolean;
  autoFocus: boolean;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 2,
  autoBreaks: false,
  autoFocus: false,
};

// =============================================================================
// Abstract Timer Base
// =============================================================================

export type Timer = PomodoroTimer | StopwatchTimer;

export abstract class TimerBase {
  constructor(
    public readonly mode: TimerMode,
    public readonly status: TimerStatus,
    public readonly duration: Duration,
    public readonly settings: TimerSettings,
  ) {}

  abstract start(): Timer;
  abstract pause(): Timer;
  abstract stop(): Timer;
  abstract tick(): { timer: Timer; completed: boolean };
  abstract skip(): Timer;
  abstract switchMode(): Timer;
  abstract updateSettings(settings: TimerSettings): Timer;
  abstract reset(): Timer;
  abstract getProgress(): number;

  get formattedTime(): string {
    return this.duration.format();
  }

  isRunning(): boolean {
    return this.status === "running";
  }
}

// =============================================================================
// Pomodoro Timer
// =============================================================================

export class PomodoroTimer extends TimerBase {
  constructor(
    status: TimerStatus,
    duration: Duration,
    settings: TimerSettings,
    public readonly phase: PomodoroPhase,
    public readonly completedSessions: number,
  ) {
    super("pomodoro", status, duration, settings);
  }

  static create(settings: TimerSettings = DEFAULT_SETTINGS): PomodoroTimer {
    return new PomodoroTimer(
      "idle",
      Duration.fromMinutes(settings.focusDuration),
      settings,
      "focus",
      0,
    );
  }

  start(): PomodoroTimer {
    if (this.isRunning()) return this;
    return new PomodoroTimer(
      "running",
      this.duration,
      this.settings,
      this.phase,
      this.completedSessions,
    );
  }

  pause(): PomodoroTimer {
    if (!this.isRunning()) return this;
    return new PomodoroTimer(
      "paused",
      this.duration,
      this.settings,
      this.phase,
      this.completedSessions,
    );
  }

  stop(): PomodoroTimer {
    return new PomodoroTimer(
      "idle",
      this.getDurationForPhase(this.phase),
      this.settings,
      this.phase,
      this.completedSessions,
    );
  }

  tick(): { timer: PomodoroTimer; completed: boolean } {
    if (!this.isRunning()) {
      return { timer: this, completed: false };
    }

    const newDuration = this.duration.subtract(1);

    if (newDuration.isZero()) {
      return { timer: this.complete(), completed: true };
    }

    return {
      timer: new PomodoroTimer(
        this.status,
        newDuration,
        this.settings,
        this.phase,
        this.completedSessions,
      ),
      completed: false,
    };
  }

  skip(): PomodoroTimer {
    return this.complete();
  }

  switchMode(): StopwatchTimer {
    return StopwatchTimer.create(this.settings);
  }

  updateSettings(settings: TimerSettings): PomodoroTimer {
    const duration =
      this.status === "idle"
        ? this.getDurationForPhase(this.phase, settings)
        : this.duration;

    return new PomodoroTimer(
      this.status,
      duration,
      settings,
      this.phase,
      this.completedSessions,
    );
  }

  reset(): PomodoroTimer {
    return PomodoroTimer.create(this.settings);
  }

  getProgress(): number {
    return this.duration.progressFrom(this.getDurationForPhase(this.phase));
  }

  private complete(): PomodoroTimer {
    const nextPhase = this.getNextPhase();
    const newCompleted =
      this.phase === "focus"
        ? this.completedSessions + 1
        : this.completedSessions;
    const shouldAutoStart =
      nextPhase === "focus"
        ? this.settings.autoFocus
        : this.settings.autoBreaks;

    return new PomodoroTimer(
      shouldAutoStart ? "running" : "idle",
      this.getDurationForPhase(nextPhase),
      this.settings,
      nextPhase,
      newCompleted,
    );
  }

  private getNextPhase(): PomodoroPhase {
    if (this.phase === "focus") {
      const shouldLongBreak =
        (this.completedSessions + 1) % this.settings.longBreakInterval === 0;
      return shouldLongBreak ? "longBreak" : "shortBreak";
    }
    return "focus";
  }

  private getDurationForPhase(
    phase: PomodoroPhase,
    settings: TimerSettings = this.settings,
  ): Duration {
    switch (phase) {
      case "focus":
        return Duration.fromMinutes(settings.focusDuration);
      case "shortBreak":
        return Duration.fromMinutes(settings.shortBreakDuration);
      case "longBreak":
        return Duration.fromMinutes(settings.longBreakDuration);
    }
  }
}

// =============================================================================
// Stopwatch Timer
// =============================================================================

export class StopwatchTimer extends TimerBase {
  constructor(
    status: TimerStatus,
    duration: Duration,
    settings: TimerSettings,
  ) {
    super("stopwatch", status, duration, settings);
  }

  static create(settings: TimerSettings = DEFAULT_SETTINGS): StopwatchTimer {
    return new StopwatchTimer("idle", Duration.fromSeconds(0), settings);
  }

  start(): StopwatchTimer {
    if (this.isRunning()) return this;
    return new StopwatchTimer("running", this.duration, this.settings);
  }

  pause(): StopwatchTimer {
    if (!this.isRunning()) return this;
    return new StopwatchTimer("paused", this.duration, this.settings);
  }

  stop(): StopwatchTimer {
    return new StopwatchTimer("idle", Duration.fromSeconds(0), this.settings);
  }

  tick(): { timer: StopwatchTimer; completed: boolean } {
    if (!this.isRunning()) {
      return { timer: this, completed: false };
    }

    return {
      timer: new StopwatchTimer(
        this.status,
        this.duration.add(1),
        this.settings,
      ),
      completed: false,
    };
  }

  skip(): StopwatchTimer {
    return this.stop();
  }

  switchMode(): PomodoroTimer {
    return PomodoroTimer.create(this.settings);
  }

  updateSettings(settings: TimerSettings): StopwatchTimer {
    return new StopwatchTimer(this.status, this.duration, settings);
  }

  reset(): StopwatchTimer {
    return StopwatchTimer.create(this.settings);
  }

  getProgress(): number {
    return 0;
  }
}
