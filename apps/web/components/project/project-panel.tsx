"use client";

import { Project, Task } from "@workspace/core/project/types";
import { cn } from "@workspace/ui/lib/utils";
import { Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";

interface ProjectsPanelProps {
  className?: string;
}

export function ProjectsPanel({ className }: ProjectsPanelProps) {
  const projects: Project[] = [
    {
      id: "p1",
      name: "Mora App",
      tasks: [
        {
          id: "t1",
          title: "Connect Supabase auth",
          icon: "🔐",
          deadline: "2025-01-10",
          priority: "urgent",
          completed: false,
          subtasks: [
            { id: "s1", title: "Google OAuth", completed: true },
            { id: "s2", title: "Session handling", completed: false },
          ],
        },
        {
          id: "t2",
          title: "Projects & Tasks UI",
          priority: "important",
          completed: false,
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "h-full w-full max-w-md bg-card/75 md:border-2 md:rounded-4xl md:shadow-xl",
        "p-4 overflow-y-auto",
        className,
      )}
      aria-label="Projects and Tasks"
    >
      <h2 className="text-lg font-semibold mb-4">Projects</h2>

      <div className="space-y-6">
        {projects.map((project) => (
          <ProjectSection key={project.id} project={project} />
        ))}
      </div>
    </aside>
  );
}

function ProjectSection({ project }: { project: Project }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        {project.name}
      </h3>

      <ul className="space-y-2">
        {project.tasks.map((task: Task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
    </section>
  );
}

function TaskItem({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);

  return (
    <li
      className={cn(
        "rounded-xl border p-3",
        "bg-background/60 hover:bg-background transition-colors",
      )}
    >
      <button
        className="w-full flex items-start gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {/* Icon */}
        {task.icon && <span className="text-lg leading-none">{task.icon}</span>}

        {/* Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{task.title}</span>
            <PriorityBadge priority={task.priority} />
          </div>

          {task.deadline && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar size={12} />
              {task.deadline}
            </div>
          )}
        </div>

        {/* Chevron */}
        {(task.subtasks?.length || 0) > 0 && (
          <ChevronDown
            size={16}
            className={cn("transition-transform", open && "rotate-180")}
          />
        )}
      </button>

      {/* Subtasks */}
      {open && task.subtasks && (
        <ul className="mt-2 ml-6 space-y-1 text-sm">
          {task.subtasks.map((sub) => (
            <li key={sub.id} className="text-muted-foreground">
              • {sub.title}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map = {
    urgent: "bg-red-500/15 text-red-500",
    important: "bg-yellow-500/15 text-yellow-500",
    normal: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "text-[10px] px-2 py-0.5 rounded-full font-medium",
        map[priority as keyof typeof map],
      )}
    >
      {priority}
    </span>
  );
}
