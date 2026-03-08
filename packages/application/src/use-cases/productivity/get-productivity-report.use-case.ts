// import { ProductivityMetrics } from "@workspace/domain/domain-services/productivity-calculator.service";
// import { ITimerSessionRepository } from "@workspace/application/interfaces/repositories/timer-session.repository.interface";
// import { ITaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
// import { ProductivityCalculatorService } from "@workspace/domain/domain-services/productivity-calculator.service";
//
// export class GetProductivityReportUseCase {
//   constructor(
//     private sessionRepository: ITimerSessionRepository,
//     private taskRepository: ITaskRepository,
//     private productivityCalculator: ProductivityCalculatorService,
//   ) {}
//
//   async execute(
//     userId: string,
//     startDate: Date,
//     endDate: Date,
//   ): Promise<ProductivityMetrics> {
//     const sessions = await this.sessionRepository.findByUserIdAndDateRange(
//       userId,
//       startDate,
//       endDate,
//     );
//
//     const tasks = await this.taskRepository.findByUserId(userId);
//
//     // Filter tasks completed in date range
//     const tasksInRange = tasks.filter(
//       (t) => t.completed && t.updatedAt >= startDate && t.updatedAt <= endDate,
//     );
//
//     return this.productivityCalculator.calculateDailyMetrics(
//       sessions,
//       tasksInRange,
//     );
//   }
// }
