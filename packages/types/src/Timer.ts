import { z } from "zod";

// Timer modes enum
export const TimerModeSchema = z.enum(["pomodoro", "stopwatch", "countdown"]);
export type TimerMode = z.infer<typeof TimerModeSchema>;

// Timer status enum
export const TimerStatusSchema = z.enum([
  "idle",
  "running",
  "paused",
  "completed",
]);
export type TimerStatus = z.infer<typeof TimerStatusSchema>;

// Pomodoro specific types
export const PomodoroPhaseSchema = z.enum([
  "focus",
  "short_break",
  "long_break",
]);
export type PomodoroPhase = z.infer<typeof PomodoroPhaseSchema>;

// Timer configuration schemas
export const PomodoroConfigSchema = z.object({
  workDuration: z.number().min(1).max(180).default(25), // 1-180 minutes
  shortBreakDuration: z.number().min(1).max(60).default(5), // 1-60 minutes
  longBreakDuration: z.number().min(1).max(120).default(15), // 1-120 minutes
  sessionsUntilLongBreak: z.number().min(2).max(10).default(4), // 2-10 sessions
});

export const CountdownConfigSchema = z.object({
  duration: z.number().min(1).max(480).default(30), // 1-480 minutes (max 8 hours)
});

export const StopwatchConfigSchema = z.object({
  // Stopwatch doesn't need configuration, but kept for consistency
  maxDuration: z.number().min(60).max(1440).default(480).optional(), // Max 8 hours default
});

// Main timer configuration
export const TimerConfigSchema = z.object({
  pomodoro: PomodoroConfigSchema,
  countdown: CountdownConfigSchema,
  stopwatch: StopwatchConfigSchema,
});

export type TimerConfig = z.infer<typeof TimerConfigSchema>;
export type PomodoroConfig = z.infer<typeof PomodoroConfigSchema>;
export type CountdownConfig = z.infer<typeof CountdownConfigSchema>;
export type StopwatchConfig = z.infer<typeof StopwatchConfigSchema>;

// Timer state schema
export const TimerStateSchema = z.object({
  mode: TimerModeSchema,
  status: TimerStatusSchema,

  // Transition to other state
  autoWork: z.boolean().default(false),
  autoBreak: z.boolean().default(false),

  // Time values (in seconds)
  currentTime: z.number().min(0),
  totalTime: z.number().min(0),
  startTime: z.date().optional(),
  pausedTime: z.number().min(0).default(0),

  // Mode-specific states
  pomodoro: z
    .object({
      phase: PomodoroPhaseSchema,
      session: z.number().min(1),
      completedSessions: z.number().min(0).default(0),
    })
    .optional(),

  // Progress calculation
  progress: z.number().min(0).max(100),
});

export type TimerState = z.infer<typeof TimerStateSchema>;

// Timer events for potential event system
// export const TimerEventSchema = z.enum([
//   "timer_started",
//   "timer_paused",
//   "timer_resumed",
//   "timer_stopped",
//   "timer_completed",
//   "timer_reset",
//   "phase_changed",
//   "mode_changed",
// ]);
// export type TimerEvent = z.infer<typeof TimerEventSchema>;

// Default configurations for each timer mode
export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  pomodoro: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  },
  countdown: {
    duration: 30,
  },
  stopwatch: {
    maxDuration: 480, // 8 hours
  },
};

export const DEFAULT_POMODORO_CONFIG_VARIANTS = {
  mini_pomodoro: {
    workDuration: 15,
    shortBreakDuration: 5,
  },
  default: {
    workDuration: 25,
    shortBreakDuration: 5,
  },
  long_pomodoro: {
    workDuration: 50,
    shortBreakDuration: 10,
  },
  the_52_17: {
    workDuration: 52,
    shortBreakDuration: 17,
  },
  the_90_30: {
    workDuration: 90,
    shortBreakDuration: 30,
  },
};

// Utility type helpers
export type ConfigForMode<T extends TimerMode> = T extends "pomodoro"
  ? PomodoroConfig
  : T extends "countdown"
    ? CountdownConfig
    : T extends "stopwatch"
      ? StopwatchConfig
      : never;

export type ConfigKey<T extends TimerMode> = keyof ConfigForMode<T>;

// Timer display information
export interface TimerDisplayInfo {
  icon: string;
  name: string;
  description: string;
  color: string;
}

export const TIMER_DISPLAY_INFO: Record<TimerMode, TimerDisplayInfo> = {
  pomodoro: {
    icon: "🍅",
    name: "Pomodoro",
    description: "Work + break cycles",
    color: "rgb(239, 68, 68)", // red-500
  },
  stopwatch: {
    icon: "⏱️",
    name: "Stopwatch",
    description: "Count up from zero",
    color: "rgb(34, 197, 94)", // green-500
  },
  countdown: {
    icon: "⌛",
    name: "Countdown",
    description: "Count down to zero",
    color: "rgb(251, 146, 60)", // orange-400
  },
} as const;

// Validation helpers
export const validateTimerConfig = (
  config: Partial<TimerConfig>,
): TimerConfig => {
  return TimerConfigSchema.parse({ ...DEFAULT_TIMER_CONFIG, ...config });
};

export const createInitialTimerState = (
  mode: TimerMode = "pomodoro",
  config: TimerConfig = DEFAULT_TIMER_CONFIG,
): TimerState => {
  const baseState: TimerState = {
    mode,
    status: "idle",
    autoWork: false,
    autoBreak: false,
    currentTime: 0,
    totalTime: 0,
    pausedTime: 0,
    progress: 0,
  };

  switch (mode) {
    case "pomodoro":
      return {
        ...baseState,
        currentTime: config.pomodoro.workDuration * 60,
        totalTime: config.pomodoro.workDuration * 60,
        pomodoro: {
          phase: "focus",
          session: 1,
          completedSessions: 0,
        },
      };

    case "countdown":
      return {
        ...baseState,
        currentTime: config.countdown.duration * 60,
        totalTime: config.countdown.duration * 60,
      };

    case "stopwatch":
      return {
        ...baseState,
        currentTime: 0,
        totalTime: 0,
      };

    default:
      return baseState;
  }
};
