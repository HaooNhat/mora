import { ArousalEntry } from "@workspace/domain/entities/arousal-entry.entity";

export interface IArousalEntryRepository {
  findById(id: string): Promise<ArousalEntry | null>;
  findByUserId(userId: string): Promise<ArousalEntry[]>;
  findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ArousalEntry[]>;
  findLatestByUserId(userId: string): Promise<ArousalEntry | null>;
  save(entry: ArousalEntry): Promise<void>;
  delete(id: string): Promise<void>;
}
