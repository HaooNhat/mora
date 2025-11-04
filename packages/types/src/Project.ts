import { z } from "zod";

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),

  color: z.string().optional(), // For visual organization
  // totalTimeSpent: z.number().min(0).default(0), // in minutes

  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Project = z.infer<typeof ProjectSchema>;

// For creating new projects (without id, createdAt, updatedAt)
export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateProject = z.infer<typeof CreateProjectSchema>;

// For updating projects (partial fields except id)
export const UpdateProjectSchema = ProjectSchema.partial().required({
  id: true,
});
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
