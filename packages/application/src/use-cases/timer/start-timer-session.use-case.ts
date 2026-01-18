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
      user_id: validated.userId,
      task_id: validated.taskId,
      mode: validated.mode,
      phase: validated.phase,
      started_at: new Date(),
      planned_duration: validated.plannedDuration,
      paused_duration: 0,
      interruptions: 0,
      // These will be undefined if user doesn't track mood
      mood_before: validated.moodBefore,
      energy_before: validated.energyBefore,
    });

    await this.sessionRepository.save(session.toJSON());

    await this.eventBus.publish(
      new TimerSessionStartedEvent(
        session.id,
        session.userId,
        validated.mode,
        validated.taskId,
        session.hasMoodTracking,
      ),
    );

    return { sessionId: session.id };
  }
}
