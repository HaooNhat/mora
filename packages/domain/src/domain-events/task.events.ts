import { DomainEvent } from "@workspace/domain/domain-events/base.events";

export class TaskCompletedEvent extends DomainEvent {
  constructor(
    public readonly taskId: string,
    public readonly projectId: string | undefined,
    public readonly userId: string,
  ) {
    super();
  }

  get eventName(): string {
    return "TaskCompleted";
  }
}

export class TaskCreatedEvent extends DomainEvent {
  constructor(
    public readonly taskId: string,
    public readonly projectId: string | undefined,
    public readonly userId: string,
    public readonly title: string,
  ) {
    super();
  }

  get eventName(): string {
    return "TaskCreated";
  }
}
