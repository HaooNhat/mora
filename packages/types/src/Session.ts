import { z } from "zod";

export const SessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).default("Untilted session"),
  taskId: z.string().uuid().optional(),
  startedAt: z.date(),
  endedAt: z.date().optional(),

  status: z.enum(["active", "paused", "completed", "abandoned"]),
});
export type Session = z.infer<typeof SessionSchema>;
