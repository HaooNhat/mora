import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Project } from "../domain/entities/project";
import { Subtask } from "../domain/entities/subtask";
import { Task } from "../domain/entities/task";
import { WorkStatus } from "../domain/value-objects/work-status";
import { WorkType } from "../domain/value-objects/work-type";

interface ProjectSlice {
  projects: Project[];

  addProject: (
    userId: string,
    name: string,
    options?: { description?: string; color?: string },
  ) => Project;

  rehydrateProject: (
    id: string,
    userId: string,
    name: string,
    description: string,
    color: string,
    createdAt: Date,
    updatedAt: Date,
  ) => void;

  renameProject: (projectId: string, name: string) => void;

  updateProjectDescription: (projectId: string, description: string) => void;

  updateProjectColor: (projectId: string, color: string) => void;

  deleteProject: (projectId: string) => void;
}

interface TaskSlice {
  tasks: Task[];

  /**
   * Creates and adds a new Task via Task.create().
   * Throws if validation fails (e.g. empty title, title > 200 chars).
   * Returns the created Task so callers can use its generated id.
   */
  addTask: (
    title: string,
    description?: string,
    workType?: WorkType,
    options?: {
      projectId?: string;
      note?: string;
      isImportant?: boolean;
      isUrgent?: boolean;
      deadline?: Date;
    },
  ) => Task;

  /**
   * Rehydrates a Task from persistence via Task.fromPersistence().
   * Use this for API/DB responses — not for user-initiated creation.
   */
  rehydrateTask: (
    id: string,
    projectId: string,
    title: string,
    description: string,
    note: string,
    workType: WorkType,
    status: WorkStatus,
    isImportant: boolean,
    isUrgent: boolean,
    subtasks: Subtask[],
    deadline: Date | null,
    completedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) => void;

  /**
   * Applies a partial update via task.update().
   * Throws if updated values violate invariants (e.g. title too long).
   */
  updateTask: (
    taskId: string,
    updates: {
      title?: string;
      description?: string;
      note?: string;
      workType?: WorkType;
      status?: WorkStatus;
      isImportant?: boolean;
      isUrgent?: boolean;
      deadline?: Date | null;
    },
  ) => void;

  /** Removes a task by id. */
  deleteTask: (taskId: string) => void;

  /** Calls task.start(). No-op if already in progress. */
  startTask: (taskId: string) => void;

  /** Calls task.pause(). Throws if task is not in progress. */
  pauseTask: (taskId: string) => void;

  /** Calls task.resume(). Throws if task is not paused. */
  resumeTask: (taskId: string) => void;

  /** Calls task.markAsCompleted(). Sets completedAt automatically. */
  completeTask: (taskId: string) => void;

  /** Calls task.toggleImportant(). */
  toggleTaskImportant: (taskId: string) => void;

  /** Calls task.toggleUrgent(). */
  toggleTaskUrgent: (taskId: string) => void;

  /** Calls task.update({ workType }). */
  changeTaskWorkType: (taskId: string, workType: WorkType) => void;

  /** Calls task.update({ deadline }). Pass null to clear. */
  setTaskDeadline: (taskId: string, deadline: Date | null) => void;
}

interface SubtaskSlice {
  /**
   * Calls task.addSubtask(title) — Subtask.create() is invoked inside Task.
   * Throws if title is empty or exceeds 500 chars.
   */
  addSubtask: (taskId: string, title: string) => void;

  /**
   * Calls task.updateSubtask(subtaskId, title).
   * Throws if subtask not found or title invalid.
   */
  updateSubtask: (taskId: string, subtaskId: string, title: string) => void;

  /** Calls task.toggleSubtask(subtaskId). Throws if subtask not found. */
  toggleSubtask: (taskId: string, subtaskId: string) => void;

  /** Calls task.deleteSubtask(subtaskId). Throws if subtask not found. */
  deleteSubtask: (taskId: string, subtaskId: string) => void;
}

export type ProjectStoreState = ProjectSlice & TaskSlice & SubtaskSlice;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Finds a task by id, runs it through `updater` (which calls a domain method),
 * and returns the new tasks array. Throws if the task is not found.
 *
 * Because all Task domain methods throw on invariant violations, any error
 * from `updater` propagates to the call site — set() is never called with
 * invalid state.
 */
const applyToTask = (
  tasks: Task[],
  taskId: string,
  updater: (task: Task) => Task,
): Task[] => {
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index === -1) throw new Error(`Task not found: ${taskId}`);
  const next = [...tasks];
  next[index] = updater(tasks[index]!);
  return next;
};

/**
 * Same as applyToTask but for projects.
 */
