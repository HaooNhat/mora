import { ITaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import { Task } from "@workspace/domain/entities/task.entity";

export class GetUserTasksUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    // private arousalAnalyzer: ArousalAnalyzerService,
  ) {}

  async execute(userId: string): Promise<Task[]> {
    const allTasks = await this.taskRepository.findByUserId(userId);

    return allTasks;
  }
}
