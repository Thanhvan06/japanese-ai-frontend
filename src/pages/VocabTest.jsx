import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import TestSettings from "../components/TestSettings";
import TestQuestion from "../components/TestQuestion";
import TestTimer from "../components/TestTimer";
import TestResult from "../components/TestResult";
import { api } from "../lib/api";

export default function VocabTest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [showSettings, setShowSettings] = useState(true);
  const [settings, setSettings] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleStartTest = async (testSettings) => {
    try {
      setLoading(true);
      setSettings(testSettings);
      setShowSettings(false);
      
      const params = new URLSearchParams();
      if (testSettings.level) params.append("level", testSettings.level);
      if (testSettings.topic) params.append("topic", testSettings.topic);
      if (testSettings.flashcardSetId) params.append("flashcardSetId", testSettings.flashcardSetId);
      params.append("limit", testSettings.limit);
      params.append("type", testSettings.type);
      
      const data = await api(`/api/vocab/practice/test?${params.toString()}`);
      setQuestions(data.questions || []);
      setCurrentIndex(0);
      setAnswers({});
      setShowResult(false);
      setCompleted(false);
    } catch (err) {
      console.error("Fetch test error:", err);
      alert(err.message || "Không thể tải bài kiểm tra");
      setShowSettings(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeout = () => {
    handleSubmit();
  };

  const handleAnswerSelect = (optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    setCompleted(true);
    setShowResult(true);
  };

  const handleRestart = () => {
    setShowSettings(true);
    setQuestions([]);
    setSettings(null);
    setAnswers({});
    setCurrentIndex(0);
    setShowResult(false);
    setCompleted(false);
  };

  if (showSettings) {
    const initialLevel = searchParams.get("level") || null;
    const initialTopic = searchParams.get("topic") || null;
    
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate("/vocab")}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ← Quay lại
              </button>
            </div>
            <TestSettings
              onSubmit={handleStartTest}
              initialLevel={initialLevel}
              initialTopic={initialTopic}
            />
          </main>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">
            <p>Đang tải...</p>
          </main>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">
            <p className="text-red-500">Không có câu hỏi nào.</p>
            <button
              onClick={() => setShowSettings(true)}
              className="mt-4 rounded-lg bg-[#4aa6e0] hover:bg-[#3a8bc0] text-white px-6 py-2"
            >
              Quay lại cài đặt
            </button>
          </main>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selectedIndex = answers[currentIndex] ?? null;
  const isAnswered = selectedIndex !== null && selectedIndex !== undefined;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/vocab")}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← Quay lại
            </button>
            <div className="flex items-center gap-4">
              {settings?.timer > 0 && (
                <TestTimer
                  totalSeconds={settings.timer}
                  onTimeout={handleTimeout}
                  isActive={!completed}
                />
              )}
              <div className="text-lg font-semibold text-[#4aa6e0]">
                {currentIndex + 1}/{questions.length}
              </div>
            </div>
          </div>

          {showResult ? (
            <TestResult
              questions={questions}
              answers={answers}
              onRestart={handleRestart}
              onBack={() => navigate("/vocab")}
            />
          ) : (
            <>
              <TestQuestion
                question={currentQuestion}
                selectedIndex={selectedIndex}
                onSelect={handleAnswerSelect}
                showResult={completed}
                correctIndex={currentQuestion.correctIndex}
              />

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  ← Trước
                </button>

                <div className="flex gap-2">
                  {questions.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-3 h-3 rounded-full ${
                        answers[idx] !== undefined
                          ? "bg-green-500"
                          : idx === currentIndex
                          ? "bg-[#4aa6e0]"
                          : "bg-slate-300"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={!isAnswered && currentIndex === questions.length - 1}
                  className="px-4 py-2 rounded-lg bg-[#4aa6e0] hover:bg-[#3a8bc0] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentIndex === questions.length - 1 ? "Nộp bài" : "Tiếp theo →"}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

