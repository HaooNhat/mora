import { DomainEvent } from "@workspace/domain/domain-events/base.events";
import { TimerMode } from "@workspace/domain/entities/timer-session.entity";

export class TimerSessionStartedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly mode: TimerMode,
    public readonly taskId?: string,
    public readonly hasMoodTracking?: boolean,
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
    public readonly duration: number,
    public readonly taskId?: string,
    public readonly hasRatings?: boolean,
    public readonly hasMoodTracking?: boolean,
  ) {
    super();
  }

  get eventName(): string {
    return "TimerSessionCompleted";
  }
}

export class PomodoroPhaseChangedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly sessionNumber: number,
  ) {
    super();
  }

  get eventName(): string {
    return "PomodoroPhaseChanged";
  }
}
