import { DomainEvent } from "@workspace/domain/domain-events/base.events";
import { ArousalLevel } from "@workspace/domain/entities/arousal-entry.entity";

export class ArousalRecordedEvent extends DomainEvent {
  constructor(
    public readonly entryId: string,
    public readonly userId: string,
    public readonly arousal: ArousalLevel,
  ) {
    super();
  }

  get eventName(): string {
    return "ArousalRecorded";
  }
}
