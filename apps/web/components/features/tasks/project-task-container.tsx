"use client";

import { Accordion } from "@workspace/ui/components/accordion";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { cn } from "@workspace/ui/lib/utils";
import { motion } from "motion/react";
import { useState } from "react";
import { Task } from "./domain/entities/task";
import { TaskActive } from "./task/task-active";
import { TasksHeader } from "./task/task-header";

interface ProjectTaskContainerProps {
  className?: string;
}

export function ProjectTaskContainer({ className }: ProjectTaskContainerProps) {
  // const projects = useProjects();
  // const tasks = useTasks();
  // const { addTask, deleteTask } = useTaskActions();
  // const { addProject, deleteProject } = useProjectActions();

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // const { tasksByProject, unlistedTasks } = useMemo(() => {
  //   const map: Record<string, Task[]> = {};
  //   const unlisted: Task[] = [];
  //
  //   for (const task of tasks) {
  //     if (!task.projectId) {
  //       unlisted.push(task);
  //       continue;
  //     }
  //
  //     if (!map[task.projectId]) {
  //       map[task.projectId] = [];
  //     }
  //
  //     map[task.projectId]!.push(task);
  //   }
  //
  //   return { tasksByProject: map, unlistedTasks: unlisted };
  // }, [tasks]);

  return (
    <>
      <div
        className={cn(
          "w-full h-full flex flex-col items-center justify-center",
          className,
        )}
      >
        <motion.div
          layout
          style={{ borderRadius: 32 }}
          className="w-full max-w-4xl h-full flex flex-col items-center min-h-60 p-4 space-y-4 border-2 bg-background/60 hover:bg-background/75 backdrop-blur-sm"
        >
          <TasksHeader
            onCreateProject={() => {
              // addProject("qewrqewr", "new project");
            }}
            className="w-full"
          />

          <ScrollArea className="max-w-3xl w-full h-full max-h-[580px]">
            <Accordion type="multiple" className="max-w-2xl w-full space-y-2">
              {/* {projects.map((project) => ( */}
              {/*   <TaskSectionAccordion */}
              {/*     key={project.id} */}
              {/*     id={project.id} */}
              {/*     title={project.name} */}
              {/*     description={project.description} */}
              {/*     color={project.color} */}
              {/*     tasks={tasksByProject[project.id] || []} */}
              {/*     onAddTask={() => addTask(project.id, "New Task")} */}
              {/*     onDeleteSection={() => { */}
              {/*       deleteProject(project.id); */}
              {/*     }} */}
              {/*     onTaskClick={setActiveTask} */}
              {/*     onTaskDelete={deleteTask} */}
              {/*   /> */}
              {/* ))} */}

              {/* <TaskSectionAccordion */}
              {/*   id="unlisted" */}
              {/*   title="Unlisted" */}
              {/*   tasks={unlistedTasks} */}
              {/*   onAddTask={() => addTask("unlisted", "New Task")} */}
              {/*   onTaskClick={setActiveTask} */}
              {/*   onTaskDelete={deleteTask} */}
              {/* /> */}
            </Accordion>
          </ScrollArea>
        </motion.div>
      </div>

      <TaskActive activeTask={activeTask} setActiveTask={setActiveTask} />
    </>
  );
}
