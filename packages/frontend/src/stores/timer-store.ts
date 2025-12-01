import {
  createInitialTimerState,
  DEFAULT_TIMER_CONFIG,
  pauseTimer,
  resetTimer,
  skipPomodoroPhase,
  startTimer,
  tickTimer,
  type TimerConfig,
  type TimerMode,
  type TimerState,
} from "@workspace/core/timer/index";
import { create } from "zustand";

interface TimerStore {
  // State
  timerState: TimerState;
  config: TimerConfig;

  // Actions
  tick: () => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skipPhase: () => void;
  setMode: (mode: TimerMode) => void;
  setAutoWork: (auto: boolean) => void;
  setAutoBreak: (auto: boolean) => void;
  updateConfig: (config: Partial<TimerConfig>) => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  // Initial state
  timerState: createInitialTimerState("pomodoro", DEFAULT_TIMER_CONFIG),
  config: DEFAULT_TIMER_CONFIG,

  // Timer tick - called every second when running
  tick: () => {
    const { timerState, config } = get();
    const newState = tickTimer(timerState, config);
    set({ timerState: newState });
  },

  // Start or resume timer
  start: () => {
    const { timerState } = get();
    const newState = startTimer(timerState);
    set({ timerState: newState });
  },

  // Pause timer
  pause: () => {
    const { timerState } = get();
    const newState = pauseTimer(timerState);
    set({ timerState: newState });
  },

  // Reset timer to initial state
  reset: () => {
    const { timerState, config } = get();
    const newState = resetTimer(timerState, config);
    set({ timerState: newState });
  },

  // Skip to next pomodoro phase
  skipPhase: () => {
    const { timerState, config } = get();
    if (timerState.mode !== "pomodoro") return;
    const newState = skipPomodoroPhase(timerState, config.pomodoro);
    set({ timerState: newState });
  },

  // Change timer mode (pomodoro/stopwatch)
  setMode: (mode: TimerMode) => {
    const { config } = get();
    const newState = createInitialTimerState(mode, config);
    set({ timerState: newState });
  },

  // Toggle auto-work (auto-start next focus session)
  setAutoWork: (auto: boolean) => {
    set((state) => ({
      timerState: { ...state.timerState, autoWork: auto },
    }));
  },

  // Toggle auto-break (auto-start breaks)
  setAutoBreak: (auto: boolean) => {
    set((state) => ({
      timerState: { ...state.timerState, autoBreak: auto },
    }));
  },

  // Update timer configuration
  updateConfig: (newConfig: Partial<TimerConfig>) => {
    const { config, timerState } = get();
    const updatedConfig = { ...config, ...newConfig };
    // Reset timer with new config if not running
    if (timerState.status === "idle") {
      const newState = createInitialTimerState(timerState.mode, updatedConfig);
      set({ config: updatedConfig, timerState: newState });
    } else {
      set({ config: updatedConfig });
    }
  },
}));
