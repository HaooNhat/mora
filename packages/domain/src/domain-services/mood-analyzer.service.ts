// import { WorkType } from "@/entities/task.entity.js";
// import {
//   ArousalEntry,
//   ArousalLevel,
//   EnergyType,
// } from "@workspace/domain/entities/arousal-entry.entity";
//
// export interface ArousalPattern {
//   dominantArousal: ArousalLevel;
//   averageEnergy: number;
//   peakEnergyTime?: number; // hour of day (0-23)
//   lowEnergyTime?: number;
// }
//
// export class ArousalAnalyzerService {
//   /**
//    * Analyze mood patterns from historical entries
//    */
//   analyzePatterns(entries: ArousalEntry[]): ArousalPattern {
//     if (entries.length === 0) {
//       return {
//         dominantArousal: "neutral",
//         averageEnergy: 3,
//       };
//     }
//
//     // Find dominant mood
//     const moodCounts = new Map<ArousalLevel, number>();
//     let totalEnergy = 0;
//
//     entries.forEach((entry) => {
//       moodCounts.set(entry.mood, (moodCounts.get(entry.mood) || 0) + 1);
//       totalEnergy += entry.energyLevel;
//     });
//
//     const dominantArousal = Array.from(moodCounts.entries()).reduce((a, b) =>
//       b[1] > a[1] ? b : a,
//     )[0];
//
//     const averageEnergy = totalEnergy / entries.length;
//
//     // Find peak energy time
//     const hourlyEnergy = new Map<number, { total: number; count: number }>();
//
//     entries.forEach((entry) => {
//       const hour = entry.createdAt.getHours();
//       const current = hourlyEnergy.get(hour) || { total: 0, count: 0 };
//       hourlyEnergy.set(hour, {
//         total: current.total + entry.energyLevel,
//         count: current.count + 1,
//       });
//     });
//
//     let peakHour: number | undefined;
//     let lowHour: number | undefined;
//     let maxAvg = 0;
//     let minAvg = 5;
//
//     hourlyEnergy.forEach((data, hour) => {
//       const avg = data.total / data.count;
//       if (avg > maxAvg) {
//         maxAvg = avg;
//         peakHour = hour;
//       }
//       if (avg < minAvg) {
//         minAvg = avg;
//         lowHour = hour;
//       }
//     });
//
//     return {
//       dominantArousal,
//       averageEnergy,
//       peakEnergyTime: peakHour,
//       lowEnergyTime: lowHour,
//     };
//   }
//
//   /**
//    * Check if current mood/energy is suitable for a task
//    */
//   isTaskSuitable(
//     mood: ArousalLevel,
//     energy: EnergyType,
//     taskMode: WorkType,
//     taskEstimatedDuration?: number,
//   ): boolean {
//     // Low energy - only suitable for short, non-demanding tasks
//     if (energy <= 2) {
//       return (
//         !(taskMode === "creative") &&
//         (!taskEstimatedDuration || taskEstimatedDuration <= 25)
//       );
//     }
//
//     // Tired mood - avoid creative/long tasks
//     if (mood === "tired") {
//       return (
//         !(taskMode === "creative") &&
//         (!taskEstimatedDuration || taskEstimatedDuration <= 30)
//       );
//     }
//
//     // Stressed mood - avoid creative tasks
//     if (mood === "stressed") {
//       return !(taskMode === "creative");
//     }
//
//     // Creative mood - perfect for creative tasks
//     if (mood === "creative") {
//       return taskMode === "creative" || !(taskMode === "boring");
//     }
//
//     // Energized/focused - suitable for anything
//     return true;
//   }
// }
