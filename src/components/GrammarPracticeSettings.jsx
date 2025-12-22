import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getGrammarByLevel, getGrammarExercises } from "../services/grammarService";

const TIMER_OPTIONS = [
  { value: 0, label: "Không giới hạn" },
  { value: 300, label: "5 phút" },
  { value: 600, label: "10 phút" },
  { value: 900, label: "15 phút" },
  { value: 1200, label: "20 phút" },
];

export default function GrammarPracticeSettings({ practiceType, onClose }) {
  const navigate = useNavigate();
  const [level, setLevel] = useState("N5");
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
      if (selectedGrammars.length === 0) {
        setMaxQuestions(10);
        return;
      }

      try {
        const exercises = await getGrammarExercises({
          level,
          question_type: practiceType,
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
  }, [level, practiceType, selectedGrammars, selectAll]);

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

  const handleStart = async () => {
    if (!selectAll && selectedGrammars.length === 0) {
      alert("Vui lòng chọn ít nhất một mẫu ngữ pháp");
      return;
    }

    const settings = {
      level,
      question_type: practiceType,
      grammar_ids: selectAll ? undefined : selectedGrammars,
      timer: timer, // Timer is already in seconds from TIMER_OPTIONS
      limit: Math.min(questionCount, maxQuestions),
    };

    // Navigate to practice page with settings in state
    navigate("/grammar/practice", { state: settings });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#4aa6e0]">
            Cài đặt luyện tập
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
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

          {/* Timer Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Thời gian
            </label>
            <select
              value={timer}
              onChange={(e) => setTimer(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4aa6e0]"
            >
              {TIMER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-3 font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleStart}
              disabled={loading || (!selectAll && selectedGrammars.length === 0)}
              className="flex-1 rounded-lg bg-[#4aa6e0] hover:bg-[#3a8bc0] text-white px-4 py-3 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bắt đầu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

