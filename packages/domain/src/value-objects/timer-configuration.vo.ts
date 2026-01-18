import { z } from "zod";

export const TimerConfigurationSchema = z.object({
  workDuration: z.number().min(1).max(180), // minutes
  shortBreakDuration: z.number().min(1).max(60),
  longBreakDuration: z.number().min(1).max(120),
  sessionsUntilLongBreak: z.number().min(2).max(10),
});

export type TimerConfiguration = z.infer<typeof TimerConfigurationSchema>;

export class TimerConfigurationVO {
  private constructor(private props: TimerConfiguration) {}

  static create(props: TimerConfiguration): TimerConfigurationVO {
    const validated = TimerConfigurationSchema.parse(props);
    return new TimerConfigurationVO(validated);
  }

  get workDuration(): number {
    return this.props.workDuration;
  }

  get shortBreakDuration(): number {
    return this.props.shortBreakDuration;
  }

  get longBreakDuration(): number {
    return this.props.longBreakDuration;
  }

  get sessionsUntilLongBreak(): number {
    return this.props.sessionsUntilLongBreak;
  }

  toJSON(): TimerConfiguration {
    return { ...this.props };
  }
}
