import { IArousalEntryRepository } from "@/interfaces/repositories/arousal-entry.repository.interface.js";
import { ArousalEntry } from "@workspace/domain/entities/arousal-entry.entity";

export class GetCurrentArousalUseCase {
  constructor(private moodRepository: IArousalEntryRepository) {}

  async execute(userId: string): Promise<ArousalEntry | null> {
    return await this.moodRepository.findLatestByUserId(userId);
  }
}
