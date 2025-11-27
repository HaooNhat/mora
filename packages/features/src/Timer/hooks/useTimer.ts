import {
  type PomodoroPhase,
  type TimerConfig,
  type TimerEvent,
  type TimerEventPayload,
  type TimerMode,
  type TimerState,
  calculateProgress,
  createInitialTimerState,
  DEFAULT_TIMER_CONFIG,
  formatTime,
  getPhaseDuration,
  isPomodoroMode,
  TIMER_DISPLAY_INFO,
  TimerError,
  TimerErrorCode,
  validateTimerConfig,
} from "@workspace/types/Timer";
import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for useTimer hook
 */
interface UseTimerOptions {
  /** Initial timer configuration */
  config?: Partial<TimerConfig>;
  /** Initial timer mode */
  initialMode?: TimerMode;
  /** Callback fired when timer completes */
  onComplete?: (mode: TimerMode) => void;
  /** Callback fired when pomodoro phase changes */
  onPhaseChange?: (phase: PomodoroPhase) => void;
  /** Callback fired on each tick (every second) */
  onTick?: (state: TimerState) => void;
  /** Callback fired on any timer event */
  onEvent?: (payload: TimerEventPayload) => void;
  /** Enable persistence to localStorage */
  enablePersistence?: boolean;
  /** localStorage key for persisting state */
  persistenceKey?: string;
}

/**
 * Return type of useTimer hook
 */
export interface UseTimerReturn {
  // State
  state: TimerState;
  config: TimerConfig;

  // Computed values
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  canStart: boolean;
  canPause: boolean;
  currentTime: number;
  currentTimeFormatted: string;
  totalTimeFormatted: string;
  progress: number;
  displayInfo: (typeof TIMER_DISPLAY_INFO)[TimerMode];
  phaseDescription: string;

  // Mode-specific state
  pomodoroPhase?: PomodoroPhase;
  pomodoroSession?: number;
  pomodoroCompletedSessions?: number;

  // Actions
  start: () => void;
  pause: () => void;
  stop: () => void;
  skip: () => void;
  reset: () => void;
  switchMode: (mode: TimerMode) => void;
  updateConfig: (config: Partial<TimerConfig>) => void;

