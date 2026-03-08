import { IProjectRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import { Project } from "@workspace/domain/entities/project.entity";

export class GetUserProjectsUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(userId: string): Promise<Project[]> {
    return await this.projectRepository.findByUserId(userId);
  }
}
