"use client";

import { CircleTimer } from "@/components/timer/circle-timer";
import { TimerMode } from "@workspace/core/timer/types";
import useTimer from "@workspace/frontend/hooks/use-timer";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

import { HistoryIcon } from "@workspace/ui/components/lucide-animated-icons/history";
import { HourglassIcon } from "@workspace/ui/components/lucide-animated-icons/hourglass";
import { TimerIcon } from "@workspace/ui/components/lucide-animated-icons/timer";
import { cn } from "@workspace/ui/lib/utils";
import { Focus, Pause, SkipForward } from "lucide-react";
import { motion } from "motion/react";

/** mode definitions outside render → stable */
const options = [
  { id: "pomodoro" as TimerMode, label: "Pomodoro", Icon: TimerIcon },
  { id: "stopwatch" as TimerMode, label: "Stopwatch", Icon: HourglassIcon },
];

interface TimerCardProps {
  className?: string;
}

export default function TimerCard({ className }: TimerCardProps) {
  const {
    timerState,
    config,
    progress,
    formattedTime,
    isRunning,
    start,
    pause,
    reset,
    skipPhase,
    setMode,
  } = useTimer();

  const [settingsOpen, setSettingsOpen] = useState(false);

  /** stable handlers */
  const handleToggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  const handleTimerClick = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const handleReset = useCallback(() => reset(), [reset]);

  const handleSkip = useCallback(() => skipPhase(), [skipPhase]);

  const handleSetMode = useCallback(
    (mode: TimerMode) => setMode(mode),
    [setMode],
  );

  const handleSwitchMode = useCallback(
    (mode: TimerMode) => {
      setMode(mode);
      setSettingsOpen(false);
    },
    [setMode],
  );

  /** memo to avoid re-render on every tick */
  const modeButtons = useMemo(
    () =>
      options.map((opt, i) => {
        const isActive = opt.id === timerState.mode;
        const isFirst = i === 0;
        const isLast = i === options.length - 1;
        return (
          <motion.li
            key={opt.id}
            initial={false}
            animate={{}}
            onClick={() => handleSetMode(opt.id)}
            className={cn(
              "relative flex items-center justify-between gap-2 list-none cursor-pointer px-3 py-1.5 text-sm font-medium rounded-2xl [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
              isActive
                ? "text-primary-foreground stroke-primary-foreground"
                : "bg-transparent text-foreground",
            )}
            aria-pressed={isActive}
          >
            <opt.Icon className="z-10" />
            <p className="relative z-10">{opt.label}</p>
            {isActive ? (
              <motion.div
                id="underline"
                layoutId="underline"
                style={{
                  borderTopLeftRadius: isFirst ? 16 : 0,
                  borderBottomLeftRadius: isFirst ? 16 : 0,
                  borderTopRightRadius: isLast ? 16 : 0,
                  borderBottomRightRadius: isLast ? 16 : 0,
                }}
                transition={{
                  duration: 1,
                  type: "spring",
                  bounce: 0.5,
                  ease: "easeOut",
                }}
                className={cn(
                  "absolute inset-0 h-full w-full bg-primary/80 z-0",
                )}
              />
            ) : null}
          </motion.li>
        );
      }),
    [timerState.mode, handleSetMode],
  );

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-evenly gap-8 w-full max-w-md py-8",
        className,
      )}
    >
      {/* Timer switchers */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, type: "spring" }}
        className="relative w-full flex items-center justify-center"
      >
        <div className="flex rounded-3xl border-2">{modeButtons}</div>
      </motion.div>

      {/* Main Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
        className="relative w-full aspect-square flex items-center justify-center"
      >
        <CircleTimer
          currentTimeFormatted={formattedTime}
          progress={progress}
          onTimerClick={handleTimerClick}
          {...timerState}
          {...timerState.pomodoro}
          {...config.pomodoro}
          setSettingsOpen={setSettingsOpen}
        />
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, type: "spring" }}
        className="w-full flex items-center justify-center gap-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="rounded-xl"
        >
          <HistoryIcon />
        </Button>

        <Button
          variant="default"
          onClick={handleToggle}
          size="lg"
          className="w-fit flex items-center justify-center gap-3 !px-6 rounded-xl text-lg font-medium"
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              Pause
            </>
          ) : (
            <>
              <Focus className="w-5 h-5" />
              Focus
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="default"
          onClick={handleSkip}
          className="rounded-xl"
        >
          <SkipForward />
        </Button>
      </motion.div>

      {/* Dialog: not re-rendered every second thanks to memo handlers */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Timer Mode</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              variant={timerState.mode === "pomodoro" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleSwitchMode("pomodoro")}
            >
              <span className="text-2xl mr-3">🍅</span>
              <div>
                <div className="font-semibold">Pomodoro</div>
                <div className="text-xs text-muted-foreground">
                  Work sessions with breaks
                </div>
              </div>
            </Button>

            <Button
              variant={timerState.mode === "stopwatch" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleSwitchMode("stopwatch")}
            >
              <span className="text-2xl mr-3">⏱️</span>
              <div>
                <div className="font-semibold">Stopwatch</div>
                <div className="text-xs text-muted-foreground">
                  Count up from zero
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
