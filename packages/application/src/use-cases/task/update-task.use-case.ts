import { TaskEntity } from "@workspace/domain/entities/task.entity";
import { ITaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import {
  UpdateTaskDto,
  UpdateTaskDtoSchema,
} from "@workspace/application/dto/project.dto";

export class UpdateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(dto: UpdateTaskDto): Promise<void> {
    const validated = UpdateTaskDtoSchema.parse(dto);

    const task = await this.taskRepository.findById(validated.id);
    if (!task) {
      throw new Error(`Task ${validated.id} not found`);
    }

    const entity = TaskEntity.fromPersistence(task);

    if (validated.title) entity.updateTitle(validated.title);
    if (validated.isImportant !== undefined)
      entity.setImportant(validated.isImportant);
    if (validated.isUrgent !== undefined) entity.setUrgent(validated.isUrgent);
    if (validated.workType !== undefined) {
      entity.updateWorkType(validated.workType ?? task.workType);
    }

    // Update other fields directly on the JSON
    const updatedTask = {
      ...entity.toJSON(),
      description: validated.description ?? task.description,
      deadline: validated.deadline
        ? new Date(validated.deadline)
        : task.deadline,
      notes: validated.note ?? task.note,
      estimatedDuration: validated.estimatedDuration ?? task.estimatedDuration,
    };

    await this.taskRepository.update(updatedTask);
  }
}
