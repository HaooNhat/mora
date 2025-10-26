import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useRef, useState } from "react";

const RADIUS = 120;
const STROKE = 4;
const NORMALIZED_RADIUS = RADIUS - STROKE / 2;
export const CIRCUMFERENCE = 2 * Math.PI * NORMALIZED_RADIUS;

interface CircleTimerProps {
  isRunning: boolean;
  strokeDashoffset: number;
  currentTimeFormatted: string;
}

interface Wave {
  id: number;
  radius: number;
  opacity: number;
}

export const CircleTimer = ({
  isRunning,
  strokeDashoffset,
  currentTimeFormatted,
}: CircleTimerProps) => {
  const [waves, setWaves] = useState<Wave[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveIdRef = useRef(0);

  const WAVE_SPAWN_RATE = 2000; // every 2 seconds

  // Spawn a new wave for defined seconds
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      waveIdRef.current += 1;
      setWaves((prev) => [
        ...prev,
        { id: waveIdRef.current, radius: NORMALIZED_RADIUS, opacity: 1 },
      ]);
    }, WAVE_SPAWN_RATE);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Animate waves expanding outward
  useEffect(() => {
    const animation = setInterval(() => {
      setWaves(
        (prev) =>
          prev
            .map((wave) => ({
              ...wave,
              radius: wave.radius + 1, // growth rate
              opacity: Math.max(0, wave.opacity - 0.025), // fade out
            }))
            .filter((wave) => wave.opacity > 0), // remove invisible waves
      );
    }, 50); // smooth animation

    return () => clearInterval(animation);
  }, []);

  return (
    <>
      <div className="w-72 h-72 flex items-center justify-center">
        <svg height="100%" width="100%" viewBox="0 0 256 256">
          {/* Fading outward waves */}
          {waves.map((wave) => (
            <circle
              key={wave.id}
              stroke="#ff6347"
              fill="transparent"
              strokeWidth={STROKE / 2}
              r={wave.radius}
              cx="128"
              cy="128"
              opacity={wave.opacity}
            />
          ))}

          {/* Static background circle */}
          <circle
            stroke="#eee"
            fill="transparent"
            strokeWidth={STROKE}
            r={NORMALIZED_RADIUS}
            cx="50%"
            cy="50%"
          />

          {/* Main progress circle */}
          <circle
            stroke="#ff6347"
            fill="transparent"
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              "hover:stroke-red-500 cursor-pointer",
              isRunning === true
                ? "transition-all duration-1000 ease-linear "
                : " transition-none",
            )}
            r={NORMALIZED_RADIUS}
            cx="50%"
            cy="50%"
            transform="rotate(-90 128 128)"
          />

          {/* Timer text */}
          <text
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono,
      Courier New, monospace"
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="24"
          >
            {currentTimeFormatted}
          </text>
        </svg>
      </div>
    </>
  );
};
