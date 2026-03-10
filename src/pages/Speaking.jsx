import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import {
  getSpeakingPhrases,
  practiceSpeaking,
  getSpeakingStats,
  generatePhraseAudio,
} from "../services/speakingService.js";

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

const getScoreStatus = (score) => {
  if (score >= 95) return "Xuất sắc";
  if (score >= 85) return "Tốt";
  if (score >= 70) return "Khá";
  return "Cần luyện thêm";
};

const getTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

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
};

const JLPT_LEVELS = [
  { level: "N5", name: "N5 - Sơ cấp", description: "Cơ bản nhất, phù hợp cho người mới bắt đầu", color: "from-green-400 to-green-600" },
  { level: "N4", name: "N4 - Sơ cấp", description: "Nền tảng giao tiếp hàng ngày", color: "from-blue-400 to-blue-600" },
  { level: "N3", name: "N3 - Trung cấp", description: "Giao tiếp trong công việc và cuộc sống", color: "from-purple-400 to-purple-600" },
  { level: "N2", name: "N2 - Trung cao cấp", description: "Giao tiếp lưu loát, đọc hiểu văn bản phức tạp", color: "from-orange-400 to-orange-600" },
  { level: "N1", name: "N1 - Cao cấp", description: "Thành thạo như người bản xứ", color: "from-red-400 to-red-600" },
];

