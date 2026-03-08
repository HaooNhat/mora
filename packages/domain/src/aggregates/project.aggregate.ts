// import {
//   ProjectEntity,
//   Project,
// } from "@workspace/domain/entities/project.entity";
// import { TaskEntity, Task } from "@workspace/domain/entities/task.entity";
// import {
//   SubtaskEntity,
//   Subtask,
// } from "@workspace/domain/entities/subtask.entity";
//
// export class ProjectAggregate {
//   private tasks: Map<string, TaskEntity> = new Map();
//   /**
//    * Map taskId to subtasks
//    */
//   private subtasks: Map<string, SubtaskEntity[]> = new Map();
//
//   private constructor(private project: ProjectEntity) {}
//
//   static create(
//     projectData: Omit<Project, "id" | "createdAt" | "updatedAt">,
//   ): ProjectAggregate {
//     const project = ProjectEntity.create(projectData);
//     return new ProjectAggregate(project);
//   }
//
//   static fromPersistence(
//     projectData: Project,
//     tasksData: Task[],
//     subtasksData: Subtask[],
//   ): ProjectAggregate {
//     const project = ProjectEntity.fromPersistence(projectData);
//     const aggregate = new ProjectAggregate(project);
//
//     // Load tasks
//     tasksData.forEach((taskData) => {
//       const task = TaskEntity.fromPersistence(taskData);
//       aggregate.tasks.set(task.id, task);
//     });
//
//     // Load subtasks
//     subtasksData.forEach((subtaskData) => {
//       const subtask = SubtaskEntity.fromPersistence(subtaskData);
//       const taskSubtasks = aggregate.subtasks.get(subtaskData.taskId) || [];
//       taskSubtasks.push(subtask);
//       aggregate.subtasks.set(subtaskData.taskId, taskSubtasks);
//     });
//
//     return aggregate;
//   }
//
//   get projectId(): string {
//     return this.project.id;
//   }
//
//   get projectName(): string {
//     return this.project.name;
//   }
//
//   addTask(
//     taskData: Omit<Task, "id" | "completedAt" | "createdAt" | "updatedAt">,
//   ): TaskEntity {
//     const task = TaskEntity.create(taskData);
//     this.tasks.set(task.id, task);
//     return task;
//   }
//
//   addSubtask(
//     taskId: string,
//     subtaskData: Omit<
//       Subtask,
//       "id" | "taskId" | "completed" | "createdAt" | "updatedAt"
//     >,
//   ): SubtaskEntity {
//     if (!this.tasks.has(taskId)) {
//       throw new Error(`Task ${taskId} not found in project`);
//     }
//
//     const subtask = SubtaskEntity.create({ ...subtaskData, taskId });
//     const taskSubtasks = this.subtasks.get(taskId) || [];
//     taskSubtasks.push(subtask);
//     this.subtasks.set(taskId, taskSubtasks);
//
//     return subtask;
//   }
//
//   getTask(taskId: string): TaskEntity | undefined {
//     return this.tasks.get(taskId);
//   }
//
//   getAllTasks(): TaskEntity[] {
//     return Array.from(this.tasks.values());
//   }
//
//   getSubtasks(taskId: string): SubtaskEntity[] {
//     return this.subtasks.get(taskId) || [];
//   }
//
//   getCompletionPercentage(): number {
//     const tasks = Array.from(this.tasks.values());
//     if (tasks.length === 0) return 0;
//
//     const completed = tasks.filter((t) => t.status === "done").length;
//     return (completed / tasks.length) * 100;
//   }
//
//   toJSON() {
//     return {
//       project: this.project.toJSON(),
//       tasks: Array.from(this.tasks.values()).map((t) => t.toJSON()),
//       subtasks: Array.from(this.subtasks.entries()).flatMap(([, subs]) =>
//         subs.map((s) => s.toJSON()),
//       ),
//     };
//   }
// }
