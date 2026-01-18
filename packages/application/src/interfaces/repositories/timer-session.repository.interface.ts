import { TimerSession } from "@workspace/domain/entities/timer-session.entity";

export interface ITimerSessionRepository {
  findById(id: string): Promise<TimerSession | null>;
  findByUserId(userId: string): Promise<TimerSession[]>;
  findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TimerSession[]>;
  save(session: TimerSession): Promise<void>;
  update(session: TimerSession): Promise<void>;
  delete(id: string): Promise<void>;
}
