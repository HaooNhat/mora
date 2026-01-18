import { useTimerStore } from "@/stores/timer-store";
import { formatTime } from "@workspace/domain/timer/TimerFormatter";
import { useEffect } from "react";

/**
 * Hook to access and control the timer
 * Manages the interval for ticking and provides formatted values
 */
export default function useTimer() {
  const store = useTimerStore();

  // Initialize timer on mount
  useEffect(() => {
    store.initialize();
  }, [store]);

  // Setup interval for timer ticking
  useEffect(() => {
    if (!store.timer || store.timer.status !== "running") {
      return;
    }

    const interval = setInterval(() => {
      store.tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [store.timer?.status, store.tick, store]);

  // Return null state if timer not initialized
  if (!store.timer) {
    return {
      timer: null,
      progress: 0,
      formattedTime: "00:00",
      isRunning: false,
      isPaused: false,
      isIdle: true,
      isCompleted: false,
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

  // Derived values
  const progress = store.timer.progress;
  const formattedTime = formatTime(store.timer.currentTime);

  const isIdle = store.timer.status === "idle";
  const isRunning = store.timer.status === "running";
  const isPaused = store.timer.status === "paused";
  const isCompleted = store.timer.status === "completed";

  return {
    // State
    timer: store.timer,

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
