import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Timer from "../components/Timer";
import { api } from "../lib/api";

export default function VocabTest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const level = searchParams.get("level") || "N5";
  const topic = searchParams.get("topic");
  const limit = parseInt(searchParams.get("limit")) || 10;
  const testType = searchParams.get("type") || "image";

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ level, limit, type: testType });
        const data = await api(`/api/vocab/practice/test?${params.toString()}`);
        setQuestions(data.questions || []);
      } catch (err) {
        console.error("Fetch test error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [level, limit, testType]);

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: answer,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(answers[currentIndex + 1] || "");
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedAnswer(answers[currentIndex - 1] || "");
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct_answer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setCompleted(true);
    setShowResult(true);
  };

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
              onClick={() => navigate("/vocab")}
              className="mt-4 rounded-lg bg-[#4aa6e0] hover:bg-[#3a8bc0] text-white px-6 py-2"
            >
              Quay lại
            </button>
          </main>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isAnswered = answers[currentIndex] !== undefined;

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
              <Timer isActive={!completed} />
              <div className="text-lg font-semibold text-[#4aa6e0]">
                {currentIndex + 1}/{questions.length}
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#4aa6e0] mb-6">
            {testType === "image" ? "Image Guessing" : "Fill Blank"} - {level}
          </h1>

          {showResult ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-[#4aa6e0] mb-2">
                Hoàn thành!
              </h2>
              <p className="text-slate-600 mb-2">
                Điểm số: {score}/{questions.length}
              </p>
              <p className="text-slate-500 text-sm mb-6">
                Tỷ lệ đúng: {((score / questions.length) * 100).toFixed(0)}%
              </p>
              <button
                onClick={() => navigate("/vocab")}
                className="rounded-lg bg-[#4aa6e0] hover:bg-[#3a8bc0] text-white px-6 py-2 font-semibold"
              >
                Quay lại
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg">
              {/* Question */}
              <div className="mb-8">
                {currentQuestion.type === "image" ? (
                  <div className="text-center">
                    <img
                      src={currentQuestion.image_url}
                      alt="Question"
                      className="max-w-md mx-auto rounded-lg shadow-md mb-4"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
                      }}
                    />
                    <p className="text-lg font-semibold text-slate-700">
                      Chọn từ tiếng Nhật phù hợp với hình ảnh
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-slate-800 mb-2">
                      {currentQuestion.sentence}
                    </p>
                    {currentQuestion.sentence_furigana && (
                      <p className="text-lg text-slate-500 mb-4">
                        {currentQuestion.sentence_furigana}
                      </p>
                    )}
                    <p className="text-lg font-semibold text-slate-700">
                      Chọn nghĩa phù hợp để điền vào chỗ trống
                    </p>
                  </div>
                )}
              </div>

              {/* Answers */}
              <div className="space-y-3 mb-8">
                {currentQuestion.answers.map((answer, idx) => {
                  const isSelected = selectedAnswer === answer;
                  const isCorrect = answer === currentQuestion.correct_answer;
                  const showCorrect = completed && isCorrect;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(answer)}
                      disabled={showResult}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        showCorrect
                          ? "bg-green-100 border-green-400"
                          : isSelected && showResult && !isCorrect
                          ? "bg-red-100 border-red-400"
                          : isSelected
                          ? "bg-[#4aa6e0] text-white border-[#4aa6e0]"
                          : "bg-white border-slate-200 hover:border-[#4aa6e0]"
                      }`}
                    >
                      <div className="font-semibold">{answer}</div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

