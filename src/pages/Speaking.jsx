import { useState, useEffect, useRef, useMemo } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import {
  getSpeakingPhrases,
  practiceSpeaking,
  getSpeakingStats,
  getSpeakingProgress,
  generatePhraseAudio,
} from "../services/speakingService.js";
import { buildTranscriptDiffSegments } from "../utils/speakingTranscriptDiff.js";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/translations";

const tips = [
  "Nói chậm, rõ từng âm, chú ý trường âm và âm ngắt.",
  "Nhấn trọng âm đúng vị trí (đặc biệt với từ nhiều âm tiết).",
  "Nghe mẫu trước, bắt chước nhịp điệu (pitch accent).",
  "Đừng ngại lặp lại nhiều lần để ổn định khẩu hình.",
];

const getScoreColor = (score) => {
  if (score >= 95) return "text-green-600";
  if (score >= 85) return "text-blue-600";
  if (score >= 70) return "text-orange-500";
  return "text-red-500";
};

const getScoreStatus = (score, language) => {
  if (score >= 95) return language === "vi" ? "Xuất sắc" : "Excellent";
  if (score >= 85) return language === "vi" ? "Tốt" : "Good";
  if (score >= 70) return language === "vi" ? "Khá" : "Fair";
  return language === "vi" ? "Cần luyện thêm" : "Needs more practice";
};

const getTimeAgo = (date, language) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (language === "vi") {
    if (days > 0) {
      if (days === 1) return "Hôm qua";
      if (days < 7) return `${days} ngày trước`;
      return new Date(date).toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "short",
      });
    }
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return "Vừa xong";
  }

  if (days > 0) {
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  }
  if (hours > 0) return `${hours} hours ago`;
  if (minutes > 0) return `${minutes} minutes ago`;
  return "Just now";
};

const SPEAKING_STARRED_KEY = "speaking_starred_phrases_v1";

