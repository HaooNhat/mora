import {
  createInitialTimerState,
  DEFAULT_TIMER_CONFIG,
  type PomodoroPhase,
  TIMER_DISPLAY_INFO,
  type TimerConfig,
  type TimerMode,
  type TimerState,
} from "@workspace/types/Timer";
import { useCallback, useEffect, useRef, useState } from "react";

const formatHMS = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};

interface UseTimerOptions {
  config?: Partial<TimerConfig>;
  onComplete?: (mode: TimerMode) => void;
  onPhaseChange?: (phase: PomodoroPhase) => void;
  onTick?: (state: TimerState) => void;
}

export function useTimer(options: UseTimerOptions = {}) {
  const { config: userConfig, onComplete, onPhaseChange, onTick } = options;

  // Merge user config with defaults
  const config = useRef<TimerConfig>({
    ...DEFAULT_TIMER_CONFIG,
    ...userConfig,
    pomodoro: { ...DEFAULT_TIMER_CONFIG.pomodoro, ...userConfig?.pomodoro },
    countdown: { ...DEFAULT_TIMER_CONFIG.countdown, ...userConfig?.countdown },
    stopwatch: { ...DEFAULT_TIMER_CONFIG.stopwatch, ...userConfig?.stopwatch },
  });

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>(() =>
    createInitialTimerState("pomodoro", config.current),
  );

  // Refs for accurate timing
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);

  const calculateProgress = useCallback((state: TimerState): number => {
    if (state.mode === "stopwatch") {
      return 0;
    }

    if (state.totalTime === 0) return 0;

    const elapsed = state.totalTime - state.currentTime;
    return Math.min(100, Math.max(0, (elapsed / state.totalTime) * 100));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<TimerConfig>) => {
    config.current = {
      ...config.current,
      ...newConfig,
      pomodoro: { ...config.current.pomodoro, ...newConfig?.pomodoro },
      countdown: { ...config.current.countdown, ...newConfig?.countdown },
      stopwatch: { ...config.current.stopwatch, ...newConfig?.stopwatch },
    };
  }, []);

  const switchMode = useCallback(
    (mode: TimerMode) => {
      // Stop current timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      startTimeRef.current = null;
      pausedTimeRef.current = 0;

      // TODO: check this calculateProgress function
      const newState = createInitialTimerState(mode, config.current);
      setTimerState({
        ...newState,
        progress: calculateProgress(newState),
      });
    },
    [calculateProgress],
  );

  const start = useCallback(() => {
    if (timerState.status === "running") return;

    startTimeRef.current = Date.now() - pausedTimeRef.current;
    pausedTimeRef.current = 0;

    setTimerState((prev) => ({
      ...prev,
      status: "running",
      startTime: new Date(),
    }));
  }, [timerState.status]);

  const pause = useCallback(() => {
    if (timerState.status !== "running") return;

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
  }, [timerState.status]);

  const stop = useCallback(() => {
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
  }, []);

  const reset = useCallback(() => {
    stop();

    const newState = createInitialTimerState(timerState.mode, config.current);
    setTimerState({
      ...newState,
      progress: calculateProgress(newState),
    });
  }, [timerState.mode, stop, calculateProgress]);

  const handleComplete = useCallback(() => {
    setTimerState((prev) => ({ ...prev, status: "completed" }));
    onComplete?.(timerState.mode);
  }, [timerState.mode, onComplete]);

  const handlePhaseTransition = useCallback(() => {
    setTimerState((prev) => {
      const newState = { ...prev };

      if (prev.mode === "pomodoro" && prev.pomodoro) {
        const cfg = config.current.pomodoro;

        if (prev.pomodoro.phase === "focus") {
          // Work finished - go to break
          const nextSession = prev.pomodoro.session + 1;

          if (nextSession % cfg.sessionsUntilLongBreak === 0) {
            // Long break time
            newState.pomodoro = {
              ...prev.pomodoro,
              phase: "long_break",
              session: nextSession,
              completedSessions: prev.pomodoro.completedSessions + 1,
            };
            newState.currentTime = cfg.longBreakDuration * 60;
            newState.totalTime = cfg.longBreakDuration * 60;
            onPhaseChange?.("long_break");
          } else {
            // Short break time
            newState.pomodoro = {
              ...prev.pomodoro,
              phase: "short_break",
              session: nextSession,
              completedSessions: prev.pomodoro.completedSessions + 1,
            };
            newState.currentTime = cfg.shortBreakDuration * 60;
            newState.totalTime = cfg.shortBreakDuration * 60;
            onPhaseChange?.("short_break");
          }
        } else {
          // Break finished - go to work
          newState.pomodoro = {
            ...prev.pomodoro,
            phase: "focus",
          };
          newState.currentTime = cfg.workDuration * 60;
          newState.totalTime = cfg.workDuration * 60;
          onPhaseChange?.("focus");
        }
      }

      newState.progress = calculateProgress(newState);
      return newState;
    });
  }, [handleComplete, onPhaseChange, calculateProgress]);

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
            // Timer reached zero
            newState.currentTime = 0;

            if (prev.mode === "countdown") {
              // Countdown completed
              handleComplete();
            } else {
              // Pomodoro transition phase
              handlePhaseTransition();
              return newState;
            }
          } else {
            newState.currentTime = prev.currentTime - 1;
          }
        }

        newState.progress = calculateProgress(newState);
        onTick?.(newState);

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
    calculateProgress,
    onTick,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Computed values
  const isRunning = timerState.status === "running";
  const isPaused = timerState.status === "paused";
  const isCompleted = timerState.status === "completed";
  const canStart =
    timerState.status === "idle" || timerState.status === "paused";
  const canPause = timerState.status === "running";

  const currentTimeFormatted = formatHMS(timerState.currentTime);
  const totalTimeFormatted = formatHMS(timerState.totalTime);

  const displayInfo = TIMER_DISPLAY_INFO[timerState.mode];

  // Phase description for pomodoro and interval
  const phaseDescription = timerState.pomodoro
    ? `Session ${timerState.pomodoro.session} - ${timerState.pomodoro.phase}`
    : displayInfo.description;

  return {
    // State
    state: timerState,
    config: config.current,

    // Computed values
    isRunning,
    isPaused,
    isCompleted,
    canStart,
    canPause,

    // Display values
    currentTime: timerState.currentTime,
    currentTimeFormatted,
    totalTimeFormatted,
    progress: timerState.progress,
    displayInfo,
    phaseDescription,

    // Mode-specific state
    pomodoroPhase: timerState.pomodoro?.phase,
    pomodoroSession: timerState.pomodoro?.session,

    // Actions
    start,
    pause,
    stop,
    reset,
    switchMode,
    updateConfig,
  };
}
