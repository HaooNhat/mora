import { TimerSessionEntity } from "@workspace/domain/entities/timer-session.entity";
import { ITimerSessionRepository } from "@workspace/application/interfaces/repositories/timer-session.repository.interface";
import { IEventBus } from "@workspace/application/interfaces/event-bus.interface";
import { TimerSessionCompletedEvent } from "@workspace/domain/domain-events/timer.events";
import {
  CompleteTimerSessionDto,
  CompleteTimerSessionDtoSchema,
} from "@workspace/application/dto/timer.dto";

export class CompleteTimerSessionUseCase {
  constructor(
    private sessionRepository: ITimerSessionRepository,
    private eventBus: IEventBus,
  ) {}

  async execute(dto: CompleteTimerSessionDto): Promise<void> {
    const validated = CompleteTimerSessionDtoSchema.parse(dto);

    const session = await this.sessionRepository.findById(validated.sessionId);
    if (!session) {
      throw new Error(`Session ${validated.sessionId} not found`);
    }

    const entity = TimerSessionEntity.fromPersistence(session);

    entity.complete({
      endedReason: validated.endedReason,
      actualDuration: validated.actualDuration,
      arousalEnd: validated.arousalEnd,
      effectiveness: validated.effectiveness,
    });

    await this.sessionRepository.update(entity.toJSON());

    await this.eventBus.publish(
      new TimerSessionCompletedEvent(
        entity.id,
        entity.userId,
        entity.actualDuration ?? 0,
        session.taskId,
      ),
    );
  }
}
