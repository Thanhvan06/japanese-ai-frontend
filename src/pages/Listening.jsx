import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { FaHeadphones, FaPlay, FaPause, FaVolumeUp, FaRedo } from "react-icons/fa";
import { api } from "../lib/api.js";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Listening() {
  const levels = ["N5", "N4", "N3", "N2", "N1"];
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryResult, setSummaryResult] = useState({ total: 0, correct: 0 });
  const [submitFeedback, setSubmitFeedback] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isCorrectLast, setIsCorrectLast] = useState(false);
  const [progressByItem, setProgressByItem] = useState({});
  const audioRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    handleLevelSelect("N5");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLevelSelect = async (level) => {
    setSelectedLevel(level);
    setCurrentExercise(null);
    setUserAnswer("");
    setShowAnswer(false);
    setScore(0);
    setShowSummary(false);
    setRetryCount(0);
    setIsCorrectLast(false);
    setLoading(true);
    setProgressByItem({});
    setCurrentPage(1);

    try {
      const listRes = await api(`/api/listening?level=${level}`);
      setExercises(listRes.exercises || []);

      try {
        const progressRes = await api(`/api/listening/progress?level=${level}`);
        setProgressByItem(progressRes.byItem || {});
      } catch {
        setProgressByItem({});
      }
    } catch (error) {
      console.error("Error loading exercises:", error);
      alert("Không thể tải danh sách bài tập. Vui lòng thử lại.");
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExerciseDetail = async (exerciseId) => {
    setLoadingDetail(true);
    try {
      const exercise = await api(`/api/listening/${exerciseId}`);
      const options = Array.isArray(exercise.options) ? exercise.options : [];
      setCurrentExercise({
        ...exercise,
        options: shuffleArray(options),
      });
      setUserAnswer("");
      setShowAnswer(false);
      setSubmitFeedback(null);
      setRetryCount(0);
      setIsCorrectLast(false);
      setIsPlaying(false);
      setAudioProgress(0);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    } catch (error) {
      console.error("Error loading exercise detail:", error);
      alert("Không thể tải chi tiết bài tập. Vui lòng thử lại.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStartExercise = async (exercise) => {
    await loadExerciseDetail(exercise.id);
  };

  const handlePlayPause = () => {
    if (!currentExercise?.audioUrl) {
      alert("Không có audio cho bài tập này.");
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(currentExercise.audioUrl);
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setAudioProgress(0);
      });
      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) {
          const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
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
    if (!currentExercise?.audioUrl) return;
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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const saveAttempt = async (itemId, isCorrect) => {
    try {
      await api("/api/listening/attempt", {
        method: "POST",
        body: JSON.stringify({ itemId, isCorrect }),
      });
    } catch {
      // User not logged in or API error - ignore
    }
  };

  const handleSubmitAnswer = async () => {
    const correct = userAnswer === currentExercise.correctAnswer;
    if (correct) setScore(score + 1);
    setIsCorrectLast(correct);
    setSubmitFeedback(
      correct
        ? "Chính xác!"
        : `Sai. Đáp án đúng: ${currentExercise.correctAnswer}`
    );
    setShowAnswer(true);
    await saveAttempt(currentExercise.id, correct);
    if (!correct) setRetryCount((c) => c + 1);
  };

  const handleRetrySameQuestion = () => {
    setUserAnswer("");
    setShowAnswer(false);
    setSubmitFeedback(null);
    setCurrentExercise((prev) =>
      prev && Array.isArray(prev.options)
        ? { ...prev, options: shuffleArray(prev.options) }
        : prev
    );
  };

  const refetchProgress = async () => {
    if (!selectedLevel) return;
    try {
      const progressRes = await api(`/api/listening/progress?level=${selectedLevel}`);
      setProgressByItem(progressRes.byItem || {});
    } catch {
      // ignore
    }
  };

  const handleNextExercise = () => {
    const currentIndex = exercises.findIndex((e) => e.id === currentExercise.id);
    const lastCorrect = score + (userAnswer === currentExercise.correctAnswer ? 1 : 0);
    refetchProgress();
    if (currentIndex < exercises.length - 1) {
      handleStartExercise(exercises[currentIndex + 1]);
    } else {
      setSummaryResult({ total: exercises.length, correct: lastCorrect });
      setShowSummary(true);
      setCurrentExercise(null);
      setUserAnswer("");
      setShowAnswer(false);
    }
  };

  const handleRetrySameLevel = () => {
    setShowSummary(false);
    setScore(0);
    setCurrentExercise(null);
    setUserAnswer("");
    setShowAnswer(false);
    refetchProgress();
  };

  const handleChooseOtherLevel = () => {
    setShowSummary(false);
    setSummaryResult({ total: 0, correct: 0 });
    setSelectedLevel(null);
    setCurrentExercise(null);
    setExercises([]);
    setScore(0);
    setUserAnswer("");
    setShowAnswer(false);
  };

  const paginatedExercises = exercises.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages =
    exercises.length > 0 ? Math.ceil(exercises.length / PAGE_SIZE) : 1;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <FaHeadphones className="text-3xl text-[#4aa6e0]" />
            <h1 className="text-2xl font-bold text-[#4aa6e0]">
              Luyện nghe
            </h1>
          </div>

          {showSummary ? (
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <h2 className="text-xl font-bold text-[#4aa6e0] mb-4">Hoàn thành</h2>
              <p className="text-4xl font-bold text-[#2e3856] mb-2">
                {summaryResult.correct}/{summaryResult.total}
              </p>
              <p className="text-gray-600 mb-6">
                {summaryResult.total > 0
                  ? Math.round((summaryResult.correct / summaryResult.total) * 100)
                  : 0}
                % đúng
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleRetrySameLevel}
                  className="px-6 py-3 rounded-lg font-semibold bg-[#4aa6e0] text-white hover:bg-[#3a8bc0] transition-colors"
                >
                  Làm lại
                </button>
                <button
                  onClick={handleChooseOtherLevel}
                  className="px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Chọn level khác
                </button>
              </div>
            </div>
          ) : !currentExercise ? (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#4aa6e0]">
                  {`Bài tập luyện nghe - ${selectedLevel}`}
                </h2>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedLevel}
                    onChange={(e) => handleLevelSelect(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4aa6e0]"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setSelectedLevel(null);
                      setExercises([]);
                    }}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Quay lại
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Đang tải bài tập...</p>
                </div>
              ) : exercises.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Chưa có bài tập nào cho cấp độ này.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <p className="text-gray-600">
                      Tổng số bài tập: {exercises.length}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {paginatedExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className={`bg-white border-2 rounded-xl p-5 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 ${
                          progressByItem[exercise.id]?.lastCorrect
                            ? "border-green-500 hover:border-green-600"
                            : progressByItem[exercise.id]?.wrongCount >= 3
                              ? "border-amber-500 hover:border-amber-600"
                              : progressByItem[exercise.id]
                                ? "border-red-500 hover:border-red-600"
                                : "border-gray-200 hover:border-[#4aa6e0]"
                        }`}
                        onClick={() => handleStartExercise(exercise)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#e0f7fa] rounded-full flex items-center justify-center text-[#4aa6e0] text-xl">
                            <FaHeadphones />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              Bài tập {exercise.id}
                              {exercise.set_title && (
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                  ({exercise.set_title})
                                </span>
                              )}
                              {progressByItem[exercise.id] && (
                                <span
                                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                    progressByItem[exercise.id].lastCorrect
                                      ? "bg-green-100 text-green-700"
                                      : progressByItem[exercise.id].wrongCount >= 3
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {progressByItem[exercise.id].lastCorrect
                                    ? "Đã học - Đúng"
                                    : progressByItem[exercise.id].wrongCount >= 3
                                      ? "Đã hết 3 lần thử"
                                      : "Đã học - Sai"}
                                </span>
                              )}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1">
                              {exercise.question}
                            </p>
                          </div>
                          <button
                            disabled={
                              !!progressByItem[exercise.id] &&
                              !progressByItem[exercise.id].lastCorrect &&
                              progressByItem[exercise.id].wrongCount >= 3
                            }
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              progressByItem[exercise.id] &&
                              !progressByItem[exercise.id].lastCorrect &&
                              progressByItem[exercise.id].wrongCount >= 3
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-[#4aa6e0] text-white hover:bg-[#3a8bc0]"
                            }`}
                          >
                            {progressByItem[exercise.id] ? "Làm lại" : "Bắt đầu"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {exercises.length > PAGE_SIZE && (
                    <div className="flex items-center justify-center gap-3 mt-6">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                      >
                        Trang trước
                      </button>
                      <span className="text-sm text-gray-600">
                        Trang {currentPage}/{totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((p) =>
                            Math.min(totalPages, p + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                      >
                        Trang sau
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-5 py-5">
              {loadingDetail ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Đang tải bài tập...</p>
                </div>
              ) : currentExercise ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#4aa6e0]">
                        Bài tập {exercises.findIndex(e => e.id === currentExercise.id) + 1}/{exercises.length}
                      </h2>
                      {currentExercise.set_title && (
                        <p className="text-sm text-gray-600 mt-1">
                          Chủ đề: {currentExercise.set_title}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        setCurrentExercise(null);
                        setUserAnswer("");
                        setShowAnswer(false);
                        setRetryCount(0);
                        setIsCorrectLast(false);
                        if (audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current.currentTime = 0;
                        }
                        setIsPlaying(false);
                        await refetchProgress();
                      }}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Quay lại danh sách
                    </button>
                  </div>

              <div
                className={`bg-gray-50 rounded-xl p-6 mb-6 shadow-sm border-2 ${
                  progressByItem[currentExercise.id]?.lastCorrect
                    ? "border-green-500"
                    : progressByItem[currentExercise.id]?.wrongCount >= 3
                      ? "border-amber-500"
                      : progressByItem[currentExercise.id]
                        ? "border-red-500"
                        : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-4 mb-4 md:flex-row flex-col flex-wrap">
                  <button
                    onClick={handlePlayPause}
                    className="w-16 h-16 rounded-full bg-[#4aa6e0] text-white border-none flex items-center justify-center text-2xl cursor-pointer transition-all duration-300 shadow-lg hover:bg-[#3a8bc0] hover:scale-105 hover:shadow-xl"
                  >
                    {isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                  <button
                    onClick={handleReplay}
                    disabled={!currentExercise?.audioUrl}
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

              <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#4aa6e0] mb-3">Câu hỏi:</h3>
                <p className="text-xl text-[#2e3856] leading-relaxed">{currentExercise.question}</p>
              </div>

              <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#4aa6e0] mb-4">Chọn đáp án:</h3>
                <div className="flex flex-col gap-3">
                  {currentExercise.options.map((option, index) => (
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
              </div>

              {submitFeedback && (
                <div
                  className={`mb-4 rounded-lg px-4 py-3 text-center font-medium ${
                    submitFeedback.startsWith("Chính xác")
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {submitFeedback}
                </div>
              )}
              {showAnswer && (isCorrectLast || retryCount >= 3) && (
                <div className="mb-6">
                  <div className="bg-blue-50 border-2 border-[#4aa6e0] rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-[#4aa6e0] mb-4">Đáp án:</h4>
                    <p className="mb-3 leading-relaxed text-[#2e3856]">
                      <strong className="text-[#4aa6e0] mr-2">Transcript:</strong> {currentExercise.transcript}
                    </p>
                    <p className="mb-3 leading-relaxed text-[#2e3856]">
                      <strong className="text-[#4aa6e0] mr-2">Dịch:</strong> {currentExercise.translation}
                    </p>
                    <p className="leading-relaxed text-[#2e3856]">
                      <strong className="text-[#4aa6e0] mr-2">Đáp án đúng:</strong> {currentExercise.correctAnswer}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center mb-6 md:flex-row flex-col flex-wrap">
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
                {showAnswer && (
                  <>
                    {!isCorrectLast && retryCount < 3 && (
                      <button
                        onClick={handleRetrySameQuestion}
                        className="px-8 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 bg-amber-500 text-white hover:bg-amber-600 md:w-auto w-full"
                      >
                        Làm lại ({retryCount}/3)
                      </button>
                    )}
                    {(isCorrectLast || retryCount >= 3) && (
                      <button
                        onClick={handleNextExercise}
                        className="px-8 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 bg-green-500 text-white hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-lg md:w-auto w-full"
                      >
                        Bài tiếp theo
                      </button>
                    )}
                  </>
                )}
              </div>
              {showAnswer && !isCorrectLast && retryCount >= 3 && (
                <p className="text-center text-amber-600 font-medium mb-4">
                  Đã hết 3 lần thử cho câu này. Chuyển sang bài tiếp theo.
                </p>
              )}
                </>
              ) : null}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

