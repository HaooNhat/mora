"use client";

import { Task } from "@workspace/core/project/types";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronDown, ArrowLeft, Plus, Loader2 } from "lucide-react";
import { CSSProperties, useState } from "react";
import { SubtasksList } from "./subtask";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  useProjects,
  useProject,
  useCreateProject,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleTaskComplete,
} from "@workspace/frontend/hooks/queries/use-project-queries";
import { toast } from "@workspace/ui/components/sonner";

/* ---------------------------------- */
/* UI State                           */
/* ---------------------------------- */

type ProjectsView =
  | { mode: "projects" }
  | { mode: "project"; projectId: string };

/* ---------------------------------- */
/* Panel                              */
/* ---------------------------------- */

interface ProjectsPanelProps {
  className?: string;
}

export function ProjectsPanel({ className }: ProjectsPanelProps) {
  const [view, setView] = useState<ProjectsView>({ mode: "projects" });

  const handleSelectProject = (projectId: string) => {
    setView({ mode: "project", projectId });
  };

  const handleBack = () => {
    setView({ mode: "projects" });
  };

  return (
    <aside
      className={cn("h-full w-full max-w-md", "p-4 overflow-y-auto", className)}
      aria-label="Projects and Tasks"
    >
      {view.mode === "projects" && (
        <ProjectsList onSelectProject={handleSelectProject} />
      )}

      {view.mode === "project" && (
        <ProjectDetail projectId={view.projectId} onBack={handleBack} />
      )}
    </aside>
  );
}

/* ---------------------------------- */
/* Projects list view                 */
/* ---------------------------------- */

function ProjectsList({
  onSelectProject,
}: {
  onSelectProject: (projectId: string) => void;
}) {
  const { data: projects, isLoading, error } = useProjects();
  const createProjectMutation = useCreateProject({
    onSuccess: () => {
      toast("Project created", {
        description: "Your new project has been created successfully.",
      });
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (!newProjectName.trim()) return;

    createProjectMutation.mutate(newProjectName.trim(), {
      onSuccess: () => {
        setNewProjectName("");
        setIsCreating(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-sm text-destructive">
        Failed to load projects: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(true)}
          aria-label="Create new project"
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* Create new project form */}
      {isCreating && (
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setIsCreating(false);
                setNewProjectName("");
              }
            }}
            autoFocus
            className="flex-1"
            disabled={createProjectMutation.isPending}
          />
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={createProjectMutation.isPending}
          >
            {createProjectMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Add"
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsCreating(false);
              setNewProjectName("");
            }}
            disabled={createProjectMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      )}

      <ul className="space-y-2">
        {projects?.map((project) => (
          <li key={project.id}>
            <button
              onClick={() => onSelectProject(project.id)}
              className={cn(
                "w-full text-left rounded-lg border p-3",
                "hover:bg-muted/40 transition-colors",
                "flex items-center justify-between",
              )}
            >
              <span className="text-sm font-medium">{project.name}</span>
              <span className="text-xs text-muted-foreground">
                {project.tasks.length} tasks
              </span>
            </button>
          </li>
        ))}

        {projects?.length === 0 && !isCreating && (
          <li className="text-center py-8 text-sm text-muted-foreground">
            No projects yet. Create your first project!
          </li>
        )}
      </ul>
    </div>
  );
}

/* ---------------------------------- */
/* Project detail view                */
/* ---------------------------------- */

function ProjectDetail({
  projectId,
  onBack,
}: {
  projectId: string;
  onBack: () => void;
}) {
  const { data: project, isLoading, error } = useProject(projectId);
  const createTaskMutation = useCreateTask({
    onSuccess: () => {
      toast("Task created", {
        description: "Your new task has been added.",
      });
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    createTaskMutation.mutate(
      {
        projectId,
        data: {
          title: newTaskTitle.trim(),
          completed: false,
        },
      },
      {
        onSuccess: () => {
          setNewTaskTitle("");
          setIsCreating(false);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <div className="text-center py-8 text-sm text-destructive">
          {error?.message || "Project not found"}
        </div>
      </div>
    );
  }

  const tasks = project.tasks || [];
  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <section className="space-y-4">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            aria-label="Back to projects"
            className="rounded-md p-1 hover:bg-muted"
          >
            <ArrowLeft size={16} />
          </button>

          <h2 className="text-lg font-semibold flex-1">{project.name}</h2>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(true)}
            aria-label="Add task"
          >
            <Plus size={16} />
          </Button>
        </div>

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {completedCount} / {tasks.length}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Create new task form */}
      {isCreating && (
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateTask();
              if (e.key === "Escape") {
                setIsCreating(false);
                setNewTaskTitle("");
              }
            }}
            autoFocus
            className="flex-1"
            disabled={createTaskMutation.isPending}
          />
          <Button
            size="sm"
            onClick={handleCreateTask}
            disabled={createTaskMutation.isPending}
          >
            {createTaskMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Add"
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsCreating(false);
              setNewTaskTitle("");
            }}
            disabled={createTaskMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Tasks list with 3D stacking */}
      <ul className={cn("space-y-2", "preserve-3d")}>
        {tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            projectId={projectId}
            style={{ transform: `translateZ(${index * -5}px)` }}
          />
        ))}

        {tasks.length === 0 && !isCreating && (
          <li className="text-center py-8 text-sm text-muted-foreground">
            No tasks yet. Create your first task!
          </li>
        )}
      </ul>
    </section>
  );
}

