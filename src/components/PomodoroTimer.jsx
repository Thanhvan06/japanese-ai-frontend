import { useState, useEffect, useRef } from "react";
import { FaCog } from "react-icons/fa";

export default function PomodoroTimer({
  defaultMinutes = 25,
  panelColor = "#4aa6e0"
}) {
  const [totalSeconds, setTotalSeconds] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(defaultMinutes);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isAlarming, setIsAlarming] = useState(false);

  const intervalRef = useRef(null);
  const initialTimeRef = useRef(defaultMinutes * 60);
  const alarmIntervalRef = useRef(null);
  const audioContextRef = useRef(null);


  // Play countdown beeps (3-2-1)
  const playCountdownBeeps = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const beeps = [
      { freq: 800, time: 0 },
      { freq: 800, time: 1 },
      { freq: 800, time: 2 },
    ];

    beeps.forEach((beep) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = beep.freq;
      oscillator.type = 'sine';

      const startTime = audioContext.currentTime + beep.time;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.2);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    });
  };

  // Play continuous alarm sound
  const startContinuousAlarm = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    const playAlarmCycle = () => {
      if (!audioContextRef.current) return;

      const frequencies = [1000, 1200, 1000, 1200];
      let time = audioContext.currentTime;

      frequencies.forEach((freq) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0, time + 0.25);

        oscillator.start(time);
        oscillator.stop(time + 0.25);

        time += 0.25;
      });
    };

    // Play alarm repeatedly
    playAlarmCycle();
    alarmIntervalRef.current = setInterval(playAlarmCycle, 1000);
  };

  const stopAlarm = () => {
    setIsAlarming(false);
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };


  // Calculate minutes and seconds from totalSeconds
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Update initial time when defaultMinutes changes
  useEffect(() => {
    if (!isRunning && !isPaused) {
      const newTotalSeconds = defaultMinutes * 60;
      initialTimeRef.current = newTotalSeconds;
      setTotalSeconds(newTotalSeconds);
      setCustomMinutes(defaultMinutes);
    }
  }, [defaultMinutes, isRunning, isPaused]);

  // Timer countdown logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((prevTotalSeconds) => {
          if (prevTotalSeconds > 3 && prevTotalSeconds <= 4) {
            // Start countdown beeps at 3 seconds
            playCountdownBeeps();
          }

          if (prevTotalSeconds > 0) {
            return prevTotalSeconds - 1;
          } else {
            // Timer finished - start continuous alarm
            setIsRunning(false);
            setIsPaused(false);
            setIsAlarming(true);
            startContinuousAlarm();
            return 0;
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);


  const handleStart = () => {
    if (totalSeconds === 0) {
      setTotalSeconds(initialTimeRef.current);
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTotalSeconds(initialTimeRef.current);
    stopAlarm();
  };

  const handleCustomTime = () => {
    if (customMinutes > 0 && customMinutes <= 1440) {
      const newTotalSeconds = customMinutes * 60;
      initialTimeRef.current = newTotalSeconds;
      setTotalSeconds(newTotalSeconds);
      setIsRunning(false);
      setIsPaused(false);
      setShowCustomInput(false);
    }
  };

  const initialSeconds = initialTimeRef.current;
  const progress = initialSeconds > 0 ? (1 - totalSeconds / initialSeconds) * 100 : 0;

  const formatTime = (mins, secs) => {
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Alarm Alert */}
      {isAlarming && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-pulse">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4">
            <div className="text-6xl mb-4">⏰</div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: panelColor }}>
              Hết giờ!
            </h3>
            <p className="text-gray-600 mb-6">Đã hoàn thành phiên Pomodoro</p>
            <button
              onClick={stopAlarm}
              className="px-8 py-3 text-white rounded-full font-semibold text-lg
                hover:opacity-90 transition-opacity shadow-lg"
              style={{ backgroundColor: panelColor }}
            >
              Dừng chuông
            </button>
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className="relative mb-8">
        {/* Circular Progress Ring */}
        <div className="relative w-64 h-64 mx-auto">
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
              style={{ color: panelColor }}
            />
          </svg>

          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className={`text-5xl font-bold mb-2 ${totalSeconds <= 3 && totalSeconds > 0 ? 'text-red-500' : ''}`}
              style={{ color: totalSeconds <= 3 && totalSeconds > 0 ? '#ef4444' : panelColor }}
            >
              {formatTime(minutes, seconds)}
            </div>
            <div className="text-sm text-gray-500">
              {isRunning ? "Đang chạy" : isPaused ? "Tạm dừng" : "Sẵn sàng"}
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="px-8 py-3 text-white rounded-full font-semibold
              hover:opacity-90 transition-opacity shadow-lg"
            style={{ backgroundColor: panelColor }}
          >
            Bắt đầu
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-8 py-3 bg-gray-600 text-white rounded-full font-semibold
              hover:bg-gray-700 transition-colors shadow-lg"
          >
            Tạm dừng
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold
            hover:bg-gray-300 transition-colors"
        >
          Đặt lại
        </button>
      </div>

      {/* Settings Section */}
      <div className="space-y-3">
        {/* Custom Time Input */}
        <div className="text-center">
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="flex items-center justify-center gap-2 w-full text-sm text-gray-600 hover:text-gray-900 transition-all font-medium text-amber-500"
            >
              <FaCog className="w-4 h-4" />
              <span>Tùy chỉnh thời gian</span>
            </button>


          ) : (
            <div className="bg-white/10 rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center
                    focus:outline-none focus:ring-2"
                  style={{ focusRingColor: panelColor }}
                  placeholder="25"
                />
                <span className="text-gray-600">phút</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={handleCustomTime}
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium
                    hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: panelColor }}
                >
                  Áp dụng
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomMinutes(defaultMinutes);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium
                    hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}