/**
 * WorkType Value Object
 *
 * Represents the cognitive category of a task.
 * Implemented as a plain discriminated union + factory functions
 * to avoid class-based patterns and stay lint-clean.
 */

/** The raw discriminant for WorkType */
export type WorkTypeValue = "deep" | "creative" | "repetitive" | "light";

/** All valid WorkType values */
export const ALL_WORK_TYPES = [
  "deep",
  "creative",
  "repetitive",
  "light",
] as const satisfies readonly WorkTypeValue[];

/** Branded WorkType object — use factory functions to construct */
export type WorkType = Readonly<{ type: WorkTypeValue }>;

// ---------------------------------------------------------------------------
// Factory functions (replaces static class methods)
// ---------------------------------------------------------------------------

/** Creates a WorkType representing focused, cognitively demanding work */
export const deepWork = (): WorkType => ({ type: "deep" });

/** Creates a WorkType representing open-ended, generative work */
export const creativeWork = (): WorkType => ({ type: "creative" });

/** Creates a WorkType representing routine, process-driven work */
export const repetitiveWork = (): WorkType => ({ type: "repetitive" });

/** Creates a WorkType representing low-effort, quick tasks */
export const lightWork = (): WorkType => ({ type: "light" });

// ---------------------------------------------------------------------------
// Guards & parsers
// ---------------------------------------------------------------------------

/** Returns true if `value` is a valid WorkTypeValue */
export const isValidWorkType = (value: string): value is WorkTypeValue =>
  ALL_WORK_TYPES.includes(value as WorkTypeValue);

/**
 * Parses a string into a WorkType object.
 * @throws {Error} If the value is not a valid WorkTypeValue.
 */
export const parseWorkType = (value: string): WorkType => {
  if (!isValidWorkType(value)) {
    throw new Error(
      `Invalid WorkType: "${value}". Must be one of: ${ALL_WORK_TYPES.join(", ")}`,
    );
  }
  return { type: value };
};

/** Safely parses a string into a WorkType object. Returns null if invalid. */
export const safeParseWorkType = (value: string): WorkType | null =>
  isValidWorkType(value) ? { type: value } : null;

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const WORK_TYPE_DISPLAY_NAMES: Record<WorkTypeValue, string> = {
  deep: "Deep Work",
  creative: "Creative Work",
  repetitive: "Repetitive Work",
  light: "Light Work",
};

/** Gets the human-readable display name for a WorkType */
export const getWorkTypeDisplayName = (workType: WorkType): string =>
  WORK_TYPE_DISPLAY_NAMES[workType.type];

const WORK_TYPE_COLORS: Record<WorkTypeValue, string> = {
  deep: "purple",
  creative: "pink",
  repetitive: "yellow",
  light: "teal",
};

/** Gets the UI color representation for a WorkType */
export const getWorkTypeColor = (workType: WorkType): string =>
  WORK_TYPE_COLORS[workType.type];

/** Returns true if two WorkType objects represent the same type */
export const workTypeEquals = (a: WorkType, b: WorkType): boolean =>
  a.type === b.type;
