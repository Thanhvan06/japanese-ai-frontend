import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getGrammarByLevel, getGrammarExercises } from "../services/grammarService";

const TIMER_OPTIONS = [
  { value: 0, label: "Không giới hạn" },
  { value: 300, label: "5 phút" },
  { value: 600, label: "10 phút" },
  { value: 900, label: "15 phút" },
  { value: 1200, label: "20 phút" },
];

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Trắc nghiệm" },
  { value: "sentence_arrangement", label: "Sắp xếp câu" },
];

export default function GrammarTestSettings({ onSubmit, initialLevel }) {
  const [searchParams] = useSearchParams();
  const initialQuestionType = searchParams.get("questionType") || "multiple_choice";
  const [questionType, setQuestionType] = useState(initialQuestionType);
  const [level, setLevel] = useState(initialLevel || "N5");
  const [selectedGrammars, setSelectedGrammars] = useState([]);
  const [selectAll, setSelectAll] = useState(true);
  const [timer, setTimer] = useState(0);
  const [questionCount, setQuestionCount] = useState(20);
  const [grammars, setGrammars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxQuestions, setMaxQuestions] = useState(20);

  useEffect(() => {
    const fetchGrammars = async () => {
      try {
        setLoading(true);
        const data = await getGrammarByLevel(level);
        setGrammars(data.items || []);
        if (selectAll) {
          setSelectedGrammars((data.items || []).map(g => g.grammar_id));
        }
      } catch (err) {
        console.error("Fetch grammars error:", err);
        setGrammars([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGrammars();
  }, [level]);

  useEffect(() => {
    if (selectAll && grammars.length > 0) {
      setSelectedGrammars(grammars.map(g => g.grammar_id));
    }
  }, [selectAll, grammars]);

  useEffect(() => {
    const estimateMax = async () => {
      if (selectedGrammars.length === 0 && !selectAll) {
        setMaxQuestions(10);
        return;
      }

      try {
        const exercises = await getGrammarExercises({
          level,
          question_type: questionType,
          limit: 100,
          grammar_ids: selectAll ? undefined : selectedGrammars,
        });
        const max = Math.max(exercises.length, 20);
        setMaxQuestions(max);
        // Update question count if it exceeds max
        setQuestionCount(prev => Math.min(prev, max));
      } catch (err) {
        console.error("Estimate max questions error:", err);
        setMaxQuestions(20);
      }
    };

    estimateMax();
  }, [level, questionType, selectedGrammars, selectAll]);

  const handleGrammarToggle = (grammarId) => {
    setSelectAll(false);
    setSelectedGrammars((prev) =>
      prev.includes(grammarId)
        ? prev.filter((id) => id !== grammarId)
        : [...prev, grammarId]
    );
  };

  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectAll(false);
      setSelectedGrammars([]);
    } else {
      setSelectAll(true);
      setSelectedGrammars(grammars.map(g => g.grammar_id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectAll && selectedGrammars.length === 0) {
      alert("Vui lòng chọn ít nhất một mẫu ngữ pháp");
      return;
    }

    const settings = {
      level,
      question_type: questionType,
      grammar_ids: selectAll ? undefined : selectedGrammars,
      timer: timer,
      limit: Math.min(questionCount, maxQuestions),
    };

    onSubmit(settings);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[#4aa6e0] mb-6">Cài đặt bài kiểm tra ngữ pháp</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Loại bài tập
          </label>
          <div className="space-y-2">
            {QUESTION_TYPES.map((type) => (
              <label
                key={type.value}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="questionType"
                  value={type.value}
                  checked={questionType === type.value}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="w-4 h-4 text-[#4aa6e0]"
                />
                <span className="text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Level Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Cấp độ JLPT
          </label>
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setSelectAll(true);
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4aa6e0]"
          >
            {["N5", "N4", "N3", "N2", "N1"].map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
        </div>

        {/* Grammar Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-slate-700">
              Chọn mẫu ngữ pháp
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAllToggle}
                className="w-4 h-4 text-[#4aa6e0]"
              />
              <span className="text-sm">Chọn tất cả</span>
            </label>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : grammars.length === 0 ? (
            <p className="text-sm text-slate-500">Không có mẫu ngữ pháp nào</p>
          ) : (
            <div className="border border-slate-200 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {grammars.map((grammar) => (
                  <label
                    key={grammar.grammar_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectAll || selectedGrammars.includes(grammar.grammar_id)}
                      onChange={() => handleGrammarToggle(grammar.grammar_id)}
                      disabled={selectAll}
                      className="w-4 h-4 text-[#4aa6e0]"
                    />
                    <span className="text-sm flex-1">
                      {grammar.grammar_structure}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

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