export default function Speaking() {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [phrases, setPhrases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);

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

  const loadPhrases = async (level) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSpeakingPhrases({ level });
      setPhrases(data.phrases || []);
      if (data.phrases && data.phrases.length > 0) {
        setSelected(data.phrases[0]);
      } else {
        setSelected(null);
      }
    } catch (err) {
      setError(err.message || "Không thể tải danh sách câu mẫu");
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
      setError("Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.");
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
      setError("Vui lòng chọn một câu mẫu");
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
      
      // Reload stats if available
      await loadStats();
    } catch (err) {
      setError(err.message || "Lỗi khi xử lý audio. Vui lòng thử lại.");
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
          setError("Không thể generate audio mẫu. " + (err.message || ""));
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
        setError("Không thể phát audio mẫu");
        setAudioPlaying(false);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error("Error playing audio:", err);
      setError("Không thể phát audio mẫu");
      setAudioPlaying(false);
    }
  };

  const handlePlayUserRecording = () => {
    if (result?.audioUrl) {
      const audio = new Audio(result.audioUrl);
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
        setError("Không thể phát bản ghi âm");
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
            {/* Hero */}
            <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-[#77BEF0] via-[#6fc6ff] to-[#9fdcff] text-white shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wide opacity-80">
                    Luyện nói
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mt-2">
                    Phát âm chuẩn, tự tin giao tiếp
                  </h1>
                  <p className="mt-3 text-white/90 max-w-2xl">
                    Thực hành phát âm theo mẫu, ghi âm và so sánh.
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
                  <div className="text-sm opacity-90">Mục tiêu hôm nay</div>
                  <div className="text-3xl font-bold">
                    {stats?.totalAttempts || 0} câu
                  </div>
                  <div className="mt-2 text-sm opacity-80">
                    {stats?.averageScore
                      ? `Điểm trung bình: ${Math.round(stats.averageScore)}%`
                      : "Bắt đầu luyện tập ngay!"}
                  </div>
                </div>
              </div>
            </div>

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
                    Chọn cấp độ luyện tập
                  </h2>
                  <p className="text-gray-600">
                    Chọn cấp độ JLPT phù hợp với trình độ của bạn
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
                          {jlpt.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {jlpt.description}
                        </p>
                        <div className="mt-4 flex items-center text-[#77BEF0] font-semibold text-sm">
                          <span>Bắt đầu luyện tập</span>
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
                  <span>Quay lại chọn cấp độ</span>
                </button>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Phrase list */}
                  <div className="lg:col-span-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-700">
                        Câu mẫu - {selectedLevel}
                      </div>
                      {phrases.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {phrases.length} câu
                        </div>
                      )}
                    </div>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Đang tải...
                  </div>
                ) : phrases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <div>Không có câu mẫu nào cho cấp độ {selectedLevel}</div>
                  </div>
                ) : (
                  phrases.map((p) => (
                    <button
                      key={p.phrase_id}
                      onClick={() => {
                        setSelected(p);
                        setResult(null);
                        setError(null);
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition shadow-sm ${
                        selected?.phrase_id === p.phrase_id
                          ? "border-[#77BEF0] bg-white"
                          : "border-gray-200 bg-white hover:border-[#A6D8FF]"
                      }`}
                    >
                      <div className="text-sm text-[#77BEF0] font-semibold">
                        {p.topic || "Không có chủ đề"}
                      </div>
                      <div className="text-lg font-bold text-gray-800 mt-1">
                        {p.jp}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {p.romaji}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{p.vi}</div>
                    </button>
                  ))
                )}
                  </div>

                  {/* Practice card */}
                  <div className="lg:col-span-2 space-y-4">
                {selected ? (
                  <div className="bg-white rounded-2xl border border-[#E8F4FD] shadow-md p-6 space-y-4">
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
                        <span>{getScoreStatus(result.score.accuracy)}</span>
                      </div>
                    )}

                    <div className="rounded-2xl bg-gradient-to-b from-white to-[#f7fbff] border border-[#E8F4FD] p-5 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="text-sm text-gray-500">
                            Speak the phrase
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
                                ? "Đang tạo audio..."
                                : audioPlaying
                                ? "Đang phát..."
                                : "Nghe mẫu"}
                            </span>
                          </button>
                          {result?.audioUrl && (
                            <button
                              onClick={handlePlayUserRecording}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8F4FD] text-[#0F6DB0] font-semibold hover:border-[#77BEF0] transition"
                            >
                              <span>👤</span>
                              <span>Nghe lại</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* So sánh text */}
                      {result && (
                        <div className="mt-5 p-4 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD] space-y-3">
                          <div className="text-sm font-semibold text-gray-700">
                            So sánh kết quả:
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Câu mẫu:</div>
                              <div className="text-lg font-semibold text-gray-800 bg-white p-2 rounded border border-gray-200">
                                {selected.jp}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Bạn nói:</div>
                              <div className={`text-lg font-semibold p-2 rounded border ${
                                result.score.accuracy >= 95
                                  ? "bg-green-50 border-green-200 text-green-800"
                                  : result.score.accuracy >= 85
                                  ? "bg-blue-50 border-blue-200 text-blue-800"
                                  : result.score.accuracy >= 70
                                  ? "bg-orange-50 border-orange-200 text-orange-800"
                                  : "bg-red-50 border-red-200 text-red-800"
                              }`}>
                                {result.transcribedText || "..."}
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
                              Chưa có bản ghi âm
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
                            ? "Đang xử lý..."
                            : recording
                            ? "Dừng ghi âm 🛑"
                            : "Tap to Speak 🎙️"}
                        </button>
                      </div>
                    </div>

                    {/* Visual meter */}
                    {result && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Độ chính xác</span>
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
                          1. Nghe mẫu
                        </div>
                        <div className="text-gray-600 mt-1">
                          Nghe chậm, chú ý trường âm / âm ngắt.
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F6FBFF] border border-[#E8F4FD]">
                        <div className="font-semibold text-gray-800">
                          2. Ghi âm
                        </div>
                        <div className="text-gray-600 mt-1">
                          Nhấn mạnh trọng âm, giữ nhịp ổn định.
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F6FBFF] border border-[#E8F4FD]">
                        <div className="font-semibold text-gray-800">
                          3. So sánh
                        </div>
                        <div className="text-gray-600 mt-1">
                          Xem kết quả và nhận feedback.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#E8F4FD] shadow-md p-6 text-center text-gray-500">
                    {loading
                      ? "Đang tải..."
                      : "Vui lòng chọn một câu mẫu để bắt đầu"}
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
                  <div className="font-semibold text-gray-800">Mẹo luyện nói</div>
                </div>
                <ul className="space-y-3 text-gray-700">
                  {tips.map((t, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD]"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-[#E8F4FD] shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="text-lg">📈</div>
                    <div className="font-semibold text-gray-800">
                      Tiến độ gần đây
                    </div>
                  </div>
                  {stats?.totalAttempts > 0 && (
                    <div className="text-xs text-gray-500">
                      Tổng: {stats.totalAttempts} lần
                    </div>
                  )}
                </div>

                {stats?.recentAttempts && stats.recentAttempts.length > 0 ? (
                  <div className="space-y-3">
                    {/* Recent attempts */}
                    <div className="space-y-2 text-sm">
                      {stats.recentAttempts.slice(0, 5).map((attempt, idx) => {
                        const date = new Date(attempt.date);
                        const timeAgo = getTimeAgo(date);
                        
                        return (
                          <div
                            key={attempt.attemptId || idx}
                            className="p-3 rounded-lg bg-[#F6FBFF] border border-[#E8F4FD] hover:border-[#77BEF0] transition"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                {attempt.phrase && (
                                  <div className="text-xs text-gray-500 mb-1 truncate">
                                    {attempt.phrase.topic || "Không có chủ đề"}
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
                          Tiến độ 7 ngày qua
                        </div>
                        <div className="space-y-2">
                          {stats.dailyProgress.map((day, idx) => {
                            const date = new Date(day.date);
                            const dayName = date.toLocaleDateString("vi-VN", {
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
                                  {day.count} lần
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
                    <div>Chưa có lịch sử luyện tập</div>
                    <div className="text-xs mt-2">
                      Bắt đầu luyện tập để xem tiến độ!
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

