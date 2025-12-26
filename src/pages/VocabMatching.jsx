import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Timer from "../components/Timer";
import { api } from "../lib/api";

export default function VocabMatching() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const level = searchParams.get("level") || "N5";
  const topic = searchParams.get("topic");
  const limit = parseInt(searchParams.get("limit")) || 10;

  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({ word: null, meaning: null });
  const [matched, setMatched] = useState(new Set());
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ level, limit });
        const data = await api(`/api/vocab/practice/matching?${params.toString()}`);
        setPairs(data.pairs || []);
      } catch (err) {
        console.error("Fetch matching error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPairs();
  }, [level, limit]);

  const handleSelectWord = (pairId, vocabId) => {
    if (matched.has(`word-${pairId}-${vocabId}`)) return;
    
    if (selected.word && selected.word.pairId === pairId && selected.word.vocabId === vocabId) {
      setSelected({ word: null, meaning: null });
      return;
    }

    setSelected((prev) => ({
      ...prev,
      word: { pairId, vocabId },
    }));
  };

  const handleSelectMeaning = (pairId, vocabId) => {
    if (matched.has(`meaning-${pairId}-${vocabId}`)) return;

    if (selected.meaning && selected.meaning.pairId === pairId && selected.meaning.vocabId === vocabId) {
      setSelected({ word: null, meaning: null });
      return;
    }

    setSelected((prev) => ({
      ...prev,
      meaning: { pairId, vocabId },
    }));
  };

  useEffect(() => {
    if (selected.word && selected.meaning) {
      if (selected.word.vocabId === selected.meaning.vocabId) {
        const wordKey = `word-${selected.word.pairId}-${selected.word.vocabId}`;
        const meaningKey = `meaning-${selected.meaning.pairId}-${selected.meaning.vocabId}`;
        setMatched((prev) => new Set([...prev, wordKey, meaningKey]));
        setScore((prev) => prev + 1);
        setSelected({ word: null, meaning: null });
      } else {
        setTimeout(() => {
          setSelected({ word: null, meaning: null });
        }, 500);
      }
    }
  }, [selected]);

  useEffect(() => {
    const totalMatches = pairs.reduce((acc, pair) => acc + 2, 0);
    if (matched.size === totalMatches && totalMatches > 0) {
      setCompleted(true);
    }
  }, [matched, pairs]);

  const allWords = pairs.flatMap((pair) => [
    { ...pair.word1, pairId: pair.id, type: "word" },
    { ...pair.word2, pairId: pair.id, type: "word" },
  ]);

  const allMeanings = pairs.flatMap((pair) => [
    ...pair.meanings.map((m) => ({ ...m, pairId: pair.id, type: "meaning" })),
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">
            <p>Đang tải...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/vocab")}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← Quay lại
            </button>
            <div className="flex items-center gap-4">
              <Timer isActive={!completed} />
              <div className="text-lg font-semibold text-[#4aa6e0]">
                Điểm: {score}/{pairs.length}
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#4aa6e0] mb-6">
            Matching Cards - {level}
          </h1>

          {completed ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-[#4aa6e0] mb-2">
                Hoàn thành!
              </h2>
              <p className="text-slate-600 mb-6">
                Bạn đã ghép đúng {score}/{pairs.length} cặp
              </p>
              <button
                onClick={() => navigate("/vocab")}
                className="rounded-lg bg-[#4aa6e0] hover:bg-[#3a8bc0] text-white px-6 py-2 font-semibold"
              >
                Quay lại
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {/* Words Column */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-slate-700">
                  Từ tiếng Nhật
                </h2>
                <div className="space-y-3">
                  {allWords.map((item) => {
                    const isMatched = matched.has(`word-${item.pairId}-${item.vocab_id}`);
                    const isSelected =
                      selected.word?.pairId === item.pairId &&
                      selected.word?.vocabId === item.vocab_id;

                    return (
                      <button
                        key={`word-${item.pairId}-${item.vocab_id}`}
                        onClick={() => handleSelectWord(item.pairId, item.vocab_id)}
                        disabled={isMatched}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          isMatched
                            ? "bg-green-100 border-green-400 opacity-60"
                            : isSelected
                            ? "bg-[#4aa6e0] text-white border-[#4aa6e0]"
                            : "bg-white border-slate-200 hover:border-[#4aa6e0]"
                        }`}
                      >
                        <div className="font-semibold">{item.word}</div>
                        <div className="text-sm opacity-75">{item.furigana}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meanings Column */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-slate-700">
                  Nghĩa
                </h2>
                <div className="space-y-3">
                  {allMeanings.map((item) => {
                    const isMatched = matched.has(`meaning-${item.pairId}-${item.vocab_id}`);
                    const isSelected =
                      selected.meaning?.pairId === item.pairId &&
                      selected.meaning?.vocabId === item.vocab_id;

                    return (
                      <button
                        key={`meaning-${item.pairId}-${item.vocab_id}`}
                        onClick={() => handleSelectMeaning(item.pairId, item.vocab_id)}
                        disabled={isMatched}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          isMatched
                            ? "bg-green-100 border-green-400 opacity-60"
                            : isSelected
                            ? "bg-[#4aa6e0] text-white border-[#4aa6e0]"
                            : "bg-white border-slate-200 hover:border-[#4aa6e0]"
                        }`}
                      >
                        <div className="font-semibold">{item.meaning}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

