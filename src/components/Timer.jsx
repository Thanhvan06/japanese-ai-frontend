import { useEffect, useState } from "react";

export default function Timer({ onComplete, isActive = true }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newSeconds = prev + 1;
        if (onComplete && newSeconds >= 3600) {
          onComplete();
        }
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onComplete]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 text-lg font-semibold text-[#4aa6e0]">
      <span>⏱️</span>
      <span>{formatTime(seconds)}</span>
    </div>
  );
}

