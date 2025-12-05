"use client";

import {
  PomodoroPhase,
  TimerMode,
  TimerStatus,
} from "@workspace/core/timer/types";
import { Button } from "@workspace/ui/components/button";
import { useIsMobile } from "@workspace/ui/hooks/useIsMobile";
import { cn } from "@workspace/ui/lib/utils";
import { Droplets, SlidersVertical } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Dispatch, SetStateAction, useState } from "react";

interface CircleTimerProps {
  currentTimeFormatted: string;
  progress: number;
  mode: TimerMode;
  status: TimerStatus;
  setSettingsOpen: Dispatch<SetStateAction<boolean>>;
  phase: PomodoroPhase;
  completedSessions: number;
  sessionsUntilLongBreak: number;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  onTimerClick: () => void;
  className?: string;
}

/**
 * CircleTimer component - pure presentational
 */
export function CircleTimer(props: CircleTimerProps) {
  const [hovered, setHovered] = useState(false);
  const isMobile = useIsMobile();

  const RADIUS = isMobile ? 160 : 180;
  const STROKE = 10;
  const NORMALIZED_RADIUS = RADIUS - STROKE / 2;
  const CIRCUMFERENCE = 2 * Math.PI * NORMALIZED_RADIUS;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center select-none z-10",
        props.className,
      )}
    >
      <div className="relative cursor-pointer" onClick={props.onTimerClick}>
        {/* Background circle */}
        <svg
          className="w-[360px] h-[360px] transform -rotate-90"
          role="img"
          viewBox="0 0 360 360"
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            cx="180"
            cy="180"
            r={NORMALIZED_RADIUS}
            className="stroke-foreground/30"
            strokeWidth={STROKE}
            fill="transparent"
          />

          {/* Foreground progress circle */}
          <motion.circle
            cx="180"
            cy="180"
            r={NORMALIZED_RADIUS}
            className="stroke-foreground/90"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={(CIRCUMFERENCE * props.progress) / 100}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{
              strokeDashoffset: CIRCUMFERENCE * (1 - props.progress / 100),
            }}
            transition={{ duration: 0.3 }}
          />
        </svg>

        <AnimatePresence>
          {props.status !== "running" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", duration: 1.5 }}
              className={cn(
                "absolute top-0 right-0",
                !isMobile && "translate-x-1/2 -translate-y-1/2",
              )}
            >
              <Button
                variant="ghost"
                onClick={() => props.setSettingsOpen(true)}
                size="lg"
                className="rounded-xl"
                aria-label="Open timer settings"
              >
                <SlidersVertical />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Time or hover info */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 font-mono"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <AnimatePresence mode="wait">
            {!hovered ? (
              <motion.div
                key="time"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full items-center justify-evenly gap-12"
              >
                {props.mode === "pomodoro" && (
                  <div className="text-base font-light text-foreground/50">
                    {props.phase
                      .split("_")
                      .map((word) => {
                        return word[0]?.toLocaleUpperCase() + word.slice(1);
                      })
                      .join(" ")}
                  </div>
                )}

                <div className="text-4xl md:text-5xl font-bold text-foreground">
                  {props.currentTimeFormatted}
                </div>

                {/* Session wave indicators */}
                {props.mode === "pomodoro" && (
                  <div className="flex gap-1.5">
                    {Array.from({ length: props.sessionsUntilLongBreak }).map(
                      (_, i) => {
                        const currentSession =
                          (props.completedSessions || 0) %
                          props.sessionsUntilLongBreak;

                        return (
                          <motion.div key={i}>
                            <Droplets
                              className={cn(
                                "w-6 h-6 border-blue-500",
                                i < currentSession
                                  ? "text-foreground"
                                  : i === currentSession
                                    ? "text-foreground/60 animate-float"
                                    : "text-muted-foreground/30",
                              )}
                            />
                          </motion.div>
                        );
                      },
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="hover"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full items-center justify-center text-base md:text-lg text-foreground font-medium space-y-1"
              >
                <p>Work: {Math.floor(props.workDuration)}m</p>
                <p>Break: {Math.floor(props.shortBreakDuration)}m</p>
                <p>Long Break: {Math.floor(props.longBreakDuration)}m</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
