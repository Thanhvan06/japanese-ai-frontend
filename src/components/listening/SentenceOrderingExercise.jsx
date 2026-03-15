import { useState, useEffect, useRef } from "react";
import { FaPlay, FaPause, FaRedo, FaVolumeUp, FaGripVertical } from "react-icons/fa";
import { api } from "../../lib/api.js";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SentenceOrderingExercise({
  exercise,
  onNext,
  onPrevious,
  canGoPrevious,
  canGoNext,
  onProgressUpdate,
  onAnswerSubmit,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableWords, setAvailableWords] = useState([]);
  const [orderedWords, setOrderedWords] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [draggedWord, setDraggedWord] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const audioRef = useRef(null);

  if (!exercise) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Đang tải bài tập...</p>
      </div>
    );
  }

  useEffect(() => {
    if (exercise?.words && Array.isArray(exercise.words) && exercise.words.length > 0) {
      const shuffled = shuffleArray([...exercise.words]);
      setAvailableWords(shuffled);
      setOrderedWords([]);
    } else if (exercise?.transcript) {
      const words = exercise.transcript.trim().split(/\s+/).filter(w => w.length > 0);
      if (words.length > 0) {
        const shuffled = shuffleArray([...words]);
        setAvailableWords(shuffled);
        setOrderedWords([]);
      } else {
        setAvailableWords([]);
        setOrderedWords([]);
      }
    } else {
      setAvailableWords([]);
      setOrderedWords([]);
    }
    setShowResult(false);
    setResult(null);
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

  const handleWordClick = (word, fromAvailable = true) => {
    if (showResult) return;

    if (fromAvailable) {
      setAvailableWords(availableWords.filter((w) => w !== word));
      setOrderedWords([...orderedWords, word]);
    } else {
      const index = orderedWords.indexOf(word);
      if (index > -1) {
        const newOrdered = [...orderedWords];
        newOrdered.splice(index, 1);
        setOrderedWords(newOrdered);
        setAvailableWords([...availableWords, word]);
      }
    }
  };

  const handleDragStart = (e, word, index, fromAvailable) => {
    setDraggedWord(word);
    setDraggedIndex({ index, fromAvailable });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetIndex, targetAvailable) => {
    e.preventDefault();
    if (!draggedWord) return;

    if (draggedIndex.fromAvailable && !targetAvailable) {
      const newAvailable = availableWords.filter((w) => w !== draggedWord);
      const newOrdered = [...orderedWords];
      newOrdered.splice(targetIndex, 0, draggedWord);
      setAvailableWords(newAvailable);
      setOrderedWords(newOrdered);
    } else if (!draggedIndex.fromAvailable && targetAvailable) {
      const newOrdered = orderedWords.filter((w) => w !== draggedWord);
      const newAvailable = [...availableWords];
      newAvailable.splice(targetIndex, 0, draggedWord);
      setOrderedWords(newOrdered);
      setAvailableWords(newAvailable);
    } else if (!draggedIndex.fromAvailable && !targetAvailable) {
      const newOrdered = [...orderedWords];
      newOrdered.splice(draggedIndex.index, 1);
      newOrdered.splice(targetIndex, 0, draggedWord);
      setOrderedWords(newOrdered);
    }

    setDraggedWord(null);
    setDraggedIndex(null);
  };

  const handleReset = () => {
    if (exercise?.words && Array.isArray(exercise.words) && exercise.words.length > 0) {
      const shuffled = shuffleArray([...exercise.words]);
      setAvailableWords(shuffled);
      setOrderedWords([]);
    } else if (exercise?.transcript) {
      const words = exercise.transcript.trim().split(/\s+/).filter(w => w.length > 0);
      if (words.length > 0) {
        const shuffled = shuffleArray([...words]);
        setAvailableWords(shuffled);
        setOrderedWords([]);
      }
    }
    setShowResult(false);
    setResult(null);
  };

  const handleSubmitAnswer = async () => {
    if (orderedWords.length === 0) {
      alert("Vui lòng sắp xếp các từ để tạo thành câu.");
      return;
    }

    try {
      const response = await api("/api/listening/check-sentence-ordering", {
        method: "POST",
        body: JSON.stringify({
          itemId: exercise.id,
          orderedWords: orderedWords,
        }),
      });

      setResult(response);
      setShowResult(true);
      
      if (onAnswerSubmit) {
        onAnswerSubmit(exercise.id, response.isCorrect);
      }
      
      if (onProgressUpdate) onProgressUpdate();

      // Nếu là bài cuối, tự động hiển thị summary sau 2 giây
      if (!canGoNext) {
        setTimeout(() => {
          if (onNext) onNext();
        }, 2000);
      }
    } catch (error) {
      console.error("Error checking sentence ordering:", error);
      alert("Không thể kiểm tra đáp án. Vui lòng thử lại.");
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
        <h3 className="text-lg font-semibold text-[#4aa6e0] mb-4">
          Drag and drop để sắp xếp câu đúng
        </h3>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">
            Câu đã sắp xếp:
          </h4>
          <div
            className="min-h-[80px] p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-wrap gap-2"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, orderedWords.length, false)}
          >
            {orderedWords.length === 0 ? (
              <p className="text-gray-400 text-sm w-full text-center">
                Kéo các từ từ bên dưới vào đây
              </p>
            ) : (
              orderedWords.map((word, index) => (
                <div
                  key={`ordered-${index}`}
                  draggable={!showResult}
                  onDragStart={(e) => handleDragStart(e, word, index, false)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index, false)}
                  onClick={() => !showResult && handleWordClick(word, false)}
                  className={`px-4 py-2 rounded-lg border-2 cursor-move flex items-center gap-2 transition-all ${
                    showResult
                      ? result?.isCorrect
                        ? "bg-green-100 border-green-500 text-green-800"
                        : "bg-red-100 border-red-500 text-red-800"
                      : "bg-white border-[#4aa6e0] text-[#2e3856] hover:bg-blue-50"
                  }`}
                >
                  {!showResult && (
                    <FaGripVertical className="text-gray-400 text-xs" />
                  )}
                  <span className="font-medium">{word}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-3">
            Các từ có sẵn:
          </h4>
          <div className="flex flex-wrap gap-2">
            {availableWords.length === 0 ? (
              <p className="text-gray-400 text-sm">Đã sử dụng hết các từ</p>
            ) : (
              availableWords.map((word, index) => (
                <div
                  key={`available-${index}`}
                  draggable={!showResult}
                  onDragStart={(e) => handleDragStart(e, word, index, true)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index, true)}
                  onClick={() => !showResult && handleWordClick(word, true)}
                  className="px-4 py-2 rounded-lg border-2 border-gray-300 bg-white text-[#2e3856] cursor-pointer hover:border-[#4aa6e0] hover:bg-blue-50 transition-all flex items-center gap-2"
                >
                  <FaGripVertical className="text-gray-400 text-xs" />
                  <span className="font-medium">{word}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {!showResult && (
          <button
            onClick={handleReset}
            className="mt-4 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {showResult && result && (
        <div className="space-y-4">
          <div
            className={`rounded-lg px-4 py-3 text-center font-medium ${
              result.isCorrect
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {result.isCorrect ? (
              <div className="text-xl font-bold">Chính xác!</div>
            ) : (
              <div className="text-xl font-bold">Chưa chính xác</div>
            )}
          </div>

          {!result.isCorrect && (
            <div className="bg-blue-50 border-2 border-[#4aa6e0] rounded-xl p-6">
              <h4 className="text-lg font-semibold text-[#4aa6e0] mb-2">
                Đáp án đúng:
              </h4>
              <p className="mb-3 leading-relaxed text-[#2e3856] text-lg font-medium">
                {result.correctAnswer}
              </p>
              {exercise.translation && (
                <p className="leading-relaxed text-[#2e3856]">
                  <strong className="text-[#4aa6e0] mr-2">Dịch:</strong>{" "}
                  {exercise.translation}
                </p>
              )}
            </div>
          )}
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
          disabled={orderedWords.length === 0 || showResult}
          className={`px-8 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 ${
            orderedWords.length === 0 || showResult
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#4aa6e0] text-white hover:bg-[#3a8bc0] hover:-translate-y-0.5 hover:shadow-lg"
          }`}
        >
          {showResult ? "Đã nộp bài" : "Nộp bài"}
        </button>
        {showResult && canGoNext && (
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

