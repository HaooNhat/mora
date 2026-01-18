import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Background gradients - kept for backward compatibility
 * Consider using theme colors directly instead
 */
// export const BACKGROUND_GRADIENTS: Record<string, string> = {};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const tw = (strings: TemplateStringsArray) => strings.join("");

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
