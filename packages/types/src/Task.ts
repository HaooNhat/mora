import { z } from "zod";

// Mood enum for task completion reflection
export const MoodSchema = z.enum([
  "very_happy",
  "happy",
  "neutral",
  "frustrated",
  "very_frustrated",
]);

export type Mood = z.infer<typeof MoodSchema>;

// Task status enum
export const TaskStatusSchema = z.enum(["todo", "in_progress", "done"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  status: TaskStatusSchema.default("todo"),

  estimatedMinutes: z.number().min(1).optional(),
  actualMinutesSpent: z.number().min(0).default(0),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),

  mood: MoodSchema.optional(),
  note: z.string().optional(),

  isImportant: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
  deadline: z.date().optional(),
  urgentDate: z.date().optional(),

  tags: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Task = z.infer<typeof TaskSchema>;

// For creating new tasks (without id, createdAt, updatedAt)
export const CreateTaskSchema = TaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: TaskStatusSchema.optional().default("todo"),
});
export type CreateTask = z.infer<typeof CreateTaskSchema>;

// For updating tasks (partial fields except id)
export const UpdateTaskSchema = TaskSchema.partial().required({ id: true });
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;

// Helper function to validate task completion
export const validateTaskCompletion = (task: UpdateTask) => {
  if (task.status === "done" && !task.completedAt) {
    return {
      ...task,
      completedAt: new Date(),
    };
  }
  if (task.status !== "done" && task.completedAt) {
    return {
      ...task,
      completedAt: undefined,
    };
  }
  return task;
};
