import { useState, useEffect } from "react";
import { api } from "../../lib/api.js";

export default function FillInTheBlankExercise({
  exercise,
  onNext,
  onPrevious,
  canGoPrevious,
  canGoNext,
  onProgressUpdate,
  onAnswerSubmit,
}) {
  const [userAnswers, setUserAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [blanks, setBlanks] = useState([]);

  if (!exercise) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Đang tải bài tập...</p>
      </div>
    );
  }

  useEffect(() => {
    if (!exercise) return;
    
    const exerciseBlanks = Array.isArray(exercise.blanks) ? exercise.blanks : [];
    setBlanks(exerciseBlanks);
    setUserAnswers({});
    setShowResult(false);
    setResult(null);
  }, [exercise]);

  const handleAnswerChange = (position, answerIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [position]: answerIndex,
    }));
  };

  const handleSubmitAnswer = async () => {
    // Check if all blanks are filled
    const allFilled = blanks.every((blank) => userAnswers[blank.position] !== undefined);
    if (!allFilled) {
      alert("Vui lòng điền tất cả các chỗ trống.");
      return;
    }

    // Convert userAnswers to array format
    const answers = blanks.map((blank) => userAnswers[blank.position] ?? -1);

    try {
      const response = await api("/api/reading/check-fill-in-the-blank", {
        method: "POST",
        body: JSON.stringify({
          itemId: exercise.id,
          answers: answers,
        }),
      });

      setResult(response);
      setShowResult(true);

      onAnswerSubmit?.(exercise.id, response.isCorrect);
      onProgressUpdate?.();

      if (!canGoNext) {
        setTimeout(() => onNext?.(), 2000);
      }
    } catch (error) {
      console.error("Error checking fill in the blank:", error);
      alert("Không thể kiểm tra đáp án. Vui lòng thử lại.");
    }
  };

  const renderPassage = () => {
    if (!exercise.passage) return "Không có đoạn văn";

    let passage = exercise.passage;
    const blankPositions = blanks.map((b) => b.position).sort((a, b) => b - a);

    // Replace (1)___, (2)___, etc. with styled blanks
    blankPositions.forEach((position) => {
      const blank = blanks.find((b) => b.position === position);
      if (blank) {
        const userAnswerIndex = userAnswers[position];
        const isCorrect = result?.results?.find((r) => r.position === position)?.isCorrect;
        const showFeedback = showResult && isCorrect !== undefined;

        let blankClass = "inline-block px-3 py-1 mx-1 border-2 rounded";
        if (showFeedback) {
          blankClass += isCorrect
            ? " bg-green-100 border-green-500 text-green-800"
            : " bg-red-100 border-red-500 text-red-800";
        } else {
          blankClass += userAnswerIndex !== undefined
            ? " bg-blue-100 border-[#4aa6e0] text-[#4aa6e0]"
            : " bg-gray-100 border-gray-300 text-gray-500";
        }

        const blankText = userAnswerIndex !== undefined && blank.options
          ? `${position}. ${blank.options[userAnswerIndex] || "___"}`
          : `${position}.___`;

        passage = passage.replace(
          new RegExp(`\\(${position}\\)___+`, "g"),
          `<span class="${blankClass}">${blankText}</span>`
        );
      }
    });

    return <div className="passage-content" dangerouslySetInnerHTML={{ __html: passage }} />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-[#4aa6e0]/20 p-8">
      {/* Passage */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-[#4aa6e0] mb-4">Đoạn văn</h3>
        <div className="bg-blue-50 rounded-xl p-6 border-2 border-[#4aa6e0]/20">
          <div className="text-lg leading-relaxed text-[#2e3856]">
            {renderPassage()}
          </div>
        </div>
      </div>

      {/* Options for each blank */}
      <div className="mb-6 space-y-6">
        {blanks.map((blank) => {
          const userAnswerIndex = userAnswers[blank.position];
          const resultForBlank = result?.results?.find((r) => r.position === blank.position);
          const showFeedback = showResult && resultForBlank;

          return (
            <div key={blank.position} className="border-2 border-[#4aa6e0]/20 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-[#4aa6e0] mb-3">
                ({blank.position})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {blank.options?.map((option, index) => {
                  const isSelected = userAnswerIndex === index;
                  const isCorrect = resultForBlank?.correctIndex === index;
                  const showCorrect = showFeedback && isCorrect;

                  return (
                    <button
                      key={index}
                      onClick={() => !showResult && handleAnswerChange(blank.position, index)}
                      disabled={showResult}
                      className={`px-4 py-3 rounded-lg text-left border-2 transition-all duration-300 ${
                        showResult
                          ? showCorrect
                            ? "bg-green-100 border-green-500 text-green-800"
                            : isSelected && !isCorrect
                            ? "bg-red-100 border-red-500 text-red-800"
                            : "bg-gray-50 border-gray-300 text-gray-600"
                          : isSelected
                          ? "bg-[#4aa6e0] border-[#4aa6e0] text-white hover:bg-[#3a8bc0]"
                          : "bg-white border-[#4aa6e0]/30 text-[#2e3856] hover:border-[#4aa6e0] hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span>{option}</span>
                        {showResult && showCorrect && (
                          <span className="ml-auto text-green-600 font-bold">✓</span>
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <span className="ml-auto text-red-600 font-bold">✗</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Result */}
      {showResult && result && (
        <div
          className={`mb-6 p-6 rounded-xl ${
            result.isCorrect
              ? "bg-green-50 border-2 border-green-500"
              : "bg-red-50 border-2 border-red-500"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <p
              className={`font-bold text-xl ${
                result.isCorrect ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.isCorrect ? "✓ Chính xác!" : `✗ Sai rồi!`}
            </p>
            <p className="text-lg font-semibold text-[#4aa6e0]">
              Điểm: {result.score}
            </p>
          </div>
          {exercise.explain_viet && (
            <p className="text-gray-700 mt-2">{exercise.explain_viet}</p>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
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
          disabled={showResult}
          className={`px-8 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 ${
            showResult
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

