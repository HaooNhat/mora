// import { ITaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
// // import { ArousalAnalyzerService } from "@workspace/domain/domain-services/arousal-analyzer.service";
// import { ArousalLevel } from "@workspace/domain/entities/arousal-entry.entity";
// import { Task } from "@workspace/domain/entities/task.entity";
//
// export class GetTasksByArousalUseCase {
//   constructor(
//     private taskRepository: ITaskRepository,
//     // private arousalAnalyzer: ArousalAnalyzerService,
//   ) {}
//
//   async execute(userId: string, arousal: ArousalLevel): Promise<Task[]> {
//     const allTasks = await this.taskRepository.findByUserId(userId);
//
//     // Filter incomplete tasks
//     const incompleteTasks = allTasks.filter((t) => t.status !== "done");
//
//     // Filter by arousal suitability
//     return incompleteTasks.filter((task) =>
//       this.arousalAnalyzer.isTaskSuitable(
//         arousal,
//         task.workType,
//         task.estimatedDuration,
//       ),
//     );
//   }
// }