/* ---------------------------------- */
/* Task                               */
/* ---------------------------------- */

interface TaskItemProps {
  task: Task;
  projectId: string;
  style?: CSSProperties;
  className?: string;
}

function TaskItem({ task, projectId, style, className }: TaskItemProps) {
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const toggleCompleteMutation = useToggleTaskComplete();

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      updateTaskMutation.mutate(
        {
          projectId,
          taskId: task.id,
          updates: { title: editTitle.trim() },
        },
        {
          onError: (error) => {
            toast.error("Error", {
              description: error.message,
            });
          },
        },
      );
    }
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    toggleCompleteMutation.mutate({
      projectId,
      taskId: task.id,
      currentStatus: task.completed,
    });
  };

  const handleUpdateField = (updates: Partial<Task>) => {
    updateTaskMutation.mutate({
      projectId,
      taskId: task.id,
      updates,
    });
  };

  return (
    <li
      style={style}
      className={cn(
        "rounded-xl border p-3 bg-background/60 space-y-2",
        "transition-all duration-300",
        "hover:translate-z-[15px] hover:scale-105",
        "hover:bg-background/80",
        task.completed && "opacity-60",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <DragHandle />

        {/* Complete checkbox */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleToggleComplete}
          disabled={toggleCompleteMutation.isPending}
          aria-label="Mark task completed"
          className="mt-2"
        />

        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* Title */}
          {isEditing ? (
            <Input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") {
                  setEditTitle(task.title);
                  setIsEditing(false);
                }
              }}
              onBlur={handleSaveTitle}
              autoFocus
              className="text-sm"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className={cn(
                "text-sm font-medium text-left w-full",
                task.completed && "line-through",
              )}
            >
              {task.title}
            </button>
          )}

          {/* Priority flags */}
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={!!task.important}
                onChange={(e) =>
                  handleUpdateField({ important: e.target.checked })
                }
              />
              <span className={task.important ? "text-yellow-500" : ""}>
                Important
              </span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={!!task.urgent}
                onChange={(e) =>
                  handleUpdateField({ urgent: e.target.checked })
                }
              />
              <span className={task.urgent ? "text-red-500" : ""}>Urgent</span>
            </label>
          </div>

          {/* Deadline */}
          <input
            type="date"
            value={task.deadline || ""}
            onChange={(e) => handleUpdateField({ deadline: e.target.value })}
            className="text-xs bg-transparent border rounded px-2 py-1"
          />
        </div>

        {/* Expand subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-1"
          >
            <ChevronDown
              size={16}
              className={cn("transition-transform", open && "rotate-180")}
            />
          </button>
        )}
      </div>

      {/* Subtasks */}
      {open && task.subtasks && (
        <SubtasksList
          subtasks={task.subtasks}
          onReorder={(next) => handleUpdateField({ subtasks: next })}
          onChangeSubtask={(subtaskId, completed) =>
            handleUpdateField({
              subtasks: task.subtasks?.map((s) =>
                s.id === subtaskId ? { ...s, completed } : s,
              ),
            })
          }
        />
      )}
    </li>
  );
}

export function DragHandle(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      aria-hidden
      className="flex flex-col gap-[2px] cursor-grab px-1 py-2 text-muted-foreground"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="h-1 w-1 rounded-full bg-current" />
      ))}
    </div>
  );
}
