// /**
//  * Timer Formatter - Domain Service
//  *
//  * Domain services contain logic that doesn't naturally belong to an entity/aggregate.
//  * This service handles time formatting concerns.
//  */
//
// /**
//  * Formats seconds into human-readable time
//  * @param seconds - Time in seconds
//  * @param format - Output format ('HH:MM:SS' | 'MM:SS' | 'compact')
//  * @returns Formatted time string
//  */
// export function formatTime(
//   seconds: number,
//   format: "HH:MM:SS" | "MM:SS" | "compact" = "MM:SS",
// ): string {
//   const s = Math.max(0, Math.floor(seconds));
//   const hours = Math.floor(s / 3600);
//   const minutes = Math.floor((s % 3600) / 60);
//   const secs = s % 60;
//
//   const pad = (n: number) => String(n).padStart(2, "0");
//
//   switch (format) {
//     case "HH:MM:SS":
//       return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
//
//     case "MM:SS":
//       return hours > 0
//         ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
//         : `${pad(minutes)}:${pad(secs)}`;
//
//     case "compact":
//       if (hours > 0) return `${hours}h ${minutes}m`;
//       if (minutes > 0) return `${minutes}m ${secs}s`;
//       return `${secs}s`;
//
//     default: {
//       const _exhaustive: never = format;
//       throw new Error(`Unknown format: ${_exhaustive}`);
//     }
//   }
// }
//
// /**
//  * Parses time string to seconds
//  * @param timeString - Time in format "HH:MM:SS" or "MM:SS"
//  * @returns Total seconds
//  */
// export function parseTimeString(timeString: string): number {
//   const parts = timeString.split(":").map((part) => parseInt(part, 10));
//
//   if (parts.length === 2) {
//     // MM:SS
//     const [minutes, seconds] = parts;
//     return minutes * 60 + seconds;
//   }
//
//   if (parts.length === 3) {
//     // HH:MM:SS
//     const [hours, minutes, seconds] = parts;
//     return hours * 3600 + minutes * 60 + seconds;
//   }
//
//   throw new Error(`Invalid time string format: ${timeString}`);
// }
