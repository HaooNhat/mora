import { DomainEvent } from "@workspace/domain/domain-events/base.events";
import { TimerType } from "@workspace/domain/entities/timer-session.entity";

export class TimerSessionStartedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly timerType: TimerType,
    public readonly taskId?: string,
  ) {
    super();
  }

  get eventName(): string {
    return "TimerSessionStarted";
  }
}

export class TimerSessionCompletedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly actualDuration: number,
    public readonly taskId?: string,
  ) {
    super();
  }

  get eventName(): string {
    return "TimerSessionCompleted";
  }
}

// export class PomodoroPhaseChangedEvent extends DomainEvent {
//   constructor(
//     public readonly sessionId: string,
//     public readonly userId: string,
//     public readonly sessionNumber: number,
//   ) {
//     super();
//   }
//
//   get eventName(): string {
//     return "PomodoroPhaseChanged";
//   }
// }
