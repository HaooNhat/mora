import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Default background gradient presets used across the application.
 *
 * Each key corresponds to a named gradient and maps to a Tailwind CSS
 * gradient class string (e.g. `from-... via-... to-...`).
 *
 * Available options:
 * - `lagoon` — cyan accent
 * - `ocean` — blue accent
 * - `aurora` — purple accent
 * - `sunset` — orange-red accent
 * - `forest` — green accent
 *
 * Example:
 * ```tsx
 * <div className={`bg-gradient-to-b ${BACKGROUND_GRADIENTS.ocean}`} />
 * ```
 */
export const BACKGROUND_GRADIENTS: Record<string, string> = {
  lagoon: "from-slate-950 via-cyan-950 to-slate-950",
  ocean: "from-slate-950 via-blue-950 to-blue-900",
  aurora: "from-slate-950 via-purple-950 to-slate-950",
  sunset: "from-slate-950 via-orange-950 to-red-950",
  forest: "from-slate-950 via-green-950 to-slate-950",
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const splitSeconds = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds)); // ensure non-negative integer
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return { hours, minutes, seconds };
};

export const formatHMS = (totalSeconds: number) => {
  const { hours, minutes, seconds } = splitSeconds(totalSeconds);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
