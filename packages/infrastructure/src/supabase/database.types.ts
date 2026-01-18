export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      daily_summaries: {
        Row: {
          abandoned_sessions: number;
          average_energy_level: number | null;
          average_session_duration: number | null;
          completed_sessions: number;
          created_at: string;
          date: string;
          dominant_mood: string | null;
          id: string;
          most_productive_hour: number | null;
          streak_days: number;
          tasks_completed: number;
          total_focus_time: number;
          total_sessions: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          abandoned_sessions?: number;
          average_energy_level?: number | null;
          average_session_duration?: number | null;
          completed_sessions?: number;
          created_at?: string;
          date: string;
          dominant_mood?: string | null;
          id?: string;
          most_productive_hour?: number | null;
          streak_days?: number;
          tasks_completed?: number;
          total_focus_time?: number;
          total_sessions?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          abandoned_sessions?: number;
          average_energy_level?: number | null;
          average_session_duration?: number | null;
          completed_sessions?: number;
          created_at?: string;
          date?: string;
          dominant_mood?: string | null;
          id?: string;
          most_productive_hour?: number | null;
          streak_days?: number;
          tasks_completed?: number;
          total_focus_time?: number;
          total_sessions?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      focus_sessions: {
        Row: {
          completed: boolean;
          created_at: string;
          duration: number;
          ended_at: string;
          energy_level: number | null;
          id: string;
          interruptions: number | null;
          mood: string | null;
          project_id: string | null;
          started_at: string;
          task_id: string | null;
          timer_mode: string;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          duration: number;
          ended_at: string;
          energy_level?: number | null;
          id?: string;
          interruptions?: number | null;
          mood?: string | null;
          project_id?: string | null;
          started_at: string;
          task_id?: string | null;
          timer_mode: string;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          duration?: number;
          ended_at?: string;
          energy_level?: number | null;
          id?: string;
          interruptions?: number | null;
          mood?: string | null;
          project_id?: string | null;
          started_at?: string;
          task_id?: string | null;
          timer_mode?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "focus_sessions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "focus_sessions_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_entries: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          mood: string | null;
          tags: string[] | null;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          mood?: string | null;
          tags?: string[] | null;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          mood?: string | null;
          tags?: string[] | null;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      productivity_goals: {
        Row: {
          achieved: boolean | null;
          created_at: string;
          current: number;
          end_date: string | null;
          id: string;
          period: string;
          start_date: string;
          target: number;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          achieved?: boolean | null;
          created_at?: string;
          current?: number;
          end_date?: string | null;
          id?: string;
          period: string;
          start_date: string;
          target: number;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          achieved?: boolean | null;
          created_at?: string;
          current?: number;
          end_date?: string | null;
          id?: string;
          period?: string;
          start_date?: string;
          target?: number;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      productivity_insights: {
        Row: {
          actionable: string | null;
          created_at: string;
          description: string;
          dismissed: boolean | null;
          id: string;
          metric: number | null;
          severity: string | null;
          title: string;
          trend: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          actionable?: string | null;
          created_at?: string;
          description: string;
          dismissed?: boolean | null;
          id?: string;
          metric?: number | null;
          severity?: string | null;
          title: string;
          trend?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          actionable?: string | null;
          created_at?: string;
          description?: string;
          dismissed?: boolean | null;
          id?: string;
          metric?: number | null;
          severity?: string | null;
          title?: string;
          trend?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          color: string | null;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      subtasks: {
        Row: {
          completed: boolean;
          created_at: string;
          id: string;
          position: number;
          task_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          id?: string;
          position?: number;
          task_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          id?: string;
          position?: number;
          task_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          completed: boolean;
          created_at: string;
          deadline: string | null;
          icon: string | null;
          id: string;
          important: boolean;
          position: number;
          project_id: string;
          title: string;
          updated_at: string;
          urgent: boolean;
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          deadline?: string | null;
          icon?: string | null;
          id?: string;
          important?: boolean;
          position?: number;
          project_id: string;
          title: string;
          updated_at?: string;
          urgent?: boolean;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          deadline?: string | null;
          icon?: string | null;
          id?: string;
          important?: boolean;
          position?: number;
          project_id?: string;
          title?: string;
          updated_at?: string;
          urgent?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_daily_summary: {
        Args: { p_date: string; p_user_id: string };
        Returns: undefined;
      };
      get_project_with_tasks: { Args: { project_uuid: string }; Returns: Json };
      update_streak: { Args: { p_user_id: string }; Returns: number };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
