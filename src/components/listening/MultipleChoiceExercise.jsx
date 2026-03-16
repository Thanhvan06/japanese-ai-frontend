import { useState, useEffect, useRef } from "react";
import { FaPlay, FaPause, FaRedo, FaVolumeUp } from "react-icons/fa";
import { api } from "../../lib/api.js";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MultipleChoiceExercise({
  exercise,
  onNext,
  onPrevious,
  canGoPrevious,
  canGoNext,
  onProgressUpdate,
  onAnswerSubmit,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [options, setOptions] = useState([]);
  const audioRef = useRef(null);

  if (!exercise) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Đang tải bài tập...</p>
      </div>
    );
  }

  useEffect(() => {
    if (exercise?.options && Array.isArray(exercise.options)) {
      setOptions(shuffleArray(exercise.options));
    } else {
      setOptions([]);
    }
    setUserAnswer("");
    setShowAnswer(false);
    setSubmitFeedback(null);
    setIsCorrect(false);
    setIsPlaying(false);
    setAudioProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, [exercise]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!exercise?.audioUrl) {
      alert("Không có audio cho bài tập này.");
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(exercise.audioUrl);
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setAudioProgress(0);
      });
      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) {
          const progress =
            (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setAudioProgress(progress || 0);
        }
      });
      audioRef.current.addEventListener("error", () => {
        alert("Không thể phát audio. Vui lòng kiểm tra đường dẫn audio.");
        setIsPlaying(false);
        setAudioProgress(0);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
        alert("Không thể phát audio.");
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    if (!exercise?.audioUrl) return;
    if (!audioRef.current) {
      handlePlayPause();
      return;
    }
    audioRef.current.currentTime = 0;
    if (!isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    } else {
      audioRef.current.play();
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer) return;

    const correct = userAnswer === exercise.correctAnswer;
    setIsCorrect(correct);
    setSubmitFeedback(
      correct
        ? "Chính xác!"
        : `Sai. Đáp án đúng: ${exercise.correctAnswer}`
    );
    setShowAnswer(true);

    if (onAnswerSubmit) {
      onAnswerSubmit(exercise.id, correct);
    }

    try {
      await api("/api/listening/attempt", {
        method: "POST",
        body: JSON.stringify({ itemId: exercise.id, isCorrect: correct }),
      });
      if (onProgressUpdate) onProgressUpdate();
    } catch {
      // User not logged in or API error - ignore
    }

    // Nếu là bài cuối, tự động hiển thị summary sau 2 giây
    if (!canGoNext) {
      setTimeout(() => {
        if (onNext) onNext();
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-xl p-6 shadow-sm border-2 border-gray-200">
        <div className="flex items-center gap-4 mb-4 md:flex-row flex-col flex-wrap">
          <button
            onClick={handlePlayPause}
            className="w-16 h-16 rounded-full bg-[#4aa6e0] text-white border-none flex items-center justify-center text-2xl cursor-pointer transition-all duration-300 shadow-lg hover:bg-[#3a8bc0] hover:scale-105 hover:shadow-xl"
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button
            onClick={handleReplay}
            disabled={!exercise?.audioUrl}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Nghe lại"
          >
            <FaRedo />
          </button>
          <div className="flex items-center flex-1">
            <FaVolumeUp className="text-gray-500" />
            <span className="text-gray-600 ml-2">
              {isPlaying ? "Đang phát..." : "Nhấn để phát audio"}
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4aa6e0] transition-all duration-300"
            style={{ width: `${audioProgress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#4aa6e0] mb-3">Câu hỏi:</h3>
        <div className="text-xl text-[#2e3856] leading-relaxed">
{exercise.question || "会話を聞いて、正しい答えを選んでください。"}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#4aa6e0] mb-4">Chọn đáp án:</h3>
        {options.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Không có đáp án cho bài tập này.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setUserAnswer(option)}
                className={`px-5 py-4 border-2 rounded-lg text-base cursor-pointer transition-all duration-300 text-left ${
                  userAnswer === option
                    ? "border-[#4aa6e0] bg-[#e0f7fa] text-[#4aa6e0] font-semibold"
                    : "border-gray-200 bg-white text-[#2e3856] hover:border-[#4aa6e0] hover:bg-blue-50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {submitFeedback && (
        <div
          className={`rounded-lg px-4 py-3 text-center font-medium ${
            submitFeedback.startsWith("Chính xác")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {submitFeedback}
        </div>
      )}

      {showAnswer && (
        <div className="bg-blue-50 border-2 border-[#4aa6e0] rounded-xl p-6">
          <h4 className="text-lg font-semibold text-[#4aa6e0] mb-4">Đáp án:</h4>
          {exercise.transcript && (
            <div className="mb-3 leading-relaxed text-[#2e3856]">
              <strong className="text-[#4aa6e0] mr-2">Transcript:</strong>{" "}
{exercise.transcript}
            </div>
          )}
          {exercise.translation && (
            <p className="mb-3 leading-relaxed text-[#2e3856]">
              <strong className="text-[#4aa6e0] mr-2">Dịch:</strong>{" "}
              {exercise.translation}
            </p>
          )}
          <p className="leading-relaxed text-[#2e3856]">
            <strong className="text-[#4aa6e0] mr-2">Đáp án đúng:</strong>{" "}
            {exercise.correctAnswer}
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-center md:flex-row flex-col">
        {canGoPrevious && (
          <button
            onClick={onPrevious}
            className="px-6 py-3 rounded-lg text-base font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            ← Bài trước
          </button>
        )}
        <button
          onClick={handleSubmitAnswer}
          disabled={!userAnswer || showAnswer}
          className={`px-8 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 ${
            !userAnswer || showAnswer
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#4aa6e0] text-white hover:bg-[#3a8bc0] hover:-translate-y-0.5 hover:shadow-lg"
          }`}
        >
          {showAnswer ? "Đã trả lời" : "Nộp bài"}
        </button>
        {showAnswer && canGoNext && (
          <button
            onClick={onNext}
            className="px-8 py-3 rounded-lg text-base font-semibold bg-green-500 text-white hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-lg transition-colors"
          >
            Bài tiếp theo →
          </button>
        )}
      </div>
    </div>
  );
}

