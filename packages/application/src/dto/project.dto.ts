import {
  TaskStatusSchema,
  WorkTypeSchema,
} from "@workspace/domain/entities/task.entity";
import { z } from "zod";

export const CreateProjectDtoSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
});

export type CreateProjectDto = z.infer<typeof CreateProjectDtoSchema>;

export const UpdateProjectDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});
export type UpdateProjectDto = z.infer<typeof UpdateProjectDtoSchema>;

export const CreateTaskDtoSchema = z.object({
  userId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  workType: WorkTypeSchema,
  isImportant: z.boolean().default(false),
  isUrgent: z.boolean().default(false),

  // Optional: Let users set these if they want, otherwise app learns
  mentalLoad: z.number().min(1).max(5).optional(),
  energyRequired: z.number().min(1).max(5).optional(),

  deadline: z.string().datetime().optional(),
  scheduledFor: z.string().date().optional(),
  estimatedDuration: z.number().positive().optional(),
  notes: z.string().optional(),
});

export type CreateTaskDto = z.infer<typeof CreateTaskDtoSchema>;

export const UpdateTaskDtoSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  note: z.string().optional(),
  workType: WorkTypeSchema.optional(),
  status: TaskStatusSchema.optional(),
  isImportant: z.boolean().optional(),
  isUrgent: z.boolean().optional(),
  deferredUntil: z.string().date().optional(),
  abandonedAt: z.string().date().optional(),
  deadline: z.string().datetime().optional(),
  estimatedDuration: z.number().positive().optional(),
  completedAt: z.date().optional(),
});
export type UpdateTaskDto = z.infer<typeof UpdateTaskDtoSchema>;

export const DeleteTaskDtoSchema = z.object({
  userId: z.string().uuid(),
});

export type DeleteTaskDto = z.infer<typeof DeleteTaskDtoSchema>;

export const AddSubtaskDtoSchema = z.object({
  taskId: z.string().uuid(),
  text: z.string().min(1),
});
export type AddSubtaskDto = z.infer<typeof AddSubtaskDtoSchema>;

export const UpdateSubtaskDtoSchema = z.object({
  taskId: z.string().uuid(),
  subtaskId: z.string().uuid(),
  text: z.string().min(1),
});
export type UpdateSubtaskDto = z.infer<typeof UpdateSubtaskDtoSchema>;

export const ToggleSubtaskDtoSchema = z.object({
  taskId: z.string().uuid(),
  subtaskId: z.string().uuid(),
});
export type ToggleSubtaskDto = z.infer<typeof ToggleSubtaskDtoSchema>;

export const ReorderSubtasksDtoSchema = z.object({
  taskId: z.string().uuid(),
  subtaskIds: z.array(z.string().uuid()),
});
export type ReorderSubtasksDto = z.infer<typeof ReorderSubtasksDtoSchema>;
