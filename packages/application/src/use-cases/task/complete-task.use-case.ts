import { IEventBus } from "@workspace/application/interfaces/event-bus.interface";
import { ITaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import { TaskCompletedEvent } from "@workspace/domain/domain-events/task.events";
import { TaskEntity } from "@workspace/domain/entities/task.entity";

export class CompleteTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private eventBus: IEventBus,
  ) {}

  async execute(taskId: string): Promise<void> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const entity = TaskEntity.fromPersistence(task);
    entity.markAsCompleted();

    await this.taskRepository.update(entity.toJSON());

    await this.eventBus.publish(
      new TaskCompletedEvent(taskId, task?.projectId, task.userId),
    );
  }
}
