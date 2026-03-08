import type { Tables } from "@workspace/infrastructure/database/supabase.types";

export type UserRow = Tables<"users">;
export type ProjectRow = Tables<"projects">;
export type TaskRow = Tables<"tasks">;
export type TimerSessionRow = Tables<"timer_sessions">;
export type UserCognitivePreferenceRow = Tables<"user_cognitive_preferences">;
