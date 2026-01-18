// import {
//   CreateDailyIntentionDto,
//   CreateDailyIntentionDtoSchema,
// } from "@/dto/daily-intention.dto.js";
// import { DailyIntentionEntity } from "@workspace/domain/entities/daily-intention.entity";
//
// export class CreateDailyIntentionUseCase {
//   constructor(private intentionRepository: IDailyIntentionRepository) {}
//
//   async execute(
//     dto: CreateDailyIntentionDto,
//   ): Promise<{ intentionId: string }> {
//     const validated = CreateDailyIntentionDtoSchema.parse(dto);
//
//     // Check if intention already exists for this date
//     const existing = await this.intentionRepository.findByUserIdAndDate(
//       validated.userId,
//       new Date(validated.date),
//     );
//
//     if (existing) {
//       throw new Error(`Daily intention already exists for ${validated.date}`);
//     }
//
//     const intention = DailyIntentionEntity.create({
//       user_id: validated.userId,
//       date: new Date(validated.date),
//       focus_theme: validated.focusTheme,
//       target_focus_minutes: validated.targetFocusMinutes,
//       planned_task_ids: validated.plannedTaskIds,
//       // Mood fields are optional
//       morning_mood: validated.morningMood,
//       morning_energy: validated.morningEnergy,
//       is_off_day: validated.isOffDay,
//     });
//
//     await this.intentionRepository.save(intention.toJSON());
//
//     return { intentionId: intention.id };
//   }
// }
