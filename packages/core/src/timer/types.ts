/**
 * Available timer modes
 */
export type TimerMode = "pomodoro" | "stopwatch";

/**
 * Timer execution status
 */
export type TimerStatus = "idle" | "running" | "paused" | "completed";

/**
 * Pomodoro phase types
 */
export type PomodoroPhase = "focus" | "short_break" | "long_break";

/**
 * Pomodoro-specific state
 */
export type PomodoroState = {
  phase: PomodoroPhase;
  session: number;
  completedSessions: number;
};

/**
 * Main timer state
 * @property mode - Current timer mode
 * @property status - Current execution status
 * @property currentTime - Remaining/elapsed time in seconds
 * @property totalTime - Total duration for current phase in seconds
 * @property startTime - Timestamp when timer was started
 * @property pausedTime - Accumulated paused time in seconds
 * @property progress - Progress percentage (0-100)
 * @property pomodoro - Pomodoro-specific state (only when mode is pomodoro)
 */
export type TimerState = {
  mode: TimerMode;
  status: TimerStatus;

  // Auto-transition settings
  autoWork: boolean;
  autoBreak: boolean;

  // Time tracking (in seconds)
  currentTime: number;
  totalTime: number;
  startTime: number;
  pausedTime: number;

  // Mode-specific state
  pomodoro: PomodoroState | null;
};

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error for timer operations
 */
export class TimerError extends Error {
  constructor(
    message: string,
    public code: TimerErrorCode,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "TimerError";
  }
}

/**
 * Error codes for timer operations
 */
export const TimerErrorCode = {
  INVALID_CONFIG: "INVALID_CONFIG",
  INVALID_STATE: "INVALID_STATE",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  STORAGE_ERROR: "STORAGE_ERROR",
} as const;

export type TimerErrorCode = keyof typeof TimerErrorCode;
