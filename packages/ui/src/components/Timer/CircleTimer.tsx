"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Droplets } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const RADIUS = 180;
const STROKE = 12;
const NORMALIZED_RADIUS = RADIUS - STROKE / 2;
export const CIRCUMFERENCE = 2 * Math.PI * NORMALIZED_RADIUS;

type TimerPhase = "focus" | "short_break" | "long_break";

interface CircleTimerProps {
  timeLeft: number;
  totalDuration: number;
  phase: TimerPhase;
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
  timeLeft,
  totalDuration,
  completedSessions,
  sessionsUntilLongBreak,
  workDuration,
  shortBreakDuration,
  longBreakDuration,
  onTimerClick,
  className,
}: CircleTimerProps) {
  const [hovered, setHovered] = useState(false);

  const progress = totalDuration > 0 ? 1 - timeLeft / totalDuration : 0;

  /** Formats seconds into MM:SS */
  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center select-none",
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
          viewBox="0 0 360 360"
        >
          <circle
            cx="180"
            cy="180"
            r={NORMALIZED_RADIUS}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={STROKE}
            fill="transparent"
          />
          {/* Foreground progress */}
          <motion.circle
            cx="180"
            cy="180"
            r={NORMALIZED_RADIUS}
            stroke="white"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * progress}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - progress) }}
            transition={{ duration: 0.3 }}
          />
        </svg>

        {/* Time or hover info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {!hovered ? (
              <motion.div
                key="time"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-5xl font-bold text-white"
              >
                {formatTime(timeLeft)}
              </motion.div>
            ) : (
              <motion.div
                key="hover"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="text-xl text-white font-bold space-y-1"
              >
                <p>Work: {Math.floor(workDuration / 60)}m</p>
                <p>Break: {Math.floor(shortBreakDuration / 60)}m</p>
                <p>Long Break: {Math.floor(longBreakDuration / 60)}m</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Session wave indicators */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1">
          {Array.from({ length: sessionsUntilLongBreak }).map((_, i) => (
            <Droplets
              key={i}
              className={cn(
                "w-5 h-5",
                i < completedSessions % sessionsUntilLongBreak
                  ? "text-white"
                  : "text-gray-500",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
