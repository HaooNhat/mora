import { useTimer } from "@workspace/features/Timer/hooks/useTimer";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { CircleTimer } from "@workspace/ui/components/Timer/CircleTimer";
import { cn } from "@workspace/ui/lib/utils";
import { Pause, Play, SkipForward, TimerReset } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export default function TimerCard() {
  const {
    state,
    config,

    isRunning,
    currentTimeFormatted,
    progress,

    pomodoroPhase,
    pomodoroCompletedSessions,

    isPaused,

    start,
    pause,
    reset,
    skip,
    switchMode,
  } = useTimer();

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Get current phase info for Pomodoro
  const phase = pomodoroPhase || "focus";
  const completedSessions = pomodoroCompletedSessions || 0;

  const handleToggle = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const handleTimerClick = () => {
    setSettingsOpen(true);
  };

  const handleSkip = () => {
    skip();
  };

  const handleReset = () => {
    reset();
  };

  const handleSwitchMode = (mode: "pomodoro" | "stopwatch" | "countdown") => {
    switchMode(mode);
    setSettingsOpen(false);
  };

  return (
    <div className="relative flex flex-col h-full items-center justify-evenly gap-6 md:gap-8 w-full max-w-md">
      {/* Circle Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, type: "spring" }}
        className="relative w-full aspect-square flex items-center justify-center"
      >
        <CircleTimer
          currentTimeFormatted={currentTimeFormatted}
          progress={progress}
          completedSessions={completedSessions}
          sessionsUntilLongBreak={config.pomodoro.sessionsUntilLongBreak}
          workDuration={config.pomodoro.workDuration * 60}
          shortBreakDuration={config.pomodoro.shortBreakDuration * 60}
          longBreakDuration={config.pomodoro.longBreakDuration * 60}
          onTimerClick={handleTimerClick}
        />
        {/* {isRunning && <WaterRippleBackground />} */}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, type: "spring" }}
        className="w-full flex items-center justify-center gap-8"
      >
        <AnimatePresence initial={false}>
          {!isRunning ? (
            <motion.div
              key="reset"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              whileHover={{ scale: 1.1, y: -6 }}
              transition={{ duration: 0.5 }}
            >
              <Button
                variant={"secondary"}
                size={"sm"}
                onClick={handleReset}
                className="rounded-xl"
              >
                <TimerReset />
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <Button
          data-state={isRunning ? "running" : "paused"}
          variant={"default"}
          onClick={handleToggle}
          size="lg"
          className={cn(
            "w-40 flex items-center justify-center gap-2 rounded-xl text-lg font-medium",
          )}
          asChild
        >
          <motion.button
            whileHover={{ scale: 1.1, y: -6 }}
            transition={{ duration: 0.3 }}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start
              </>
            )}
          </motion.button>
        </Button>
        <AnimatePresence>
          {!isRunning && (
            <Button
              variant={"secondary"}
              size={"sm"}
              onClick={handleSkip}
              className="rounded-xl"
              asChild
            >
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.1, y: -6 }}
                transition={{ duration: 0.3 }}
              >
                <SkipForward />
              </motion.button>
            </Button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dialog for Settings */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Timer Mode</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              variant={state.mode === "pomodoro" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleSwitchMode("pomodoro")}
            >
              <span className="text-2xl mr-3">🍅</span>
              <div className="text-left">
                <div className="font-semibold">Pomodoro</div>
                <div className="text-xs text-muted-foreground">
                  Work sessions with breaks
                </div>
              </div>
            </Button>
            <Button
              variant={state.mode === "stopwatch" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleSwitchMode("stopwatch")}
            >
              <span className="text-2xl mr-3">⏱️</span>
              <div className="text-left">
                <div className="font-semibold">Stopwatch</div>
                <div className="text-xs text-muted-foreground">
                  Count up from zero
                </div>
              </div>
            </Button>
            <Button
              variant={state.mode === "countdown" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleSwitchMode("countdown")}
            >
              <span className="text-2xl mr-3">⏳</span>
              <div className="text-left">
                <div className="font-semibold">Countdown</div>
                <div className="text-xs text-muted-foreground">
                  Count down to zero
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
