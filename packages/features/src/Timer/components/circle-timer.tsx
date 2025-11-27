"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Droplets } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const RADIUS = 180;
const STROKE = 10;
const NORMALIZED_RADIUS = RADIUS - STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * NORMALIZED_RADIUS;

interface CircleTimerProps {
  currentTimeFormatted: string;
  progress: number;
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
  completedSessions,
  sessionsUntilLongBreak,
  workDuration,
  shortBreakDuration,
  longBreakDuration,
  onTimerClick,
  className,
}: CircleTimerProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center select-none z-10",
        className,
      )}
    >
      <div
        className="relative cursor-pointer"
        onClick={onTimerClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
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
            strokeDashoffset={(CIRCUMFERENCE * progress) / 100}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - progress / 100) }}
            transition={{ duration: 0.3 }}
          />
        </svg>

        {/* Time or hover info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-mono">
          <AnimatePresence mode="wait">
            {!hovered ? (
              <motion.div
                key="time"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-4xl md:text-5xl font-bold text-foreground"
              >
                {currentTimeFormatted}
              </motion.div>
            ) : (
              <motion.div
                key="hover"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="text-base md:text-lg text-foreground font-medium space-y-1"
              >
                <p>Work: {Math.floor(workDuration / 60)}m</p>
                <p>Break: {Math.floor(shortBreakDuration / 60)}m</p>
                <p>Long Break: {Math.floor(longBreakDuration / 60)}m</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Session wave indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {Array.from({ length: sessionsUntilLongBreak }).map((_, i) => (
              <Droplets
                key={i}
                className={cn(
                  "w-4 h-4 md:w-5 md:h-5",
                  i < completedSessions % sessionsUntilLongBreak
                    ? "text-foreground"
                    : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
