export {
  DEFAULT_TIMER_CONFIG,
  POMODORO_PRESETS,
} from "@workspace/core/timer/constants";
export type { PomodoroPreset } from "@workspace/core/timer/constants";

export {
  calculateProgress,
  createInitialTimerState,
  formatTime,
  getNextPomodoroPhase,
  isPomodoroMode,
  pauseTimer,
  resetTimer,
  skipPomodoroPhase,
  startTimer,
  tickTimer,
  transitionPomodoroPhase,
  validateTimerConfig,
} from "@workspace/core/timer/engine";

export {
  PomodoroConfigSchema,
  StopwatchConfigSchema,
  TimerConfigSchema,
} from "@workspace/core/timer/schema";
export type {
  PomodoroConfig,
  StopwatchConfig,
  TimerConfig,
} from "@workspace/core/timer/schema";

export { TimerError, TimerErrorCodes } from "@workspace/core/timer/types";
export type {
  PomodoroPhase,
  PomodoroState,
  TimerErrorCode,
  TimerMode,
  TimerState,
  TimerStatus,
} from "@workspace/core/timer/types";
