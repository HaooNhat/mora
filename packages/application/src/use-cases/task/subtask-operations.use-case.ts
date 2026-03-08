import { ITaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import {
  TaskEntity,
  SubtaskItem,
} from "@workspace/domain/entities/task.entity";

/**
 * Add subtask to a task
 */
export class AddSubtaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(params: {
    taskId: string;
    text: string;
  }): Promise<{ subtask: SubtaskItem }> {
    const task = await this.taskRepository.findById(params.taskId);
    if (!task) {
      throw new Error(`Task ${params.taskId} not found`);
    }

    const taskEntity = TaskEntity.fromPersistence(task);
    const subtask = taskEntity.addSubtask(params.text);

    await this.taskRepository.update(taskEntity.toJSON());

    return { subtask };
  }
}

/**
 * Update subtask text
 */
export class UpdateSubtaskTextUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(params: {
    taskId: string;
    subtaskId: string;
    text: string;
  }): Promise<void> {
    const task = await this.taskRepository.findById(params.taskId);
    if (!task) {
      throw new Error(`Task ${params.taskId} not found`);
    }

    const taskEntity = TaskEntity.fromPersistence(task);
    taskEntity.updateSubtask(params.subtaskId, params.text);

    await this.taskRepository.update(taskEntity.toJSON());
  }
}

/**
 * Toggle subtask done status
 */
export class ToggleSubtaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(params: { taskId: string; subtaskId: string }): Promise<void> {
    const task = await this.taskRepository.findById(params.taskId);
    if (!task) {
      throw new Error(`Task ${params.taskId} not found`);
    }

    const taskEntity = TaskEntity.fromPersistence(task);
    taskEntity.toggleSubtask(params.subtaskId);

    await this.taskRepository.update(taskEntity.toJSON());
  }
}

/**
 * Delete subtask
 */
export class DeleteSubtaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(params: { taskId: string; subtaskId: string }): Promise<void> {
    const task = await this.taskRepository.findById(params.taskId);
    if (!task) {
      throw new Error(`Task ${params.taskId} not found`);
    }

    const taskEntity = TaskEntity.fromPersistence(task);
    taskEntity.deleteSubtask(params.subtaskId);

    await this.taskRepository.update(taskEntity.toJSON());
  }
}

/**
 * Reorder subtasks
 */
export class ReorderSubtasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(params: {
    taskId: string;
    subtaskIds: string[];
  }): Promise<void> {
    const task = await this.taskRepository.findById(params.taskId);
    if (!task) {
      throw new Error(`Task ${params.taskId} not found`);
    }

    const taskEntity = TaskEntity.fromPersistence(task);
    taskEntity.reorderSubtasks(params.subtaskIds);

    await this.taskRepository.update(taskEntity.toJSON());
  }
}
