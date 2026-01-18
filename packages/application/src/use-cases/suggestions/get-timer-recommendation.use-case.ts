import { TimerConfiguration } from "@workspace/domain/value-objects/timer-configuration.vo";
import { TimerRecommenderService } from "@workspace/domain/domain-services/timer-recommender.service";
import { IArousalEntryRepository } from "@/interfaces/repositories/arousal-entry.repository.interface.js";

export class GetTimerRecommendationUseCase {
  constructor(
    private arousalRepository: IArousalEntryRepository,
    private timerRecommender: TimerRecommenderService,
  ) {}

  async execute(userId: string): Promise<TimerConfiguration> {
    const currentArousal =
      await this.arousalRepository.findLatestByUserId(userId);

    const arousal = currentArousal?.arousal ?? "optimal";
    // const currentHour = new Date().getHours();

    return this.timerRecommender.recommendConfiguration({ arousal });
  }
}
