import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { FaHeadphones, FaPlay, FaPause, FaVolumeUp } from "react-icons/fa";
import { api } from "../lib/api.js";

export default function Listening() {
  const levels = ["N5", "N4", "N3", "N2", "N1"];
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef(null);

  const handleLevelSelect = async (level) => {
    setSelectedLevel(level);
    setCurrentExercise(null);
    setUserAnswer("");
    setShowAnswer(false);
    setScore(0);
    setLoading(true);
    
    try {
      const response = await api(`/api/listening?level=${level}`);
      setExercises(response.exercises || []);
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
      setCurrentExercise(exercise);
      setUserAnswer("");
      setShowAnswer(false);
      setIsPlaying(false);
      setAudioProgress(0);
      
      // Reset audio if exists
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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSubmitAnswer = () => {
    if (userAnswer === currentExercise.correctAnswer) {
      setScore(score + 1);
      alert("Chính xác! 🎉");
    } else {
      alert(`Sai rồi. Đáp án đúng là: ${currentExercise.correctAnswer}`);
    }
    setShowAnswer(true);
  };

  const handleNextExercise = () => {
    const currentIndex = exercises.findIndex(e => e.id === currentExercise.id);
    if (currentIndex < exercises.length - 1) {
      handleStartExercise(exercises[currentIndex + 1]);
    } else {
      alert(`Hoàn thành! Điểm số của bạn: ${score + (userAnswer === currentExercise.correctAnswer ? 1 : 0)}/${exercises.length}`);
      setSelectedLevel(null);
      setCurrentExercise(null);
    }
  };

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

          {!selectedLevel ? (
            <>
              <p className="text-gray-600 mb-6">
                Chọn cấp độ JLPT để bắt đầu luyện nghe
              </p>
              <div className="grid grid-cols-5 gap-6">
                {levels.map((level) => (
                  <div
                    key={level}
                    onClick={() => handleLevelSelect(level)}
                    className="block bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-center h-28">
                      <span className="text-2xl font-bold text-[#4aa6e0]">{level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : !currentExercise ? (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#4aa6e0]">
                  Bài tập luyện nghe - {selectedLevel}
                </h2>
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
              <div className="mb-4">
                <p className="text-gray-600">
                  Tổng số bài tập: {exercises.length}
                </p>
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Đang tải bài tập...</p>
                </div>
              ) : exercises.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Chưa có bài tập nào cho cấp độ này.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {exercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="bg-white border-2 border-gray-200 rounded-xl p-5 cursor-pointer transition-all duration-300 shadow-sm hover:border-[#4aa6e0] hover:shadow-lg hover:-translate-y-0.5"
                      onClick={() => handleStartExercise(exercise)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#e0f7fa] rounded-full flex items-center justify-center text-[#4aa6e0] text-xl">
                          <FaHeadphones />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            Bài tập {exercise.id}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {exercise.question}
                          </p>
                        </div>
                        <button className="px-4 py-2 bg-[#4aa6e0] text-white rounded-lg hover:bg-[#3a8bc0] transition-colors">
                          Bắt đầu
                        </button>
                      </div>
                    </div>
                  ))}
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
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#4aa6e0]">
                      Bài tập {exercises.findIndex(e => e.id === currentExercise.id) + 1}/{exercises.length}
                    </h2>
                    <button
                      onClick={() => {
                        setCurrentExercise(null);
                        setUserAnswer("");
                        setShowAnswer(false);
                        if (audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current.currentTime = 0;
                        }
                        setIsPlaying(false);
                      }}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Quay lại danh sách
                    </button>
                  </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4 md:flex-row flex-col">
                  <button
                    onClick={handlePlayPause}
                    className="w-16 h-16 rounded-full bg-[#4aa6e0] text-white border-none flex items-center justify-center text-2xl cursor-pointer transition-all duration-300 shadow-lg hover:bg-[#3a8bc0] hover:scale-105 hover:shadow-xl"
                  >
                    {isPlaying ? <FaPause /> : <FaPlay />}
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

              {showAnswer && (
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

              <div className="flex gap-3 justify-center mb-6 md:flex-row flex-col">
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
                  <button
                    onClick={handleNextExercise}
                    className="px-8 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 bg-green-500 text-white hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-lg md:w-auto w-full"
                  >
                    Bài tiếp theo
                  </button>
                )}
              </div>

              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold text-[#4aa6e0]">
                  Điểm số: {score}/{exercises.findIndex(e => e.id === currentExercise.id)}
                </p>
              </div>
                </>
              ) : null}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

