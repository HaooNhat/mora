export class TimerMode {
  private constructor(private readonly value: "pomodoro" | "stopwatch") {}

  static Pomodoro = new TimerMode("pomodoro");
  static Stopwatch = new TimerMode("stopwatch");

  // isPomodoro(): boolean {
  //   return this.value === "pomodoro";
  // }
  //
  // isStopwatch(): boolean {
  //   return this.value === "stopwatch";
  // }
  //
  // toString(): string {
  //   switch (this.value) {
  //     case "pomodoro":
  //       return "Pomodoro";
  //     case "stopwatch":
  //       return "Stopwatch";
  //   }
  // }

  equals(other: TimerMode): boolean {
    return this.value === other.value;
  }

  toJSON(): string {
    return this.value;
  }

  static fromString(value: string): TimerMode {
    switch (value) {
      case "pomodoro":
        return TimerMode.Pomodoro;
      case "stopwatch":
        return TimerMode.Stopwatch;
      default:
        throw new Error(`Invalid timer mode: ${value}`);
    }
  }
}
