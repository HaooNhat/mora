import { IProjectRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import { ITaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";

export class DeleteProjectUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private taskRepository: ITaskRepository,
  ) {}

  async execute(projectId: string): Promise<void> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Delete all tasks in project
    const tasks = await this.taskRepository.findByProjectId(projectId);
    for (const task of tasks) {
      await this.taskRepository.delete(task.id);
    }

    // Delete project
    await this.projectRepository.delete(projectId);
  }
}
