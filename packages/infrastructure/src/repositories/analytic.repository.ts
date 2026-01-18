// /**
//  * Analytics Repository - Data Access Layer
//  */
//
// import { supabase } from "@workspace/infrastructure/supabase/client";
// import type {
//   DailySummary,
//   FocusSession,
//   ProductivityInsight,
//   TimeDistribution,
// } from "@workspace/domain/analytic/types";
// import type { MoodType } from "@workspace/domain/mood/types";
//
// /**
//  * Analytics Repository
//  */
// export const analyticsRepository = {
//   /* ================================
//      FOCUS SESSIONS
//   ================================ */
//
//   async createFocusSession(data: {
//     userId: string;
//     startedAt: Date;
//     endedAt: Date;
//     duration: number;
//     timerMode: "pomodoro" | "stopwatch";
//     mood?: MoodType;
//     energyLevel?: 1 | 2 | 3 | 4 | 5;
//     projectId?: string;
//     taskId?: string;
//     completed: boolean;
//     interruptions?: number;
//   }): Promise<FocusSession> {
//     const { data: session, error } = await supabase
//       .from("focus_sessions")
//       .insert({
//         user_id: data.userId,
//         started_at: data.startedAt.toISOString(),
//         ended_at: data.endedAt.toISOString(),
//         duration: data.duration,
//         timer_mode: data.timerMode,
//         mood: data.mood,
//         energy_level: data.energyLevel,
//         project_id: data.projectId,
//         task_id: data.taskId,
//         completed: data.completed,
//         interruptions: data.interruptions ?? 0,
//       })
//       .select()
//       .single();
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to create focus session`,
//       );
//     }
//
//     return this.mapDbSessionToDomain(session);
//   },
//
//   async getFocusSessionsByDateRange(
//     userId: string,
//     startDate: Date,
//     endDate: Date,
//   ): Promise<FocusSession[]> {
//     const { data, error } = await supabase
//       .from("focus_sessions")
//       .select("*")
//       .eq("user_id", userId)
//       .gte("started_at", startDate.toISOString())
//       .lte("started_at", endDate.toISOString())
//       .order("started_at", { ascending: false });
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to fetch focus sessions`,
//       );
//     }
//
//     return data.map(this.mapDbSessionToDomain);
//   },
//
//   async getTodayFocusSessions(userId: string): Promise<FocusSession[]> {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);
//
//     return this.getFocusSessionsByDateRange(userId, today, tomorrow);
//   },
//
//   /* ================================
//      DAILY SUMMARIES
//   ================================ */
//
//   async getDailySummary(
//     userId: string,
//     date: Date,
//   ): Promise<DailySummary | null> {
//     const dateStr = date.toISOString().split("T")[0];
//
//     const { data, error } = await supabase
//       .from("daily_summaries")
//       .select("*")
//       .eq("user_id", userId)
//       .eq("date", dateStr)
//       .single();
//
//     if (error) {
//       if (error.code === "PGRST116") return null;
//       throw new Error(
//         `${error.code}, ${error.details} Failed to fetch daily summary`,
//       );
//     }
//
//     return this.mapDbSummaryToDomain(data);
//   },
//
//   async getDailySummaries(
//     userId: string,
//     startDate: Date,
//     endDate: Date,
//   ): Promise<DailySummary[]> {
//     const startStr = startDate.toISOString().split("T")[0];
//     const endStr = endDate.toISOString().split("T")[0];
//
//     const { data, error } = await supabase
//       .from("daily_summaries")
//       .select("*")
//       .eq("user_id", userId)
//       .gte("date", startStr)
//       .lte("date", endStr)
//       .order("date", { ascending: false });
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to fetch daily summaries`,
//       );
//     }
//
//     return data.map(this.mapDbSummaryToDomain);
//   },
//
//   async calculateDailySummary(userId: string, date: Date): Promise<void> {
//     const dateStr = date.toISOString().split("T")[0];
//
//     const { error } = await supabase.rpc("calculate_daily_summary", {
//       p_user_id: userId,
//       p_date: dateStr,
//     });
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to calculate daily summary`,
//       );
//     }
//   },
//
//   async updateStreak(userId: string): Promise<number> {
//     const { data, error } = await supabase.rpc("update_streak", {
//       p_user_id: userId,
//     });
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to update streak`,
//       );
//     }
//
//     return data as number;
//   },
//
//   /* ================================
//      INSIGHTS
//   ================================ */
//
//   async getInsights(
//     userId: string,
//     limit: number = 5,
//   ): Promise<ProductivityInsight[]> {
//     const { data, error } = await supabase
//       .from("productivity_insights")
//       .select("*")
//       .eq("user_id", userId)
//       .eq("dismissed", false)
//       .order("created_at", { ascending: false })
//       .limit(limit);
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to fetch insights`,
//       );
//     }
//
//     return data.map(this.mapDbInsightToDomain);
//   },
//
//   async createInsight(
//     userId: string,
//     insight: Omit<ProductivityInsight, "id" | "createdAt">,
//   ): Promise<ProductivityInsight> {
//     const { data, error } = await supabase
//       .from("productivity_insights")
//       .insert({
//         user_id: userId,
//         type: insight.type,
//         title: insight.title,
//         description: insight.description,
//         metric: insight.metric,
//         trend: insight.trend,
//         severity: insight.severity,
//         actionable: insight.actionable,
//       })
//       .select()
//       .single();
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to create insight`,
//       );
//     }
//
//     return this.mapDbInsightToDomain(data);
//   },
//
//   async dismissInsight(insightId: string): Promise<void> {
//     const { error } = await supabase
//       .from("productivity_insights")
//       .update({ dismissed: true })
//       .eq("id", insightId);
//
//     if (error) {
//       throw new Error(
//         `${error.code}, ${error.details} Failed to dismiss insight`,
//       );
//     }
//   },
//
//   /* ================================
//      TIME DISTRIBUTION
//   ================================ */
//
//   async getTimeDistribution(
//     userId: string,
//     startDate: Date,
//     endDate: Date,
//   ): Promise<TimeDistribution> {
//     const sessions = await this.getFocusSessionsByDateRange(
//       userId,
//       startDate,
//       endDate,
//     );
//
//     const byHour: Record<number, number> = {};
//     const byDayOfWeek: Record<number, number> = {};
//     const byMood: Record<MoodType, number> = {} as Record<MoodType, number>;
//
//     sessions.forEach((session) => {
//       const hour = new Date(session.startedAt).getHours();
//       const dayOfWeek = new Date(session.startedAt).getDay();
//
//       byHour[hour] = (byHour[hour] || 0) + session.duration;
//       byDayOfWeek[dayOfWeek] = (byDayOfWeek[dayOfWeek] || 0) + session.duration;
//
//       if (session.mood) {
//         byMood[session.mood] = (byMood[session.mood] || 0) + session.duration;
//       }
//     });
//
//     return { byHour, byDayOfWeek, byMood };
//   },
//
//   /* ================================
//      MAPPERS
//   ================================ */
//
//   mapDbSessionToDomain(dbSession: any): FocusSession {
//     return {
//       id: dbSession.id,
//       userId: dbSession.user_id,
//       startedAt: new Date(dbSession.started_at),
//       endedAt: new Date(dbSession.ended_at),
//       duration: dbSession.duration,
//       timerMode: dbSession.timer_mode,
//       mood: dbSession.mood,
//       energyLevel: dbSession.energy_level,
//       projectId: dbSession.project_id,
//       taskId: dbSession.task_id,
//       completed: dbSession.completed,
//       interruptions: dbSession.interruptions,
//       createdAt: new Date(dbSession.created_at),
//     };
//   },
//
//   mapDbSummaryToDomain(dbSummary: any): DailySummary {
//     return {
//       id: dbSummary.id,
//       userId: dbSummary.user_id,
//       date: new Date(dbSummary.date),
//       totalFocusTime: dbSummary.total_focus_time,
//       totalSessions: dbSummary.total_sessions,
//       completedSessions: dbSummary.completed_sessions,
//       abandonedSessions: dbSummary.abandoned_sessions,
//       tasksCompleted: dbSummary.tasks_completed,
//       averageSessionDuration: dbSummary.average_session_duration,
//       mostProductiveHour: dbSummary.most_productive_hour,
//       dominantMood: dbSummary.dominant_mood,
//       averageEnergyLevel: dbSummary.average_energy_level,
//       streakDays: dbSummary.streak_days,
//       createdAt: new Date(dbSummary.created_at),
//       updatedAt: new Date(dbSummary.updated_at),
//     };
//   },
//
//   mapDbInsightToDomain(dbInsight: any): ProductivityInsight {
//     return {
//       id: dbInsight.id,
//       type: dbInsight.type,
//       title: dbInsight.title,
//       description: dbInsight.description,
//       metric: dbInsight.metric,
//       trend: dbInsight.trend,
//       severity: dbInsight.severity,
//       actionable: dbInsight.actionable,
//       createdAt: new Date(dbInsight.created_at),
//     };
//   },
// };
