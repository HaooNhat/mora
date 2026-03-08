import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { LucideTimerReset, Pause, Play, SkipForward } from "lucide-react";
import {
  AnimatePresence,
  motion,
  Transition,
  useReducedMotion,
  Variants,
} from "motion/react";
import { PomodoroPhase } from "../domain/timer";
import {
  useTimerActions,
  useTimerIsRunning,
  useTimerMode,
  useTimerPhase,
  useTimerProgress,
} from "../store/timer-store";

const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const MotionButton = motion.create(Button);

const subButtonVariants: Variants = {
  closed: { opacity: 0, y: -10 },
  opened: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const circleVariants: Variants = {
  closed: {
    opacity: 0,
  },
  opened: (progressNormalized: number) => ({
    opacity: 1,
    strokeDashoffset: CIRCUMFERENCE * (1 - progressNormalized),
  }),
};

export function ExpandedTimerController({
  isExpanded,
  layoutDone,
}: {
  isExpanded: boolean;
  layoutDone: boolean;
}) {
  const isRunning = useTimerIsRunning();
  const mode = useTimerMode();
  const { start, pause, reset, skip } = useTimerActions();
  const prefersReducedMotion = useReducedMotion();
  const progress = useTimerProgress();
  const phase = useTimerPhase();

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    reset();
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    skip();
  };

  // Convert progress from 0-100 to 0-1
  const progressNormalized = progress / 100;

  const ringColorClass =
    mode === "pomodoro" && phase ? phaseRingColors[phase] : "text-primary";

  const ringTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.8, ease: "easeInOut" };

  return (
    <>
      {isExpanded ? (
        <motion.div className="w-full flex items-center justify-center gap-6">
          <motion.button
            onClick={handleReset}
            variants={subButtonVariants}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 rounded-full hover:bg-muted transition-colors"
          >
            <LucideTimerReset className="w-4 h-4" />
          </motion.button>

          <MotionButton
            layoutId="play-pause-button"
            size={"lg"}
            variant={"default"}
            onClick={handlePlayPause}
            className={
              isRunning
                ? "p-5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg"
                : "p-5 bg-muted text-foreground hover:bg-muted/80 transition-colors"
            }
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isRunning ? (
                <motion.div
                  key="pause-large"
                  layout="position"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Pause className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="play-large"
                  layout="position"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Play className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </MotionButton>

          {mode === "pomodoro" ? (
            <motion.button
              onClick={handleSkip}
              variants={subButtonVariants}
              className="p-3 hover:bg-muted rounded-full transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <SkipForward className="w-4 h-4" />
            </motion.button>
          ) : (
            <div className="w-10 h-10"></div>
          )}
        </motion.div>
      ) : (
        <motion.div
          layout
          className="relative w-9 h-9 flex items-center justify-center shrink-0"
        >
          <motion.svg
            initial={"closed"}
            animate={!isExpanded && layoutDone ? "opened" : "closed"}
            width="36"
            height="36"
            viewBox="0 0 36 36"
            className="absolute"
          >
            <motion.circle
              cx="18"
              cy="18"
              r={RADIUS}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="2.5"
              variants={circleVariants}
              custom={1}
              className="text-muted/90"
            />

            <motion.circle
              cx="18"
              cy="18"
              r={RADIUS}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className={cn(ringColorClass, "-rotate-90")}
              style={{
                strokeDasharray: CIRCUMFERENCE,
                transformOrigin: "center",
              }}
              variants={circleVariants}
              custom={progressNormalized}
              transition={ringTransition}
            />
          </motion.svg>

          {/* Play/Pause button inside small circle */}
          <motion.button
            layoutId="play-pause-button"
            onClick={handlePlayPause}
            whileTap={{ scale: 0.85 }}
            className="relative z-10 w-full h-full flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isRunning ? (
                <motion.div
                  key="pause"
                  layout="position"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Pause className="w-3.5 h-3.5" />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  layout="position"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      )}
    </>
  );
}

const phaseRingColors: Record<PomodoroPhase, string> = {
  focus: "text-primary",
  shortBreak: "text-emerald-500",
  longBreak: "text-sky-500",
};
