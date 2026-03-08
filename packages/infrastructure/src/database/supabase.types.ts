export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      projects: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          abandoned_at: string | null
          completed_at: string | null
          created_at: string | null
          deadline: string | null
          deferred_until: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          is_important: boolean | null
          is_urgent: boolean | null
          note: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["task_status_enum"]
          subtasks: Json | null
          title: string
          updated_at: string | null
          user_id: string
          work_type: Database["public"]["Enums"]["work_type_enum"]
        }
        Insert: {
          abandoned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          deferred_until?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_important?: boolean | null
          is_urgent?: boolean | null
          note?: string | null
          project_id?: string | null
          status: Database["public"]["Enums"]["task_status_enum"]
          subtasks?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
          work_type: Database["public"]["Enums"]["work_type_enum"]
        }
        Update: {
          abandoned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          deferred_until?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_important?: boolean | null
          is_urgent?: boolean | null
          note?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status_enum"]
          subtasks?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
          work_type?: Database["public"]["Enums"]["work_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_same_user"
            columns: ["project_id", "user_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      timer_sessions: {
        Row: {
          actual_duration: number | null
          arousal_end: number | null
          arousal_start: number | null
          created_at: string | null
          effectiveness: number | null
          ended_at: string | null
          ended_reason: Database["public"]["Enums"]["ended_reason_enum"] | null
          id: string
          started_at: string
          task_id: string | null
          timer_type: Database["public"]["Enums"]["timer_type_enum"]
          user_id: string
        }
        Insert: {
          actual_duration?: number | null
          arousal_end?: number | null
          arousal_start?: number | null
          created_at?: string | null
          effectiveness?: number | null
          ended_at?: string | null
          ended_reason?: Database["public"]["Enums"]["ended_reason_enum"] | null
          id?: string
          started_at?: string
          task_id?: string | null
          timer_type: Database["public"]["Enums"]["timer_type_enum"]
          user_id: string
        }
        Update: {
          actual_duration?: number | null
          arousal_end?: number | null
          arousal_start?: number | null
          created_at?: string | null
          effectiveness?: number | null
          ended_at?: string | null
          ended_reason?: Database["public"]["Enums"]["ended_reason_enum"] | null
          id?: string
          started_at?: string
          task_id?: string | null
          timer_type?: Database["public"]["Enums"]["timer_type_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timer_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timer_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cognitive_preferences: {
        Row: {
          arousal_spread: number
          confidence: number
          optimal_arousal_center: number
          task_type_offsets: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          arousal_spread?: number
          confidence?: number
          optimal_arousal_center?: number
          task_type_offsets?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          arousal_spread?: number
          confidence?: number
          optimal_arousal_center?: number
          task_type_offsets?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          default_focus_duration: number | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_focus_duration?: number | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_focus_duration?: number | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_subtask_to_task: {
        Args: { p_task_id: string; p_text: string }
        Returns: Json
      }
      delete_subtask: {
        Args: { p_subtask_id: string; p_task_id: string }
        Returns: undefined
      }
      toggle_subtask: {
        Args: { p_subtask_id: string; p_task_id: string }
        Returns: undefined
      }
    }
    Enums: {
      ended_reason_enum: "finished" | "abandoned" | "interrupted" | "crashed"
      task_status_enum: "todo" | "in_progress" | "done" | "paused"
      timer_type_enum: "pomodoro" | "stopwatch"
      work_type_enum: "deep" | "creative" | "repetitive" | "light"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ended_reason_enum: ["finished", "abandoned", "interrupted", "crashed"],
      task_status_enum: ["todo", "in_progress", "done", "paused"],
      timer_type_enum: ["pomodoro", "stopwatch"],
      work_type_enum: ["deep", "creative", "repetitive", "light"],
    },
  },
} as const
