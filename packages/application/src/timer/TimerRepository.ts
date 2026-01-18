// /**
//  * Timer Repository - Infrastructure Implementation
//  *
//  * Persists timer state to localStorage.
//  * Implements the repository interface defined in application layer.
//  */
//
// import { Timer } from "@workspace/domain/timer/Timer";
// import { DEFAULT_TIMER_CONFIG } from "@workspace/domain/timer/constants";
// import type { TimerConfig } from "@workspace/domain/timer/schema";
// import type { ITimerRepository } from "./TimerApplicationService";
//
// const STORAGE_KEY = "mora_timer_state";
// const CONFIG_STORAGE_KEY = "mora_timer_config";
//
// interface SerializedTimerState {
//   mode: string;
//   status: string;
//   currentTime: number;
//   totalTime: number;
//   startTime: number;
//   pausedTime: number;
//   autoWork: boolean;
//   autoBreak: boolean;
//   pomodoroPhase?: string;
//   pomodoroSession?: number;
//   completedSessions?: number;
// }
//
// /**
//  * LocalStorage Timer Repository
//  */
// export class LocalStorageTimerRepository implements ITimerRepository {
//   /**
//    * Save timer state to localStorage
//    */
//   async save(timer: Timer): Promise<void> {
//     try {
//       const state = timer.getState();
//       const serialized: SerializedTimerState = {
//         mode: state.mode,
//         status: state.status,
//         currentTime: state.currentTime,
//         totalTime: state.totalTime,
//         startTime: state.startTime,
//         pausedTime: state.pausedTime,
//         autoWork: state.autoWork,
//         autoBreak: state.autoBreak,
//         pomodoroPhase: state.pomodoroPhase,
//         pomodoroSession: state.pomodoroSession,
//         completedSessions: state.completedSessions,
//       };
//
//       localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
//     } catch (error) {
//       console.error("Failed to save timer state:", error);
//       // In production, you might want to throw or handle this differently
//     }
//   }
//
//   /**
//    * Load timer state from localStorage
//    */
//   async load(): Promise<Timer | null> {
//     try {
//       const stored = localStorage.getItem(STORAGE_KEY);
//       if (!stored) {
//         return null;
//       }
//
//       const serialized: SerializedTimerState = JSON.parse(stored);
//       const config = await this.loadConfig();
//
//       // Reconstruct timer from state
//       return Timer.fromState(
//         {
//           mode: serialized.mode as any,
//           status: serialized.status as any,
//           currentTime: serialized.currentTime,
//           totalTime: serialized.totalTime,
//           startTime: serialized.startTime,
//           pausedTime: serialized.pausedTime,
//           autoWork: serialized.autoWork,
//           autoBreak: serialized.autoBreak,
//           pomodoroPhase: serialized.pomodoroPhase as any,
//           pomodoroSession: serialized.pomodoroSession,
//           completedSessions: serialized.completedSessions,
//         },
//         config,
//       );
//     } catch (error) {
//       console.error("Failed to load timer state:", error);
//       return null;
//     }
//   }
//
//   /**
//    * Clear timer state from localStorage
//    */
//   async clear(): Promise<void> {
//     try {
//       localStorage.removeItem(STORAGE_KEY);
//     } catch (error) {
//       console.error("Failed to clear timer state:", error);
//     }
//   }
//
//   /**
//    * Save config to localStorage
//    */
//   async saveConfig(config: TimerConfig): Promise<void> {
//     try {
//       localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
//     } catch (error) {
//       console.error("Failed to save timer config:", error);
//     }
//   }
//
//   /**
//    * Load config from localStorage
//    */
//   async loadConfig(): Promise<TimerConfig> {
//     try {
//       const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
//       if (!stored) {
//         return DEFAULT_TIMER_CONFIG;
//       }
//
//       return JSON.parse(stored) as TimerConfig;
//     } catch (error) {
//       console.error("Failed to load timer config:", error);
//       return DEFAULT_TIMER_CONFIG;
//     }
//   }
// }
