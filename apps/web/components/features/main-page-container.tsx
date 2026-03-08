"use client";

import Header from "@/components/header/header";
import { cn } from "@workspace/ui/lib/utils";
import { useEffect } from "react";
import { ProjectTaskContainer } from "./tasks/project-task-container";
import { useTickTimer, useTimerUIState } from "./timer/store/timer-store";
import TimerContainer from "./timer/timer-container";

interface MainPageContainerProps {
  className?: string;
}

export default function MainPageContainer({
  className,
}: MainPageContainerProps) {
  const uiState = useTimerUIState();
  const tick = useTickTimer();

  useEffect(() => {
    const intervalId = setInterval(() => {
      tick();
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [tick]);

  return (
    <div className={cn(className)}>
      <Header className="w-full px-4 py-2 md:py-6" />

      <main
        className={cn(
          "flex-1 flex flex-row gap-4 md:gap-8 items-center overflow-visible md:pb-6 md:px-8",
        )}
      >
        {uiState === "opened" && <TimerContainer className="flex-1" />}
        <ProjectTaskContainer className="flex-2" />

        {/* <ConfigDock layoutState={layoutState} handleSelect={handleSelect} /> */}
      </main>
    </div>
  );
}
