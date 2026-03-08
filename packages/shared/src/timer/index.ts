// // ============================================================================
// // Domain Aggregates & Entities
// // ============================================================================
// export { Timer } from "./Timer.js";
//
// // ============================================================================
// // Domain Events
// // ============================================================================
// export type { DomainEvent } from "./timer.events.js";
// export {
//   TimerStartedEvent,
//   TimerPausedEvent,
//   TimerResetEvent,
//   TimerCompletedEvent,
//   TimerTickedEvent,
//   PhaseTransitionedEvent,
// } from "./timer.events.js";
//
// // ============================================================================
// // Domain Services
// // ============================================================================
// export { formatTime, parseTimeString } from "./TimerFormatter.js";
//
// // ============================================================================
// // Value Objects & Configuration
// // ============================================================================
// export { DEFAULT_TIMER_CONFIG, POMODORO_PRESETS } from "./constants.js";
// export type { PomodoroPreset } from "./constants.js";
//
// export {
//   PomodoroConfigSchema,
//   StopwatchConfigSchema,
//   TimerConfigSchema,
// } from "./schema.js";
// export type { PomodoroConfig, StopwatchConfig, TimerConfig } from "./schema.js";
//
// // ============================================================================
// // Types & Errors
// // ============================================================================
// export { TimerError, TimerErrorCodes } from "./types.js";
// export type {
//   PomodoroPhase,
//   PomodoroState,
//   TimerErrorCode,
//   TimerMode,
//   TimerState,
//   TimerStatus,
// } from "./types.js";
//
// // ============================================================================
// // Legacy Engine Functions (Deprecated - use Timer aggregate instead)
// // ============================================================================
// /**
//  * @deprecated Use Timer aggregate methods instead
//  * These functions are kept for backward compatibility during migration
//  */
// export {
//   calculateProgress,
//   createInitialTimerState,
//   getNextPomodoroPhase,
//   isPomodoroMode,
//   pauseTimer,
//   resetTimer,
//   skipPomodoroPhase,
//   startTimer,
//   tickTimer,
//   transitionPomodoroPhase,
//   validateTimerConfig,
// } from "./engine.js";
