/**
 * Timer Domain Events
 *
 * Events represent things that have happened in the domain.
 * They are immutable and should be named in past tense.
 */

import type { TimerMode, PomodoroPhase } from "./types.js";

export interface DomainEvent {
  readonly eventType: string;
  readonly occurredAt: number;
  readonly aggregateId?: string;
}

/**
 * Timer was started or resumed
 */
export class TimerStartedEvent implements DomainEvent {
  readonly eventType = "TimerStarted";

  constructor(
    readonly occurredAt: number,
    readonly mode: TimerMode,
    readonly aggregateId?: string,
  ) {}
}

/**
 * Timer was paused
 */
export class TimerPausedEvent implements DomainEvent {
  readonly eventType = "TimerPaused";

  constructor(
    readonly occurredAt: number,
    readonly remainingTime: number,
    readonly aggregateId?: string,
  ) {}
}

/**
 * Timer was reset
 */
export class TimerResetEvent implements DomainEvent {
  readonly eventType = "TimerReset";

  constructor(
    readonly occurredAt: number,
    readonly mode: TimerMode,
    readonly aggregateId?: string,
  ) {}
}

/**
 * Timer completed (reached 0 or max duration)
 */
export class TimerCompletedEvent implements DomainEvent {
  readonly eventType = "TimerCompleted";

  constructor(
    readonly occurredAt: number,
    readonly mode: TimerMode,
    readonly phase?: PomodoroPhase,
    readonly aggregateId?: string,
  ) {}
}

/**
 * Timer ticked (1 second passed)
 */
export class TimerTickedEvent implements DomainEvent {
  readonly eventType = "TimerTicked";

  constructor(
    readonly occurredAt: number,
    readonly currentTime: number,
    readonly aggregateId?: string,
  ) {}
}

/**
 * Pomodoro transitioned to next phase
 */
export class PhaseTransitionedEvent implements DomainEvent {
  readonly eventType = "PhaseTransitioned";

  constructor(
    readonly occurredAt: number,
    readonly fromPhase: PomodoroPhase,
    readonly toPhase: PomodoroPhase,
    readonly session: number,
    readonly aggregateId?: string,
  ) {}
}
