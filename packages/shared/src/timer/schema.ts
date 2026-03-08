// import { z } from "zod";
//
// /**
//  * Pomodoro timer configuration
//  * @property workDuration - Work session length in minutes (1-90). Default is 25
//  * @property shortBreakDuration - Short break length in minutes (0-15). Default is 5
//  * @property longBreakDuration - Long break length in minutes (15-30). Default is 15
//  * @property sessionsUntilLongBreak - Number of work sessions before long break (1-5). Default is 4
//  */
// export const PomodoroConfigSchema = z.object({
//   workDuration: z.number().int().min(1).max(90).default(25),
//   shortBreakDuration: z.number().int().min(0).max(15).default(5),
//   longBreakDuration: z.number().int().min(15).max(30).default(15),
//   sessionsUntilLongBreak: z.number().int().min(1).max(5).default(4),
// });
// export type PomodoroConfig = z.infer<typeof PomodoroConfigSchema>;
//
// /**
//  * Stopwatch configuration
//  * @property maxDuration - Optional maximum duration in minutes (0-120)
//  */
// export const StopwatchConfigSchema = z.object({
//   maxDuration: z.number().int().min(0).max(120).optional().default(60),
// });
// export type StopwatchConfig = z.infer<typeof StopwatchConfigSchema>;
//
// /**
//  * Combined timer configuration for all modes
//  */
// export const TimerConfigSchema = z.object({
//   pomodoro: PomodoroConfigSchema,
//   stopwatch: StopwatchConfigSchema,
// });
// export type TimerConfig = z.infer<typeof TimerConfigSchema>;
