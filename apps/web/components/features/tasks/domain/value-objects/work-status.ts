/**
 * WorkStatus Value Object
 *
 * Represents the current status of a task in the workflow.
 * Immutable and self-validating.
 */
export enum WorkStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  PAUSED = "paused",
  DONE = "done",
}

/** All valid work statuses */
export const ALL_WORK_STATUSES = [
  WorkStatus.TODO,
  WorkStatus.IN_PROGRESS,
  WorkStatus.PAUSED,
  WorkStatus.DONE,
] as const;

/** Validates if a string is a valid WorkStatus */
export const isValidWorkStatus = (value: string): value is WorkStatus =>
  ALL_WORK_STATUSES.includes(value as WorkStatus);

/**
 * Parses a string to WorkStatus.
 * @throws {Error} If the value is not a valid WorkStatus.
 */
export const parseWorkStatus = (value: string): WorkStatus => {
  if (!isValidWorkStatus(value)) {
    throw new Error(
      `Invalid WorkStatus: "${value}". Must be one of: ${ALL_WORK_STATUSES.join(", ")}`,
    );
  }
  return value;
};

/** Safely parses a string to WorkStatus. Returns null if invalid. */
export const safeParseWorkStatus = (value: string): WorkStatus | null =>
  isValidWorkStatus(value) ? value : null;

/** Display name map for WorkStatus */
const WORK_STATUS_DISPLAY_NAMES: Record<WorkStatus, string> = {
  [WorkStatus.TODO]: "To Do",
  [WorkStatus.IN_PROGRESS]: "In Progress",
  [WorkStatus.PAUSED]: "Paused",
  [WorkStatus.DONE]: "Done",
};

/** Gets the human-readable display name for a WorkStatus */
export const getWorkStatusDisplayName = (status: WorkStatus): string =>
  WORK_STATUS_DISPLAY_NAMES[status];

/** Tailwind color key map for WorkStatus */
const WORK_STATUS_COLORS: Record<WorkStatus, string> = {
  [WorkStatus.TODO]: "gray",
  [WorkStatus.IN_PROGRESS]: "blue",
  [WorkStatus.PAUSED]: "orange",
  [WorkStatus.DONE]: "green",
};

/** Gets the UI color representation for a WorkStatus */
export const getWorkStatusColor = (status: WorkStatus): string =>
  WORK_STATUS_COLORS[status];

/** Returns true if the status represents an active (non-done) task */
export const isActiveWorkStatus = (status: WorkStatus): boolean =>
  status !== WorkStatus.DONE;

/** Returns true if the status is a terminal/final state */
export const isFinalWorkStatus = (status: WorkStatus): boolean =>
  status === WorkStatus.DONE;

/** Valid transition map for WorkStatus */
const WORK_STATUS_TRANSITIONS: Record<WorkStatus, WorkStatus[]> = {
  [WorkStatus.TODO]: [WorkStatus.IN_PROGRESS, WorkStatus.DONE],
  [WorkStatus.IN_PROGRESS]: [WorkStatus.PAUSED, WorkStatus.DONE],
  [WorkStatus.PAUSED]: [WorkStatus.IN_PROGRESS, WorkStatus.DONE],
  [WorkStatus.DONE]: [WorkStatus.TODO], // Allow reopening
};

/** Returns the list of valid next statuses from the current status */
export const getValidWorkStatusTransitions = (
  currentStatus: WorkStatus,
): WorkStatus[] => WORK_STATUS_TRANSITIONS[currentStatus];

/** Returns true if transitioning from `from` to `to` is a valid state change */
export const canTransitionWorkStatus = (
  from: WorkStatus,
  to: WorkStatus,
): boolean => getValidWorkStatusTransitions(from).includes(to);

/** Sort order map for WorkStatus (lower = higher priority in lists) */
const WORK_STATUS_SORT_ORDER: Record<WorkStatus, number> = {
  [WorkStatus.IN_PROGRESS]: 0,
  [WorkStatus.TODO]: 1,
  [WorkStatus.PAUSED]: 2,
  [WorkStatus.DONE]: 3,
};

/** Gets the sort order for a WorkStatus. Lower numbers appear first. */
export const getWorkStatusSortOrder = (status: WorkStatus): number =>
  WORK_STATUS_SORT_ORDER[status];
