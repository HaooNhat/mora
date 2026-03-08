import { ITaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";

export class DeleteTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(taskId: string): Promise<void> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error(`Project ${taskId} not found`);
    }

    await this.taskRepository.delete(taskId);
  }
}
