import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button } from "@workspace/ui/components/button";
import { Plus, Trash2 } from "lucide-react";
import { Task } from "../domain/entities/task";
import { TaskRow } from "./task-row";

interface TaskSectionAccordionProps {
  id: string;
  title: string;
  description?: string;
  color?: string;
  tasks: Task[];
  onAddTask: () => void;
  onDeleteSection?: () => void;
  onTaskClick: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

export function TaskSectionAccordion({
  id,
  title,
  description,
  color,
  tasks,
  onAddTask,
  onDeleteSection,
  onTaskClick,
  onTaskDelete,
}: TaskSectionAccordionProps) {
  return (
    <AccordionItem value={id} className="self-center rounded-lg px-2">
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex items-center justify-between w-full pr-2">
          <div className="text-left flex items-center gap-3">
            {color && (
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
            )}
            <div>
              <p className="font-semibold">{title}</p>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {tasks.length} task{tasks.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="space-y-2 px-4 pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onAddTask();
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>

          {onDeleteSection && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSection();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onDelete={() => onTaskDelete(task.id)}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tasks yet. Click + to add one.
          </p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
