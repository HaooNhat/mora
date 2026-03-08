import { TimerSessionEntity } from "@workspace/domain/entities/timer-session.entity";
import { ITimerSessionRepository } from "@workspace/application/interfaces/repositories/timer-session.repository.interface";
import { IEventBus } from "@workspace/application/interfaces/event-bus.interface";
import { TimerSessionStartedEvent } from "@workspace/domain/domain-events/timer.events";
import {
  StartTimerSessionDto,
  StartTimerSessionDtoSchema,
} from "@workspace/application/dto/timer.dto";

export class StartTimerSessionUseCase {
  constructor(
    private sessionRepository: ITimerSessionRepository,
    private eventBus: IEventBus,
  ) {}

  async execute(dto: StartTimerSessionDto): Promise<{ sessionId: string }> {
    const validated = StartTimerSessionDtoSchema.parse(dto);

    const session = TimerSessionEntity.create({
      userId: validated.userId,
      taskId: validated.taskId,
      timerType: validated.timerType,
      startedAtt: new Date(),
      arousalStart: validated.arousalStart,
    });

    await this.sessionRepository.save(session.toJSON());

    await this.eventBus.publish(
      new TimerSessionStartedEvent(
        session.id,
        session.userId,
        validated.timerType,
        validated.taskId,
      ),
    );

    return { sessionId: session.id };
  }
}
