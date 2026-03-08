import { ProjectEntity } from "@workspace/domain/entities/project.entity";
import { IProjectRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import {
  CreateProjectDto,
  CreateProjectDtoSchema,
} from "@workspace/application/dto/project.dto";

export class CreateProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(dto: CreateProjectDto): Promise<{ projectId: string }> {
    console.log("Check 1");
    // Validate input
    const validated = CreateProjectDtoSchema.parse(dto);
    console.log("Check 2");

    // Create entity
    const project = ProjectEntity.create(validated);
    console.log("Check 3");

    console.log("Test: ", project.toJSON());
    // Persist
    await this.projectRepository.save(project.toJSON());
    console.log("Check 4");

    return { projectId: project.id };
  }
}
