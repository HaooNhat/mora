import { TimerSession } from "@workspace/domain/entities/timer-session.entity";
import { ITimerSessionRepository } from "@workspace/application/interfaces/repositories/timer-session.repository.interface";

export class GetUserSessionsUseCase {
  constructor(private sessionRepository: ITimerSessionRepository) {}

  async execute(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TimerSession[]> {
    if (startDate && endDate) {
      return await this.sessionRepository.findByUserIdAndDateRange(
        userId,
        startDate,
        endDate,
      );
    }

    return await this.sessionRepository.findByUserId(userId);
  }
}
