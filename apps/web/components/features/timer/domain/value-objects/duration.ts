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
