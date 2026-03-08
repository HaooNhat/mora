import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { motion } from "motion/react";
import { Dispatch, SetStateAction } from "react";
import { Task } from "../domain/entities/task";

interface TaskActiveProps {
  activeTask: Task | null;
  setActiveTask: Dispatch<SetStateAction<Task | null>>;
}

const MotionContent = motion.create(DialogContent);
const MotionTitle = motion.create(DialogTitle);

export function TaskActive({ activeTask, setActiveTask }: TaskActiveProps) {
  console.log(`Test 2 ${activeTask?.id}`);
  return (
    <Dialog open={!!activeTask} onOpenChange={() => setActiveTask(null)}>
      {activeTask && (
        <MotionContent
          layoutId={`task-${activeTask.id}`}
          forceMount
          style={{
            borderRadius: 20,
          }}
          transition={{
            duration: 5,
          }}
          className="bg-blue-500 duration-0"
        >
          <DialogHeader className="">
            <MotionTitle
              layout="position"
              layoutId={`task-${activeTask.id}-title`}
              style={{
                fontSize: 18,
              }}
              className=""
            >
              {activeTask.title}
            </MotionTitle>
          </DialogHeader>

          <motion.div layout="position" className="mt-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Status
              </h3>
              <p className="mt-1 capitalize">{activeTask.status}</p>
            </div>

            {activeTask.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Description
                </h3>
                <p className="mt-1">{activeTask.description}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Work Type
              </h3>
              <p className="mt-1 capitalize">{activeTask.workType.type}</p>
            </div>

            <div className="flex gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Important
                </h3>
                <p className="mt-1">{activeTask.isImportant ? "Yes" : "No"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Urgent
                </h3>
                <p className="mt-1">{activeTask.isUrgent ? "Yes" : "No"}</p>
              </div>
            </div>

            {activeTask.subtasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Subtasks
                </h3>
                <ul className="space-y-2">
                  {activeTask.subtasks.map((subtask) => (
                    <li
                      key={subtask.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={subtask.isCompleted()}
                        readOnly
                        className="rounded"
                      />
                      <span
                        className={cn(
                          subtask.isCompleted() &&
                            "line-through text-muted-foreground",
                        )}
                      >
                        {subtask.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTask.deadline && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Deadline
                </h3>
                <p className="mt-1">
                  {activeTask.deadline.toLocaleDateString()}
                </p>
              </div>
            )}

            {/* {activeTask.estimatedDuration && ( */}
            {/*   <div> */}
            {/*     <h3 className="text-sm font-medium text-muted-foreground"> */}
            {/*       Estimated Duration */}
            {/*     </h3> */}
            {/*     <p className="mt-1"> */}
            {/*       {Math.floor(activeTask.estimatedDuration / 60)} hours{" "} */}
            {/*       {activeTask.estimatedDuration % 60} minutes */}
            {/*     </p> */}
            {/*   </div> */}
            {/* )} */}
          </motion.div>
        </MotionContent>
      )}
    </Dialog>
  );
}
