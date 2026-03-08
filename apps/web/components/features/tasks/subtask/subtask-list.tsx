import { useState } from "react";
import { SubtaskItem } from "@workspace/domain/entities/task.entity";

interface SubtaskListProps {
  taskId: string;
  subtasks: SubtaskItem[];
  onAdd: (text: string) => Promise<void>;
  onToggle: (subtaskId: string) => Promise<void>;
  onDelete: (subtaskId: string) => Promise<void>;
  onUpdate: (subtaskId: string, text: string) => Promise<void>;
  readOnly?: boolean;
}

export default function SubtaskList({
  // taskId,
  subtasks,
  onAdd,
  onToggle,
  onDelete,
  onUpdate,
  readOnly = false,
}: SubtaskListProps) {
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newSubtaskText.trim()) return;

    setIsAdding(true);
    try {
      await onAdd(newSubtaskText.trim());
      setNewSubtaskText("");
    } catch (error) {
      console.error("Failed to add subtask:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (subtask: SubtaskItem) => {
    setEditingId(subtask.id);
    setEditText(subtask.text);
  };

  const handleSaveEdit = async (subtaskId: string) => {
    if (!editText.trim()) return;

    try {
      await onUpdate(subtaskId, editText.trim());
      setEditingId(null);
      setEditText("");
    } catch (error) {
      console.error("Failed to update subtask:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  // Calculate completion
  const completedCount = subtasks.filter((s) => s.done).length;
  const totalCount = subtasks.length;
  const completionRate =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtasks</span>
            <span>
              {completedCount}/{totalCount} ({Math.round(completionRate)}%)
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-2">
        {subtasks
          .sort((a, b) => a.order - b.order)
          .map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-2 group">
              {/* Checkbox */}
              <button
                onClick={() => onToggle(subtask.id)}
                disabled={readOnly}
                className={`
                  flex-shrink-0 w-5 h-5 rounded border-2 transition-all
                  ${
                    subtask.done
                      ? "bg-primary border-primary"
                      : "border-border hover:border-primary"
                  }
                  ${readOnly ? "cursor-default" : "cursor-pointer"}
                  flex items-center justify-center
                `}
              >
                {subtask.done && (
                  <svg
                    className="w-3 h-3 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>

              {/* Text */}
              {editingId === subtask.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(subtask.id);
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(subtask.id)}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-2 py-1 text-xs border rounded hover:bg-accent"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className={`
                      flex-1 text-sm
                      ${subtask.done ? "line-through text-muted-foreground" : ""}
                    `}
                  >
                    {subtask.text}
                  </span>

                  {/* Actions */}
                  {!readOnly && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(subtask)}
                        className="p-1 hover:bg-accent rounded"
                        title="Edit"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(subtask.id)}
                        className="p-1 hover:bg-destructive/10 rounded text-destructive"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
      </div>

      {/* Add new subtask */}
      {!readOnly && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newSubtaskText}
            onChange={(e) => setNewSubtaskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            placeholder="Add a subtask..."
            className="flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isAdding}
          />
          <button
            onClick={handleAdd}
            disabled={!newSubtaskText.trim() || isAdding}
            className={`
              px-4 py-2 text-sm font-medium rounded transition-colors
              ${
                newSubtaskText.trim() && !isAdding
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }
            `}
          >
            {isAdding ? "Adding..." : "Add"}
          </button>
        </div>
      )}
    </div>
  );
}
