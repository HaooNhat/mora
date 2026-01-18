import type { User } from "@supabase/supabase-js";

// Database row types (what comes from Supabase)
export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  userId: string;
  project_id: string;
  title: string;
  description: string | null;
  isImportant: boolean;
  isUrgent: boolean;
  deadline: string | null;
  status: "todo" | "in_progress" | "done" | "paused";
  notes: string | null;
  workType: "deep" | "creative" | "repetitive" | "light";
  estimated_duration: number | null;
  created_at: string;
  updated_at: string;
}

export interface SubtaskRow {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimerSessionRow {
  id: string;
  user_id: string;
  task_id: string | null;
  mode: "pomodoro" | "stopwatch";
  started_at: string;
  ended_at: string | null;
  paused_duration: number;
  interruptions: number;
  planned_duration: number;
  actual_duration: number | null;
  completed: boolean;
  created_at: string;
}

export interface ArousalEntryRow {
  id: string;
  user_id: string;
  arousal: "very_low" | "low" | "optimal" | "high" | "overloaded";
  note: string | null;
  created_at: string;
}

export interface ProductivityMetricRow {
  id: string;
  user_id: string;
  date: string;
  total_focus_time: number;
  sessions_completed: number;
  tasks_completed: number;
  average_session_duration: number;
  completion_rate: number;
  created_at: string;
}

export type { User };
