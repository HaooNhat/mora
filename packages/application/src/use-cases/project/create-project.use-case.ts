import { ProjectEntity } from "@workspace/domain/entities/project.entity";
import { IProjectRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import {
  CreateProjectDto,
  CreateProjectDtoSchema,
} from "@workspace/application/dto/project.dto";

export class CreateProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(dto: CreateProjectDto): Promise<{ projectId: string }> {
    // Validate input
    const validated = CreateProjectDtoSchema.parse(dto);

    // Create entity
    const project = ProjectEntity.create(validated);

    // Persist
    await this.projectRepository.save(project.toJSON());

    return { projectId: project.id };
  }
}
