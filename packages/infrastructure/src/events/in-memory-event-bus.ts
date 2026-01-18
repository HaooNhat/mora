import { IEventBus } from "@workspace/application/interfaces/event-bus.interface";
import { DomainEvent } from "@workspace/domain/domain-events/base.event";

type EventHandler = (event: DomainEvent) => Promise<void>;

export class InMemoryEventBus implements IEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventName) || [];

    // Execute all handlers in parallel
    await Promise.all(handlers.map((handler) => handler(event)));
  }

  subscribe(eventName: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventName) || [];
    handlers.push(handler);
    this.handlers.set(eventName, handlers);
  }
}
