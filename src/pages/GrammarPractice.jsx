import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import TestTimer from "../components/TestTimer";
import GrammarTestSettings from "../components/GrammarTestSettings";
import { getGrammarExercises } from "../services/grammarService";

export default function GrammarPractice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [showSettings, setShowSettings] = useState(true);
  const [settings, setSettings] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleStartTest = async (testSettings) => {
    try {
      setLoading(true);
      setSettings(testSettings);
      setShowSettings(false);
      
      const data = await getGrammarExercises({
        level: testSettings.level,
        question_type: testSettings.question_type,
        limit: testSettings.limit || 20,
        grammar_ids: testSettings.grammar_ids,
      });

      if (data.length === 0) {
        alert("Không có câu hỏi nào. Vui lòng thử lại với cấp độ hoặc mẫu ngữ pháp khác.");
        setShowSettings(true);
        return;
      }

      setExercises(data);
      setTimeLeft(testSettings.timer || 0);
      setCurrentIndex(0);
      setAnswers({});
      setShowResult(false);
      setSubmitted(false);
    } catch (err) {
      console.error("Load exercises error:", err);
      alert(err.message || "Không thể tải bài tập. Vui lòng thử lại.");
      setShowSettings(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft > 0 && !submitted && !showResult) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, submitted, showResult]);

  const handleAnswerSelect = (answer) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: answer,
    }));
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
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
    setSubmitted(true);
    setShowResult(true);
  };

  const handleTimeout = () => {
    handleSubmit();
  };

  const handleRestart = () => {
    setShowSettings(true);
    setExercises([]);
    setSettings(null);
    setAnswers({});
    setCurrentIndex(0);
    setShowResult(false);
    setSubmitted(false);
  };

  if (showSettings) {
    const initialLevel = searchParams.get("level") || null;
    
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <button
                onClick={() => navigate("/grammar")}
                className="w-full sm:w-auto text-sm text-slate-500 hover:text-slate-700"
              >
                ← Quay lại
              </button>
            </div>
            <GrammarTestSettings
              onSubmit={handleStartTest}
              initialLevel={initialLevel}
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

  if (exercises.length === 0) {
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

  const currentExercise = exercises[currentIndex];
  const isMultipleChoice = currentExercise.question_type === "multiple_choice";
  const userAnswer = answers[currentIndex];

  if (showResult) {
    return <GrammarPracticeResult exercises={exercises} answers={answers} onRestart={handleRestart} />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <button
              onClick={() => navigate("/grammar")}
              className="w-full sm:w-auto text-sm text-slate-500 hover:text-slate-700"
            >
              ← Quay lại
            </button>
            <div className="flex items-center gap-4">
              {settings?.timer > 0 && (
                <TestTimer
                  totalSeconds={timeLeft}
                  onTimeout={handleTimeout}
                  isActive={!submitted}
                />
              )}
              <div className="text-lg font-semibold text-[#4aa6e0]">
                {currentIndex + 1}/{exercises.length}
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg mb-6">
            {/* Question Text - Only show for multiple choice */}
            {isMultipleChoice && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">
                  {currentExercise.question_text}
                  {currentExercise.question_suffix && (
                    <span className="text-slate-600"> {currentExercise.question_suffix}</span>
                  )}
                </h3>
              </div>
            )}

            {/* Multiple Choice */}
            {isMultipleChoice && (
              <div className="space-y-3">
                {currentExercise.options.map((option, idx) => {
                  const isSelected = userAnswer === idx;
                  const isCorrect = option.is_correct;
                  const showCorrect = submitted && isCorrect;
                  const showIncorrect = submitted && isSelected && !isCorrect;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(idx)}
                      disabled={submitted}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        showCorrect
                          ? "bg-green-100 border-green-400 text-green-900"
                          : showIncorrect
                          ? "bg-red-100 border-red-400 text-red-900"
                          : isSelected
                          ? "bg-[#4aa6e0] text-white border-[#4aa6e0]"
                          : "bg-white border-slate-200 hover:border-[#4aa6e0] hover:bg-slate-50"
                      } ${submitted ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                            isSelected && !submitted
                              ? "bg-white text-[#4aa6e0]"
                              : showCorrect || showIncorrect
                              ? "bg-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <div className="font-medium">{option.option_text}</div>
                        {showCorrect && (
                          <span className="ml-auto text-green-600 font-semibold">✓ Đúng</span>
                        )}
                        {showIncorrect && (
                          <span className="ml-auto text-red-600 font-semibold">✗ Sai</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sentence Arrangement */}
            {!isMultipleChoice && (
              <SentenceArrangementQuestion
                exercise={currentExercise}
                userAnswer={userAnswer}
                onSubmit={handleAnswerSelect}
                submitted={submitted}
              />
            )}

            {/* Answer Status and Explanation (shown after submit) */}
            {submitted && (
              <div className="mt-6 space-y-4">
                {/* Answer Status */}
                {(() => {
                  let isCorrect = false;
                  if (isMultipleChoice) {
                    const correctIndex = currentExercise.options.findIndex(opt => opt.is_correct);
                    isCorrect = userAnswer === correctIndex;
                  } else {
                    // Sentence arrangement
                    const correctOrder = currentExercise.options
                      .filter(opt => opt.option_role === "arrange_word")
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map(opt => opt.option_text);
                    const userOrder = Array.isArray(userAnswer)
                      ? userAnswer.map(i => {
                          const words = currentExercise.options.filter(opt => opt.option_role === "arrange_word");
                          return words[i]?.option_text;
                        }).filter(Boolean)
                      : [];
                    isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
                  }

                  return (
                    <div className={`p-4 rounded-lg border-2 ${
                      isCorrect 
                        ? "bg-green-50 border-green-200" 
                        : "bg-red-50 border-red-200"
                    }`}>
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <>
                            <span className="text-2xl">✓</span>
                            <span className="text-lg font-semibold text-green-700">Đúng!</span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl">✗</span>
                            <span className="text-lg font-semibold text-red-700">Sai</span>
                          </>
                        )}
                      </div>
                      {!isCorrect && (
                        <div className="mt-2 text-sm text-slate-600">
                          {isMultipleChoice ? (
                            <>
                              <span className="text-red-600">Đáp án của bạn: </span>
                              <span>{userAnswer !== undefined ? currentExercise.options[userAnswer]?.option_text : "Chưa trả lời"}</span>
                              <br />
                              <span className="text-green-600">Đáp án đúng: </span>
                              <span>{currentExercise.options.find(opt => opt.is_correct)?.option_text}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-red-600">Thứ tự của bạn: </span>
                              <span>
                                {Array.isArray(userAnswer) && userAnswer.length > 0
                                  ? userAnswer.map(i => {
                                      const words = currentExercise.options.filter(opt => opt.option_role === "arrange_word");
                                      return words[i]?.option_text;
                                    }).filter(Boolean).join(" ")
                                  : "Chưa trả lời"}
                              </span>
                              <br />
                              <span className="text-green-600">Thứ tự đúng: </span>
                              <span>
                                {currentExercise.options
                                  .filter(opt => opt.option_role === "arrange_word")
                                  .sort((a, b) => a.sort_order - b.sort_order)
                                  .map(opt => opt.option_text)
                                  .join(" ")}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Explanation Note */}
                {currentExercise.explanation_note && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800 mb-2">Giải thích:</p>
                    <p className="text-sm text-blue-700 whitespace-pre-wrap">{currentExercise.explanation_note}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              ← Trước
            </button>

            <div
              className="flex gap-2 overflow-x-auto max-w-full w-full sm:w-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              {exercises.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
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
              disabled={userAnswer === undefined && currentIndex === exercises.length - 1}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#4aa6e0] hover:bg-[#3a8bc0] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentIndex === exercises.length - 1 ? "Nộp bài" : "Tiếp theo →"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

// Sentence Arrangement Component
function SentenceArrangementQuestion({ exercise, userAnswer, onSubmit, submitted }) {
  const [arrangedWords, setArrangedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);

  useEffect(() => {
    // Get all words with their original indices in the options array
    const allOptions = exercise.options.filter(opt => opt.option_role === "arrange_word");
    const allWords = allOptions.map((opt, idx) => ({
      text: opt.option_text,
      sortOrder: opt.sort_order,
      isCorrect: opt.is_correct,
      originalIndex: idx, // Index in the filtered array
    }));

    // If user already answered, restore their answer
    if (userAnswer !== undefined && Array.isArray(userAnswer) && userAnswer.length > 0) {
      // Restore arranged words based on user's answer indices
      const arranged = userAnswer.map(idx => allWords[idx]).filter(Boolean);
      const availableIndices = allWords.map((_, idx) => idx).filter(idx => !userAnswer.includes(idx));
      const available = availableIndices.map(idx => allWords[idx]);
      setArrangedWords(arranged);
      setAvailableWords(available);
    } else {
      // Shuffle and set all as available
      const shuffled = [...allWords].sort(() => Math.random() - 0.5);
      setAvailableWords(shuffled);
      setArrangedWords([]);
    }
  }, [exercise, userAnswer]);

  const handleWordClick = (word, fromArranged) => {
    if (submitted) return;

    let newArranged, newAvailable;

    if (fromArranged) {
      // Move from arranged to available
      newArranged = arrangedWords.filter((w) => w !== word);
      newAvailable = [...availableWords, word];
    } else {
      // Move from available to arranged
      newArranged = [...arrangedWords, word];
      newAvailable = availableWords.filter((w) => w !== word);
    }

    // Update state
    setArrangedWords(newArranged);
    setAvailableWords(newAvailable);

    // Update answer - map arranged words to their original indices
    const answerIndices = newArranged.map(arrangedWord => arrangedWord.originalIndex);
    onSubmit(answerIndices.length > 0 ? answerIndices : undefined);
  };

  const correctOrder = exercise.options
    .filter(opt => opt.option_role === "arrange_word")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(opt => opt.option_text);

  const userOrder = arrangedWords.map(w => w.text);
  const isCorrect = submitted && JSON.stringify(userOrder) === JSON.stringify(correctOrder);

  // Render question with blank placeholder
  const renderQuestionWithBlank = () => {
    let questionText = exercise.question_text || "";
    const questionSuffix = exercise.question_suffix || "";
    
    // Combine question text and suffix
    let fullQuestion = questionText + (questionSuffix ? " " + questionSuffix : "");
    
    // Check if question already contains parentheses (various formats)
    const hasBlank = /（[^）]*）|\([^)]*\)|___+/.test(fullQuestion);
    
    if (hasBlank) {
      // Replace existing blank markers with visible placeholder
      return fullQuestion
        .replace(/（[^）]*）/g, "（　　　）")
        .replace(/\([^)]*\)/g, "（　　　）")
        .replace(/___+/g, "（　　　）")
        .replace(/\s+/g, " "); // Normalize whitespace
    } else {
      // If no blank found, inject at the beginning
      return "（　　　）" + fullQuestion;
    }
  };

  return (
    <div className="space-y-6">
      {/* Instruction and Question */}
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-700 mb-4">
          Sắp xếp các từ sau để hoàn thành câu
        </p>
        <div className="text-2xl font-bold text-slate-800 mt-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          {renderQuestionWithBlank()}
        </div>
      </div>

      {/* Arranged Words Area (Drop Zone) */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">Khu vực sắp xếp:</p>
        <div className="min-h-[100px] p-6 border-2 border-dashed border-[#4aa6e0] rounded-lg bg-blue-50 flex flex-wrap gap-3 items-center justify-center">
          {arrangedWords.length === 0 ? (
            <span className="text-slate-400 italic text-center">
              Click vào các từ bên dưới để sắp xếp vào đây
            </span>
          ) : (
            arrangedWords.map((word, idx) => (
              <button
                key={idx}
                onClick={() => handleWordClick(word, true)}
                disabled={submitted}
                className={`px-5 py-3 rounded-lg border-2 font-semibold text-lg transition-all ${
                  submitted && isCorrect
                    ? "bg-green-100 border-green-400 text-green-900"
                    : submitted && !isCorrect
                    ? "bg-red-100 border-red-400 text-red-900"
                    : "bg-white border-[#4aa6e0] text-[#4aa6e0] hover:bg-blue-100 shadow-sm"
                } ${submitted ? "cursor-default" : "cursor-pointer"}`}
              >
                {word.text}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Available Words */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">Các từ có sẵn:</p>
        <div className="flex flex-wrap gap-3">
          {availableWords.map((word, idx) => (
            <button
              key={idx}
              onClick={() => handleWordClick(word, false)}
              disabled={submitted}
              className="px-5 py-3 rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-50 hover:border-[#4aa6e0] text-slate-700 font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {word.text}
            </button>
          ))}
        </div>
      </div>

      {/* Correct Order (shown after submit if wrong) */}
      {submitted && !isCorrect && (
        <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
          <p className="text-sm font-semibold text-green-800 mb-3">Thứ tự đúng:</p>
          <div className="flex flex-wrap gap-2">
            {correctOrder.map((word, idx) => (
              <span
                key={idx}
                className="px-4 py-2 rounded-lg bg-green-100 border border-green-400 text-green-900 font-semibold"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Result Component
function GrammarPracticeResult({ exercises, answers, onRestart }) {
  const navigate = useNavigate();
  
  const totalQuestions = exercises.length;
  const correctCount = exercises.reduce((count, ex, idx) => {
    const userAnswer = answers[idx];
    if (ex.question_type === "multiple_choice") {
      const correctIndex = ex.options.findIndex(opt => opt.is_correct);
      return count + (userAnswer === correctIndex ? 1 : 0);
    } else {
      // Sentence arrangement
      const correctOrder = ex.options
        .filter(opt => opt.option_role === "arrange_word")
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(opt => opt.option_text);
      
      const userOrder = Array.isArray(userAnswer)
        ? userAnswer.map(i => {
            const words = ex.options.filter(opt => opt.option_role === "arrange_word");
            return words[i]?.option_text;
          }).filter(Boolean)
        : [];
      
      return count + (JSON.stringify(userOrder) === JSON.stringify(correctOrder) ? 1 : 0);
    }
  }, 0);

  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { emoji: "🎉", text: "Xuất sắc!", color: "text-green-600" };
    if (percentage >= 75) return { emoji: "🌟", text: "Tốt lắm!", color: "text-green-500" };
    if (percentage >= 60) return { emoji: "👍", text: "Khá tốt!", color: "text-blue-500" };
    if (percentage >= 50) return { emoji: "📚", text: "Cần cố gắng thêm", color: "text-orange-500" };
    return { emoji: "💪", text: "Đừng bỏ cuộc!", color: "text-red-500" };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{performance.emoji}</div>
              <h2 className={`text-3xl font-bold mb-2 ${performance.color}`}>
                {performance.text}
              </h2>
              <p className="text-slate-600 mb-4">Bạn đã hoàn thành bài kiểm tra</p>

              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#4aa6e0]">{correctCount}</div>
                  <div className="text-sm text-slate-500">Đúng</div>
                </div>
                <div className="text-slate-300">/</div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-700">{totalQuestions}</div>
                  <div className="text-sm text-slate-500">Tổng số</div>
                </div>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-4 mb-2">
                <div
                  className={`h-4 rounded-full transition-all ${
                    percentage >= 75 ? "bg-green-500" : percentage >= 50 ? "bg-blue-500" : "bg-orange-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-2xl font-semibold text-slate-700">{percentage}%</p>
            </div>

            {/* Detailed Results */}
            <div className="border-t border-slate-200 pt-6 mb-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Chi tiết kết quả</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {exercises.map((ex, idx) => {
                  const userAnswer = answers[idx];
                  let isCorrect = false;
                  let userAnswerText = "";
                  let correctAnswerText = "";

                  if (ex.question_type === "multiple_choice") {
                    const correctIndex = ex.options.findIndex(opt => opt.is_correct);
                    isCorrect = userAnswer === correctIndex;
                    userAnswerText = userAnswer !== undefined && userAnswer !== null 
                      ? ex.options[userAnswer]?.option_text 
                      : "Chưa trả lời";
                    correctAnswerText = ex.options[correctIndex]?.option_text || "";
                  } else {
                    // Sentence arrangement
                    const correctOrder = ex.options
                      .filter(opt => opt.option_role === "arrange_word")
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map(opt => opt.option_text);
                    
                    const userOrder = Array.isArray(userAnswer)
                      ? userAnswer.map(i => {
                          const words = ex.options.filter(opt => opt.option_role === "arrange_word");
                          return words[i]?.option_text;
                        }).filter(Boolean)
                      : [];
                    
                    isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
                    userAnswerText = userOrder.length > 0 ? userOrder.join(" ") : "Chưa trả lời";
                    correctAnswerText = correctOrder.join(" ");
                  }

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border-2 ${
                        isCorrect
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`font-semibold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                          Câu {idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="text-sm text-slate-600 mb-1">
                            <span className="font-medium">
                              {ex.question_text}
                              {ex.question_suffix && ` ${ex.question_suffix}`}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {isCorrect ? (
                              <span className="text-green-600">✓ Bạn đã trả lời đúng</span>
                            ) : (
                              <>
                                <span className="text-red-600">✗ Sai: </span>
                                <span>{userAnswerText}</span>
                                <span className="text-green-600"> | Đúng: </span>
                                <span>{correctAnswerText}</span>
                              </>
                            )}
                          </div>
                          {ex.explanation_note && (
                            <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                              <span className="font-semibold">Giải thích: </span>
                              {ex.explanation_note}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/grammar")}
                className="flex-1 rounded-lg border-2 border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-3 font-semibold transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={onRestart}
                className="flex-1 rounded-lg bg-[#4aa6e0] hover:bg-[#3a8bc0] text-white px-4 py-3 font-semibold transition-colors"
              >
                Làm lại
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

