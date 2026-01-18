import { IArousalEntryRepository } from "@/interfaces/repositories/arousal-entry.repository.interface.js";
import {
  RecordArousalDto,
  RecordArousalDtoSchema,
} from "@workspace/application/dto/mood.dto";
import { IEventBus } from "@workspace/application/interfaces/event-bus.interface";
import { ArousalRecordedEvent } from "@workspace/domain/domain-events/arousal.events";
import { ArousalEntryEntity } from "@workspace/domain/entities/arousal-entry.entity";

export class RecordMoodUseCase {
  constructor(
    private moodRepository: IArousalEntryRepository,
    private eventBus: IEventBus,
  ) {}

  async execute(dto: RecordArousalDto): Promise<{ entryId: string }> {
    const validated = RecordArousalDtoSchema.parse(dto);

    const entry = ArousalEntryEntity.create(validated);

    await this.moodRepository.save(entry.toJSON());

    await this.eventBus.publish(
      new ArousalRecordedEvent(
        entry.id,
        validated.userId,
        validated.arousalLevel,
      ),
    );

    return { entryId: entry.id };
  }
}
