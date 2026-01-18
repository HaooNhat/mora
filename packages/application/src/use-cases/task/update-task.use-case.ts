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
    if (validated.isImportant || validated.isUrgent)
      entity.setPriority(
        validated.isImportant ?? false,
        validated.isUrgent ?? false,
      );
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
      notes: validated.notes ?? task.notes,
      estimatedDuration: validated.estimatedDuration ?? task.estimatedDuration,
    };

    await this.taskRepository.update(updatedTask);
  }
}
