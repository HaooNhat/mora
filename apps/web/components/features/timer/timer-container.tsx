"use client";

import { cn } from "@workspace/ui/lib/utils";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ModeSwitcher } from "./components/mode-switcher";
import { ExpandedTimerController } from "./components/timer-controller";
import { TimerView } from "./components/timer-display";
import {
  useTimerStatus,
  useTimerUIActions,
  useTimerUIState,
} from "./store/timer-store";

interface TimerContainerProps {
  className?: string;
}

const baseClasses =
  "flex flex-row w-[300px] h-[48px] items-center border px-3 gap-2 justify-between transition-colors duration-300 bg-background/80 border-border text-foreground/80 hover:border-2 hover:border-foreground";

const expandedClasses =
  "flex-col justify-evenly w-[480px] h-[320px] bg-background/90 ring-2";

const runningClasses = "bg-background border-foreground text-foreground";

export default function TimerContainer({ className }: TimerContainerProps) {
  const uiState = useTimerUIState();
  const isExpanded = uiState !== "minimized";
  const status = useTimerStatus();
  const { open, minimize } = useTimerUIActions();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [layoutDone, setLayoutDone] = useState<boolean>(false);

  const containerClasses = cn(
    baseClasses,
    isExpanded && expandedClasses,
    status === "running" && runningClasses,
  );
  useEffect(() => {
    if (isExpanded) return;

    function handleOpenTimer(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (!isTyping && event.key.toLowerCase() === "t") {
        open();
      }
    }

    document.addEventListener("keydown", handleOpenTimer);

    return () => {
      document.removeEventListener("keydown", handleOpenTimer);
    };
  }, [isExpanded, open]);

  useEffect(() => {
    if (!isExpanded) return;

    // Handle click outside
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        minimize();
      }
    }

    // Handle escape keydown
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        minimize();
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded, minimize]);

  return (
    <motion.div
      ref={containerRef}
      onClick={() => {
        if (!isExpanded) {
          open();
        }
      }}
      className={cn("flex items-center", className)}
    >
      <motion.div
        layoutId="timer-border"
        initial={"closed"}
        animate={isExpanded && layoutDone ? "opened" : "closed"}
        exit={"closed"}
        onLayoutAnimationComplete={() => {
          setLayoutDone(true);
        }}
        style={{
          borderRadius: 16,
        }}
        className={containerClasses}
      >
        <ModeSwitcher isExpanded={isExpanded} layoutDone={layoutDone} />
        <TimerView isExpanded={isExpanded} />
        <ExpandedTimerController
          isExpanded={isExpanded}
          layoutDone={layoutDone}
        />
      </motion.div>
    </motion.div>
  );
}
