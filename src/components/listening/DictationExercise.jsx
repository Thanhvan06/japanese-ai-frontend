import { useState, useEffect, useRef } from "react";
import { FaPlay, FaPause, FaRedo, FaVolumeUp } from "react-icons/fa";
import { api } from "../../lib/api.js";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../i18n/translations";

export default function DictationExercise({
  exercise,
  onNext,
  onPrevious,
  canGoPrevious,
  canGoNext,
  onProgressUpdate,
  onAnswerSubmit,
}) {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef(null);

  if (!exercise) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          {t("listening.dictationExercise.loading", language)}
        </p>
      </div>
    );
  }

  useEffect(() => {
    setUserAnswer("");
    setShowResult(false);
    setResult(null);
    setIsPlaying(false);
    setAudioProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, [exercise]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!exercise?.audioUrl) {
      alert(t("listening.dictationExercise.noAudio", language));
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(exercise.audioUrl);
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setAudioProgress(0);
      });
      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) {
          const progress =
            (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setAudioProgress(progress || 0);
        }
      });
      audioRef.current.addEventListener("error", () => {
        alert(t("listening.dictationExercise.audioPathError", language));
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
        alert(t("listening.dictationExercise.playAudioError", language));
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    if (!exercise?.audioUrl) return;
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


  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert(t("listening.dictationExercise.inputRequired", language));
      return;
    }

    try {
      const response = await api("/api/listening/check-dictation", {
        method: "POST",
        body: JSON.stringify({
          itemId: exercise.id,
          userAnswer: userAnswer,
        }),
      });

      setResult(response);
      setShowResult(true);
      
      if (onAnswerSubmit) {
        onAnswerSubmit(exercise.id, response.isCorrect);
      }
      
      if (onProgressUpdate) onProgressUpdate();

      // Nếu là bài cuối, tự động hiển thị summary sau 2 giây
      if (!canGoNext) {
        setTimeout(() => {
          if (onNext) onNext();
        }, 2000);
      }
    } catch (error) {
      console.error("Error checking dictation:", error);
      alert(t("listening.dictationExercise.checkAnswerError", language));
    }
  };

  const renderHighlightedText = () => {
    if (!result || !result.correctAnswer) return userAnswer;

    const normalize = (text) =>
      text
        .replace(/\s+/g, "")
        .replace(/[。、]/g, "")
        .toLowerCase();

    const normalizedCorrect = normalize(result.correctAnswer);
    const normalizedUser = normalize(userAnswer);

    const highlighted = [];
    let userCharIndex = 0;

    for (let i = 0; i < userAnswer.length; i++) {
      const char = userAnswer[i];
      if (/\s/.test(char)) {
        highlighted.push(
          <span key={i} className="text-gray-400">
            {char}
          </span>
        );
        continue;
      }

      if (userCharIndex < normalizedUser.length) {
        const isCorrect =
          userCharIndex < normalizedCorrect.length &&
          normalizedCorrect[userCharIndex] === normalizedUser[userCharIndex];

        highlighted.push(
          <span
            key={i}
            className={isCorrect ? "text-green-600" : "text-red-600 underline"}
          >
            {char}
          </span>
        );
        userCharIndex++;
      } else {
        highlighted.push(
          <span key={i} className="text-red-600 underline">
            {char}
          </span>
        );
      }
    }

    return highlighted.length > 0 ? highlighted : userAnswer;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-xl p-6 shadow-sm border-2 border-gray-200">
        <div className="flex items-center gap-4 mb-4 md:flex-row flex-col flex-wrap">
          <button
            onClick={handlePlayPause}
            className="w-16 h-16 rounded-full bg-[#4aa6e0] text-white border-none flex items-center justify-center text-2xl cursor-pointer transition-all duration-300 shadow-lg hover:bg-[#3a8bc0] hover:scale-105 hover:shadow-xl"
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button
            onClick={handleReplay}
            disabled={!exercise?.audioUrl}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={t("listening.dictationExercise.replayTitle", language)}
          >
            <FaRedo />
          </button>
          <div className="flex items-center flex-1">
            <FaVolumeUp className="text-gray-500" />
            <span className="text-gray-600 ml-2">
              {isPlaying
                ? t("listening.dictationExercise.playing", language)
                : t("listening.dictationExercise.tapToPlay", language)}
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

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#4aa6e0] mb-4">
          聞こえた内容を書いてください
        </h3>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder={t("listening.dictationExercise.inputPlaceholder", language)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#4aa6e0] resize-none"
          rows="6"
          disabled={showResult}
        />
      </div>

      {showResult && result && (
        <div className="space-y-4">
          <div
            className={`rounded-lg px-4 py-3 text-center font-medium ${
              result.isCorrect
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {result.isCorrect ? (
              <div>
                <div className="text-xl font-bold mb-1">
                  {t("listening.dictationExercise.correctTitle", language)}
                </div>
                <div>
                  {t("listening.dictationExercise.accuracyLabel", language, {
                    accuracy: result.accuracy,
                  })}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xl font-bold mb-1">
                  {t("listening.dictationExercise.incorrectTitle", language)}
                </div>
                <div>
                  {t("listening.dictationExercise.accuracyLabel", language, {
                    accuracy: result.accuracy,
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border-2 border-[#4aa6e0] rounded-xl p-6">
            <h4 className="text-lg font-semibold text-[#4aa6e0] mb-4">
              {t("listening.dictationExercise.yourAnswerTitle", language)}
            </h4>
            <p className="mb-4 leading-relaxed text-[#2e3856]">
              {renderHighlightedText()}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <span className="text-green-600">
                {t("listening.dictationExercise.colorGreen", language)}
              </span>{" "}
              = {t("listening.dictationExercise.colorCorrect", language)},{" "}
              <span className="text-red-600">
                {t("listening.dictationExercise.colorRed", language)}
              </span>{" "}
              = {t("listening.dictationExercise.colorWrong", language)}
            </p>

            <h4 className="text-lg font-semibold text-[#4aa6e0] mb-2 mt-6">
              {t("listening.dictationExercise.correctAnswerTitle", language)}
            </h4>
            <div className="mb-3 leading-relaxed text-[#2e3856]">
{result.correctAnswer}
            </div>

            {exercise.translation && (
              <p className="leading-relaxed text-[#2e3856]">
                <strong className="text-[#4aa6e0] mr-2">
                  {t("listening.dictationExercise.translationLabel", language)}
                </strong>{" "}
                {exercise.translation}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center md:flex-row flex-col">
        {canGoPrevious && (
          <button
            onClick={onPrevious}
            className="px-6 py-3 rounded-lg text-base font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            ← {t("listening.dictationExercise.prevButton", language)}
          </button>
        )}
        <button
          onClick={handleSubmitAnswer}
          disabled={!userAnswer.trim() || showResult}
          className={`px-8 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 ${
            !userAnswer.trim() || showResult
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#4aa6e0] text-white hover:bg-[#3a8bc0] hover:-translate-y-0.5 hover:shadow-lg"
          }`}
        >
          {showResult
            ? t("listening.dictationExercise.submittedButton", language)
            : t("listening.dictationExercise.submitButton", language)}
        </button>
        {showResult && canGoNext && (
          <button
            onClick={onNext}
            className="px-8 py-3 rounded-lg text-base font-semibold bg-green-500 text-white hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-lg transition-colors"
          >
            {t("listening.dictationExercise.nextButton", language)} →
          </button>
        )}
      </div>
    </div>
  );
}

