import { TaskEntity } from "@workspace/domain/entities/task.entity";
import { ITaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import { IProjectRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import { IEventBus } from "@workspace/application/interfaces/event-bus.interface";
import { TaskCreatedEvent } from "@workspace/domain/domain-events/task.events";
import {
  CreateTaskDto,
  CreateTaskDtoSchema,
} from "@workspace/application/dto/project.dto";

export class CreateTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private projectRepository: IProjectRepository,
    private eventBus: IEventBus,
  ) {}

  async execute(dto: CreateTaskDto): Promise<{ taskId: string }> {
    const validated = CreateTaskDtoSchema.parse(dto);

    // Verify project exists
    if (validated.projectId) {
      const project = await this.projectRepository.findById(
        validated.projectId,
      );
      if (!project) {
        throw new Error(`Project ${validated.projectId} not found`);
      }
    }

    // Convert deadline string to Date if provided
    const taskData = {
      ...validated,
      deadline: validated.deadline ? new Date(validated.deadline) : undefined,
    };

    const task = TaskEntity.create(taskData);

    await this.taskRepository.save(task.toJSON());

    // Publish event
    await this.eventBus.publish(
      new TaskCreatedEvent(task.id, task.projectId, task.userId, task.title),
    );

    return { taskId: task.id };
  }
}
