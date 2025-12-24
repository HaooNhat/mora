"use client";

import { Task } from "@workspace/core/project/types";
import {
  useInitializeProjects,
  useProject,
  useProjects,
} from "@workspace/frontend/hooks/use-project";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowLeft, ChevronDown, GripVertical, Plus } from "lucide-react";
import { CSSProperties, useState } from "react";
import { SubtasksList } from "./subtask";
import { FoldersIcon } from "@workspace/ui/components/lucide-animated-icons/folders";

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
  // Initialize with seed data if empty
  useInitializeProjects();

  const { projects, setActiveProject } = useProjects();
  const [view, setView] = useState<ProjectsView>({ mode: "projects" });

  // Sync view with active project
  const handleSelectProject = (projectId: string) => {
    setActiveProject(projectId);
    setView({ mode: "project", projectId });
  };

  const handleBack = () => {
    setActiveProject(null);
    setView({ mode: "projects" });
  };

  return (
    <aside
      className={cn("h-full w-full max-w-md", "p-4 overflow-y-auto", className)}
      aria-label="Projects and Tasks"
    >
      {view.mode === "projects" && (
        <ProjectsList
          projects={projects}
          onSelectProject={handleSelectProject}
        />
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
  projects,
  onSelectProject,
}: {
  projects: ReturnType<typeof useProjects>["projects"];
  onSelectProject: (projectId: string) => void;
}) {
  const { createProject, deleteProject } = useProjects();
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (!newProjectName.trim()) return;
    createProject(newProjectName.trim());
    setNewProjectName("");
    setIsCreating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FoldersIcon />
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
          />
          <Button size="sm" onClick={handleCreate}>
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsCreating(false);
              setNewProjectName("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      <ul className="space-y-2">
        {projects.map((project) => (
          <li key={project.id}>
            <div
              className={cn(
                "rounded-lg border p-3",
                "hover:bg-muted/40 transition-colors",
                "flex items-center justify-between gap-2",
              )}
            >
              <button
                onClick={() => onSelectProject(project.id)}
                className="flex-1 text-left"
              >
                <span className="text-sm font-medium">{project.name}</span>
                <div className="text-xs text-muted-foreground">
                  {project.tasks.length} tasks
                </div>
              </button>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete project"
                onClick={() => deleteProject(project.id)}
              >
                ✕
              </Button>
            </div>
          </li>
        ))}

        {projects.length === 0 && !isCreating && (
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
  const {
    project,
    tasks,
    createTask,
    updateTask,
    deleteTask,
    createSubtask,
    completedTaskCount,
    taskCount,
    progress,
  } = useProject(projectId);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask({
      title: newTaskTitle.trim(),
      completed: false,
    });
    setNewTaskTitle("");
    setIsCreating(false);
  };

  if (!project) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Project not found
      </div>
    );
  }

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
        {taskCount > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {completedTaskCount} / {taskCount}
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
          />
          <Button size="sm" onClick={handleCreateTask}>
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsCreating(false);
              setNewTaskTitle("");
            }}
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
            style={{ transform: `translateZ(${index * -5}px)` }}
            onCreateSubtask={(title) => createSubtask(task.id, title)}
            onUpdate={(updates) => updateTask(task.id, updates)}
            onDelete={() => deleteTask(task.id)}
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
  style?: CSSProperties;
  className?: string;
  onCreateSubtask: (title: string) => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
}

function TaskItem({
  task,
  style,
  className,
  onCreateSubtask,
  onUpdate,
  onDelete,
}: TaskItemProps) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onUpdate({ title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  return (
    <li
      style={style}
      className={cn(
        "rounded-xl border p-3 bg-background/60 space-y-2",
        "transition-all duration-300",
        "hover:scale-105",
        "hover:bg-background/80",
        task.completed && "opacity-60",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle (future enhancement) */}
        <DragHandle />

        {/* Complete checkbox */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => onUpdate({ completed: e.target.checked })}
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
                onChange={(e) => onUpdate({ important: e.target.checked })}
              />
              <span className={task.important ? "text-yellow-500" : ""}>
                Important
              </span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={!!task.urgent}
                onChange={(e) => onUpdate({ urgent: e.target.checked })}
              />
              <span className={task.urgent ? "text-red-500" : ""}>Urgent</span>
            </label>
          </div>

          {/* Deadline */}
          <input
            type="date"
            value={task.deadline || ""}
            onChange={(e) => onUpdate({ deadline: e.target.value })}
            className="text-xs bg-transparent border rounded px-2 py-1"
          />
        </div>

        <div className="flex flex-col gap-1">
          {task.subtasks?.length ? (
            <button onClick={() => setOpen((v) => !v)}>
              <ChevronDown
                size={16}
                className={cn("transition-transform", open && "rotate-180")}
              />
            </button>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Delete task"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Subtasks */}
      {open && task.subtasks && (
        <div className="ml-6 space-y-2">
          <SubtasksList
            subtasks={task.subtasks}
            onReorder={(next) => onUpdate({ subtasks: next })}
            onChangeSubtask={(subtaskId, completed) =>
              onUpdate({
                subtasks: task.subtasks?.map((s) =>
                  s.id === subtaskId ? { ...s, completed } : s,
                ),
              })
            }
          />
        </div>
      )}

      {addingSubtask ? (
        <div className="flex gap-2">
          <Input
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newSubtask.trim()) {
                onCreateSubtask(newSubtask.trim());
                setNewSubtask("");
                setAddingSubtask(false);
              }
              if (e.key === "Escape") {
                setAddingSubtask(false);
                setNewSubtask("");
              }
            }}
            autoFocus
            placeholder="Subtask title"
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={() => {
              if (!newSubtask.trim()) return;
              onCreateSubtask(newSubtask.trim());
              setNewSubtask("");
              setAddingSubtask(false);
            }}
          >
            Add
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setAddingSubtask(true)}
        >
          <Plus size={12} /> Add subtask
        </Button>
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
      <GripVertical />
    </div>
  );
}
