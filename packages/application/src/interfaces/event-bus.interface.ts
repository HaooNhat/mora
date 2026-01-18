import { DomainEvent } from "@workspace/domain/domain-events/base.events";

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(
    eventName: string,
    handler: (event: DomainEvent) => Promise<void>,
  ): void;
}
