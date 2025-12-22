import { useState, useEffect } from "react";
import { api } from "../lib/api";
import axios from "axios";

const TEST_TYPES = [
  { value: "image", label: "Hình ảnh → Từ" },
  { value: "kanji-hiragana", label: "Kanji → Hiragana" },
  { value: "hiragana-kanji", label: "Hiragana → Kanji" },
  { value: "word-meaning", label: "Từ → Nghĩa" },
];

const TIMER_OPTIONS = [
  { value: 0, label: "Không giới hạn" },
  { value: 300, label: "5 phút" },
  { value: 600, label: "10 phút" },
  { value: 900, label: "15 phút" },
  { value: 1200, label: "20 phút" },
];

export default function TestSettings({ onSubmit, initialLevel, initialTopic }) {
  const [testType, setTestType] = useState("image");
  const [sourceType, setSourceType] = useState(initialTopic ? "topic" : "level"); // level, topic, flashcard
  const [level, setLevel] = useState(initialLevel || "N5");
  const [topic, setTopic] = useState(initialTopic || "");
  const [flashcardSetId, setFlashcardSetId] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [timer, setTimer] = useState(0);
  
  const [topics, setTopics] = useState([]);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [maxQuestions, setMaxQuestions] = useState(10);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoadingTopics(true);
        const res = await axios.get("http://localhost:4000/api/topics");
        setTopics(res.data || []);
      } catch (err) {
        console.error("Fetch topics error:", err);
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchTopics();
  }, []);

  useEffect(() => {
    if (sourceType === "flashcard") {
      const fetchFlashcardSets = async () => {
        try {
          setLoadingFlashcards(true);
          const data = await api("/api/flashcards/sets");
          setFlashcardSets(data.sets || []);
        } catch (err) {
          console.error("Fetch flashcard sets error:", err);
        } finally {
          setLoadingFlashcards(false);
        }
      };
      fetchFlashcardSets();
    }
  }, [sourceType]);

  useEffect(() => {
    // Estimate max questions (will be validated by backend)
    const estimateMax = async () => {
      try {
        const params = new URLSearchParams();
        if (sourceType === "level" && level) {
          params.append("level", level);
        } else if (sourceType === "topic" && topic) {
          params.append("topic", topic);
        } else if (sourceType === "flashcard" && flashcardSetId) {
          params.append("flashcardSetId", flashcardSetId);
        } else {
          return; // Wait for required params
        }
        params.append("limit", 1000);
        params.append("type", testType);
        
        const data = await api(`/api/vocab/practice/test?${params.toString()}`);
        setMaxQuestions(data.total || 10);
      } catch (err) {
        console.error("Estimate max questions error:", err);
        // For flashcard sets, user might not be authenticated yet, use default
        if (sourceType === "flashcard") {
          const selectedSet = flashcardSets.find(s => s.set_id === parseInt(flashcardSetId));
          setMaxQuestions(selectedSet?.card_count || 10);
        }
      }
    };
    
    if ((sourceType === "level" && level) || 
        (sourceType === "topic" && topic) ||
        (sourceType === "flashcard" && flashcardSetId)) {
      estimateMax();
    } else {
      setMaxQuestions(10);
    }
  }, [sourceType, level, topic, flashcardSetId, testType, flashcardSets]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (sourceType === "topic" && !topic) {
      alert("Vui lòng chọn chủ đề");
      return;
    }
    
    if (sourceType === "flashcard" && !flashcardSetId) {
      alert("Vui lòng chọn flashcard set");
      return;
    }

    const settings = {
      type: testType,
      level: sourceType === "level" ? level : undefined,
      topic: sourceType === "topic" ? topic : undefined,
      flashcardSetId: sourceType === "flashcard" ? flashcardSetId : undefined,
      limit: Math.min(questionCount, maxQuestions),
      timer: timer,
    };

    onSubmit(settings);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[#4aa6e0] mb-6">Cài đặt bài kiểm tra</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Loại bài tập
          </label>
          <div className="space-y-2">
            {TEST_TYPES.map((type) => (
              <label
                key={type.value}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="testType"
                  value={type.value}
                  checked={testType === type.value}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-4 h-4 text-[#4aa6e0]"
                />
                <span className="text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Source Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Nguồn từ vựng
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="radio"
                name="sourceType"
                value="level"
                checked={sourceType === "level"}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-4 h-4 text-[#4aa6e0]"
              />
              <span className="text-sm">Theo cấp độ</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="radio"
                name="sourceType"
                value="topic"
                checked={sourceType === "topic"}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-4 h-4 text-[#4aa6e0]"
              />
              <span className="text-sm">Theo chủ đề</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="radio"
                name="sourceType"
                value="flashcard"
                checked={sourceType === "flashcard"}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-4 h-4 text-[#4aa6e0]"
              />
              <span className="text-sm">Từ flashcard set</span>
            </label>
          </div>
        </div>

        {/* Level Selection */}
        {sourceType === "level" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cấp độ
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4aa6e0]"
            >
              {["N5", "N4", "N3", "N2", "N1"].map((lv) => (
                <option key={lv} value={lv}>
                  {lv}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Topic Selection */}
        {sourceType === "topic" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Chủ đề
            </label>
            {loadingTopics ? (
              <p className="text-sm text-slate-500">Đang tải...</p>
            ) : (
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4aa6e0]"
              >
                <option value="">Chọn chủ đề</option>
                {topics
                  .filter((t) => t._count?.vocabitems > 0)
                  .map((t) => (
                    <option key={t.topic_id} value={t.topic_id}>
                      {t.topic_name}
                    </option>
                  ))}
              </select>
            )}
          </div>
        )}

        {/* Flashcard Set Selection */}
        {sourceType === "flashcard" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Flashcard Set
            </label>
            {loadingFlashcards ? (
              <p className="text-sm text-slate-500">Đang tải...</p>
            ) : flashcardSets.length === 0 ? (
              <p className="text-sm text-slate-500">Bạn chưa có flashcard set nào</p>
            ) : (
              <select
                value={flashcardSetId}
                onChange={(e) => setFlashcardSetId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4aa6e0]"
              >
                <option value="">Chọn flashcard set</option>
                {flashcardSets.map((set) => (
                  <option key={set.set_id} value={set.set_id}>
                    {set.set_name} ({set.card_count || 0} thẻ)
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Question Count */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Số câu hỏi (tối đa: {maxQuestions})
          </label>
          <input
            type="number"
            min="10"
            max={maxQuestions}
            value={questionCount}
            onChange={(e) => setQuestionCount(Math.min(Math.max(10, parseInt(e.target.value) || 10), maxQuestions))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4aa6e0]"
          />
        </div>

        {/* Timer */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Thời gian
          </label>
          <select
            value={timer}
            onChange={(e) => setTimer(parseInt(e.target.value))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4aa6e0]"
          >
            {TIMER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full rounded-lg bg-[#4aa6e0] hover:bg-[#3a8bc0] text-white px-4 py-3 font-semibold transition-colors"
        >
          Bắt đầu kiểm tra
        </button>
      </form>
    </div>
  );
}

