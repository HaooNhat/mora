import { z } from "zod";

/**
 * Available timer modes
 */
export const TimerModeSchema = z.enum(["pomodoro", "stopwatch"]);
export type TimerMode = z.infer<typeof TimerModeSchema>;

/**
 * Timer execution status
 */
export const TimerStatusSchema = z.enum([
  "idle",
  "running",
  "paused",
  "completed",
]);
export type TimerStatus = z.infer<typeof TimerStatusSchema>;

/**
 * Pomodoro phase types
 */
export const PomodoroPhaseSchema = z.enum([
  "focus",
  "short_break",
  "long_break",
]);
export type PomodoroPhase = z.infer<typeof PomodoroPhaseSchema>;

// ============================================================================
// Configuration Schemas
// ============================================================================

/**
 * Pomodoro timer configuration
 * @property workDuration - Work session length in minutes (1-90)
 * @property shortBreakDuration - Short break length in minutes (0-15)
 * @property longBreakDuration - Long break length in minutes (15-30)
 * @property sessionsUntilLongBreak - Number of work sessions before long break (1-5)
 */
export const PomodoroConfigSchema = z.object({
  workDuration: z.number().int().min(1).max(90).default(25),
  shortBreakDuration: z.number().int().min(0).max(15).default(5),
  longBreakDuration: z.number().int().min(15).max(30).default(15),
  sessionsUntilLongBreak: z.number().int().min(1).max(5).default(4),
});
export type PomodoroConfig = z.infer<typeof PomodoroConfigSchema>;

/**
 * Stopwatch configuration
 * @property maxDuration - Optional maximum duration in minutes (0-120)
 */
export const StopwatchConfigSchema = z.object({
  maxDuration: z.number().int().min(0).max(120).optional().default(60),
});
export type StopwatchConfig = z.infer<typeof StopwatchConfigSchema>;

/**
 * Combined timer configuration for all modes
 */
export const TimerConfigSchema = z.object({
  pomodoro: PomodoroConfigSchema,
  stopwatch: StopwatchConfigSchema,
});
export type TimerConfig = z.infer<typeof TimerConfigSchema>;

// ============================================================================
// State Schemas
// ============================================================================

/**
 * Pomodoro-specific state
 */
export const PomodoroStateSchema = z.object({
  phase: PomodoroPhaseSchema,
  session: z.number().int().min(1),
  completedSessions: z.number().int().min(0).default(0),
});
export type PomodoroState = z.infer<typeof PomodoroStateSchema>;

/**
 * Main timer state
 * @property mode - Current timer mode
 * @property status - Current execution status
 * @property currentTime - Remaining/elapsed time in seconds
 * @property totalTime - Total duration for current phase in seconds
 * @property startTime - Timestamp when timer was started
 * @property pausedTime - Accumulated paused time in seconds
 * @property progress - Progress percentage (0-100)
 * @property pomodoro - Pomodoro-specific state (only when mode is pomodoro)
 */
export type TimerState = {
  mode: TimerMode;
  status: TimerStatus;

  // Auto-transition settings
  autoWork: boolean;
  autoBreak: boolean;

  // Time tracking (in seconds)
  currentTime: number;
  totalTime: number;
  startTime: number;
  pausedTime: number;

  // Mode-specific state
  pomodoro: PomodoroState | null;
};

// ============================================================================
// Event Types
// ============================================================================

/**
 * Timer events for tracking and analytics
 */
export const TimerEventSchema = z.enum([
  "timer_started",
  "timer_paused",
  "timer_resumed",
  "timer_stopped",
  "timer_skipped",
  "timer_completed",
  "timer_reset",
  "phase_changed",
  "mode_changed",
  "config_updated",
]);
export type TimerEvent = z.infer<typeof TimerEventSchema>;
