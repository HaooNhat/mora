export type TaskPriority = "urgent" | "important" | "normal";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  icon?: string;
  completed: boolean;
  deadline?: string;
  urgent?: boolean;
  important?: boolean;
  subtasks?: Subtask[];
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
}

/**
 * Project Store State
 */
export interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  loading: boolean;
  error: string | null;
}