function loadStarredIdsForLevel(level) {
  try {
    const raw = localStorage.getItem(SPEAKING_STARRED_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const arr = all[level];
    return Array.isArray(arr) ? arr.map(Number) : [];
  } catch {
    return [];
  }
}

function persistStarredIds(level, ids) {
  try {
    const raw = localStorage.getItem(SPEAKING_STARRED_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[level] = ids;
    localStorage.setItem(SPEAKING_STARRED_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function orderPhrasesByStarred(list, starredIds) {
  const set = new Set(starredIds);
  const star = list.filter((p) => set.has(p.phrase_id));
  const rest = list.filter((p) => !set.has(p.phrase_id));
  return [...star, ...rest];
}

const JLPT_LEVELS = [
  { level: "N5", name: "N5 - Sơ cấp", description: "Cơ bản nhất, phù hợp cho người mới bắt đầu", color: "from-green-400 to-green-600" },
  { level: "N4", name: "N4 - Sơ cấp", description: "Nền tảng giao tiếp hàng ngày", color: "from-blue-400 to-blue-600" },
  { level: "N3", name: "N3 - Trung cấp", description: "Giao tiếp trong công việc và cuộc sống", color: "from-purple-400 to-purple-600" },
  { level: "N2", name: "N2 - Trung cao cấp", description: "Giao tiếp lưu loát, đọc hiểu văn bản phức tạp", color: "from-orange-400 to-orange-600" },
  { level: "N1", name: "N1 - Cao cấp", description: "Thành thạo như người bản xứ", color: "from-red-400 to-red-600" },
];

export default function Speaking() {
  const { language } = useLanguage();
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [phrases, setPhrases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [progressByPhrase, setProgressByPhrase] = useState({});
  const [starredIds, setStarredIds] = useState([]);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);

  const orderedPhrases = useMemo(
    () => orderPhrasesByStarred(phrases, starredIds),
    [phrases, starredIds]
  );

  const displayPhrases = useMemo(() => {
    if (!showStarredOnly) {
      return orderedPhrases;
    }
    return orderedPhrases.filter((p) => starredIds.includes(p.phrase_id));
  }, [orderedPhrases, showStarredOnly, starredIds]);

  const phraseNavIndex = useMemo(() => {
    if (!selected || displayPhrases.length === 0) {
      return -1;
    }
    return displayPhrases.findIndex((p) => p.phrase_id === selected.phrase_id);
  }, [selected, displayPhrases]);

  // Fetch stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!selected?.phrase_id) {
      return;
    }
    const el = document.getElementById(`speaking-phrase-${selected.phrase_id}`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected?.phrase_id, displayPhrases.length]);

  useEffect(() => {
    if (!showStarredOnly || !selectedLevel) {
      return;
    }
    if (displayPhrases.length === 0) {
      setSelected(null);
      setResult(null);
      return;
    }
    const stillIn = displayPhrases.some(
      (p) => p.phrase_id === selected?.phrase_id
    );
    if (!stillIn) {
      setSelected(displayPhrases[0]);
      setResult(null);
      setError(null);
    }
  }, [showStarredOnly, displayPhrases, selectedLevel, selected?.phrase_id]);

  const loadPhraseProgress = async (level) => {
    try {
      const res = await getSpeakingProgress(level);
      setProgressByPhrase(res?.byPhrase || {});
    } catch {
      setProgressByPhrase({});
    }
  };

  const loadPhrases = async (level) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSpeakingPhrases({ level });
      const list = data.phrases || [];
      setPhrases(list);
      const starred = loadStarredIdsForLevel(level);
      setStarredIds(starred);
      const ordered = orderPhrasesByStarred(list, starred);
      if (ordered.length > 0) {
        setSelected(ordered[0]);
      } else {
        setSelected(null);
      }
      setShowStarredOnly(false);
      await loadPhraseProgress(level);
    } catch (err) {
      setError(err.message || t("speaking.errors.loadPhrases", language));
      console.error("Error loading phrases:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLevel = (level) => {
    setSelectedLevel(level);
    setResult(null);
    setSelected(null);
    loadPhrases(level);
  };

  const handleBackToLevels = () => {
    setSelectedLevel(null);
    setPhrases([]);
    setSelected(null);
    setResult(null);
    setError(null);
    setProgressByPhrase({});
    setStarredIds([]);
    setShowStarredOnly(false);
  };

  const togglePhraseStar = (phraseId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setStarredIds((prev) => {
      const next = prev.includes(phraseId)
        ? prev.filter((id) => id !== phraseId)
        : [...prev, phraseId];
      if (selectedLevel) {
        persistStarredIds(selectedLevel, next);
      }
      return next;
    });
  };

  const goToAdjacentPhrase = (delta) => {
    if (displayPhrases.length === 0) {
      return;
    }
    let idx = phraseNavIndex;
    if (idx < 0) {
      idx = 0;
    }
    const next = idx + delta;
    if (next < 0 || next >= displayPhrases.length) {
      return;
    }
    setSelected(displayPhrases[next]);
    setResult(null);
    setError(null);
  };

  const loadStats = async () => {
    try {
      const data = await getSpeakingStats();
      setStats(data);
    } catch (err) {
      // Stats không bắt buộc, có thể user chưa đăng nhập
      console.log("Stats not available:", err.message);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await handleSubmit(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      setError(t("speaking.errors.microphoneAccess", language));
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setRecording(false);
    }
  };

  const handleSubmit = async (audioBlob) => {
    if (!selected) {
      setError(t("speaking.errors.chooseSample", language));
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setResult(null);

      // Convert blob to File
      const audioFile = new File([audioBlob], "recording.webm", {
        type: "audio/webm",
      });

      const data = await practiceSpeaking(audioFile, selected.phrase_id);
      setResult(data);

      await loadStats();
      if (selectedLevel) {
        await loadPhraseProgress(selectedLevel);
      }
    } catch (err) {
      setError(err.message || t("speaking.errors.processAudio", language));
      console.error("Error practicing:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handlePlaySample = async () => {
    if (!selected) return;

    try {
      let audioUrl = selected.audio_url;

      // Nếu chưa có audio, generate trước
      if (!audioUrl) {
        setGeneratingAudio(true);
        setError(null);
        try {
          const response = await generatePhraseAudio(selected.phrase_id);
          audioUrl = response.audioUrl;
          
          // Cập nhật selected phrase với audio_url mới
          setSelected({ ...selected, audio_url: audioUrl });
          
          // Cập nhật trong phrases list
          setPhrases(phrases.map(p => 
            p.phrase_id === selected.phrase_id 
              ? { ...p, audio_url: audioUrl }
              : p
          ));
        } catch (err) {
          setError(
            `${t("speaking.errors.generateSampleAudio", language)} ${
              err.message || ""
            }`.trim()
          );
          setGeneratingAudio(false);
          return;
        } finally {
          setGeneratingAudio(false);
        }
      }

      // Phát audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onplay = () => setAudioPlaying(true);
      audio.onended = () => {
        setAudioPlaying(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setError(t("speaking.errors.playSampleAudio", language));
        setAudioPlaying(false);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error("Error playing audio:", err);
      setError(t("speaking.errors.playSampleAudio", language));
      setAudioPlaying(false);
    }
  };

  const handlePlayUserRecording = () => {
    if (result?.audioUrl) {
      const audio = new Audio(result.audioUrl);
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
        setError(t("speaking.errors.playRecordingAudio", language));
      });
    }
  };

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, #e8f4fd 0, #f2f8ff 40%, #f8fbff 75%)",
      }}
    >
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {!selectedLevel ? (
              <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-[#77BEF0] via-[#6fc6ff] to-[#9fdcff] text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-wide opacity-80">
                      {t("speaking.title", language)}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mt-2">
                      {t("speaking.heroHeading", language)}
                    </h1>
                    <p className="mt-3 text-white/90 max-w-2xl">
                      {t("speaking.heroSubtitle", language)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20">
                        Pitch accent
                      </span>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20">
                        Slow & Clear
                      </span>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20">
                        Shadowing
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/15 border border-white/25 rounded-2xl px-6 py-4 shadow-md">
                    <div className="text-sm opacity-90">
                      {t("speaking.todayLabel", language)}
                    </div>
                    <div className="text-3xl font-bold">
                      {stats?.todayAttempts ?? 0}{" "}
                      {t("speaking.attemptsUnit", language)}
                    </div>
                    <div className="mt-2 text-sm opacity-80">
                      {stats?.averageScore
                        ? `${t("speaking.avgScoreLabelPrefix", language)} ${Math.round(
                            stats.averageScore
                          )}%`
                        : t("speaking.avgScoreDefault", language)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl px-4 py-3 md:px-6 bg-gradient-to-r from-[#77BEF0] via-[#6fc6ff] to-[#9fdcff] text-white shadow-md flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold uppercase tracking-wide opacity-90">
                    {t("speaking.title", language)}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/25 text-sm font-bold">
                    {selectedLevel}
                  </span>
                  <span className="text-sm opacity-90 hidden sm:inline">
                    {t("speaking.practiceModeHint", language)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    {t("speaking.todayLabel", language)}:{" "}
                    <strong>{stats?.todayAttempts ?? 0}</strong>{" "}
                    {t("speaking.attemptsUnit", language)}
                  </span>
                  {stats?.averageScore ? (
                    <span className="opacity-90">
                      {t("speaking.avgScoreLabelPrefix", language)}{" "}
                      <strong>{Math.round(stats.averageScore)}%</strong>
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Level Selection Screen */}
            {!selectedLevel && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {t("speaking.levelSelectTitle", language)}
                  </h2>
                  <p className="text-gray-600">
                    {t("speaking.levelSelectSubtitle", language)}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {JLPT_LEVELS.map((jlpt) => (
                    <button
                      key={jlpt.level}
                      onClick={() => handleSelectLevel(jlpt.level)}
                      className={`group relative overflow-hidden rounded-2xl p-6 text-left bg-white border-2 border-gray-200 hover:border-[#77BEF0] transition-all shadow-sm hover:shadow-md`}
                    >
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${jlpt.color} opacity-10 rounded-full -mr-16 -mt-16 group-hover:opacity-20 transition-opacity`} />
                      <div className="relative">
                        <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${jlpt.color} text-white font-bold text-lg mb-3`}>
                          {jlpt.level}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {t(`speaking.levels.${jlpt.level}.name`, language)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {t(
                            `speaking.levels.${jlpt.level}.description`,
                            language
                          )}
                        </p>
                        <div className="mt-4 flex items-center text-[#77BEF0] font-semibold text-sm">
                          <span>{t("speaking.startPractice", language)}</span>
                          <span className="ml-2">→</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Practice + Phrases - Only show when level is selected */}
            {selectedLevel && (
              <div className="space-y-6">
                {/* Back button */}
                <button
                  onClick={handleBackToLevels}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8F4FD] text-[#0F6DB0] font-semibold hover:border-[#77BEF0] transition"
                >
                  <span>←</span>
                  <span>{t("speaking.backToLevels", language)}</span>
                </button>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Phrase list */}
                  <div className="lg:col-span-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="font-semibold text-gray-700">
                        {t("speaking.phrasesTitlePrefix", language, {
                          level: selectedLevel,
                        })}
                      </div>
                      {phrases.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {phrases.length} {t("speaking.phrasesCountUnit", language)}
                        </div>
                      )}
                    </div>
                    {phrases.length > 0 && (
                      <div className="text-xs text-[#0F6DB0] font-medium">
                        {t("speaking.levelProgressSummary", language, {
                          done: phrases.filter(
                            (p) => progressByPhrase[p.phrase_id]?.attempted
                          ).length,
                          total: phrases.length,
                        })}
                      </div>
                    )}
                    {phrases.length > 0 && (
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#77BEF0] focus:ring-[#77BEF0]"
                          checked={showStarredOnly}
                          onChange={(e) =>
                            setShowStarredOnly(e.target.checked)
                          }
                        />
                        <span>{t("speaking.starredOnlyLabel", language)}</span>
                      </label>
                    )}
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    {t("speaking.phrasesLoading", language)}
                  </div>
                ) : phrases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <div>
                      {t("speaking.phrasesEmpty", language, {
                        level: selectedLevel,
                      })}
                    </div>
                  </div>
                ) : displayPhrases.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-200 rounded-xl">
                    {t("speaking.starredOnlyEmpty", language)}
                  </div>
                ) : (
                  <div
                    className="max-h-[min(58vh,26rem)] overflow-y-auto overflow-x-hidden rounded-xl border border-[#E8F4FD] bg-white/95 p-2 space-y-2 shadow-inner [scrollbar-gutter:stable]"
                  >
                    {displayPhrases.map((p) => {
                    const prog = progressByPhrase[p.phrase_id];
                    const isStarred = starredIds.includes(p.phrase_id);
                    return (
                    <div
                      key={p.phrase_id}
                      id={`speaking-phrase-${p.phrase_id}`}
                      className={`flex gap-2 rounded-xl border transition shadow-sm ${
                        selected?.phrase_id === p.phrase_id
                          ? "border-[#77BEF0] bg-[#f5fbff]"
                          : "border-gray-200 bg-white hover:border-[#A6D8FF]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => togglePhraseStar(p.phrase_id, e)}
                        className="shrink-0 self-start mt-3 ml-2 p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition"
                        title={t("speaking.starToggleTitle", language)}
                        aria-label={t("speaking.starToggleTitle", language)}
                      >
                        {isStarred ? (
                          <FaStar className="w-4 h-4" />
                        ) : (
                          <FaRegStar className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(p);
                          setResult(null);
                          setError(null);
                        }}
                        className="flex-1 min-w-0 text-left p-3 pr-4"
                      >
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <div className="text-sm text-[#77BEF0] font-semibold">
                          {p.topic || t("speaking.noTopic", language)}
                        </div>
                        {prog?.attempted && (
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {prog.passed && (
                              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold">
                                {t("speaking.phrasePassed", language)}
                              </span>
                            )}
                            <span className="text-gray-600">
                              {t("speaking.phraseBestScore", language, {
                                score: Math.round(prog.bestScore ?? 0),
                              })}
                            </span>
                            <span className="text-gray-400">
                              {t("speaking.phraseAttempts", language, {
                                count: prog.attemptCount ?? 0,
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-bold text-gray-800 mt-1">
                        {p.jp}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {p.romaji}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{p.vi}</div>
                      </button>
                    </div>
                    );
                  })}
                  </div>
                )}
                  </div>

                  {/* Practice card */}
                  <div className="lg:col-span-2 space-y-4">
                {selected ? (
                  <div className="bg-white rounded-2xl border border-[#E8F4FD] shadow-md p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => goToAdjacentPhrase(-1)}
                          disabled={
                            phraseNavIndex <= 0 || displayPhrases.length === 0
                          }
                          className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#E8F4FD] text-[#0F6DB0] hover:bg-[#d4ecfc] disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          {t("speaking.prevPhraseButton", language)}
                        </button>
                        <button
                          type="button"
                          onClick={() => goToAdjacentPhrase(1)}
                          disabled={
                            phraseNavIndex < 0 ||
                            phraseNavIndex >= displayPhrases.length - 1
                          }
                          className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#E8F4FD] text-[#0F6DB0] hover:bg-[#d4ecfc] disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          {t("speaking.nextPhraseButton", language)}
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        {displayPhrases.length > 0 && phraseNavIndex >= 0
                          ? t("speaking.phrasePosition", language, {
                              current: phraseNavIndex + 1,
                              total: displayPhrases.length,
                            })
                          : "—"}
                      </div>
                      <button
                        type="button"
                        onClick={(e) =>
                          togglePhraseStar(selected.phrase_id, e)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
                      >
                        {starredIds.includes(selected.phrase_id) ? (
                          <FaStar className="w-4 h-4" />
                        ) : (
                          <FaRegStar className="w-4 h-4" />
                        )}
                        {t("speaking.markReviewLabel", language)}
                      </button>
                    </div>
                    {/* Score display */}
                    {result && (
                      <div
                        className={`flex items-center gap-2 font-semibold ${getScoreColor(
                          result.score.accuracy
                        )}`}
                      >
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full border-2 text-sm ${
                            result.score.accuracy >= 95
                              ? "border-green-400"
                              : result.score.accuracy >= 85
                              ? "border-blue-400"
                              : result.score.accuracy >= 70
                              ? "border-orange-400"
                              : "border-red-400"
                          }`}
                        >
                          {Math.round(result.score.accuracy)}%
                        </span>
                        <span>{getScoreStatus(result.score.accuracy, language)}</span>
                      </div>
                    )}

                    <div className="rounded-2xl bg-gradient-to-b from-white to-[#f7fbff] border border-[#E8F4FD] p-5 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="text-sm text-gray-500">
                            {t("speaking.speakPhraseLabel", language)}
                          </div>
                          <div className="text-3xl font-bold text-gray-800 mt-1">
                            {selected.jp}
                          </div>
                          <div className="text-base text-gray-600 mt-1">
                            {selected.romaji}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {selected.vi}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={handlePlaySample}
                            disabled={generatingAudio || audioPlaying}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8F4FD] text-[#0F6DB0] font-semibold hover:border-[#77BEF0] transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span>{generatingAudio ? "⏳" : audioPlaying ? "🔊" : "🔊"}</span>
                            <span>
                              {generatingAudio
                                ? t("speaking.generateAudioLoading", language)
                                : audioPlaying
                                ? t("speaking.playingAudio", language)
                                : t("speaking.playSample", language)}
                            </span>
                          </button>
                          {result?.audioUrl && (
                            <button
                              onClick={handlePlayUserRecording}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8F4FD] text-[#0F6DB0] font-semibold hover:border-[#77BEF0] transition"
                            >
                              <span>👤</span>
                              <span>{t("speaking.listenAgain", language)}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* So sánh text */}
                      {result && (
                        <div className="mt-5 p-4 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD] space-y-3">
                          <div className="text-sm font-semibold text-gray-700">
                          {t("speaking.compareResultsLabel", language)}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                            <div className="text-xs text-gray-500 mb-1">
                              {t("speaking.sampleLabel", language)}
                            </div>
                              <div className="text-lg font-semibold text-gray-800 bg-white p-2 rounded border border-gray-200">
                                {selected.jp}
                              </div>
                            </div>
                            <div>
                            <div className="text-xs text-gray-500 mb-1">
                              {t("speaking.yourAnswerLabel", language)}
                            </div>
                              <div
                                className={`text-lg p-2 rounded border leading-relaxed ${
                                  result.score.accuracy >= 95
                                    ? "bg-green-50 border-green-200"
                                    : result.score.accuracy >= 85
                                      ? "bg-blue-50 border-blue-200"
                                      : result.score.accuracy >= 70
                                        ? "bg-orange-50 border-orange-200"
                                        : "bg-red-50 border-red-200"
                                }`}
                              >
                                {(() => {
                                  const raw = result.transcribedText?.trim();
                                  if (!raw) {
                                    return (
                                      <span className="text-gray-400 font-medium">
                                        ...
                                      </span>
                                    );
                                  }
                                  const { segments } = buildTranscriptDiffSegments(
                                    selected.jp,
                                    raw
                                  );
                                  if (segments.length === 0) {
                                    return (
                                      <span className="text-gray-800 font-semibold">
                                        {raw}
                                      </span>
                                    );
                                  }
                                  return segments.map((seg, idx) => (
                                    <span
                                      key={idx}
                                      className={
                                        seg.match
                                          ? "text-green-700 font-semibold"
                                          : "text-red-600 underline decoration-red-500 decoration-2 underline-offset-2 font-semibold"
                                      }
                                    >
                                      {seg.text}
                                    </span>
                                  ));
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        {!result && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-xl">/</span>
                            <span className="text-lg font-semibold text-gray-800">
                              {t("speaking.noRecordingYet", language)}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={recording ? stopRecording : startRecording}
                          disabled={processing}
                          className={`inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-semibold shadow-lg transition ${
                            recording
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-gradient-to-r from-[#77BEF0] to-[#5fb4ec] hover:brightness-110"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {processing
                            ? t("speaking.processingAudio", language)
                            : recording
                              ? t("speaking.stopRecordingLabel", language)
                              : t("speaking.tapToSpeakLabel", language)}
                        </button>
                      </div>
                    </div>

                    {/* Visual meter */}
                    {result && (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
                          <span>{t("speaking.accuracyLabel", language)}</span>
                          <span
                            className={`font-semibold ${getScoreColor(
                              result.score.accuracy
                            )}`}
                          >
                            {Math.round(result.score.accuracy)}%
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${
                              result.score.accuracy >= 95
                                ? "from-green-400 to-green-500"
                                : result.score.accuracy >= 85
                                ? "from-blue-400 to-blue-500"
                                : result.score.accuracy >= 70
                                ? "from-orange-400 to-orange-500"
                                : "from-red-400 to-red-500"
                            }`}
                            style={{ width: `${result.score.accuracy}%` }}
                          />
                        </div>
                        {result.score.feedback && (
                          <div className="text-sm text-gray-600 p-3 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD]">
                            {result.score.feedback}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="h-[1px] bg-gray-100" />

                    {/* Steps */}
                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      <div className="p-3 rounded-xl bg-[#F6FBFF] border border-[#E8F4FD]">
                        <div className="font-semibold text-gray-800">
                          {t("speaking.steps.step1Title", language)}
                        </div>
                        <div className="text-gray-600 mt-1">
                          {t("speaking.steps.step1Desc", language)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F6FBFF] border border-[#E8F4FD]">
                        <div className="font-semibold text-gray-800">
                          {t("speaking.steps.step2Title", language)}
                        </div>
                        <div className="text-gray-600 mt-1">
                          {t("speaking.steps.step2Desc", language)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F6FBFF] border border-[#E8F4FD]">
                        <div className="font-semibold text-gray-800">
                          {t("speaking.steps.step3Title", language)}
                        </div>
                        <div className="text-gray-600 mt-1">
                          {t("speaking.steps.step3Desc", language)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#E8F4FD] shadow-md p-6 text-center text-gray-500">
                    {loading
                      ? t("speaking.phrasesLoading", language)
                      : t("speaking.noSampleSelected", language)}
                  </div>
                )}
                  </div>
                </div>
              </div>
            )}

            {/* Tips & history */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-[#E8F4FD] shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-lg">💡</div>
                  <div className="font-semibold text-gray-800">
                    {t("speaking.tipsTitle", language)}
                  </div>
                </div>
                <ul className="space-y-3 text-gray-700">
                  {tips.map((tip, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD]"
                    >
                      {t(`speaking.tips.tip${idx + 1}`, language)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-[#E8F4FD] shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="text-lg">📈</div>
                    <div className="font-semibold text-gray-800">
                        {t("speaking.recentProgressTitle", language)}
                    </div>
                  </div>
                  {stats?.totalAttempts > 0 && (
                    <div className="text-xs text-gray-500">
                        {t("speaking.totalAttemptsLabel", language, {
                          count: stats.totalAttempts,
                        })}
                    </div>
                  )}
                </div>

                {stats?.recentAttempts && stats.recentAttempts.length > 0 ? (
                  <div className="space-y-3">
                    {/* Recent attempts */}
                    <div className="space-y-2 text-sm">
                      {stats.recentAttempts.slice(0, 5).map((attempt, idx) => {
                        const date = new Date(attempt.date);
                        const timeAgo = getTimeAgo(date, language);
                        
                        return (
                          <div
                            key={attempt.attemptId || idx}
                            className="p-3 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD] hover:border-[#77BEF0] transition"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                {attempt.phrase && (
                                  <div className="text-xs text-gray-500 mb-1 truncate">
                                    {attempt.phrase.topic ||
                                      t("speaking.noTopic", language)}
                                  </div>
                                )}
                                {attempt.phrase && (
                                  <div className="text-sm font-semibold text-gray-800 truncate">
                                    {attempt.phrase.jp}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  {timeAgo}
                                </div>
                              </div>
                              <div
                                className={`text-lg font-bold whitespace-nowrap ${getScoreColor(
                                  attempt.score
                                )}`}
                              >
                                {Math.round(attempt.score || 0)}%
                              </div>
                            </div>
                            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r transition-all ${
                                  attempt.score >= 95
                                    ? "from-green-400 to-green-500"
                                    : attempt.score >= 85
                                    ? "from-blue-400 to-blue-500"
                                    : attempt.score >= 70
                                    ? "from-orange-400 to-orange-500"
                                    : "from-red-400 to-red-500"
                                }`}
                                style={{ width: `${attempt.score || 0}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Daily progress chart */}
                    {stats?.dailyProgress && stats.dailyProgress.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#E8F4FD]">
                        <div className="text-xs font-semibold text-gray-600 mb-2">
                          {t("speaking.last7DaysTitle", language)}
                        </div>
                        <div className="space-y-2">
                          {stats.dailyProgress.map((day, idx) => {
                            const date = new Date(day.date);
                            const locale = language === "vi" ? "vi-VN" : "en-US";
                            const dayName = date.toLocaleDateString(locale, {
                              weekday: "short",
                            });
                            const dayNumber = date.getDate();

                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="text-xs text-gray-500 w-12">
                                  {dayName} {dayNumber}
                                </div>
                                <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className={`h-full bg-gradient-to-r ${
                                      day.avgScore >= 95
                                        ? "from-green-400 to-green-500"
                                        : day.avgScore >= 85
                                        ? "from-blue-400 to-blue-500"
                                        : day.avgScore >= 70
                                        ? "from-orange-400 to-orange-500"
                                        : "from-red-400 to-red-500"
                                    }`}
                                    style={{ width: `${day.avgScore || 0}%` }}
                                  />
                                </div>
                                <div className="text-xs text-gray-600 w-16 text-right">
                                  {day.count} {t("speaking.attemptsUnit", language)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <div>{t("speaking.recentProgressEmptyTitle", language)}</div>
                    <div className="text-xs mt-2">
                      {t("speaking.recentProgressEmptyHint", language)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

