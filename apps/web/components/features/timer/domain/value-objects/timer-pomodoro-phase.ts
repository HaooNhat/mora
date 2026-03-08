export class PomodoroPhase {
  private constructor(
    private readonly value: "focus" | "shortBreak" | "longBreak",
  ) {}

  static Focus = new PomodoroPhase("focus");
  static ShortBreak = new PomodoroPhase("shortBreak");
  static LongBreak = new PomodoroPhase("longBreak");

  isFocus(): boolean {
    return this.value === "focus";
  }

  isBreak(): boolean {
    return this.value === "shortBreak" || this.value === "longBreak";
  }

  toString(): string {
    switch (this.value) {
      case "focus":
        return "Focus Time";
      case "shortBreak":
        return "Short Break";
      case "longBreak":
        return "Long Break";
    }
  }

  toJSON(): string {
    return this.value;
  }

  static fromString(value: string): PomodoroPhase {
    switch (value) {
      case "focus":
        return PomodoroPhase.Focus;
      case "shortBreak":
        return PomodoroPhase.ShortBreak;
      case "longBreak":
        return PomodoroPhase.LongBreak;
      default:
        throw new Error(`Invalid timer mode: ${value}`);
    }
  }

  equals(other: PomodoroPhase): boolean {
    return this.value === other.value;
  }
}
