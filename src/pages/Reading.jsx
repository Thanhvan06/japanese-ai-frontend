import { useState, useEffect, useMemo } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { FaBook } from "react-icons/fa";
import { api, apiErrorHint } from "../lib/api.js";
import ReadingComprehensionExercise from "../components/reading/ReadingComprehensionExercise";
import FillInTheBlankExercise from "../components/reading/FillInTheBlankExercise";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/translations";
import {
  takeRandomSubset,
  formatCountdown,
} from "../utils/practiceSession.js";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const QUESTION_COUNT_OPTIONS = ["all", 5, 10, 15, 20];
const TIME_LIMIT_MINUTES = [0, 5, 10, 15, 20, 30];

export default function Reading() {
  const { language } = useLanguage();
  const exerciseTypes = useMemo(
    () => [
      {
        value: "reading_comprehension",
        label: t("reading.types.reading_comprehension.label", language),
        description: t(
          "reading.types.reading_comprehension.description",
          language
        ),
        icon: "📖",
      },
      {
        value: "fill_in_the_blank",
        label: t("reading.types.fill_in_the_blank.label", language),
        description: t("reading.types.fill_in_the_blank.description", language),
        icon: "✏️",
      },
    ],
    [language]
  );

  const [step, setStep] = useState("level");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedExerciseType, setSelectedExerciseType] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [scores, setScores] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [questionLimit, setQuestionLimit] = useState("all");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);
  const [sessionId, setSessionId] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const [endedByTimer, setEndedByTimer] = useState(false);

  useEffect(() => {
    if (selectedLevel && selectedExerciseType) {
      loadExercises();
    }
  }, [selectedLevel, selectedExerciseType, questionLimit]);

  useEffect(() => {
    if (step !== "exercise" || showSummary || exercises.length === 0) {
      return undefined;
    }
    if (!timeLimitMinutes || timeLimitMinutes <= 0) {
      setSecondsRemaining(null);
      return undefined;
    }
    let sec = timeLimitMinutes * 60;
    setSecondsRemaining(sec);
    const id = setInterval(() => {
      sec -= 1;
      setSecondsRemaining(sec);
      if (sec <= 0) {
        clearInterval(id);
        setEndedByTimer(true);
        setShowSummary(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [sessionId, exercises.length, timeLimitMinutes, step, showSummary]);

  useEffect(() => {
    if (
      exercises.length > 0 &&
      currentExerciseIndex >= 0 &&
      currentExerciseIndex < exercises.length
    ) {
      loadExerciseDetail(exercises[currentExerciseIndex].id);
    }
  }, [currentExerciseIndex, exercises]);

  const loadExercises = async () => {
    if (!selectedLevel || !selectedExerciseType) {
      return;
    }

    setLoading(true);
    try {
      const response = await api(
        `/api/reading?level=${selectedLevel}&exerciseType=${selectedExerciseType}`
      );
      const raw = response.exercises ?? [];
      const limit =
        questionLimit === "all" ? "all" : Number(questionLimit);
      setExercises(takeRandomSubset(raw, limit));
    } catch (error) {
      console.error("Error loading exercises:", error);
      alert(
        `${t("reading.loadListError", language)}\n\n${apiErrorHint(error)}`
      );
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExerciseDetail = async (exerciseId) => {
    if (!exerciseId) {
      return;
    }

    setLoadingDetail(true);
    try {
      const detail = await api(`/api/reading/${exerciseId}`);
      setCurrentExercise(detail);
    } catch (error) {
      console.error("Error loading exercise detail:", error);
      alert(
        `${t("reading.loadDetailError", language)}\n\n${apiErrorHint(error)}`
      );
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
    setEndedByTimer(false);
    setSessionId((s) => s + 1);
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
    setSecondsRemaining(null);
    setEndedByTimer(false);
  };

  const handleRetryExercise = () => {
    setScores({});
    setCurrentExerciseIndex(0);
    setCurrentExercise(null);
    setShowSummary(false);
    setEndedByTimer(false);
    setSessionId((s) => s + 1);
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
      setEndedByTimer(false);
      setShowSummary(true);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
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
            <FaBook className="text-3xl text-[#4aa6e0]" />
            <h1 className="text-2xl font-bold text-[#4aa6e0]">
              {t("reading.title", language)}
            </h1>
          </div>

          {step === "level" && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl border-2 border-[#4aa6e0]/20 p-10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-[#4aa6e0] mb-3">
                    {t("reading.levelSelectTitle", language)}
                  </h2>
                  <p className="text-gray-600">
                    {t("reading.levelSelectSubtitle", language)}
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
                          {t("reading.levelCardLabel", language, { level })}
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-[#4aa6e0] mb-2">
                      {t("reading.exerciseTypeTitle", language)}
                    </h2>
                    <p className="text-gray-600">
                      {t("reading.exerciseTypeLevelPrefix", language)}{" "}
                      <span className="font-semibold text-[#4aa6e0]">
                        {selectedLevel}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={handleBackToLevel}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white border-2 border-[#4aa6e0]/30 rounded-xl hover:bg-[#4aa6e0] hover:text-white hover:border-[#4aa6e0] transition-all duration-300 text-sm font-semibold text-[#4aa6e0]"
                  >
                    ← {t("reading.backToLevel", language)}
                  </button>
                </div>
                <div className="mb-8 p-6 rounded-2xl bg-white border-2 border-[#4aa6e0]/20 shadow-sm space-y-4">
                  <p className="text-sm text-gray-600">
                    {t("reading.sessionConfigHint", language)}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="reading-question-count"
                        className="block text-sm font-semibold text-gray-700 mb-1.5"
                      >
                        {t("reading.sessionQuestionCountLabel", language)}
                      </label>
                      <select
                        id="reading-question-count"
                        value={questionLimit}
                        onChange={(e) => setQuestionLimit(e.target.value)}
                        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-gray-800 focus:border-[#4aa6e0] focus:outline-none"
                      >
                        {QUESTION_COUNT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt === "all"
                              ? t("reading.sessionQuestionAll", language)
                              : t("reading.sessionQuestionN", language, {
                                  count: opt,
                                })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="reading-time-limit"
                        className="block text-sm font-semibold text-gray-700 mb-1.5"
                      >
                        {t("reading.sessionTimeLimitLabel", language)}
                      </label>
                      <select
                        id="reading-time-limit"
                        value={timeLimitMinutes}
                        onChange={(e) =>
                          setTimeLimitMinutes(Number(e.target.value))
                        }
                        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-gray-800 focus:border-[#4aa6e0] focus:outline-none"
                      >
                        {TIME_LIMIT_MINUTES.map((m) => (
                          <option key={m} value={m}>
                            {m === 0
                              ? t("reading.sessionTimeUnlimited", language)
                              : t("reading.sessionTimeMinutes", language, {
                                  count: m,
                                })}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {exerciseTypes.map((type) => (
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
                      {t("reading.summaryTitle", language)}
                    </h2>
                    <p className="text-gray-600">
                      {endedByTimer
                        ? t("reading.summaryTimeUpSubtitle", language)
                        : t("reading.summarySubtitle", language)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-[#4aa6e0]/10 to-blue-100 rounded-2xl p-8 mb-8 border-2 border-[#4aa6e0]/30">
                    <p className="text-gray-700 mb-3 font-semibold text-lg">
                      {t("reading.correctCountLabel", language)}
                    </p>
                    <p className="text-5xl font-bold text-[#4aa6e0] mb-2">
                      {Object.values(scores).filter(Boolean).length}/
                      {exercises.length}
                    </p>
                    <div className="inline-block bg-[#4aa6e0] text-white px-6 py-2 rounded-full mt-3">
                      <p className="text-lg font-semibold">
                        {exercises.length > 0
                          ? Math.round(
                              (Object.values(scores).filter(Boolean).length /
                                exercises.length) *
                                100
                            )
                          : 0}
                        {t("reading.correctPercentSuffix", language)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={handleRetryExercise}
                      className="px-8 py-4 rounded-xl font-semibold bg-[#4aa6e0] text-white hover:bg-[#3a8bc0] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg text-lg"
                    >
                      {t("reading.retryButton", language)}
                    </button>
                    <button
                      onClick={handleBackToExerciseType}
                      className="px-8 py-4 rounded-xl font-semibold bg-white border-2 border-[#4aa6e0]/30 text-[#4aa6e0] hover:bg-[#4aa6e0] hover:text-white hover:border-[#4aa6e0] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg text-lg"
                    >
                      ← {t("reading.backToExerciseType", language)}
                    </button>
                  </div>
                </div>
              ) : loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {t("reading.loadingExercises", language)}
                  </p>
                </div>
              ) : exercises.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    {t("reading.noExercisesForType", language)}
                  </p>
                  <button
                    onClick={handleBackToExerciseType}
                    className="px-6 py-3 bg-[#4aa6e0] text-white rounded-lg hover:bg-[#3a8bc0] transition-colors"
                  >
                    {t("reading.chooseOtherType", language)}
                  </button>
                </div>
              ) : loadingDetail ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {t("reading.loadingExerciseDetail", language)}
                  </p>
                </div>
              ) : currentExercise ? (
                <div>
                  <div className="bg-gradient-to-r from-[#4aa6e0]/10 to-blue-50 rounded-2xl p-6 mb-6 border-2 border-[#4aa6e0]/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-[#4aa6e0] mb-1">
                          {t("reading.exerciseHeader", language, {
                            current: currentExerciseIndex + 1,
                            total: exercises.length,
                          })}
                        </h2>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-[#4aa6e0]">
                            {selectedLevel}
                          </span>{" "}
                          -{" "}
                          {
                            exerciseTypes.find(
                              (x) => x.value === selectedExerciseType
                            )?.label
                          }
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 justify-end">
                        {timeLimitMinutes > 0 &&
                          secondsRemaining != null &&
                          !showSummary && (
                            <div
                              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${
                                secondsRemaining <= 60
                                  ? "bg-red-50 border-red-300 text-red-700"
                                  : "bg-white border-[#4aa6e0]/40 text-[#4aa6e0]"
                              }`}
                            >
                              {t("reading.timerRemainingLabel", language)}{" "}
                              {formatCountdown(secondsRemaining)}
                            </div>
                          )}
                        <button
                          onClick={handleBackToExerciseType}
                          className="w-full sm:w-auto px-5 py-2.5 bg-white border-2 border-[#4aa6e0]/30 rounded-xl hover:bg-[#4aa6e0] hover:text-white hover:border-[#4aa6e0] transition-all duration-300 text-sm font-semibold text-[#4aa6e0]"
                        >
                          ← {t("reading.backToExerciseType", language)}
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedExerciseType === "reading_comprehension" && (
                    <ReadingComprehensionExercise
                      exercise={currentExercise}
                      onNext={handleNextExercise}
                      onPrevious={handlePreviousExercise}
                      canGoPrevious={currentExerciseIndex > 0}
                      canGoNext={currentExerciseIndex < exercises.length - 1}
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
