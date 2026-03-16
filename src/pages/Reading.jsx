import { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { FaBook } from "react-icons/fa";
import { api } from "../lib/api.js";
import ReadingComprehensionExercise from "../components/reading/ReadingComprehensionExercise";
import FillInTheBlankExercise from "../components/reading/FillInTheBlankExercise";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const EXERCISE_TYPES = [
  { value: "reading_comprehension", label: "Đọc hiểu", description: "Đọc đoạn văn và trả lời câu hỏi", icon: "📖" },
  { value: "fill_in_the_blank", label: "Điền từ", description: "Điền từ phù hợp vào chỗ trống", icon: "✏️" },
];

export default function Reading() {
  const [step, setStep] = useState("level"); // "level" | "exerciseType" | "exercise"
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedExerciseType, setSelectedExerciseType] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [progressByItem, setProgressByItem] = useState({});
  const [scores, setScores] = useState({}); // Track scores: { exerciseId: true/false }
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (selectedLevel && selectedExerciseType) {
      loadExercises();
    }
  }, [selectedLevel, selectedExerciseType]);

  useEffect(() => {
    if (exercises.length > 0 && currentExerciseIndex >= 0 && currentExerciseIndex < exercises.length) {
      loadExerciseDetail(exercises[currentExerciseIndex].id);
    }
  }, [currentExerciseIndex, exercises]);

  const loadExercises = async () => {
    if (!selectedLevel || !selectedExerciseType) return;
    
    setLoading(true);
    try {
      const response = await api(
        `/api/reading?level=${selectedLevel}&exerciseType=${selectedExerciseType}`
      );
      setExercises(response.exercises ?? []);

      try {
        const progressRes = await api(`/api/reading/progress?level=${selectedLevel}`);
        setProgressByItem(progressRes.byItem ?? {});
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
    if (!exerciseId) return;
    
    setLoadingDetail(true);
    try {
      const detail = await api(`/api/reading/${exerciseId}`);
      setCurrentExercise(detail);
    } catch (error) {
      console.error("Error loading exercise detail:", error);
      alert("Không thể tải chi tiết bài tập. Vui lòng thử lại.");
      setCurrentExercise(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
    setStep("exerciseType");
  };

  const handleExerciseTypeSelect = (exerciseType) => {
    setSelectedExerciseType(exerciseType);
    setStep("exercise");
    setCurrentExerciseIndex(0);
    setScores({});
    setShowSummary(false);
  };

  const handleBackToLevel = () => {
    setStep("level");
    setSelectedLevel(null);
    setSelectedExerciseType(null);
    setExercises([]);
    setCurrentExerciseIndex(0);
  };

  const handleBackToExerciseType = () => {
    setStep("exerciseType");
    setSelectedExerciseType(null);
    setExercises([]);
    setCurrentExerciseIndex(0);
    setScores({});
    setShowSummary(false);
  };

  const handleRetryExercise = () => {
    setScores({});
    setCurrentExerciseIndex(0);
    setCurrentExercise(null);
    setShowSummary(false);
  };

  const handleAnswerSubmit = (exerciseId, isCorrect) => {
    setScores((prev) => ({
      ...prev,
      [exerciseId]: isCorrect,
    }));
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentExercise(null);
    } else {
      // Hoàn thành tất cả bài tập, hiển thị summary
      setShowSummary(true);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setCurrentExercise(null);
    }
  };

  const refetchProgress = async () => {
    if (!selectedLevel) return;
    try {
      const progressRes = await api(`/api/reading/progress?level=${selectedLevel}`);
      setProgressByItem(progressRes.byItem ?? {});
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <FaBook className="text-3xl text-[#4aa6e0]" />
            <h1 className="text-2xl font-bold text-[#4aa6e0]">Luyện đọc</h1>
          </div>

          {step === "level" && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl border-2 border-[#4aa6e0]/20 p-10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-[#4aa6e0] mb-3">
                    Chọn cấp độ JLPT
                  </h2>
                  <p className="text-gray-600">
                    Chọn cấp độ phù hợp với trình độ của bạn
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => handleLevelSelect(level)}
                      className="group relative px-6 py-6 bg-white rounded-2xl border-2 border-[#4aa6e0]/30 hover:border-[#4aa6e0] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-[#4aa6e0] mb-2 group-hover:scale-110 transition-transform">
                          {level}
                        </span>
                        <span className="text-xs text-gray-500 group-hover:text-[#4aa6e0] transition-colors">
                          Cấp độ {level}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[#4aa6e0]">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "exerciseType" && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl border-2 border-[#4aa6e0]/20 p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-[#4aa6e0] mb-2">
                      Chọn loại bài tập
                    </h2>
                    <p className="text-gray-600">
                      Cấp độ: <span className="font-semibold text-[#4aa6e0]">{selectedLevel}</span>
                    </p>
                  </div>
                  <button
                    onClick={handleBackToLevel}
                    className="px-5 py-2.5 bg-white border-2 border-[#4aa6e0]/30 rounded-xl hover:bg-[#4aa6e0] hover:text-white hover:border-[#4aa6e0] transition-all duration-300 text-sm font-semibold text-[#4aa6e0]"
                  >
                    ← Quay lại
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {EXERCISE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleExerciseTypeSelect(type.value)}
                      className="group relative px-6 py-8 bg-white rounded-2xl border-2 border-[#4aa6e0]/30 hover:border-[#4aa6e0] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                          {type.icon}
                        </div>
                        <div className="text-xl font-bold text-[#4aa6e0] mb-2 group-hover:text-[#3a8bc0] transition-colors">
                          {type.label}
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {type.description}
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[#4aa6e0] text-xl">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "exercise" && (
            <div className="max-w-4xl mx-auto">
              {showSummary ? (
                <div className="max-w-lg mx-auto bg-gradient-to-br from-white via-blue-50 to-white rounded-3xl shadow-2xl border-2 border-[#4aa6e0] p-10 text-center">
                  <div className="mb-8">
                    <div className="text-7xl mb-4 animate-bounce">🎉</div>
                    <h2 className="text-3xl font-bold text-[#4aa6e0] mb-3">
                      Chúc mừng bạn đã hoàn thành bài tập!
                    </h2>
                    <p className="text-gray-600">
                      Bạn đã hoàn thành tất cả các câu hỏi
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#4aa6e0]/10 to-blue-100 rounded-2xl p-8 mb-8 border-2 border-[#4aa6e0]/30">
                    <p className="text-gray-700 mb-3 font-semibold text-lg">Số câu đúng</p>
                    <p className="text-5xl font-bold text-[#4aa6e0] mb-2">
                      {Object.values(scores).filter(Boolean).length}/{exercises.length}
                    </p>
                    <div className="inline-block bg-[#4aa6e0] text-white px-6 py-2 rounded-full mt-3">
                      <p className="text-lg font-semibold">
                        {exercises.length > 0
                          ? Math.round(
                              (Object.values(scores).filter(Boolean).length / exercises.length) * 100
                            )
                          : 0}
                        % đúng
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={handleRetryExercise}
                      className="px-8 py-4 rounded-xl font-semibold bg-[#4aa6e0] text-white hover:bg-[#3a8bc0] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg text-lg"
                    >
                      🔄 Làm lại một lần nữa
                    </button>
                    <button
                      onClick={handleBackToExerciseType}
                      className="px-8 py-4 rounded-xl font-semibold bg-white border-2 border-[#4aa6e0]/30 text-[#4aa6e0] hover:bg-[#4aa6e0] hover:text-white hover:border-[#4aa6e0] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg text-lg"
                    >
                      ← Quay lại
                    </button>
                  </div>
                </div>
              ) : loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Đang tải bài tập...</p>
                </div>
              ) : exercises.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Chưa có bài tập nào cho loại này.
                  </p>
                  <button
                    onClick={handleBackToExerciseType}
                    className="px-6 py-3 bg-[#4aa6e0] text-white rounded-lg hover:bg-[#3a8bc0] transition-colors"
                  >
                    Chọn loại khác
                  </button>
                </div>
              ) : loadingDetail ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Đang tải chi tiết bài tập...</p>
                </div>
              ) : currentExercise ? (
                <div>
                  <div className="bg-gradient-to-r from-[#4aa6e0]/10 to-blue-50 rounded-2xl p-6 mb-6 border-2 border-[#4aa6e0]/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-[#4aa6e0] mb-1">
                          Bài tập {currentExerciseIndex + 1}/{exercises.length}
                        </h2>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-[#4aa6e0]">{selectedLevel}</span> - {EXERCISE_TYPES.find(t => t.value === selectedExerciseType)?.label}
                        </p>
                      </div>
                      <button
                        onClick={handleBackToExerciseType}
                        className="px-5 py-2.5 bg-white border-2 border-[#4aa6e0]/30 rounded-xl hover:bg-[#4aa6e0] hover:text-white hover:border-[#4aa6e0] transition-all duration-300 text-sm font-semibold text-[#4aa6e0]"
                      >
                        ← Quay lại
                      </button>
                    </div>
                  </div>

                  {selectedExerciseType === "reading_comprehension" && (
                    <ReadingComprehensionExercise
                      exercise={currentExercise}
                      onNext={handleNextExercise}
                      onPrevious={handlePreviousExercise}
                      canGoPrevious={currentExerciseIndex > 0}
                      canGoNext={currentExerciseIndex < exercises.length - 1}
                      onProgressUpdate={refetchProgress}
                      onAnswerSubmit={handleAnswerSubmit}
                    />
                  )}

                  {selectedExerciseType === "fill_in_the_blank" && (
                    <FillInTheBlankExercise
                      exercise={currentExercise}
                      onNext={handleNextExercise}
                      onPrevious={handlePreviousExercise}
                      canGoPrevious={currentExerciseIndex > 0}
                      canGoNext={currentExerciseIndex < exercises.length - 1}
                      onProgressUpdate={refetchProgress}
                      onAnswerSubmit={handleAnswerSubmit}
                    />
                  )}
                </div>
              ) : null}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

