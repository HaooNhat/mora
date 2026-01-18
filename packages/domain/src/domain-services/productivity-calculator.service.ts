// import { TimerSession } from "@workspace/domain/entities/timer-session.entity";
// import { Task } from "@workspace/domain/entities/task.entity";
//
// export interface ProductivityMetrics {
//   totalFocusTime: number; // minutes
//   sessionsCompleted: number;
//   tasksCompleted: number;
//   averageSessionDuration: number; // minutes
//   completionRate: number; // percentage
// }
//
// export class ProductivityCalculatorService {
//   calculateDailyMetrics(
//     sessions: TimerSession[],
//     tasks: Task[],
//   ): ProductivityMetrics {
//     const completedSessions = sessions.filter((s) => s.completed);
//
//     const totalFocusTime = completedSessions.reduce((sum, session) => {
//       return sum + (session.actualDuration || 0) / 60;
//     }, 0);
//
//     const tasksCompleted = tasks.filter((t) => t.completed).length;
//
//     const avgDuration =
//       completedSessions.length > 0
//         ? totalFocusTime / completedSessions.length
//         : 0;
//
//     const completionRate =
//       tasks.length > 0 ? (tasksCompleted / tasks.length) * 100 : 0;
//
//     return {
//       totalFocusTime: Math.round(totalFocusTime),
//       sessionsCompleted: completedSessions.length,
//       tasksCompleted,
//       averageSessionDuration: Math.round(avgDuration),
//       completionRate: Math.round(completionRate),
//     };
//   }
//
//   /**
//    * Predict optimal session duration based on historical data
//    */
//   suggestSessionDuration(completedSessions: TimerSession[]): number {
//     if (completedSessions.length < 3) {
//       return 25; // Default Pomodoro
//     }
//
//     const recentSessions = completedSessions.slice(-10);
//     const avgDuration =
//       recentSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0) /
//       recentSessions.length /
//       60;
//
//     // Round to nearest 5 minutes
//     return Math.round(avgDuration / 5) * 5;
//   }
// }
