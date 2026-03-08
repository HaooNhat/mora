import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  PomodoroPhase,
  PomodoroTimer,
  Timer,
  TimerSettings,
} from "../domain/timer";

export type TimerUIState = "minimized" | "opened" | "configuring";

interface TimerStoreState {
  timer: Timer;
  uiState: TimerUIState;

  // Timer actions
  start: () => void;
  pause: () => void;
  stop: () => void;
  skip: () => void;
  tick: () => void;
  switchMode: () => void;
  updateSettings: (settings: TimerSettings) => void;
  reset: () => void;

  // UI actions
  minimize: () => void;
  open: () => void;
  configure: () => void;
}

export const useTimerStore = create<TimerStoreState>()(
  devtools(
    (set) => ({
      timer: PomodoroTimer.create(),
      uiState: "minimized",

      start: () => set((s) => ({ timer: s.timer.start() })),
      pause: () => set((s) => ({ timer: s.timer.pause() })),
      stop: () => set((s) => ({ timer: s.timer.stop() })),
      skip: () => set((s) => ({ timer: s.timer.skip() })),
      tick: () => set((s) => ({ timer: s.timer.tick().timer })),

      switchMode: () => set((s) => ({ timer: s.timer.switchMode() })),
      updateSettings: (settings) =>
        set((s) => ({ timer: s.timer.updateSettings(settings) })),
      reset: () => set((s) => ({ timer: s.timer.reset() })),

      minimize: () => set({ uiState: "minimized" }),
      open: () => set({ uiState: "opened" }),
      configure: () => set({ uiState: "configuring" }),
    }),
    { name: "TimerStore" },
  ),
);

// =============================================================================
// Selectors
// =============================================================================

export const useTimerMode = () => useTimerStore((s) => s.timer.mode);
export const useTimerStatus = () => useTimerStore((s) => s.timer.status);
export const useTimerIsRunning = () =>
  useTimerStore((s) => s.timer.isRunning());
export const useTimerProgress = () =>
  useTimerStore((s) => s.timer.getProgress());
export const useTimerFormattedTime = () =>
  useTimerStore((s) => s.timer.formattedTime);
export const useTimerUIState = () => useTimerStore((s) => s.uiState);

/** Get pomodoro phase (only meaningful when mode is 'pomodoro') */
export const useTimerPhase = (): PomodoroPhase | null =>
  useTimerStore((s) =>
    s.timer.mode === "pomodoro" ? (s.timer as PomodoroTimer).phase : null,
  );

/** Get completed sessions (only meaningful when mode is 'pomodoro') */
export const useTimerCompletedSessions = (): number =>
  useTimerStore((s) =>
    s.timer.mode === "pomodoro"
      ? (s.timer as PomodoroTimer).completedSessions
      : 0,
  );

export const useTimerActions = () => {
  const start = useTimerStore((s) => s.start);
  const pause = useTimerStore((s) => s.pause);
  const stop = useTimerStore((s) => s.stop);
  const skip = useTimerStore((s) => s.skip);
  const switchMode = useTimerStore((s) => s.switchMode);
  const updateSettings = useTimerStore((s) => s.updateSettings);
  const reset = useTimerStore((s) => s.reset);

  return { start, pause, stop, skip, switchMode, updateSettings, reset };
};

export const useTickTimer = () => {
  const tick = useTimerStore((s) => s.tick);
  return tick;
};

export const useTimerUIActions = () => {
  const minimize = useTimerStore((s) => s.minimize);
  const open = useTimerStore((s) => s.open);
  const configure = useTimerStore((s) => s.configure);

  return { minimize, open, configure };
};