const applyToProject = (
  projects: Project[],
  projectId: string,
  updater: (project: Project) => Project,
): Project[] => {
  const index = projects.findIndex((p) => p.id === projectId);
  if (index === -1) throw new Error(`Project not found: ${projectId}`);
  const next = [...projects];
  next[index] = updater(projects[index]!);
  return next;
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useProjectStore = create<ProjectStoreState>()(
  devtools(
    (set) => ({
      projects: [],
      tasks: [],

      addProject: (userId, name, options) => {
        const project = Project.create(userId, name, options);
        set(
          (s) => ({ projects: [...s.projects, project] }),
          false,
          "project/add",
        );
        return project;
      },

      rehydrateProject: (
        id,
        userId,
        name,
        description,
        color,
        createdAt,
        updatedAt,
      ) => {
        const project = Project.fromPersistence(
          id,
          userId,
          name,
          description,
          color,
          createdAt,
          updatedAt,
        );
        set(
          (s) => ({ projects: [...s.projects, project] }),
          false,
          "project/rehydrate",
        );
      },

      renameProject: (projectId, name) =>
        set(
          (s) => ({
            projects: applyToProject(s.projects, projectId, (p) =>
              p.updateName(name),
            ),
          }),
          false,
          "project/rename",
        ),

      updateProjectDescription: (projectId, description) =>
        set(
          (s) => ({
            projects: applyToProject(s.projects, projectId, (p) =>
              p.updateDescription(description),
            ),
          }),
          false,
          "project/updateDescription",
        ),

      updateProjectColor: (projectId, color) =>
        set(
          (s) => ({
            projects: applyToProject(s.projects, projectId, (p) =>
              p.updateColor(color),
            ),
          }),
          false,
          "project/updateColor",
        ),

      deleteProject: (projectId) =>
        set(
          (s) => ({
            projects: s.projects.filter((p) => p.id !== projectId),
            // Cascade-delete: Task has no knowledge of Project, so the store
            // is the right place to enforce this cross-entity rule.
            tasks: s.tasks.filter((t) => t.projectId !== projectId),
          }),
          false,
          "project/delete",
        ),

      addTask: (title, description, workType, options) => {
        const task = Task.create(title, description, workType, options);
        set((s) => ({ tasks: [...s.tasks, task] }), false, "task/add");
        return task;
      },

      rehydrateTask: (
        id,
        projectId,
        title,
        description,
        note,
        workType,
        status,
        isImportant,
        isUrgent,
        subtasks,
        deadline,
        completedAt,
        createdAt,
        updatedAt,
      ) => {
        const task = Task.fromPersistence(
          id,
          projectId,
          title,
          description,
          note,
          workType,
          status,
          isImportant,
          isUrgent,
          subtasks,
          deadline,
          completedAt,
          createdAt,
          updatedAt,
        );
        set((s) => ({ tasks: [...s.tasks, task] }), false, "task/rehydrate");
      },

      updateTask: (taskId, updates) =>
        set(
          (s) => ({
            tasks: applyToTask(s.tasks, taskId, (t) => t.update(updates)),
          }),
          false,
          "task/update",
        ),

      deleteTask: (taskId) =>
        set(
          (s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) }),
          false,
          "task/delete",
        ),

      startTask: (taskId) =>
        set(
          (s) => ({ tasks: applyToTask(s.tasks, taskId, (t) => t.start()) }),
          false,
          "task/start",
        ),

      pauseTask: (taskId) =>
        set(
          (s) => ({ tasks: applyToTask(s.tasks, taskId, (t) => t.pause()) }),
          false,
          "task/pause",
        ),

      resumeTask: (taskId) =>
        set(
          (s) => ({ tasks: applyToTask(s.tasks, taskId, (t) => t.resume()) }),
          false,
          "task/resume",
        ),

      completeTask: (taskId) =>
        set(
          (s) => ({
            tasks: applyToTask(s.tasks, taskId, (t) => t.markAsCompleted()),
          }),
          false,
          "task/complete",
        ),

      toggleTaskImportant: (taskId) =>
        set(
          (s) => ({
            tasks: applyToTask(s.tasks, taskId, (t) => t.toggleImportant()),
          }),
          false,
          "task/toggleImportant",
        ),

      toggleTaskUrgent: (taskId) =>
        set(
          (s) => ({
            tasks: applyToTask(s.tasks, taskId, (t) => t.toggleUrgent()),
          }),
          false,
          "task/toggleUrgent",
        ),

      changeTaskWorkType: (taskId, workType) =>
        set(
          (s) => ({
            tasks: applyToTask(s.tasks, taskId, (t) => t.update({ workType })),
          }),
          false,
          "task/changeWorkType",
        ),

      setTaskDeadline: (taskId, deadline) =>
        set(
          (s) => ({
            tasks: applyToTask(s.tasks, taskId, (t) => t.update({ deadline })),
          }),
          false,
          "task/setDeadline",
        ),

      addSubtask: (taskId, title) =>
        set(
          (s) => ({
            tasks: applyToTask(s.tasks, taskId, (t) => t.addSubtask(title)),
          }),
          false,
          "subtask/add",
        ),

      updateSubtask: (taskId, subtaskId, title) =>
        set(
          (s) => ({
            tasks: applyToTask(s.tasks, taskId, (t) =>
              t.updateSubtask(subtaskId, title),
            ),
          }),
          false,
          "subtask/update",
        ),

      toggleSubtask: (taskId, subtaskId) =>
        set(
          (s) => ({
            tasks: applyToTask(s.tasks, taskId, (t) =>
              t.toggleSubtask(subtaskId),
            ),
          }),
          false,
          "subtask/toggle",
        ),

      deleteSubtask: (taskId, subtaskId) =>
        set(
          (s) => ({
            tasks: applyToTask(s.tasks, taskId, (t) =>
              t.deleteSubtask(subtaskId),
            ),
          }),
          false,
          "subtask/delete",
        ),
    }),
    { name: "ProjectStore" },
  ),
);
