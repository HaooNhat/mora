import { DEFAULT_TIMER_CONFIG } from "./constants.js";
import { PomodoroConfig, TimerConfig, TimerConfigSchema } from "./schema.js";
import {
  PomodoroPhase,
  PomodoroState,
  TimerMode,
  TimerState,
} from "./types.js";

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
  const basePomodoro: PomodoroState = {
    phase: "focus",
    session: 0,
    completedSessions: 0,
  };

  const baseState: Omit<TimerState, "currentTime" | "totalTime"> = {
    mode,
    status: "idle",
    autoWork: false,
    autoBreak: false,
    startTime: 0,
    pausedTime: 0,
    pomodoro: basePomodoro,
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

/**
 * Determines the next pomodoro phase based on current state
 * @param state - Current pomodoro state
 * @param config - Pomodoro configuration
 * @returns Next phase
 */
export function getNextPomodoroPhase(
  state: PomodoroState,
  config: PomodoroConfig,
): PomodoroPhase {
  if (state.phase === "focus") {
    // After focus, check if it's time for long break
    const isLongBreak = state.session % config.sessionsUntilLongBreak === 0;
    return isLongBreak ? "long_break" : "short_break";
  }

  // After any break, go back to focus
  return "focus";
}

/**
 * Advances timer by one second (tick)
 * @param state - Current timer state
 * @param config - Timer configuration
 * @returns Updated state after tick
 */
export function tickTimer(state: TimerState, config: TimerConfig): TimerState {
  if (state.status !== "running") {
    return state;
  }

  if (state.mode === "stopwatch") {
    // Stopwatch counts up
    const newTime = state.currentTime + 1;
    const maxDuration = config.stopwatch.maxDuration
      ? config.stopwatch.maxDuration * 60
      : Infinity;

    if (newTime >= maxDuration) {
      return {
        ...state,
        currentTime: maxDuration,
        status: "completed",
      };
    }

    return {
      ...state,
      currentTime: newTime,
    };
  }

  // Pomodoro counts down
  const newTime = state.currentTime - 1;

  if (newTime <= 0) {
    // Phase completed
    if (!state.pomodoro) {
      return { ...state, currentTime: 0, status: "completed" };
    }

    const shouldAutoTransition =
      (state.pomodoro.phase === "focus" && state.autoBreak) ||
      (state.pomodoro.phase !== "focus" && state.autoWork);

    if (shouldAutoTransition) {
      // Auto-transition to next phase
      return transitionPomodoroPhase(state, config.pomodoro);
    }

    // Wait for manual transition
    return {
      ...state,
      currentTime: 0,
      status: "completed",
    };
  }

  return {
    ...state,
    currentTime: newTime,
  };
}

/**
 * Transitions pomodoro to the next phase
 * @param state - Current timer state
 * @param config - Pomodoro configuration
 * @returns Updated state with next phase
 */
export function transitionPomodoroPhase(
  state: TimerState,
  config: PomodoroConfig,
): TimerState {
  if (!state.pomodoro) {
    throw new Error("Cannot transition phase: not in pomodoro mode");
  }

  const nextPhase = getNextPomodoroPhase(state.pomodoro, config);
  const duration = getPhaseDuration(nextPhase, config);

  const isCompletingFocus = state.pomodoro.phase === "focus";
  const completedSessions = isCompletingFocus
    ? state.pomodoro.completedSessions + 1
    : state.pomodoro.completedSessions;

  const session =
    nextPhase === "focus" ? state.pomodoro.session + 1 : state.pomodoro.session;

  return {
    ...state,
    currentTime: duration,
    totalTime: duration,
    status: "running",
    pomodoro: {
      phase: nextPhase,
      session,
      completedSessions,
    },
  };
}

/**
 * Starts the timer
 * @param state - Current timer state
 * @returns Updated state with timer running
 */
export function startTimer(state: TimerState): TimerState {
  if (state.status === "running") {
    return state;
  }

  const now = Date.now();

  if (state.status === "idle" || state.status === "completed") {
    return {
      ...state,
      status: "running",
      startTime: now,
      pausedTime: 0,
    };
  }

  // Resuming from pause
  return {
    ...state,
    status: "running",
  };
}

/**
 * Pauses the timer
 * @param state - Current timer state
 * @returns Updated state with timer paused
 */
export function pauseTimer(state: TimerState): TimerState {
  if (state.status !== "running") {
    return state;
  }

  return {
    ...state,
    status: "paused",
  };
}

/**
 * Resets the timer to initial state
 * @param state - Current timer state
 * @param config - Timer configuration
 * @returns Reset timer state
 */
export function resetTimer(state: TimerState, config: TimerConfig): TimerState {
  return createInitialTimerState(state.mode, config);
}

/**
 * Skips to the next pomodoro phase
 * @param state - Current timer state
 * @param config - Pomodoro configuration
 * @returns Updated state with next phase
 */
export function skipPomodoroPhase(
  state: TimerState,
  config: PomodoroConfig,
): TimerState {
  if (!state.pomodoro) {
    throw new Error("Cannot skip phase: not in pomodoro mode");
  }

  return transitionPomodoroPhase(state, config);
}
