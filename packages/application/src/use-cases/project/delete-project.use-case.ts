import { IProjectRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import { ITaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";

export class DeleteProjectUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private taskRepository: ITaskRepository,
  ) {}

  async execute(
    projectId: string,
    options?: {
      deleteTasks?: boolean; // Default: false (just clear project_id)
    },
  ): Promise<void> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Handle tasks
    if (options?.deleteTasks) {
      // Option 1: Delete all tasks in project
      const tasks = await this.taskRepository.findByProjectId(projectId);
      for (const task of tasks) {
        await this.taskRepository.delete(task.id);
      }
    } else {
      // Option 2: Just clear project_id (tasks become standalone)
      await this.taskRepository.clearProjectId(projectId);
    }

    // Delete project
    await this.projectRepository.delete(projectId);
  }
}
