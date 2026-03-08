import { ArousalLevelSchema } from "@workspace/domain/entities/arousal-entry.entity";
import {
  EndedReasonSchema,
  TimerTypeSchema,
} from "@workspace/domain/entities/timer-session.entity";
import { z } from "zod";

export const StartTimerSessionDtoSchema = z.object({
  userId: z.string().uuid(),
  taskId: z.string().uuid().optional(), // ambient focus support
  timerType: TimerTypeSchema,
  startedAt: z.date(),

  // OPTIONAL: User can skip mood tracking entirely
  arousalStart: ArousalLevelSchema.optional(),
});

export type StartTimerSessionDto = z.infer<typeof StartTimerSessionDtoSchema>;

export const CompleteTimerSessionDtoSchema = z.object({
  sessionId: z.string().uuid(),

  endedReason: EndedReasonSchema,
  actualDuration: z.number().positive().optional(),
  arousalEnd: ArousalLevelSchema.optional(),
  effectiveness: z.number().min(0).max(1).optional(), // 0-1 scale
});

export type CompleteTimerSessionDto = z.infer<
  typeof CompleteTimerSessionDtoSchema
>;
