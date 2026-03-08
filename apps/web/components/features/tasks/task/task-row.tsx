import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { Task } from "../domain/entities/task";

/**
 * TaskRow - Individual task item with delete functionality
 */
export function TaskRow({
  task,
  onClick,
  onDelete,
}: {
  task: Task;
  onClick: () => void;
  onDelete: () => void;
}) {
  const statusColors = {
    todo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
    in_progress:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    paused:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  };

  const workTypeIcons = {
    deep: "🧠",
    creative: "🎨",
    repetitive: "🔁",
    light: "💡",
  };

  console.log(`test 1 ${task.id}`);

  return (
    <motion.div
      layoutId={`task-${task.id}`}
      style={{
        borderRadius: 10,
      }}
      transition={{ duration: 5 }}
      className="flex items-center justify-between border bg-blue-500 p-3 hover:bg-muted/50 transition-colors"
    >
      <motion.button onClick={onClick} className="text-left flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm">{workTypeIcons[task.workType.type]}</span>
          <motion.div
            layout="position"
            layoutId={`task-${task.id}-title`}
            className="text-sm font-medium"
          >
            {task.title}
          </motion.div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              statusColors[task.status],
            )}
          >
            {task.status.replace("_", " ")}
          </span>
          {task.isImportant && <span className="text-xs text-red-500">⚠️</span>}
          {task.isUrgent && <span className="text-xs text-orange-500">⏰</span>}
          {task.subtasks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {task.subtasks.filter((s) => s.isCompleted()).length}/
              {task.subtasks.length}
            </span>
          )}
        </div>
      </motion.button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
