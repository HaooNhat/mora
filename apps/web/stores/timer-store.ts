/**
 * Timer Store - Zustand State Management
 *
 * Thin adapter layer between React components and Application Service.
 * No business logic - delegates to TimerApplicationService.
 */

import { TimerApplicationService } from "@workspace/application/timer/TimerApplicationService";
import { LocalStorageTimerRepository } from "@workspace/application/timer/TimerRepository";
import { Timer } from "../../../packages/shared/src/timer/Timer";
import type { TimerConfig } from "../../../packages/shared/src/timer/schema";
import type { TimerMode } from "../../../packages/shared/src/timer/types";
import { create } from "zustand";

// Initialize application service
const repository = new LocalStorageTimerRepository();
const timerService = new TimerApplicationService(repository);

interface TimerStore {
  // State
  timer: Timer | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  tick: () => Promise<void>;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  reset: () => Promise<void>;
  skipPhase: () => Promise<void>;
  setMode: (mode: TimerMode) => Promise<void>;
  setAutoWork: (auto: boolean) => Promise<void>;
  setAutoBreak: (auto: boolean) => Promise<void>;
  updateConfig: (config: Partial<TimerConfig>) => Promise<void>;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  // Initial state
  timer: null,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;

    const timer = await timerService.initialize();
    set({ timer, isInitialized: true });
  },

  tick: async () => {
    const timer = await timerService.tick();
    set({ timer });
  },

  start: async () => {
    const timer = await timerService.start();
    set({ timer });
  },

  pause: async () => {
    const timer = await timerService.pause();
    set({ timer });
  },

  reset: async () => {
    const timer = await timerService.reset();
    set({ timer });
  },

  skipPhase: async () => {
    const timer = await timerService.skipPhase();
    set({ timer });
  },

  setMode: async (mode: TimerMode) => {
    const timer = await timerService.setMode(mode);
    set({ timer });
  },

  setAutoWork: async (auto: boolean) => {
    const timer = await timerService.setAutoWork(auto);
    set({ timer });
  },

  setAutoBreak: async (auto: boolean) => {
    const timer = await timerService.setAutoBreak(auto);
    set({ timer });
  },

  updateConfig: async (newConfig: Partial<TimerConfig>) => {
    await timerService.updateConfig(newConfig);
    const timer = timerService.getCurrentTimer();
    set({ timer });
  },
}));

// Export service for direct access if needed
export { timerService };
