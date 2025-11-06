import { useTimer } from "@workspace/features/Timer/hooks/useTimer";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { CircleTimer } from "@workspace/ui/components/Timer/CircleTimer";
import { Pause, Play, RotateCcw, Settings, SkipForward } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export default function TimerCard() {
  const {
    state,
    config,
    isRunning,
    currentTime,
    start,
    pause,
    reset,
    switchMode,
  } = useTimer();

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Get current phase info for Pomodoro
  const phase = state.pomodoro?.phase || "focus";
  const completedSessions = state.pomodoro?.completedSessions || 0;

  // Calculate total duration based on current phase
  const getTotalDuration = () => {
    if (state.mode === "pomodoro") {
      if (phase === "short_break")
        return config.pomodoro.shortBreakDuration * 60;
      if (phase === "long_break") return config.pomodoro.longBreakDuration * 60;
      return config.pomodoro.workDuration * 60;
    }
    if (state.mode === "countdown") {
      return config.countdown.duration * 60;
    }
    return 0; // stopwatch doesn't have a total duration
  };

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
    reset(); // In pomodoro, this moves to next phase
  };

  const handleSwitchMode = (mode: "pomodoro" | "stopwatch" | "countdown") => {
    switchMode(mode);
    setSettingsOpen(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-4">
      {/* Settings Button - Top Right */}
      <div className="absolute top-0 right-0">
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <button
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 border border-white/20"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </DialogTrigger>
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

      {/* Circle Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        <CircleTimer
          timeLeft={currentTime}
          totalDuration={getTotalDuration()}
          phase={phase}
          completedSessions={completedSessions}
          sessionsUntilLongBreak={config.pomodoro.sessionsUntilLongBreak}
          workDuration={config.pomodoro.workDuration * 60}
          shortBreakDuration={config.pomodoro.shortBreakDuration * 60}
          longBreakDuration={config.pomodoro.longBreakDuration * 60}
          onTimerClick={handleTimerClick}
        />
      </motion.div>

      {/* Control Buttons - Below Timer */}
      <motion.div
        className="flex items-center gap-3 mt-8 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Reset Button - Left */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={reset}
          className="p-2 rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-400/20 hover:from-cyan-400/30 hover:to-teal-400/30 backdrop-blur-md transition-all duration-200 border border-cyan-400/30 hover:border-cyan-400/50"
          title="Reset timer"
          aria-label="Reset timer to initial time"
        >
          <RotateCcw className="w-4 h-4 text-cyan-300/70 hover:text-cyan-300 transition-colors" />
        </motion.button>

        {/* Play/Pause Button - Center */}
        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleToggle}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-slate-900"
          title={isRunning ? "Pause timer" : "Start timer"}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
          aria-pressed={isRunning}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-slate-900" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <motion.div
                animate={{ x: [0, 2, 0] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
              >
                <Play className="w-5 h-5 fill-slate-900" />
              </motion.div>
              <span>Focus</span>
            </>
          )}
        </motion.button>

        {/* Skip Button - Right (only for pomodoro) */}
        {state.mode === "pomodoro" ? (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleSkip}
            className="p-2 rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-400/20 hover:from-cyan-400/30 hover:to-teal-400/30 backdrop-blur-md transition-all duration-200 border border-cyan-400/30 hover:border-cyan-400/50"
            title="Skip to next phase"
            aria-label="Skip to next Pomodoro phase"
          >
            <SkipForward className="w-4 h-4 text-cyan-300/70 hover:text-cyan-300 transition-colors" />
          </motion.button>
        ) : (
          <div className="w-8" />
        )}
      </motion.div>
    </div>
  );
}
