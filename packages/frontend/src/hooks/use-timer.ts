import { calculateProgress, formatTime } from "@workspace/core/timer/engine";
import { useTimerStore } from "@workspace/frontend/stores/timer-store";
import { useEffect } from "react";

/**
 * Hook to access and control the timer
 * Manages the interval for ticking and provides formatted values
 */
export default function useTimer() {
  const store = useTimerStore();

  // Setup interval for timer ticking
  useEffect(() => {
    if (store.timerState.status !== "running") {
      return;
    }

    const interval = setInterval(() => {
      store.tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [store.timerState.status, store.tick]);

  // Derived values
  const progress = calculateProgress(store.timerState);
  const formattedTime = formatTime(store.timerState.currentTime);

  const isIdle = store.timerState.status === "idle";
  const isRunning = store.timerState.status === "running";
  const isPaused = store.timerState.status === "paused";
  const isCompleted = store.timerState.status === "completed";

  return {
    // State
    timerState: store.timerState,
    config: store.config,

    // Derived values
    progress,
    formattedTime,
    isRunning,
    isPaused,
    isIdle,
    isCompleted,

    // Actions
    start: store.start,
    pause: store.pause,
    reset: store.reset,
    skipPhase: store.skipPhase,
    setMode: store.setMode,
    setAutoWork: store.setAutoWork,
    setAutoBreak: store.setAutoBreak,
    updateConfig: store.updateConfig,
  };
}
