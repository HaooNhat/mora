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

      {/* Control Buttons - Below Timer */}
      <div className="flex items-center gap-3 mt-2">
        {/* Reset Button - Left */}
        <button
          onClick={reset}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 border border-white/20"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </button>

        {/* Play/Pause Button - Center */}
        <button
          onClick={handleToggle}
          className="p-5 rounded-full bg-white hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200"
          title={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? (
            <Pause className="w-7 h-7 text-gray-900 fill-gray-900" />
          ) : (
            <Play className="w-7 h-7 text-gray-900 fill-gray-900 ml-0.5" />
          )}
        </button>

        {/* Skip Button - Right (only for pomodoro) */}
        {state.mode === "pomodoro" ? (
          <button
            onClick={handleSkip}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 border border-white/20"
            title="Skip to next"
          >
            <SkipForward className="w-5 h-5 text-white" />
          </button>
        ) : (
          <div className="w-[52px]" /> // Spacer to maintain alignment
        )}
      </div>
    </div>
  );
}
