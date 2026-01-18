import { ArousalLevelSchema } from "@workspace/domain/entities/arousal-entry.entity";
import z from "zod";

export const CreateDailyIntentionDtoSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().date(),
  focusTheme: z.string().optional(),
  targetFocusMinutes: z.number().min(0).default(120),
  plannedTaskIds: z.array(z.string().uuid()).default([]),

  // OPTIONAL: Morning mood check-in
  morningArousal: ArousalLevelSchema.optional(),

  isOffDay: z.boolean().default(false),
});
export type CreateDailyIntentionDto = z.infer<
  typeof CreateDailyIntentionDtoSchema
>;

export const ReflectDailyIntentionDtoSchema = z.object({
  intentionId: z.string().uuid(),

  // OPTIONAL: Evening mood check-in
  eveningArousal: ArousalLevelSchema.optional(),

  perceivedProductivity: z.number().min(1).max(5).optional(),
  whatWentWell: z.string().optional(),
  whatWasHard: z.string().optional(),
  tomorrowNote: z.string().optional(),
});
export type ReflectDailyIntentionDto = z.infer<
  typeof ReflectDailyIntentionDtoSchema
>;
