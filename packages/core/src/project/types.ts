export type TaskPriority = "urgent" | "important" | "normal";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  icon?: string; // emoji hoặc icon key
  deadline?: string; // ISO date
  priority: TaskPriority;
  completed: boolean;
  subtasks?: Subtask[];
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
}
