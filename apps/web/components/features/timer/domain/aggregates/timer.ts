// import { TimerSession } from "../entities/timer-session";
// import { TimerSettings } from "../entities/timer-settings";
// import { TimerStatus } from "../timer";
// import { Duration } from "../value-objects/duration";
// import { TimerMode } from "../value-objects/timer-mode";
// import { PomodoroPhase } from "../value-objects/timer-pomodoro-phase";
//
// abstract class TimerBase {
//   constructor(
//     public readonly mode: TimerMode,
//     public readonly pomodoroPhase: PomodoroPhase | null,
//     public readonly status: TimerStatus,
//     public readonly duration: Duration,
//     public readonly settings: TimerSettings,
//     public readonly session: TimerSession,
//   ) {}
//
//   static create(): TimerBase {
//     throw new Error("Must be implemented by subclass");
//   }
//   abstract start(): TimerBase;
//   abstract pause(): TimerBase;
//   abstract stop(): TimerBase;
//   abstract tick(): { timer: TimerBase; completed: boolean };
//   abstract skip(): TimerBase;
//
//   abstract switchMode(mode: TimerMode): TimerBase;
//   abstract updateSettings(settings: TimerSettings): TimerBase;
//   abstract resetSession(): TimerBase;
//
//   protected abstract complete(): TimerBase;
//
//   abstract getProgress(): number;
//
//   canSkip(): boolean {
//     return this.status !== TimerStatus.Running;
//   }
//
//   canReset(): boolean {
//     return this.status !== TimerStatus.Running;
//   }
//
//   isRunning(): boolean {
//     return this.status === TimerStatus.Running;
//   }
// }
//
// export class PomodoroTimer extends TimerBase {
//   static create(
//     settings: TimerSettings = TimerSettings.createDefault(),
//   ): PomodoroTimer {
//     return new PomodoroTimer(
//       TimerMode.Pomodoro,
//       PomodoroPhase.Focus,
//       TimerStatus.Idle,
//       settings.getDurationFor(PomodoroPhase.Focus),
//       settings,
//       new TimerSession(),
//     );
//   }
//
//   start(): PomodoroTimer {
//     if (this.isRunning()) return this;
//
//     return new PomodoroTimer(
//       this.mode,
//       this.pomodoroPhase!,
//       TimerStatus.Running,
//       this.duration,
//       this.settings,
//       this.status === TimerStatus.Idle ? this.session.start() : this.session,
//     );
//   }
//
//   pause(): PomodoroTimer {
//     if (!this.isRunning()) return this;
//
//     return new PomodoroTimer(
//       this.mode,
//       this.pomodoroPhase!,
//       TimerStatus.Paused,
//       this.duration,
//       this.settings,
//       this.session,
//     );
//   }
//
//   stop(): PomodoroTimer {
//     return new PomodoroTimer(
//       this.mode,
//       this.pomodoroPhase!,
//       TimerStatus.Idle,
//       this.settings.getDurationFor(this.pomodoroPhase!),
//       this.settings,
//       new TimerSession(
//         this.session.completedFocusSessions,
//         this.session.totalFocusTime,
//         null,
//       ),
//     );
//   }
//
//   tick(): { timer: PomodoroTimer; completed: boolean } {
//     if (!this.isRunning()) {
//       return { timer: this, completed: false };
//     }
//
//     const newRemaining = this.duration.subtract(1);
//
//     if (newRemaining.isZero()) {
//       return {
//         timer: this.complete(),
//         completed: true,
//       };
//     }
//
//     return {
//       timer: new PomodoroTimer(
//         this.mode,
//         this.pomodoroPhase!,
//         this.status,
//         newRemaining,
//         this.settings,
//         this.session,
//       ),
//       completed: false,
//     };
//   }
//
//   protected complete(): PomodoroTimer {
//     const nextPhase = this.calculateNextPhase();
//
//     const updatedSession = this.pomodoroPhase!.isFocus()
//       ? this.session.completeFocus(
//           this.settings.getDurationFor(this.pomodoroPhase!),
//         )
//       : this.session;
//
//     const shouldAutoStart = this.settings.shouldAutoStart(nextPhase);
//
//     return new PomodoroTimer(
//       this.mode,
//       nextPhase,
//       shouldAutoStart ? TimerStatus.Running : TimerStatus.Idle,
//       this.settings.getDurationFor(nextPhase),
//       this.settings,
//       shouldAutoStart ? updatedSession.start() : updatedSession,
//     );
//   }
//
//   skip(): PomodoroTimer {
//     return this.complete();
//   }
//
//   switchMode(): TimerBase {
//     return StopwatchTimer.create(this.settings);
//   }
//
//   updateSettings(settings: TimerSettings): PomodoroTimer {
//     const duration =
//       this.status === TimerStatus.Idle
//         ? settings.getDurationFor(this.pomodoroPhase!)
//         : this.duration;
//
//     return new PomodoroTimer(
//       this.mode,
//       this.pomodoroPhase!,
//       this.status,
//       duration,
//       settings,
//       this.session,
//     );
//   }
//
//   resetSession(): PomodoroTimer {
//     return PomodoroTimer.create(this.settings);
//   }
//
//   getProgress(): number {
//     return this.duration.progressFrom(
//       this.settings.getDurationFor(this.pomodoroPhase!),
//     );
//   }
//
//   private calculateNextPhase(): PomodoroPhase {
//     if (this.pomodoroPhase!.isFocus()) {
//       return this.session.shouldTakeLongBreak(this.settings.longBreakInterval)
//         ? PomodoroPhase.LongBreak
//         : PomodoroPhase.ShortBreak;
//     }
//
//     return PomodoroPhase.Focus;
//   }
// }
//
// export class StopwatchTimer extends TimerBase {
//   static create(
//     settings: TimerSettings = TimerSettings.createDefault(),
//   ): StopwatchTimer {
//     return new StopwatchTimer(
//       TimerMode.Stopwatch,
//       null,
//       TimerStatus.Idle,
//       Duration.fromSeconds(0),
//       settings,
//       new TimerSession(),
//     );
//   }
//
//   start(): StopwatchTimer {
//     if (this.isRunning()) return this;
//
//     return new StopwatchTimer(
//       this.mode,
//       null,
//       TimerStatus.Running,
//       this.duration,
//       this.settings,
//       this.session.start(),
//     );
//   }
//
//   pause(): StopwatchTimer {
//     if (!this.isRunning()) return this;
//
//     return new StopwatchTimer(
//       this.mode,
//       null,
//       TimerStatus.Paused,
//       this.duration,
//       this.settings,
//       this.session,
//     );
//   }
//
//   stop(): StopwatchTimer {
//     return new StopwatchTimer(
//       this.mode,
//       null,
//       TimerStatus.Idle,
//       Duration.fromSeconds(0),
//       this.settings,
//       this.session,
//     );
//   }
//
//   tick(): { timer: StopwatchTimer; completed: boolean } {
//     if (!this.isRunning()) {
//       return { timer: this, completed: false };
//     }
//
//     return {
//       timer: new StopwatchTimer(
//         this.mode,
//         null,
//         this.status,
//         this.duration.add(1),
//         this.settings,
//         this.session,
//       ),
//       completed: false,
//     };
//   }
//
//   protected complete(): StopwatchTimer {
//     return this.stop();
//   }
//
//   skip(): StopwatchTimer {
//     return this.stop();
//   }
//
//   switchMode(): TimerBase {
//     return PomodoroTimer.create(this.settings);
//   }
//
//   updateSettings(settings: TimerSettings): StopwatchTimer {
//     return new StopwatchTimer(
//       this.mode,
//       null,
//       this.status,
//       this.duration,
//       settings,
//       this.session,
//     );
//   }
//
//   resetSession(): StopwatchTimer {
//     return StopwatchTimer.create(this.settings);
//   }
//
//   getProgress(): number {
//     return 0;
//   }
// }
