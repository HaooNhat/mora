// import { IArousalEntryRepository } from "@workspace/application/interfaces/repositories/mood-entry.repository.interface";
// import {
//   MoodAnalyzerService,
//   MoodPattern,
// } from "@workspace/domain/domain-services/mood-analyzer.service";
//
// export class GetMoodInsightsUseCase {
//   constructor(
//     private moodRepository: IArousalEntryRepository,
//     private moodAnalyzer: MoodAnalyzerService,
//   ) {}
//
//   async execute(
//     userId: string,
//     startDate: Date,
//     endDate: Date,
//   ): Promise<MoodPattern> {
//     const entries = await this.moodRepository.findByUserIdAndDateRange(
//       userId,
//       startDate,
//       endDate,
//     );
//
//     return this.moodAnalyzer.analyzePatterns(entries);
//   }
// }
