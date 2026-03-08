import { ITimerSessionRepository } from "@workspace/application/interfaces/repositories/timer-session.repository.interface";
import { TimerSession } from "@workspace/domain/entities/timer-session.entity";
import { TimerSessionRow } from "@workspace/infrastructure/database/index.types";
import { supabase } from "@workspace/infrastructure/database/supabase.client";

export class TimerSessionRepository implements ITimerSessionRepository {
  private mapRowToEntity(row: TimerSessionRow): TimerSession {
    return {
      id: row.id,
      userId: row.user_id,
      taskId: row.task_id ?? undefined,
      timerType: row.timer_type,
      startedAt: new Date(row.started_at),
      endedAt: row.ended_at ? new Date(row.ended_at) : undefined,
      actualDuration: row.actual_duration ?? undefined,
      endedReason: row.ended_reason ?? undefined,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    };
  }

  async findById(id: string): Promise<TimerSession | null> {
    const { data, error } = await supabase
      .from("timer_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return this.mapRowToEntity(data);
  }

  async findByUserId(userId: string): Promise<TimerSession[]> {
    const { data, error } = await supabase
      .from("timer_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapRowToEntity);
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TimerSession[]> {
    const { data, error } = await supabase
      .from("timer_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("started_at", startDate.toISOString())
      .lte("started_at", endDate.toISOString())
      .order("started_at", { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapRowToEntity);
  }

  async save(session: TimerSession): Promise<void> {
    const { error } = await supabase.from("timer_sessions").insert({
      id: session.id,
      user_id: session.userId,
      task_id: session.taskId ?? null,
      timer_type: session.timerType,
      started_at: session.startedAt.toISOString(),
      ended_at: session.endedAt?.toISOString() ?? null,
      ended_reason: session.endedReason,
      arousal_start: session.arousalStart,
      arousal_end: session.arousalEnd,
      actual_duration: session.actualDuration ?? null,
      effectiveness: session.effectiveness,
      created_at: session.createdAt.toISOString(),
    });

    if (error) {
      throw new Error(`Failed to save timer session: ${error.message}`);
    }
  }

  async update(session: TimerSession): Promise<void> {
    const { error } = await supabase
      .from("timer_sessions")
      .update({
        ended_at: session.endedAt?.toISOString() ?? null,
        actual_duration: session.actualDuration ?? null,
        ended_reason: session.endedReason,
      })
      .eq("id", session.id);

    if (error) {
      throw new Error(`Failed to update timer session: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("timer_sessions")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete timer session: ${error.message}`);
    }
  }
}
