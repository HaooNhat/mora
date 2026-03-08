// // ============================================================================
// // Default Configurations
// // ============================================================================
//
// import { TimerConfig } from "./schema.js";
//
// /**
//  * Default timer configuration
//  */
// export const DEFAULT_TIMER_CONFIG: TimerConfig = {
//   pomodoro: {
//     workDuration: 25,
//     shortBreakDuration: 5,
//     longBreakDuration: 15,
//     sessionsUntilLongBreak: 4,
//   },
//   stopwatch: {
//     maxDuration: 120,
//   },
// };
//
// /**
//  * Preset pomodoro configurations
//  */
// export const POMODORO_PRESETS = {
//   mini: {
//     workDuration: 15,
//     shortBreakDuration: 3,
//     longBreakDuration: 10,
//     sessionsUntilLongBreak: 4,
//   },
//   classic: {
//     workDuration: 25,
//     shortBreakDuration: 5,
//     longBreakDuration: 15,
//     sessionsUntilLongBreak: 4,
//   },
//   extended: {
//     workDuration: 50,
//     shortBreakDuration: 10,
//     longBreakDuration: 30,
//     sessionsUntilLongBreak: 2,
//   },
//   cycle52_17: {
//     workDuration: 52,
//     shortBreakDuration: 0,
//     longBreakDuration: 17,
//     sessionsUntilLongBreak: 1,
//   },
//   cycle90_30: {
//     workDuration: 90,
//     shortBreakDuration: 0,
//     longBreakDuration: 30,
//     sessionsUntilLongBreak: 1,
//   },
// } as const;
//
// export type PomodoroPreset = keyof typeof POMODORO_PRESETS;
