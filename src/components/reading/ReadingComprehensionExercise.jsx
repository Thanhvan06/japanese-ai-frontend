import { useState, useEffect } from "react";
import { api } from "../../lib/api.js";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../i18n/translations";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  const { language } = useLanguage();
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [options, setOptions] = useState([]);

  if (!exercise) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          {t("reading.readingComprehensionExercise.loading", language)}
        </p>
      </div>
    );
  }

  useEffect(() => {
    if (!exercise) return;
    
    const exerciseOptions = Array.isArray(exercise.options) ? exercise.options : [];
    setOptions(exerciseOptions.length > 0 ? shuffleArray(exerciseOptions) : []);
    setUserAnswer("");
    setShowAnswer(false);
    setSubmitFeedback(null);
    setIsCorrect(false);
  }, [exercise]);

  const handleSubmitAnswer = async () => {
    if (!userAnswer || !exercise) return;

    const correct = exercise.correctAnswer === userAnswer;
    setIsCorrect(correct);
    setSubmitFeedback(
      correct
        ? t("reading.readingComprehensionExercise.feedbackCorrect", language)
        : t("reading.readingComprehensionExercise.feedbackWrong", language, {
            answer:
              exercise.correctAnswer ||
              t(
                "reading.readingComprehensionExercise.noAnswerFallback",
                language
              ),
          })
    );
    setShowAnswer(true);

    onAnswerSubmit?.(exercise.id, correct);

    try {
      await api("/api/reading/attempt", {
        method: "POST",
        body: JSON.stringify({ itemId: exercise.id, isCorrect: correct }),
      });
      onProgressUpdate?.();
    } catch {
      // User not logged in or API error - ignore
    }

    if (!canGoNext) {
      setTimeout(() => onNext?.(), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-[#4aa6e0]/20 p-8">
      {/* Passage */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-[#4aa6e0] mb-4">
          {t("reading.readingComprehensionExercise.passageTitle", language)}
        </h3>
        <div className="bg-blue-50 rounded-xl p-6 border-2 border-[#4aa6e0]/20">
          <div className="text-lg leading-relaxed text-[#2e3856] whitespace-pre-wrap">
            {exercise.passage ||
              t("reading.readingComprehensionExercise.noPassage", language)}
          </div>
        </div>
      </div>

      {/* Question */}
      {exercise.question && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[#4aa6e0] mb-4">
            {t("reading.readingComprehensionExercise.questionTitle", language)}
          </h3>
          <div className="text-lg text-[#2e3856] leading-relaxed">
            {exercise.question}
          </div>
        </div>
      )}

      {/* Options */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#4aa6e0] mb-4">
          {t("reading.readingComprehensionExercise.chooseAnswerTitle", language)}
        </h3>
        <div className="space-y-3">
          {options.map((option, index) => {
            const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = userAnswer === option;
            const isCorrectOption = option === exercise.correctAnswer;
            const showCorrect = showAnswer && isCorrectOption;

            return (
              <button
                key={index}
                onClick={() => !showAnswer && setUserAnswer(option)}
                disabled={showAnswer}
                className={`w-full px-6 py-4 rounded-xl text-left border-2 transition-all duration-300 ${
                  showAnswer
                    ? showCorrect
                      ? "bg-green-100 border-green-500 text-green-800"
                      : isSelected && !isCorrectOption
                      ? "bg-red-100 border-red-500 text-red-800"
                      : "bg-gray-50 border-gray-300 text-gray-600"
                    : isSelected
                    ? "bg-[#4aa6e0] border-[#4aa6e0] text-white hover:bg-[#3a8bc0]"
                    : "bg-white border-[#4aa6e0]/30 text-[#2e3856] hover:border-[#4aa6e0] hover:bg-blue-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold text-lg ${
                      showAnswer && showCorrect
                        ? "text-green-700"
                        : isSelected && showAnswer && !isCorrectOption
                        ? "text-red-700"
                        : ""
                    }`}
                  >
                    {optionLabel}.
                  </span>
                  <span>{option}</span>
                  {showAnswer && showCorrect && (
                    <span className="ml-auto text-green-600 font-bold">✓</span>
                  )}
                  {showAnswer && isSelected && !isCorrectOption && (
                    <span className="ml-auto text-red-600 font-bold">✗</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {showAnswer && (
        <div
          className={`mb-6 p-4 rounded-xl ${
            isCorrect ? "bg-green-50 border-2 border-green-500" : "bg-red-50 border-2 border-red-500"
          }`}
        >
          <p
            className={`font-semibold text-lg ${
              isCorrect ? "text-green-800" : "text-red-800"
            }`}
          >
            {submitFeedback}
          </p>
          {exercise.explain_viet && (
            <p className="mt-2 text-gray-700">{exercise.explain_viet}</p>
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
            ← {t("reading.readingComprehensionExercise.prevButton", language)}
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
          {showAnswer
            ? t("reading.readingComprehensionExercise.answeredButton", language)
            : t("reading.readingComprehensionExercise.submitButton", language)}
        </button>
        {showAnswer && canGoNext && (
          <button
            onClick={onNext}
            className="px-8 py-3 rounded-lg text-base font-semibold bg-green-500 text-white hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-lg transition-colors"
          >
            {t("reading.readingComprehensionExercise.nextButton", language)} →
          </button>
        )}
      </div>
    </div>
  );
}

