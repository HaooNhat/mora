import { useEffect } from "react";
import { useTickTimer } from "../store/timer.selectors";

export default function TimerTick() {
  const tick = useTickTimer();

  useEffect(() => {
    const intervalId = setInterval(() => {
      tick();
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [tick]);
}
