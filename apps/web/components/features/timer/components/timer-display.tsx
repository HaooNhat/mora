import { motion, Variants } from "motion/react";
import { PomodoroPhase } from "../domain/timer";
import {
  useTimerFormattedTime,
  useTimerMode,
  useTimerPhase,
  useTimerStatus,
} from "../store/timer-store";

interface TimerViewProps {
  isExpanded: boolean;
}

const displayVariants: Variants = {
  closed: {
    fontSize: "16px",
  },
  opened: {
    fontSize: "36px",
  },
};

const labelVariants: Variants = {
  closed: {
    opacity: 0,
    y: -5,
  },
  opened: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function TimerView({ isExpanded }: TimerViewProps) {
  const timeDisplay = useTimerFormattedTime();
  const mode = useTimerMode();
  const phase = useTimerPhase();
  const status = useTimerStatus();

  const label =
    mode === "pomodoro" && phase ? PHASE_LABELS[phase] : "Stopwatch";

  let helperText: string | null = null;

  if (status === "idle" || status === "paused") {
    helperText = "Tap play button to focus.";
  }

  return (
    <>
      <motion.div className="w-full flex flex-col gap-2 items-center justify-center">
        <motion.div
          layoutId="timer-time"
          animate={isExpanded ? "opened" : "closed"}
          variants={displayVariants}
          className="font-bold tabular-nums tracking-tight"
        >
          {timeDisplay}
        </motion.div>
        {isExpanded && (
          <motion.div
            variants={labelVariants}
            className="w-40 h-10 flex flex-col items-center justify-center gap-0.5 text-center"
          >
            <motion.div layout="position" className="w-40">
              {label}
            </motion.div>
            {helperText && (
              <motion.div className="text-xs text-muted-foreground/80 max-w-xs">
                {helperText}
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  focus: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};
