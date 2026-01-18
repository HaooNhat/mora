import { Project } from "@workspace/domain/entities/project.entity";
import { Task } from "@workspace/domain/entities/task.entity";
import { Subtask } from "@workspace/domain/entities/subtask.entity";

export interface IProjectRepository {
  findById(id: string): Promise<Project | null>;
  findByUserId(userId: string): Promise<Project[]>;
  save(project: Project): Promise<void>;
  update(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByProjectId(projectId: string): Promise<Task[]>;
  findByUserId(userId: string): Promise<Task[]>;
  save(task: Task): Promise<void>;
  update(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ISubtaskRepository {
  findById(id: string): Promise<Subtask | null>;
  findByTaskId(taskId: string): Promise<Subtask[]>;
  save(subtask: Subtask): Promise<void>;
  update(subtask: Subtask): Promise<void>;
  delete(id: string): Promise<void>;
}
