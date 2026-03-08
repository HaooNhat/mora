// import { Task } from "@workspace/domain/entities/task.entity";
// import { ArousalLevel } from "@workspace/domain/entities/arousal-entry.entity";
//
// export interface TaskSuggestion {
//   task: Task;
//   reason: string;
//   confidence: number; // 0–100
// }
//
// type Compatibility = "safe" | "limited" | "blocked";
//
// export class TaskSuggestionService {
//   suggestNextTask(params: {
//     tasks: Task[];
//     arousal: ArousalLevel;
//     now?: Date;
//   }): TaskSuggestion | null {
//     const { tasks, arousal, now = new Date() } = params;
//
//     const candidates = tasks.filter(
//       (t) => t.status !== "done" && !t.abandonedAt,
//     );
//
//     if (candidates.length === 0) return null;
//
//     /** 1. Apply matrix gating */
//     const compatible = candidates
//       .map((task) => ({
//         task,
//         compatibility: this.getCompatibility(arousal, task.workType),
//       }))
//       .filter((x) => x.compatibility !== "blocked");
//
//     if (compatible.length === 0) return null;
//
//     /** 2. Score remaining tasks */
//     const scored = compatible.map(({ task, compatibility }) => {
//       let score = 0;
//       const reasons: string[] = [];
//
//       /** Safety first */
//       if (compatibility === "safe") {
//         score += 40;
//         reasons.push("Safe for current arousal");
//       } else {
//         score += 20;
//         reasons.push("Allowed with constraints");
//       }
//
//       /** Eisenhower bias */
//       if (task.isUrgent) {
//         score += 15;
//         reasons.push("Urgent");
//       } else if (task.isImportant) {
//         score += 10;
//         reasons.push("Important");
//       }
//
//       /** Deadline (soft) */
//       if (task.deadline) {
//         const hoursLeft =
//           (task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
//         if (hoursLeft <= 24) {
//           score += 10;
//           reasons.push("Due soon");
//         }
//       }
//
//       /** Duration sanity (especially for ⚠️ tasks) */
//       if (task.estimatedDuration) {
//         if (compatibility === "limited" && task.estimatedDuration > 30) {
//           score -= 10;
//           reasons.push("Too long for current state");
//         }
//         if (task.estimatedDuration <= 25) {
//           score += 5;
//         }
//       }
//
//       return {
//         task,
//         score,
//         reason: reasons.join(". "),
//       };
//     });
//
//     scored.sort((a, b) => b.score - a.score);
//     const best = scored[0]!;
//
//     return {
//       task: best.task,
//       reason: best.reason,
//       confidence: this.normalizeConfidence(best.score),
//     };
//   }
//
//   /** === MATRIX LOGIC === */
//   private getCompatibility(
//     arousal: ArousalLevel,
//     workType: Task["workType"],
//   ): Compatibility {
//     const matrix: Record<
//       ArousalLevel,
//       Record<Task["workType"], Compatibility>
//     > = {
//       very_low: {
//         deep: "blocked",
//         creative: "blocked",
//         repetitive: "limited",
//         light: "safe",
//       },
//       low: {
//         deep: "limited",
//         creative: "limited",
//         repetitive: "safe",
//         light: "safe",
//       },
//       optimal: {
//         deep: "safe",
//         creative: "safe",
//         repetitive: "safe",
//         light: "limited",
//       },
//       high: {
//         deep: "limited",
//         creative: "blocked",
//         repetitive: "safe",
//         light: "limited",
//       },
//       overloaded: {
//         deep: "blocked",
//         creative: "blocked",
//         repetitive: "limited",
//         light: "blocked",
//       },
//     };
//
//     return matrix[arousal][workType];
//   }
//
//   private normalizeConfidence(score: number): number {
//     return Math.max(0, Math.min(100, Math.round(score)));
//   }
// }
