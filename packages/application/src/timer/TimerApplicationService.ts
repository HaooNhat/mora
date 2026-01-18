// /**
//  * Timer Application Service
//  *
//  * Application layer orchestrates:
//  * - Domain operations
//  * - Infrastructure interactions (persistence, events)
//  * - Transaction boundaries
//  * - Cross-cutting concerns
//  */
//
// import { Timer } from "@workspace/domain/timer/Timer";
// import { DEFAULT_TIMER_CONFIG } from "@workspace/domain/timer/constants";
// import type { TimerConfig } from "@workspace/domain/timer/schema";
// import type { TimerMode } from "@workspace/domain/timer/types";
// import type { DomainEvent } from "@workspace/domain/timer/timer.events";
//
// /**
//  * Timer Repository Interface (to be implemented in infrastructure)
//  */
// export interface ITimerRepository {
//   save(timer: Timer): Promise<void>;
//   load(): Promise<Timer | null>;
//   clear(): Promise<void>;
// }
//
// /**
//  * Event Handler Interface
//  */
// export interface IEventHandler {
//   handle(event: DomainEvent): void | Promise<void>;
// }
//
// /**
//  * Timer Application Service
//  * Coordinates timer operations with infrastructure
//  */
// export class TimerApplicationService {
//   private currentTimer: Timer;
//   private config: TimerConfig;
//
//   constructor(
//     private readonly repository: ITimerRepository,
//     private readonly eventHandlers: IEventHandler[] = [],
//   ) {
//     this.config = DEFAULT_TIMER_CONFIG;
//     this.currentTimer = Timer.createPomodoro(this.config);
//   }
//
//   /**
//    * Initialize timer from storage or create new
//    */
//   async initialize(): Promise<Timer> {
//     const savedTimer = await this.repository.load();
//
//     if (savedTimer) {
//       this.currentTimer = savedTimer;
//     } else {
//       this.currentTimer = Timer.createPomodoro(this.config);
//       await this.repository.save(this.currentTimer);
//     }
//
//     return this.currentTimer;
//   }
//
//   /**
//    * Get current timer state
//    */
//   getCurrentTimer(): Timer {
//     return this.currentTimer;
//   }
//
//   /**
//    * Get current configuration
//    */
//   getConfig(): TimerConfig {
//     return this.config;
//   }
//
//   /**
//    * Start timer
//    */
//   async start(): Promise<Timer> {
//     this.currentTimer = this.currentTimer.start();
//
//     await this.persistAndEmitEvents();
//
//     return this.currentTimer;
//   }
//
//   /**
//    * Pause timer
//    */
//   async pause(): Promise<Timer> {
//     this.currentTimer = this.currentTimer.pause();
//
//     await this.persistAndEmitEvents();
//
//     return this.currentTimer;
//   }
//
//   /**
//    * Reset timer
//    */
//   async reset(): Promise<Timer> {
//     this.currentTimer = this.currentTimer.reset();
//
//     await this.persistAndEmitEvents();
//
//     return this.currentTimer;
//   }
//
//   /**
//    * Tick timer (advance by 1 second)
//    */
//   async tick(): Promise<Timer> {
//     this.currentTimer = this.currentTimer.tick();
//
//     // Only persist on significant events (not every tick for performance)
//     const events = this.currentTimer.getDomainEvents();
//     const hasSignificantEvent = events.some(
//       (e) =>
//         e.eventType === "TimerCompleted" || e.eventType === "PhaseTransitioned",
//     );
//
//     if (hasSignificantEvent) {
//       await this.persistAndEmitEvents();
//     } else {
//       // Still emit tick events without persisting
//       await this.emitEvents();
//     }
//
//     return this.currentTimer;
//   }
//
//   /**
//    * Skip to next pomodoro phase
//    */
//   async skipPhase(): Promise<Timer> {
//     this.currentTimer = this.currentTimer.skipPhase();
//
//     await this.persistAndEmitEvents();
//
//     return this.currentTimer;
//   }
//
//   /**
//    * Change timer mode
//    */
//   async setMode(mode: TimerMode): Promise<Timer> {
//     if (mode === "pomodoro") {
//       this.currentTimer = Timer.createPomodoro(this.config);
//     } else {
//       this.currentTimer = Timer.createStopwatch(this.config);
//     }
//
//     await this.repository.save(this.currentTimer);
//
//     return this.currentTimer;
//   }
//
//   /**
//    * Update auto-work setting
//    */
//   async setAutoWork(enabled: boolean): Promise<Timer> {
//     this.currentTimer = this.currentTimer.setAutoWork(enabled);
//     await this.repository.save(this.currentTimer);
//     return this.currentTimer;
//   }
//
//   /**
//    * Update auto-break setting
//    */
//   async setAutoBreak(enabled: boolean): Promise<Timer> {
//     this.currentTimer = this.currentTimer.setAutoBreak(enabled);
//     await this.repository.save(this.currentTimer);
//     return this.currentTimer;
//   }
//
//   /**
//    * Update timer configuration
//    */
//   async updateConfig(newConfig: Partial<TimerConfig>): Promise<void> {
//     this.config = { ...this.config, ...newConfig };
//
//     // If timer is idle, recreate with new config
//     if (this.currentTimer.status === "idle") {
//       if (this.currentTimer.mode === "pomodoro") {
//         this.currentTimer = Timer.createPomodoro(this.config);
//       } else {
//         this.currentTimer = Timer.createStopwatch(this.config);
//       }
//       await this.repository.save(this.currentTimer);
//     }
//   }
//
//   // ============================================================================
//   // Private Helpers
//   // ============================================================================
//
//   private async persistAndEmitEvents(): Promise<void> {
//     await this.repository.save(this.currentTimer);
//     await this.emitEvents();
//   }
//
//   private async emitEvents(): Promise<void> {
//     const events = this.currentTimer.getDomainEvents();
//
//     for (const event of events) {
//       for (const handler of this.eventHandlers) {
//         await handler.handle(event);
//       }
//     }
//   }
// }
