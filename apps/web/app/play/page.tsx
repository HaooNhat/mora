"use client";

import useTimer from "@workspace/hooks/useTimer";
import { useEffect } from "react";

export default function PlayPage() {
  const { isPlaying, setIsPlaying, timeRemaining, setTimeRemaining } =
    useTimer(60);

  useEffect(() => {
    setIsPlaying(true);
  }, [setIsPlaying, setTimeRemaining]);
  return (
    <div className="flex item-center m-4">
      {isPlaying ? "Yes" : "No"}, {timeRemaining}
      <svg width={200} height={200}>
        <circle fill="green" cx={70} cy={70} r={70} />
        <circle
          strokeDashoffset={timeRemaining / 60}
          stroke="blue"
          strokeWidth={3}
          fill="red"
          cx={70}
          cy={70}
          r={70}
        />
      </svg>
    </div>
  );
}
