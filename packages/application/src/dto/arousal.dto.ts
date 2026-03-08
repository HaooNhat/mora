import { ArousalLevelSchema } from "@workspace/domain/entities/arousal-entry.entity";
import { z } from "zod";

export const RecordArousalDtoSchema = z.object({
  userId: z.string().uuid(),
  arousalLevel: ArousalLevelSchema,
  note: z.string().optional(),
});
export type RecordArousalDto = z.infer<typeof RecordArousalDtoSchema>;
