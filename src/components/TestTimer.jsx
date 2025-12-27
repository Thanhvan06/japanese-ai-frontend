import { useEffect, useState } from "react";

export default function TestTimer({ totalSeconds, onTimeout, isActive }) {
  const [seconds, setSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(isActive);

  useEffect(() => {
    setSeconds(totalSeconds);
    setIsRunning(isActive);
  }, [totalSeconds, isActive]);

  useEffect(() => {
    if (!isRunning || seconds <= 0) {
      if (seconds <= 0 && onTimeout) {
        onTimeout();
      }
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (onTimeout) {
            onTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, seconds, onTimeout]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const secsRemain = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${secsRemain.toString().padStart(2, "0")}`;
  };

  const percentage = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
  const isLowTime = seconds < 60 && seconds > 0;

  if (totalSeconds === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="transform -rotate-90 w-16 h-16">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-slate-200"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
            className={`transition-all ${isLowTime ? "text-red-500" : "text-[#4aa6e0]"}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-semibold ${isLowTime ? "text-red-500" : "text-slate-700"}`}>
            {formatTime(seconds)}
          </span>
        </div>
      </div>
      <span className={`text-sm font-medium ${isLowTime ? "text-red-500" : "text-slate-600"}`}>
        {isLowTime && "Thời gian sắp hết!"}
      </span>
    </div>
  );
}

