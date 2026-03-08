import { Duration } from "../value-objects/duration";

export class TimerSession {
  constructor(
    public readonly completedFocusSessions: number = 0,
    public readonly totalFocusTime: Duration = Duration.fromSeconds(0),
    private readonly startTime: Date | null = null,
  ) {}

  /**
   * Start a new session
   */
  start(): TimerSession {
    return new TimerSession(
      this.completedFocusSessions,
      this.totalFocusTime,
      new Date(),
    );
  }

  /**
   * Complete a focus session
   */
  completeFocus(duration: Duration): TimerSession {
    return new TimerSession(
      this.completedFocusSessions + 1,
      Duration.fromSeconds(
        this.totalFocusTime.toSeconds() + duration.toSeconds(),
      ),
      null,
    );
  }

  /**
   * Reset session
   */
  reset(): TimerSession {
    return new TimerSession(0, Duration.fromSeconds(0), null);
  }

  /**
   * Should take long break?
   */
  shouldTakeLongBreak(interval: number): boolean {
    return (
      this.completedFocusSessions > 0 &&
      this.completedFocusSessions % interval === 0
    );
  }

  isActive(): boolean {
    return this.startTime !== null;
  }

  toJSON() {
    return {
      completedFocusSessions: this.completedFocusSessions,
      totalFocusTime: this.totalFocusTime.toSeconds(),
      startTime: this.startTime?.toISOString() ?? null,
    };
  }

  // static fromJSON(json: any): TimerSession {
  //   return new TimerSession(
  //     json.completedFocusSessions,
  //     Duration.fromSeconds(json.totalFocusTime),
  //     json.startTime ? new Date(json.startTime) : null,
  //   );
  // }
}
