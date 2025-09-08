import { useEffect, useState } from "react";

export default function useTimer(initTime?: number) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(initTime ?? 0);

  useEffect(() => {
    if (isPlaying) {
      const countdownInterval = setInterval(() => {
        setTimeRemaining((prev) => {
          let remainingTime = prev - 1;
          if (remainingTime <= 0) {
            remainingTime = 0;
            clearInterval(countdownInterval);
            setIsPlaying(false);
          }

          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isPlaying]);

  return {
    isPlaying,
    setIsPlaying,
    timeRemaining,
    setTimeRemaining,
  };
}