  // Error state
  error: Error | null;
  clearError: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_PREFIX = "timer";
const DEFAULT_PERSISTENCE_KEY = `${STORAGE_PREFIX}_state`;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Custom hook for managing timer state and operations
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   isRunning,
 *   currentTimeFormatted,
 *   start,
 *   pause,
 *   reset
 * } = useTimer({
 *   config: { pomodoro: { workDuration: 30 } },
 *   onComplete: (mode) => console.log(`${mode} completed!`)
 * });
 * ```
 */
export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const {
    config: userConfig,
    initialMode = "pomodoro",
    onComplete,
    onPhaseChange,
    onTick,
    onEvent,
    enablePersistence = false,
    persistenceKey = DEFAULT_PERSISTENCE_KEY,
  } = options;

  // ============================================================================
  // State
  // ============================================================================

  const [error, setError] = useState<Error | null>(null);

  // Validated configuration
  const [config, setConfig] = useState<TimerConfig>(() => {
    try {
      return validateTimerConfig(userConfig || {});
    } catch (err) {
      setError(
        new TimerError(
          "Invalid timer configuration",
          TimerErrorCode.INVALID_CONFIG,
          { config: userConfig },
        ),
      );
      console.error("Invalid timer configuration: ", err);
      return DEFAULT_TIMER_CONFIG;
    }
  });

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>(() => {
    // Try to restore from localStorage if persistence enabled
    if (enablePersistence) {
      try {
        const stored = localStorage.getItem(persistenceKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects
          if (parsed.startTime) {
            parsed.startTime = new Date(parsed.startTime);
          }
          return parsed as TimerState;
        }
      } catch (err) {
        console.warn("Failed to restore timer state from localStorage:", err);
      }
    }

    return createInitialTimerState(initialMode, config);
  });

  // ============================================================================
  // Refs
  // ============================================================================

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);

  // Store callbacks in refs to avoid re-creating interval
  const onCompleteRef = useRef(onComplete);
  const onPhaseChangeRef = useRef(onPhaseChange);
  const onTickRef = useRef(onTick);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onPhaseChangeRef.current = onPhaseChange;
    onTickRef.current = onTick;
    onEventRef.current = onEvent;
  }, [onComplete, onPhaseChange, onTick, onEvent]);

  // ============================================================================
  // Persistence
  // ============================================================================

  /**
   * Persists current state to localStorage
   */
  const persistState = useCallback(
    (state: TimerState) => {
      if (!enablePersistence) return;

      try {
        localStorage.setItem(persistenceKey, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to persist timer state:", err);
        setError(
          new TimerError(
            "Failed to save timer state",
            TimerErrorCode.STORAGE_ERROR,
            { error: err },
          ),
        );
      }
    },
    [enablePersistence, persistenceKey],
  );

  // Persist state changes
  useEffect(() => {
    persistState(timerState);
  }, [timerState, persistState]);

  // ============================================================================
  // Event Emission
  // ============================================================================

  /**
   * Emits a timer event
   */
  const emitEvent = useCallback(
    (event: TimerEvent) => {
      const payload: TimerEventPayload = {
        event,
        timestamp: new Date(),
        mode: timerState.mode,
        status: timerState.status,
        currentTime: timerState.currentTime,
        phase: timerState.pomodoro?.phase,
      };

      onEventRef.current?.(payload);
    },
    [timerState],
  );

  // ============================================================================
  // Timer Operations
  // ============================================================================

  /**
   * Starts or resumes the timer
   */
  const start = useCallback(() => {
    if (timerState.status === "running") return;

    try {
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      pausedTimeRef.current = 0;

      setTimerState((prev) => ({
        ...prev,
        status: "running",
        startTime: new Date(),
      }));

      const event =
        timerState.status === "paused" ? "timer_resumed" : "timer_started";
      emitEvent(event);
    } catch (err) {
      setError(
        new TimerError(
          "Failed to start timer",
          TimerErrorCode.INVALID_TRANSITION,
          { error: err },
        ),
      );
    }
  }, [timerState.status, emitEvent]);

  /**
   * Pauses the timer
   */
  const pause = useCallback(() => {
    if (timerState.status !== "running") return;

    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (startTimeRef.current) {
        pausedTimeRef.current = Date.now() - startTimeRef.current;
      }

      setTimerState((prev) => ({
        ...prev,
        status: "paused",
        pausedTime: pausedTimeRef.current / 1000,
      }));

      emitEvent("timer_paused");
    } catch (err) {
      setError(
        new TimerError(
          "Failed to pause timer",
          TimerErrorCode.INVALID_TRANSITION,
          { error: err },
        ),
      );
    }
  }, [timerState.status, emitEvent]);

  /**
   * Stops the timer completely
   */
  const stop = useCallback(() => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      startTimeRef.current = null;
      pausedTimeRef.current = 0;

      setTimerState((prev) => ({
        ...prev,
        status: "idle",
        pausedTime: 0,
      }));

      emitEvent("timer_stopped");
    } catch (err) {
      setError(
        new TimerError(
          "Failed to stop timer",
          TimerErrorCode.INVALID_TRANSITION,
          { error: err },
        ),
      );
    }
  }, [emitEvent]);

  const skip = useCallback(() => {
    try {
      handlePhaseTransition();

      emitEvent("timer_skipped");
    } catch (err) {
      setError(
        new TimerError(
          "Failed to skip timer",
          TimerErrorCode.INVALID_TRANSITION,
          { error: err },
        ),
      );
    }
  }, [emitEvent]);

  /**
   * Handles timer completion
   */
  const handleComplete = useCallback(() => {
    setTimerState((prev) => ({ ...prev, status: "completed" }));
    emitEvent("timer_completed");
    onCompleteRef.current?.(timerState.mode);
  }, [timerState.mode, emitEvent]);

  /**
   * Handles pomodoro phase transition
   */
  const handlePhaseTransition = useCallback(() => {
    setTimerState((prev) => {
      if (!isPomodoroMode(prev)) return prev;

      const cfg = config.pomodoro;
      let newPhase: PomodoroPhase;
      let newSession = prev.pomodoro.session;
      let newCompleted = prev.pomodoro.completedSessions;

      if (prev.pomodoro.phase === "focus") {
        // Work finished - go to break
        newSession += 1;
        newCompleted += 1;

        if (newSession % cfg.sessionsUntilLongBreak === 0) {
          newPhase = "long_break";
        } else {
          newPhase = "short_break";
        }
      } else {
        // Break finished - go to work
        newPhase = "focus";
      }

      const duration = getPhaseDuration(newPhase, cfg);

      emitEvent("phase_changed");
      onPhaseChangeRef.current?.(newPhase);

      return {
        ...prev,
        pomodoro: {
          phase: newPhase,
          session: newSession,
          completedSessions: newCompleted,
        },
        currentTime: duration,
        totalTime: duration,
        progress: 0,
        status: "idle",
      };
    });
  }, [config.pomodoro, emitEvent]);

  /**
   * Resets timer to initial state
   */
  const reset = useCallback(() => {
    try {
      stop();

      const newState = createInitialTimerState(timerState.mode, config);
      setTimerState({
        ...newState,
        progress: calculateProgress(newState),
      });

      emitEvent("timer_reset");
    } catch (err) {
      setError(
        new TimerError(
          "Failed to reset timer",
          TimerErrorCode.INVALID_TRANSITION,
          { error: err },
        ),
      );
    }
  }, [timerState.mode, config, stop, emitEvent]);

  /**
   * Switches timer mode
   */
  const switchMode = useCallback(
    (mode: TimerMode) => {
      try {
        stop();

        const newState = createInitialTimerState(mode, config);
        setTimerState({
          ...newState,
          progress: calculateProgress(newState),
        });

        emitEvent("mode_changed");
      } catch (err) {
        setError(
          new TimerError(
            "Failed to switch mode",
            TimerErrorCode.INVALID_TRANSITION,
            { error: err, mode },
          ),
        );
      }
    },
    [config, stop, emitEvent],
  );

  /**
   * Updates timer configuration
   */
  const updateConfig = useCallback(
    (newConfig: Partial<TimerConfig>) => {
      try {
        const validated = validateTimerConfig({ ...config, ...newConfig });
        setConfig(validated);
        emitEvent("config_updated");
      } catch (err) {
        setError(
          new TimerError(
            "Invalid configuration update",
            TimerErrorCode.INVALID_CONFIG,
            { config: newConfig },
          ),
        );
        console.error("Invalid configuration update: ", err);
      }
    },
    [config, emitEvent],
  );

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================================
  // Timer Tick Effect
  // ============================================================================

  useEffect(() => {
    if (timerState.status !== "running") return;

    intervalRef.current = setInterval(() => {
      setTimerState((prev) => {
        const newState = { ...prev };

        if (prev.mode === "stopwatch") {
          // Count up
          newState.currentTime = prev.currentTime + 1;
          newState.totalTime = prev.currentTime + 1;
        } else {
          // Count down
          if (prev.currentTime <= 1) {
            newState.currentTime = 0;

            if (prev.mode === "countdown") {
              handleComplete();
            } else if (isPomodoroMode(prev)) {
              handlePhaseTransition();
            }

            return newState;
          }

          newState.currentTime = prev.currentTime - 1;
        }

        newState.progress = calculateProgress(newState);
        onTickRef.current?.(newState);

        return newState;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    timerState.status,
    timerState.mode,
    handleComplete,
    handlePhaseTransition,
  ]);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const isRunning = timerState.status === "running";
  const isPaused = timerState.status === "paused";
  const isCompleted = timerState.status === "completed";
  const canStart =
    timerState.status === "idle" || timerState.status === "paused";
  const canPause = timerState.status === "running";

  const currentTimeFormatted = formatTime(timerState.currentTime);
  const totalTimeFormatted = formatTime(timerState.totalTime);
  const displayInfo = TIMER_DISPLAY_INFO[timerState.mode];

  const phaseDescription = timerState.pomodoro
    ? `Session ${timerState.pomodoro.session} - ${timerState.pomodoro.phase.replace("_", " ")}`
    : displayInfo.description;

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    state: timerState,
    config,

    // Computed values
    isRunning,
    isPaused,
    isCompleted,
    canStart,
    canPause,
    currentTime: timerState.currentTime,
    currentTimeFormatted,
    totalTimeFormatted,
    progress: timerState.progress,
    displayInfo,
    phaseDescription,

    // Mode-specific state
    pomodoroPhase: timerState.pomodoro?.phase,
    pomodoroSession: timerState.pomodoro?.session,
    pomodoroCompletedSessions: timerState.pomodoro?.completedSessions,

    // Actions
    start,
    pause,
    stop,
    skip,
    reset,
    switchMode,
    updateConfig,

    // Error handling
    error,
    clearError,
  };
}
