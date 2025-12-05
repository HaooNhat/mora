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

import { cn } from "@workspace/ui/lib/utils";
import { Pause, Play, SkipForward, TimerReset } from "lucide-react";
import { motion } from "motion/react";

/** mode definitions outside render → stable */
const options = [
  { id: "pomodoro" as TimerMode, label: "Pomodoro" },
  { id: "stopwatch" as TimerMode, label: "Stopwatch" },
];

export default function TimerCard() {
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
      options.map((opt) => {
        const isActive = opt.id === timerState.mode;
        return (
          <button
            key={opt.id}
            onClick={() => handleSetMode(opt.id)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-2xl",
              isActive && "bg-primary/50",
            )}
            aria-pressed={isActive}
          >
            {opt.label}
          </button>
        );
      }),
    [timerState.mode, handleSetMode],
  );

  return (
    <div className="relative flex flex-col h-full items-center justify-evenly gap-6 md:gap-8 w-full max-w-md py-4 border-2 rounded-4xl shadow-xl">
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, type: "spring" }}
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
          variant="secondary"
          size="sm"
          onClick={handleReset}
          className="rounded-xl"
        >
          <TimerReset />
        </Button>

        <Button
          variant="default"
          onClick={handleToggle}
          size="lg"
          className="w-40 flex items-center justify-center gap-2 rounded-xl text-lg font-medium"
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Focus
            </>
          )}
        </Button>

        <Button
          variant="secondary"
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
