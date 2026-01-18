import { IArousalEntryRepository } from "@/interfaces/repositories/arousal-entry.repository.interface.js";
import { ITaskRepository } from "@workspace/application/interfaces/repositories/project.repository.interface";
import {
  TaskSuggestion,
  TaskSuggestionService,
} from "@workspace/domain/domain-services/task-suggestion.service";

export class GetTaskSuggestionUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private arousalRepository: IArousalEntryRepository,
    private taskSuggestionService: TaskSuggestionService,
  ) {}

  async execute(userId: string): Promise<TaskSuggestion | null> {
    // Get current mood
    const currentArousal =
      await this.arousalRepository.findLatestByUserId(userId);
    if (!currentArousal) {
      return null; // No mood data available
    }

    // Get incomplete tasks
    const tasks = await this.taskRepository.findByUserId(userId);

    return this.taskSuggestionService.suggestNextTask({
      tasks,
      arousal: currentArousal.arousal,
    });
  }
}

// export interface TaskRecommendation {
//   task: Task;
//   reason: string;
//   confidence: number; // 0-100
//   source: 'mood-based' | 'priority-based' | 'deadline-based';
// }
//
// export class GetTaskRecommendationsUseCase {
//   constructor(
//     private taskRepository: ITaskRepository,
//     private correlationsRepository: any, // ITaskMoodCorrelationRepository
//   ) {}
//
//   async execute(params: {
//     userId: string;
//     currentMood?: MoodType;
//     currentEnergy?: EnergyType;
//     limit?: number;
//   }): Promise<TaskRecommendation[]> {
//     const { userId, currentMood, currentEnergy, limit = 5 } = params;
//
//     const tasks = await this.taskRepository.findByUserId(userId);
//     const activeTasks = tasks.filter(t => ['todo', 'in_progress', 'paused'].includes(t.status));
//
//     // If user provides mood/energy, use intelligent matching
//     if (currentMood && currentEnergy) {
//       return this.getMoodBasedRecommendations(activeTasks, currentMood, currentEnergy, limit);
//     }
//
//     // Otherwise fall back to priority-based recommendations
//     return this.getPriorityBasedRecommendations(activeTasks, limit);
//   }
//
//   private async getMoodBasedRecommendations(
//     tasks: Task[],
//     mood: MoodType,
//     energy: EnergyType,
//     limit: number,
//   ): Promise<TaskRecommendation[]> {
//     const currentHour = new Date().getHours();
//
//     // Get learned correlations for current context
//     const correlations = await this.correlationsRepository.findByContext({
//       mood,
//       energy,
//       timeOfDay: currentHour,
//     });
//
//     // Score tasks based on correlations
//     const scored = tasks.map(task => {
//       const correlation = correlations.find(c => c.work_type === task.work_type);
//
//       let score = 0;
//       let reasons: string[] = [];
//
//       // Learned effectiveness
//       if (correlation && correlation.sessions_count >= 3) {
//         score += correlation.avg_perceived_productivity * 20;
//         reasons.push(`Works well when you're ${mood} energy`);
//       }
//
//       // Priority scoring
//       if (task.is_urgent) {
//         score += 30;
//         reasons.push('Urgent');
//       } else if (task.is_important) {
//         score += 20;
//         reasons.push('Important');
//       }
//
//       // Deadline proximity
//       if (task.deadline) {
//         const daysUntil = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
//         if (daysUntil <= 1) {
//           score += 40;
//           reasons.push('Due very soon');
//         } else if (daysUntil <= 3) {
//           score += 20;
//           reasons.push('Due soon');
//         }
//       }
//
//       return {
//         task,
//         score,
//         reason: reasons.join('. ') || 'Good match for current state',
//         confidence: Math.min(100, Math.max(0, score)),
//         source: 'mood-based' as const,
//       };
//     });
//
//     return scored.sort((a, b) => b.score - a.score).slice(0, limit);
//   }
//
//   private getPriorityBasedRecommendations(
//     tasks: Task[],
//     limit: number,
//   ): Promise<TaskRecommendation[]> {
//     const scored = tasks.map(task => {
//       let score = 0;
//       let reasons: string[] = [];
//
//       // Priority
//       if (task.is_urgent && task.is_important) {
//         score = 100;
//         reasons.push('Urgent & Important');
//       } else if (task.is_urgent) {
//         score = 70;
//         reasons.push('Urgent');
//       } else if (task.is_important) {
//         score = 50;
//         reasons.push('Important');
//       } else {
//         score = 30;
//       }
//
//       // Deadline
//       if (task.deadline) {
//         const daysUntil = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
//         if (daysUntil <= 1) {
//           score += 50;
//           reasons.push('Due today');
//         } else if (daysUntil <= 3) {
//           score += 25;
//           reasons.push('Due this week');
//         }
//       }
//
//       // In progress tasks
//       if (task.status === 'in_progress') {
//         score += 15;
//         reasons.push('Already started');
//       }
//
//       return {
//         task,
//         score,
//         reason: reasons.join('. ') || 'Ready to work on',
//         confidence: Math.min(100, score),
//         source: 'priority-based' as const,
//       };
//     });
//
//     return Promise.resolve(scored.sort((a, b) => b.score - a.score).slice(0, limit));
//   }
// }
