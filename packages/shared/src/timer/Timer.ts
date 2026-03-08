// /**
//  * Timer Aggregate Root
//  *
//  * Following DDD principles:
//  * - Encapsulates all timer state and behavior
//  * - Enforces business invariants
//  * - Emits domain events
//  * - Factory methods for creation
//  */
//
// import type { TimerConfig } from "./schema.js";
// import type { DomainEvent } from "./timer.events.js";
// import {
//   PhaseTransitionedEvent,
//   TimerCompletedEvent,
//   TimerPausedEvent,
//   TimerResetEvent,
//   TimerStartedEvent,
//   TimerTickedEvent,
// } from "./timer.events.js";
// import type { PomodoroPhase, TimerMode, TimerStatus } from "./types.js";
// import { TimerError } from "./types.js";
//
// interface TimerProps {
//   mode: TimerMode;
//   status: TimerStatus;
//   currentTime: number;
//   totalTime: number;
//   startTime: number;
//   pausedTime: number;
//   autoWork: boolean;
//   autoBreak: boolean;
//
//   // Pomodoro-specific
//   pomodoroPhase?: PomodoroPhase;
//   pomodoroSession?: number;
//   completedSessions?: number;
// }
//
// /**
//  * Timer Aggregate Root
//  * Immutable - all operations return new instances
//  */
// export class Timer {
//   private readonly props: TimerProps;
//   private readonly config: TimerConfig;
//   private readonly events: DomainEvent[] = [];
//
//   private constructor(props: TimerProps, config: TimerConfig) {
//     this.props = { ...props };
//     this.config = config;
//     this.validateInvariants();
//   }
//
//   // ============================================================================
//   // Factory Methods
//   // ============================================================================
//
//   static createPomodoro(config: TimerConfig): Timer {
//     const duration = config.pomodoro.workDuration * 60;
//
//     return new Timer(
//       {
//         mode: "pomodoro",
//         status: "idle",
//         currentTime: duration,
//         totalTime: duration,
//         startTime: 0,
//         pausedTime: 0,
//         autoWork: false,
//         autoBreak: false,
//         pomodoroPhase: "focus",
//         pomodoroSession: 1,
//         completedSessions: 0,
//       },
//       config,
//     );
//   }
//
//   static createStopwatch(config: TimerConfig): Timer {
//     return new Timer(
//       {
//         mode: "stopwatch",
//         status: "idle",
//         currentTime: 0,
//         totalTime: 0,
//         startTime: 0,
//         pausedTime: 0,
//         autoWork: false,
//         autoBreak: false,
//       },
//       config,
//     );
//   }
//
//   static fromState(props: TimerProps, config: TimerConfig): Timer {
//     return new Timer(props, config);
//   }
//
//   // ============================================================================
//   // Getters
//   // ============================================================================
//
//   get mode(): TimerMode {
//     return this.props.mode;
//   }
//
//   get status(): TimerStatus {
//     return this.props.status;
//   }
//
//   get currentTime(): number {
//     return this.props.currentTime;
//   }
//
//   get totalTime(): number {
//     return this.props.totalTime;
//   }
//
//   get progress(): number {
//     if (this.props.mode === "stopwatch" || this.props.totalTime === 0) {
//       return 0;
//     }
//     const elapsed = this.props.totalTime - this.props.currentTime;
//     return Math.min(100, Math.max(0, (elapsed / this.props.totalTime) * 100));
//   }
//
//   get pomodoroPhase(): PomodoroPhase | undefined {
//     return this.props.pomodoroPhase;
//   }
//
//   get pomodoroSession(): number | undefined {
//     return this.props.pomodoroSession;
//   }
//
//   get completedSessions(): number {
//     return this.props.completedSessions ?? 0;
//   }
//
//   get autoWork(): boolean {
//     return this.props.autoWork;
//   }
//
//   get autoBreak(): boolean {
//     return this.props.autoBreak;
//   }
//
//   getState(): TimerProps {
//     return { ...this.props };
//   }
//
//   getDomainEvents(): ReadonlyArray<DomainEvent> {
//     return [...this.events];
//   }
//
//   // ============================================================================
//   // Business Logic - Commands
//   // ============================================================================
//
//   /**
//    * Start or resume the timer
//    */
//   start(): Timer {
//     if (this.props.status === "running") {
//       return this;
//     }
//
//     const now = Date.now();
//     const newProps: TimerProps = { ...this.props, status: "running" };
//
//     if (this.props.status === "idle" || this.props.status === "completed") {
//       newProps.startTime = now;
//       newProps.pausedTime = 0;
//     }
//
//     const newTimer = new Timer(newProps, this.config);
//     newTimer.addEvent(new TimerStartedEvent(now, this.props.mode));
//     return newTimer;
//   }
//
//   /**
//    * Pause the timer
//    */
//   pause(): Timer {
//     if (this.props.status !== "running") {
//       return this;
//     }
//
//     const now = Date.now();
//     const newTimer = new Timer(
//       { ...this.props, status: "paused" },
//       this.config,
//     );
//     newTimer.addEvent(new TimerPausedEvent(now, this.props.currentTime));
//     return newTimer;
//   }
//
//   /**
//    * Reset timer to initial state
//    */
//   reset(): Timer {
//     let newTimer: Timer;
//
//     if (this.props.mode === "pomodoro") {
//       newTimer = Timer.createPomodoro(this.config);
//     } else {
//       newTimer = Timer.createStopwatch(this.config);
//     }
//
//     newTimer.addEvent(new TimerResetEvent(Date.now(), this.props.mode));
//     return newTimer;
//   }
//
//   /**
//    * Tick - advance timer by one second
//    */
//   tick(): Timer {
//     if (this.props.status !== "running") {
//       return this;
//     }
//
//     if (this.props.mode === "stopwatch") {
//       return this.tickStopwatch();
//     }
//
//     return this.tickPomodoro();
//   }
//
//   /**
//    * Skip to next pomodoro phase
//    */
//   skipPhase(): Timer {
//     if (this.props.mode !== "pomodoro") {
//       throw new TimerError(
//         "Cannot skip phase: not in pomodoro mode",
//         "INVALID_STATE",
//       );
//     }
//
//     return this.transitionToNextPhase();
//   }
//
//   /**
//    * Update auto-transition settings
//    */
//   setAutoWork(enabled: boolean): Timer {
//     return new Timer({ ...this.props, autoWork: enabled }, this.config);
//   }
//
//   setAutoBreak(enabled: boolean): Timer {
//     return new Timer({ ...this.props, autoBreak: enabled }, this.config);
//   }
//
//   // ============================================================================
//   // Private Methods
//   // ============================================================================
//
//   private tickStopwatch(): Timer {
//     const newTime = this.props.currentTime + 1;
//     const maxDuration = this.config.stopwatch.maxDuration
//       ? this.config.stopwatch.maxDuration * 60
//       : Infinity;
//
//     if (newTime >= maxDuration) {
//       const newTimer = new Timer(
//         {
//           ...this.props,
//           currentTime: maxDuration,
//           status: "completed",
//         },
//         this.config,
//       );
//       newTimer.addEvent(new TimerCompletedEvent(Date.now(), "stopwatch"));
//       return newTimer;
//     }
//
//     const newTimer = new Timer(
//       { ...this.props, currentTime: newTime },
//       this.config,
//     );
//     newTimer.addEvent(new TimerTickedEvent(Date.now(), newTime));
//     return newTimer;
//   }
//
//   private tickPomodoro(): Timer {
//     const newTime = this.props.currentTime - 1;
//
//     if (newTime <= 0) {
//       return this.handlePhaseCompletion();
//     }
//
//     const newTimer = new Timer(
//       { ...this.props, currentTime: newTime },
//       this.config,
//     );
//     newTimer.addEvent(new TimerTickedEvent(Date.now(), newTime));
//     return newTimer;
//   }
//
//   private handlePhaseCompletion(): Timer {
//     const shouldAutoTransition =
//       (this.props.pomodoroPhase === "focus" && this.props.autoBreak) ||
//       (this.props.pomodoroPhase !== "focus" && this.props.autoWork);
//
//     if (shouldAutoTransition) {
//       return this.transitionToNextPhase();
//     }
//
//     // Wait for manual transition
//     const newTimer = new Timer(
//       {
//         ...this.props,
//         currentTime: 0,
//         status: "completed",
//       },
//       this.config,
//     );
//     newTimer.addEvent(
//       new TimerCompletedEvent(Date.now(), "pomodoro", this.props.pomodoroPhase),
//     );
//     return newTimer;
//   }
//
//   private transitionToNextPhase(): Timer {
//     if (!this.props.pomodoroPhase || this.props.pomodoroSession === undefined) {
//       throw new TimerError(
//         "Cannot transition phase: invalid pomodoro state",
//         "INVALID_STATE",
//       );
//     }
//
//     const nextPhase = this.calculateNextPhase();
//     const duration = this.getPhaseDuration(nextPhase);
//
//     const isCompletingFocus = this.props.pomodoroPhase === "focus";
//     const completedSessions = isCompletingFocus
//       ? (this.props.completedSessions ?? 0) + 1
//       : (this.props.completedSessions ?? 0);
//
//     const session =
//       nextPhase === "focus"
//         ? this.props.pomodoroSession + 1
//         : this.props.pomodoroSession;
//
//     const newTimer = new Timer(
//       {
//         ...this.props,
//         currentTime: duration,
//         totalTime: duration,
//         status: "running",
//         pomodoroPhase: nextPhase,
//         pomodoroSession: session,
//         completedSessions,
//       },
//       this.config,
//     );
//
//     newTimer.addEvent(
//       new PhaseTransitionedEvent(
//         Date.now(),
//         this.props.pomodoroPhase,
//         nextPhase,
//         session,
//       ),
//     );
//
//     return newTimer;
//   }
//
//   private calculateNextPhase(): PomodoroPhase {
//     if (this.props.pomodoroPhase === "focus") {
//       const isLongBreak =
//         (this.props.pomodoroSession ?? 0) %
//           this.config.pomodoro.sessionsUntilLongBreak ===
//         0;
//       return isLongBreak ? "long_break" : "short_break";
//     }
//     return "focus";
//   }
//
//   private getPhaseDuration(phase: PomodoroPhase): number {
//     const config = this.config.pomodoro;
//     switch (phase) {
//       case "focus":
//         return config.workDuration * 60;
//       case "short_break":
//         return config.shortBreakDuration * 60;
//       case "long_break":
//         return config.longBreakDuration * 60;
//     }
//   }
//
//   private addEvent(event: DomainEvent): void {
//     (this.events as DomainEvent[]).push(event);
//   }
//
//   private validateInvariants(): void {
//     // Time invariants
//     if (this.props.currentTime < 0) {
//       throw new TimerError("Current time cannot be negative", "INVALID_STATE", {
//         currentTime: this.props.currentTime,
//       });
//     }
//
//     if (this.props.totalTime < 0) {
//       throw new TimerError("Total time cannot be negative", "INVALID_STATE", {
//         totalTime: this.props.totalTime,
//       });
//     }
//
//     // Pomodoro invariants
//     if (this.props.mode === "pomodoro") {
//       if (!this.props.pomodoroPhase) {
//         throw new TimerError(
//           "Pomodoro timer must have a phase",
//           "INVALID_STATE",
//         );
//       }
//
//       if (
//         this.props.pomodoroSession === undefined ||
//         this.props.pomodoroSession < 1
//       ) {
//         throw new TimerError(
//           "Pomodoro session must be at least 1",
//           "INVALID_STATE",
//         );
//       }
//     }
//   }
// }
