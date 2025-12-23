import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@workspace/core/project/types";
import { DragHandle } from "./project-panel";

interface SubtasksListProps {
  subtasks: Task["subtasks"];
  onChangeSubtask: (subtaskId: string, completed: boolean) => void;
  onReorder: (next: Task["subtasks"]) => void;
}

export function SubtasksList({
  subtasks = [],
  onReorder,
  onChangeSubtask,
}: SubtasksListProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    onReorder(
      reorderSubtasks(subtasks, active.id as string, over.id as string),
    );
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={subtasks.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-1 mt-2 ml-6">
          {subtasks.map((sub) => (
            <SortableSubtask
              key={sub.id}
              subtask={sub}
              onChangeCompleted={onChangeSubtask}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableSubtask({
  subtask,
  onChangeCompleted,
}: {
  subtask: NonNullable<Task["subtasks"]>[number];
  onChangeCompleted: (id: string, completed: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: subtask.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-start gap-2 rounded-md px-2 py-1 bg-muted/40"
    >
      {/* Drag handle */}
      <DragHandle {...listeners} />

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={(e) => onChangeCompleted(subtask.id, e.target.checked)}
        aria-label="Mark subtask completed"
        className="mt-1"
      />

      {/* Title */}
      <span className="text-sm text-muted-foreground">{subtask.title}</span>
    </li>
  );
}

function reorderSubtasks(
  subtasks: Task["subtasks"],
  activeId: string,
  overId: string,
) {
  if (!subtasks) return subtasks;

  const oldIndex = subtasks.findIndex((s) => s.id === activeId);
  const newIndex = subtasks.findIndex((s) => s.id === overId);

  return arrayMove(subtasks, oldIndex, newIndex);
}
