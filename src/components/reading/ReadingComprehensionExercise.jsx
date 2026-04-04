import { useState, useEffect, useMemo } from "react";
import { api } from "../../lib/api.js";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getCorrectJp(question) {
  if (!question?.options?.length) {
    return "";
  }
  const idx = question.answer;
  return question.options[idx]?.jp ?? "";
}

export default function ReadingComprehensionExercise({
  exercise,
  onNext,
  onPrevious,
  canGoPrevious,
  canGoNext,
  onProgressUpdate,
  onAnswerSubmit,
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [options, setOptions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [allCorrectSoFar, setAllCorrectSoFar] = useState(true);

  const isBilingual = Boolean(exercise?.isBilingual && exercise?.bilingual);
  const questions = useMemo(() => {
    if (isBilingual) {
      return exercise.bilingual.questions || [];
    }
    return [];
  }, [exercise, isBilingual]);

  const currentQuestion = isBilingual ? questions[qIndex] : null;
  const totalQuestions = isBilingual ? questions.length : 1;
  const isLastQuestion = isBilingual ? qIndex >= totalQuestions - 1 : true;

  if (!exercise) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Đang tải bài tập...</p>
      </div>
    );
  }

  useEffect(() => {
    if (!exercise) {
      return;
    }

    if (isBilingual && currentQuestion) {
      const shuffled = shuffleArray([...currentQuestion.options]);
      setOptions(shuffled);
    } else if (!isBilingual) {
      const lo = Array.isArray(exercise.options) ? exercise.options : [];
      setOptions(lo.length > 0 ? shuffleArray(lo) : []);
    } else {
      setOptions([]);
    }

    setUserAnswer("");
    setShowAnswer(false);
    setSubmitFeedback(null);
    setIsCorrect(false);
  }, [exercise, isBilingual, qIndex, currentQuestion]);

  useEffect(() => {
    setQIndex(0);
    setAllCorrectSoFar(true);
  }, [exercise?.id]);

  const handleSubmitAnswer = async () => {
    if (!userAnswer || !exercise) {
      return;
    }

    let correct = false;
    let correctLabel = "";

    if (isBilingual && currentQuestion) {
      correctLabel = getCorrectJp(currentQuestion);
      correct = userAnswer === correctLabel;
    } else {
      correctLabel = exercise.correctAnswer || "";
      correct = exercise.correctAnswer === userAnswer;
    }

    setIsCorrect(correct);
    setSubmitFeedback(
      correct
        ? "Chính xác!"
        : `Sai. Đáp án đúng: ${correctLabel || "Không có đáp án"}`
    );
    setShowAnswer(true);

    const stillAllCorrect = allCorrectSoFar && correct;
    setAllCorrectSoFar(stillAllCorrect);

    if (!isBilingual || isLastQuestion) {
      onAnswerSubmit?.(exercise.id, stillAllCorrect);

      try {
        await api("/api/reading/attempt", {
          method: "POST",
          body: JSON.stringify({
            itemId: exercise.id,
            isCorrect: stillAllCorrect,
          }),
        });
        onProgressUpdate?.();
      } catch {
        // User not logged in or API error - ignore
      }

      if (!isBilingual && !canGoNext) {
        setTimeout(() => onNext?.(), 2000);
      }
    }
  };

  const handleNextQuestion = () => {
    if (!isBilingual || !showAnswer) {
      return;
    }
    if (qIndex < totalQuestions - 1) {
      setQIndex((i) => i + 1);
    }
  };

  useEffect(() => {
    if (
      isBilingual &&
      showAnswer &&
      isLastQuestion &&
      !canGoNext
    ) {
      const t = setTimeout(() => onNext?.(), 2000);
      return () => clearTimeout(t);
    }
  }, [isBilingual, showAnswer, isLastQuestion, canGoNext, onNext]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-[#4aa6e0]/20 p-8">
      {isBilingual && (
        <>
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-sm px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                Song ngữ
              </span>
              {exercise.bilingual.level && (
                <span className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {exercise.bilingual.level}
                </span>
              )}
              {exercise.jlpt_level && (
                <span className="text-sm px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                  {exercise.jlpt_level}
                </span>
              )}
            </div>
            <h2 className="text-xl text-[#2e3856] font-medium">
              {exercise.bilingual.title_jp}
            </h2>
            <p className="text-base text-gray-600 mt-1 italic">
              {exercise.bilingual.title_vi}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg text-[#4aa6e0] font-medium mb-3">
              Nội dung
            </h3>
            <div className="bg-blue-50 rounded-xl p-5 border border-[#4aa6e0]/20 max-h-[min(70vh,32rem)] overflow-y-auto">
              <div className="space-y-4">
                {exercise.bilingual.content.map((row, idx) => (
                  <div key={idx} className="text-[#2e3856]">
                    <p className="text-base leading-relaxed">{row.jp}</p>
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed italic pl-0.5">
                      {row.vi}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {exercise.bilingual.vocab?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg text-[#4aa6e0] font-medium mb-3 flex items-center gap-2">
                <span>Từ vựng tham khảo</span>
                <span className="text-sm font-normal text-gray-500">
                  ({exercise.bilingual.vocab.length})
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exercise.bilingual.vocab.map((v, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm"
                  >
                    <div className="font-medium text-[#2e3856]">
                      {v.word}
                      <span className="text-gray-500 font-normal">
                        {" "}
                        ({v.reading})
                      </span>
                    </div>
                    <div className="text-gray-600 mt-0.5">{v.meaning_vi}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!isBilingual && (
        <div className="mb-8">
          <h3 className="text-lg text-[#4aa6e0] font-medium mb-3">
            Đoạn văn
          </h3>
          <div className="bg-blue-50 rounded-xl p-5 border border-[#4aa6e0]/20 max-h-[min(70vh,32rem)] overflow-y-auto">
            <div className="text-base leading-relaxed text-[#2e3856] whitespace-pre-wrap">
              {exercise.passage || "Không có đoạn văn"}
            </div>
          </div>
        </div>
      )}

      {(isBilingual ? currentQuestion : exercise.question) && (
        <div className="mb-6">
          <h3 className="text-lg text-[#4aa6e0] font-medium mb-3">
            Câu hỏi
            {isBilingual && totalQuestions > 1 && (
              <span className="text-gray-500 font-normal text-base ml-2">
                ({qIndex + 1}/{totalQuestions})
              </span>
            )}
          </h3>
          <div className="text-base text-[#2e3856] leading-relaxed">
            {isBilingual ? currentQuestion.question_jp : exercise.question}
          </div>
          {isBilingual && (
            <p className="text-sm text-gray-600 mt-2 italic leading-relaxed">
              {currentQuestion.question_vi}
            </p>
          )}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg text-[#4aa6e0] font-medium mb-3">
          Chọn đáp án
        </h3>
        <div className="space-y-3">
          {options.map((option, index) => {
            const jp = isBilingual ? option.jp : option;
            const vi = isBilingual ? option.vi : null;
            const optionLabel = String.fromCharCode(65 + index);
            const isSelected = userAnswer === jp;
            const correctJp = isBilingual
              ? getCorrectJp(currentQuestion)
              : exercise.correctAnswer;
            const showCorrect = showAnswer && jp === correctJp;

            return (
              <button
                key={`${qIndex}-${index}-${jp}`}
                type="button"
                onClick={() => !showAnswer && setUserAnswer(jp)}
                disabled={showAnswer}
                className={`w-full px-5 py-4 rounded-xl text-left border-2 transition-all duration-300 ${
                  showAnswer
                    ? showCorrect
                      ? "bg-green-100 border-green-500 text-green-800"
                      : isSelected && !showCorrect
                        ? "bg-red-100 border-red-500 text-red-800"
                        : "bg-gray-50 border-gray-300 text-gray-600"
                    : isSelected
                      ? "bg-[#4aa6e0] border-[#4aa6e0] text-white hover:bg-[#3a8bc0]"
                      : "bg-white border-[#4aa6e0]/30 text-[#2e3856] hover:border-[#4aa6e0] hover:bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`font-semibold text-base shrink-0 ${
                      showAnswer && showCorrect
                        ? "text-green-700"
                        : isSelected && showAnswer && !showCorrect
                          ? "text-red-700"
                          : ""
                    }`}
                  >
                    {optionLabel}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-base">{jp}</span>
                    {vi != null && vi !== "" && (
                      <p
                        className={`text-sm mt-1 italic ${
                          showAnswer && (isSelected || showCorrect)
                            ? "opacity-95"
                            : isSelected && !showAnswer
                              ? "text-white/90"
                              : "text-gray-600"
                        }`}
                      >
                        {vi}
                      </p>
                    )}
                  </div>
                  {showAnswer && showCorrect && (
                    <span className="ml-auto text-green-600 font-semibold shrink-0">
                      ✓
                    </span>
                  )}
                  {showAnswer && isSelected && !showCorrect && (
                    <span className="ml-auto text-red-600 font-semibold shrink-0">
                      ✗
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showAnswer && (
        <div
          className={`mb-6 p-4 rounded-xl ${
            isCorrect
              ? "bg-green-50 border-2 border-green-500"
              : "bg-red-50 border-2 border-red-500"
          }`}
        >
          <p
            className={`font-medium text-base ${
              isCorrect ? "text-green-800" : "text-red-800"
            }`}
          >
            {submitFeedback}
          </p>
          {exercise.explain_viet && (!isBilingual || isLastQuestion) && (
            <p className="mt-2 text-gray-700 text-sm">{exercise.explain_viet}</p>
          )}
        </div>
      )}

      <div className="flex gap-3 justify-center md:flex-row flex-col flex-wrap">
        {canGoPrevious && (
          <button
            type="button"
            onClick={onPrevious}
            className="px-6 py-3 rounded-lg text-base font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            ← Bài trước
          </button>
        )}
        {isBilingual &&
          showAnswer &&
          !isLastQuestion &&
          totalQuestions > 1 && (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="px-8 py-3 rounded-lg text-base font-medium bg-[#4aa6e0] text-white hover:bg-[#3a8bc0] transition-colors"
            >
              Câu hỏi tiếp theo →
            </button>
          )}
        <button
          type="button"
          onClick={handleSubmitAnswer}
          disabled={!userAnswer || showAnswer}
          className={`px-8 py-3 rounded-lg text-base font-medium cursor-pointer transition-all duration-300 ${
            !userAnswer || showAnswer
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#4aa6e0] text-white hover:bg-[#3a8bc0] hover:-translate-y-0.5 hover:shadow-lg"
          }`}
        >
          {showAnswer ? "Đã trả lời" : "Nộp bài"}
        </button>
        {isBilingual && showAnswer && isLastQuestion && canGoNext && (
          <button
            type="button"
            onClick={() => onNext()}
            className="px-8 py-3 rounded-lg text-base font-medium bg-green-500 text-white hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-lg transition-colors"
          >
            Bài tiếp theo →
          </button>
        )}
        {!isBilingual && showAnswer && canGoNext && (
          <button
            type="button"
            onClick={onNext}
            className="px-8 py-3 rounded-lg text-base font-medium bg-green-500 text-white hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-lg transition-colors"
          >
            Bài tiếp theo →
          </button>
        )}
      </div>
    </div>
  );
}
