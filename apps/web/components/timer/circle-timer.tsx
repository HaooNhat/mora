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
import { AnimatePresence, motion, Variants } from "motion/react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

const drawCircle: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1, ease: "easeInOut" },
      opacity: { duration: 0.2 },
    },
  },
};

const containerVariants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut", staggerChildren: 0.06 },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.98,
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
};

const hoverInfoVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

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
export function CircleTimer({
  currentTimeFormatted,
  progress,
  mode,
  status,
  setSettingsOpen,
  phase,
  completedSessions,
  sessionsUntilLongBreak,
  workDuration,
  shortBreakDuration,
  longBreakDuration,
  onTimerClick,
  className,
}: CircleTimerProps) {
  const [hovered, setHovered] = useState(false);
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(0);

  // Resize observer to adjust the circle's radius
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize(entry.contentRect.width);
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const MIN_RADIUS = 150;
  const MAX_RADIUS = 180;
  const RADIUS = Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, size * 0.95 * 0.5));
  const STROKE = 10;
  const NORMALIZED_RADIUS = RADIUS - STROKE / 2;
  const CIRCUMFERENCE = 2 * Math.PI * NORMALIZED_RADIUS;

  const formatPhase = (phase: PomodoroPhase) =>
    phase
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const circleKey = `${mode}`;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col items-center justify-center select-none z-10",
        className,
      )}
    >
      <div className="relative cursor-pointer" onClick={onTimerClick}>
        <AnimatePresence mode="wait">
          <motion.svg
            role="img"
            key={circleKey}
            transition={{ type: "tween", duration: 0.3 }}
            width={360}
            height={360}
            viewBox="0 0 360 360"
            className="transform -rotate-90"
            aria-hidden="true"
          >
            <motion.circle
              key={`bg-${circleKey}`}
              initial="hidden"
              animate="visible"
              cx="180"
              cy="180"
              r={NORMALIZED_RADIUS}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="transparent"
              variants={drawCircle}
              className="stroke-foreground/30"
            />

            <motion.circle
              key={`fg-${circleKey}`}
              cx="180"
              cy="180"
              r={NORMALIZED_RADIUS}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{
                strokeDashoffset: CIRCUMFERENCE * (1 - progress / 100),
              }}
              transition={{ duration: 0.3, ease: "linear" }}
              className="stroke-foreground/90"
            />
          </motion.svg>
        </AnimatePresence>

        <AnimatePresence>
          {mode === "pomodoro" && status !== "running" && (
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
                onClick={() => setSettingsOpen(true)}
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
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform-3d w-2/3 h-2/3 font-mono"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <AnimatePresence mode="wait">
            {mode === "pomodoro" && hovered ? (
              <motion.div
                key={`key-${mode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotateX: 0 }}
                exit={{ opacity: 0, rotateX: -90 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col h-full items-center justify-center text-base md:text-lg text-foreground font-medium space-y-1"
              >
                <p>Work: {Math.floor(workDuration)}m</p>
                <p>Break: {Math.floor(shortBreakDuration)}m</p>
                <p>Long Break: {Math.floor(longBreakDuration)}m</p>
              </motion.div>
            ) : (
              <motion.div
                key={`time-${mode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotateX: 0 }}
                exit={{ opacity: 0, rotateX: 90 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col h-full items-center justify-evenly gap-12"
              >
                {mode === "pomodoro" && (
                  <div className="text-base font-light text-foreground/50">
                    {formatPhase(phase)}
                  </div>
                )}

                <div className="text-4xl md:text-5xl font-bold text-foreground">
                  {currentTimeFormatted}
                </div>

                {mode === "pomodoro" && (
                  <div className="flex gap-1.5">
                    {Array.from({ length: sessionsUntilLongBreak }).map(
                      (_, i) => {
                        const currentSession =
                          (completedSessions || 0) % sessionsUntilLongBreak;

                        return (
                          <motion.div key={i}>
                            <Droplets
                              className={cn(
                                "w-6 h-6",
                                i < currentSession
                                  ? "stroke-blue-500"
                                  : i === currentSession
                                    ? "stroke-blue-500/75 animate-float"
                                    : "stroke-white/50",
                              )}
                            />
                          </motion.div>
                        );
                      },
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
