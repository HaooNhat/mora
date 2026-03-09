import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { PomodoroTimer, Timer, TimerSettings } from "../domain/timer";

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
