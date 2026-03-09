import { PomodoroPhase, PomodoroTimer } from "../domain/timer";
import { useTimerStore } from "./timer.store";

export const useTimerMode = () => useTimerStore((s) => s.timer.mode);
export const useTimerStatus = () => useTimerStore((s) => s.timer.status);
export const useTimerIsRunning = () =>
  useTimerStore((s) => s.timer.isRunning());
export const useTimerProgress = () =>
  useTimerStore((s) => s.timer.getProgress());
export const useTimerFormattedTime = () =>
  useTimerStore((s) => s.timer.formattedTime);
export const useTimerUIState = () => useTimerStore((s) => s.uiState);

/** Get pomodoro phase (only meaningful when mode is 'pomodoro') */
export const useTimerPhase = (): PomodoroPhase | null =>
  useTimerStore((s) =>
    s.timer.mode === "pomodoro" ? (s.timer as PomodoroTimer).phase : null,
  );

/** Get completed sessions (only meaningful when mode is 'pomodoro') */
export const useTimerCompletedSessions = (): number =>
  useTimerStore((s) =>
    s.timer.mode === "pomodoro"
      ? (s.timer as PomodoroTimer).completedSessions
      : 0,
  );

export const useTimerActions = () => {
  const start = useTimerStore((s) => s.start);
  const pause = useTimerStore((s) => s.pause);
  const stop = useTimerStore((s) => s.stop);
  const skip = useTimerStore((s) => s.skip);
  const switchMode = useTimerStore((s) => s.switchMode);
  const updateSettings = useTimerStore((s) => s.updateSettings);
  const reset = useTimerStore((s) => s.reset);

  return { start, pause, stop, skip, switchMode, updateSettings, reset };
};

export const useTickTimer = () => {
  const tick = useTimerStore((s) => s.tick);
  return tick;
};

export const useTimerUIActions = () => {
  const minimize = useTimerStore((s) => s.minimize);
  const open = useTimerStore((s) => s.open);
  const configure = useTimerStore((s) => s.configure);

  return { minimize, open, configure };
};
