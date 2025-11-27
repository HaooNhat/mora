import {
  TimerEvent,
  TimerMode,
  TimerStatus,
  PomodoroPhase,
  TimerConfig,
  TimerConfigSchema,
  TimerState,
  PomodoroConfig,
  PomodoroState,
} from "./schema.js";

/**
 * Event callback payload
 */
export interface TimerEventPayload {
  event: TimerEvent;
  timestamp: Date;
  mode: TimerMode;
  status: TimerStatus;
  currentTime: number;
  phase?: PomodoroPhase;
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default timer configuration
 */
export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  pomodoro: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  },
  stopwatch: {
    maxDuration: 120,
  },
};

/**
 * Preset pomodoro configurations
 */
export const POMODORO_PRESETS = {
  mini: {
    workDuration: 15,
    shortBreakDuration: 3,
    longBreakDuration: 10,
    sessionsUntilLongBreak: 4,
  },
  classic: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  },
  extended: {
    workDuration: 50,
    shortBreakDuration: 10,
    longBreakDuration: 30,
    sessionsUntilLongBreak: 4,
  },
  "52-17": {
    workDuration: 52,
    shortBreakDuration: 17,
    longBreakDuration: 17,
    sessionsUntilLongBreak: 4,
  },
  "90-30": {
    workDuration: 90,
    shortBreakDuration: 30,
    longBreakDuration: 45,
    sessionsUntilLongBreak: 2,
  },
} as const;

export type PomodoroPreset = keyof typeof POMODORO_PRESETS;

// ============================================================================
// Display Information
// ============================================================================

/**
 * Display metadata for each timer mode
 */
export interface TimerDisplayInfo {
  icon: string;
  name: string;
  description: string;
  color: string;
}

export const TIMER_DISPLAY_INFO: Record<TimerMode, TimerDisplayInfo> = {
  pomodoro: {
    icon: "🍅",
    name: "Pomodoro",
    description: "Work + break cycles",
    color: "rgb(239, 68, 68)", // red-500
  },
  stopwatch: {
    icon: "⏱️",
    name: "Stopwatch",
    description: "Count up from zero",
    color: "rgb(34, 197, 94)", // green-500
  },
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates and returns a safe timer configuration
 * @param config - Partial configuration to validate
 * @returns Validated complete configuration
 */
export function validateTimerConfig(config: Partial<TimerConfig>): TimerConfig {
  return TimerConfigSchema.parse({ ...DEFAULT_TIMER_CONFIG, ...config });
}

/**
 * Creates initial timer state for a given mode
 * @param mode - Timer mode to initialize
 * @param config - Timer configuration
 * @returns Initial state for the specified mode
 */
export function createInitialTimerState(
  mode: TimerMode = "pomodoro",
  config: TimerConfig = DEFAULT_TIMER_CONFIG,
): TimerState {
  const baseState: Omit<TimerState, "currentTime" | "totalTime"> = {
    mode,
    status: "idle",
    autoWork: false,
    autoBreak: false,
    startTime: 0,
    pausedTime: 0,
    pomodoro: null,
  };

  switch (mode) {
    case "pomodoro": {
      const duration = config.pomodoro.workDuration * 60;
      return {
        ...baseState,
        currentTime: duration,
        totalTime: duration,
        pomodoro: {
          phase: "focus",
          session: 1,
          completedSessions: 0,
        },
      };
    }

    case "stopwatch":
      return {
        ...baseState,
        currentTime: 0,
        totalTime: 0,
      };

    default: {
      // Type-safe exhaustive check
      const _exhaustive: never = mode;
      throw new Error(`Unknown timer mode: ${_exhaustive}`);
    }
  }
}

/**
 * Formats seconds into human-readable time
 * @param seconds - Time in seconds
 * @param format - Output format ('HH:MM:SS' | 'MM:SS' | 'compact')
 * @returns Formatted time string
 */
export function formatTime(
  seconds: number,
  format: "HH:MM:SS" | "MM:SS" | "compact" = "MM:SS",
): string {
  const s = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  switch (format) {
    case "HH:MM:SS":
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;

    case "MM:SS":
      return hours > 0
        ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
        : `${pad(minutes)}:${pad(secs)}`;

    case "compact":
      if (hours > 0) return `${hours}h ${minutes}m`;
      if (minutes > 0) return `${minutes}m ${secs}s`;
      return `${secs}s`;

    default: {
      const _exhaustive: never = format;
      throw new Error(`Unknown format: ${_exhaustive}`);
    }
  }
}

/**
 * Calculates progress percentage for current timer state
 * @param state - Current timer state
 * @returns Progress as percentage (0-100)
 */
export function calculateProgress(state: TimerState): number {
  if (state.mode === "stopwatch") {
    return 0; // Stopwatch doesn't have progress
  }

  if (state.totalTime === 0) {
    return 0;
  }

  const elapsed = state.totalTime - state.currentTime;
  return Math.min(100, Math.max(0, (elapsed / state.totalTime) * 100));
}

/**
 * Gets the duration for a specific pomodoro phase
 * @param phase - Pomodoro phase
 * @param config - Pomodoro configuration
 * @returns Duration in seconds
 */
export function getPhaseDuration(
  phase: PomodoroPhase,
  config: PomodoroConfig,
): number {
  switch (phase) {
    case "focus":
      return config.workDuration * 60;
    case "short_break":
      return config.shortBreakDuration * 60;
    case "long_break":
      return config.longBreakDuration * 60;
    default: {
      const _exhaustive: never = phase;
      throw new Error(`Unknown phase: ${_exhaustive}`);
    }
  }
}

/**
 * Type guard to check if timer is in pomodoro mode
 */
export function isPomodoroMode(state: TimerState): state is TimerState & {
  mode: "pomodoro";
  pomodoro: PomodoroState;
} {
  return state.mode === "pomodoro" && state.pomodoro !== undefined;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error for timer operations
 */
export class TimerError extends Error {
  constructor(
    message: string,
    public code: string,
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

export type TimerErrorCode =
  (typeof TimerErrorCode)[keyof typeof TimerErrorCode];
