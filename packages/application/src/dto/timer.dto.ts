import { ArousalLevelSchema } from "@workspace/domain/entities/arousal-entry.entity";
import { TimerModeSchema } from "@workspace/domain/entities/timer-session.entity";
import { z } from "zod";

export const StartTimerSessionDtoSchema = z.object({
  userId: z.string().uuid(),
  taskId: z.string().uuid().optional(), // ambient focus support
  mode: TimerModeSchema,
  plannedDuration: z.number().min(1), // seconds

  // OPTIONAL: User can skip mood tracking entirely
  arousalBefore: ArousalLevelSchema.optional(),
});

export type StartTimerSessionDto = z.infer<typeof StartTimerSessionDtoSchema>;

export const CompleteTimerSessionDtoSchema = z.object({
  sessionId: z.string().uuid(),
  pausedDuration: z.number().min(0).default(0),
  interruptions: z.number().min(0).default(0),

  // OPTIONAL: User can skip effectiveness ratings
  perceivedFocus: z.number().min(1).max(5).optional(),
  perceivedProductivity: z.number().min(1).max(5).optional(),
});

export type CompleteTimerSessionDto = z.infer<
  typeof CompleteTimerSessionDtoSchema
>;
