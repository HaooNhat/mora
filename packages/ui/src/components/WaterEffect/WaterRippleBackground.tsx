import { useEffect, useState } from "react";

export const WaterRippleBackground = () => {
  const [ripples, setRipples] = useState<Array<{ id: number; delay: number }>>(
    [],
  );

  useEffect(() => {
    // Create initial ripples
    const initialRipples = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      delay: i * 1.5,
    }));
    setRipples(initialRipples);

    // Add new ripple every 4 seconds
    const interval = setInterval(() => {
      setRipples((prev) => {
        const newId = Date.now();
        return [...prev, { id: newId, delay: 0 }].slice(-5);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            animationDelay: `${ripple.delay}s`,
          }}
        >
          <div className="animate-ripple rounded-full border-2 border-gray-300/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      ))}
    </div>
  );
};
