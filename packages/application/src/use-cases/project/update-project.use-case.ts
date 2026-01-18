import { ProjectEntity } from "@workspace/domain/entities/project.entity";
import { IProjectRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import {
  UpdateProjectDto,
  UpdateProjectDtoSchema,
} from "@workspace/application/dto/project.dto";

export class UpdateProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(dto: UpdateProjectDto): Promise<void> {
    const validated = UpdateProjectDtoSchema.parse(dto);

    const project = await this.projectRepository.findById(validated.id);
    if (!project) {
      throw new Error(`Project ${validated.id} not found`);
    }

    const entity = ProjectEntity.fromPersistence(project);

    if (validated.name) entity.updateName(validated.name);
    if (validated.description !== undefined)
      entity.updateDescription(validated.description);

    await this.projectRepository.update(entity.toJSON());
  }
}
