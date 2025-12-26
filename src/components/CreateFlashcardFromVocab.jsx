import { useState, useEffect } from "react";
import { createSetFromVocab } from "../services/flashcardService";
import { api } from "../lib/api";

export default function CreateFlashcardFromVocab({
  isOpen,
  onClose,
  onSuccess,
  sourceType,
  sourceId,
  vocabList = [],
}) {
  const [setName, setSetName] = useState("");
  const [selectedVocabIds, setSelectedVocabIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [fetchingVocab, setFetchingVocab] = useState(false);
  const [vocabs, setVocabs] = useState(vocabList);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (isOpen && sourceType && sourceId && vocabList.length === 0) {
      fetchVocab();
    } else if (vocabList.length > 0) {
      setVocabs(vocabList);
    }
  }, [isOpen, sourceType, sourceId]);

  useEffect(() => {
    if (vocabs.length > 0) {
      setSelectedVocabIds(new Set(vocabs.map(v => v.vocab_id)));
      setSelectAll(true);
    }
  }, [vocabs]);

  const fetchVocab = async () => {
    try {
      setFetchingVocab(true);
      let data;
      
      if (sourceType === "level") {
        data = await api(`/api/vocab?level=${sourceId}`);
        setVocabs(data.items || []);
      } else if (sourceType === "topic") {
        data = await api(`/api/topics/${sourceId}/vocab`);
        setVocabs(data.vocab || []);
      }
    } catch (err) {
      console.error("Fetch vocab error:", err);
      alert("Không thể tải từ vựng");
    } finally {
      setFetchingVocab(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedVocabIds(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(vocabs.map(v => v.vocab_id));
      setSelectedVocabIds(allIds);
      setSelectAll(true);
    }
  };

  const handleToggleVocab = (vocabId) => {
    const newSelected = new Set(selectedVocabIds);
    if (newSelected.has(vocabId)) {
      newSelected.delete(vocabId);
    } else {
      newSelected.add(vocabId);
    }
    setSelectedVocabIds(newSelected);
    setSelectAll(newSelected.size === vocabs.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!setName.trim()) {
      alert("Vui lòng nhập tên flashcard set");
      return;
    }

    if (selectedVocabIds.size === 0) {
      alert("Vui lòng chọn ít nhất 1 từ vựng");
      return;
    }

    try {
      setLoading(true);
      const vocabIdsArray = Array.from(selectedVocabIds);
      
      await createSetFromVocab({
        setName: setName.trim(),
        vocabIds: vocabIdsArray,
        source: sourceType,
      });

      alert(`Tạo flashcard set thành công với ${vocabIdsArray.length} thẻ!`);
      setSetName("");
      setSelectedVocabIds(new Set());
      setSelectAll(false);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Create flashcard set error:", err);
      alert(err.message || "Không thể tạo flashcard set");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col mx-4">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#4aa6e0]">
              Tạo flashcard từ từ vựng
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Set Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên flashcard set *
              </label>
              <input
                type="text"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                placeholder="Ví dụ: Từ vựng N5 chủ đề Gia đình"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4aa6e0]"
                required
              />
            </div>

            {/* Select All */}
            <div className="mb-4 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleToggleSelectAll}
                  className="w-5 h-5 text-[#4aa6e0] rounded"
                />
                <span className="text-sm font-medium text-slate-700">
                  Chọn tất cả ({selectedVocabIds.size}/{vocabs.length})
                </span>
              </label>
            </div>

            {/* Vocab List */}
            {fetchingVocab ? (
              <p className="text-sm text-slate-500 text-center py-8">
                Đang tải từ vựng...
              </p>
            ) : vocabs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                Không có từ vựng nào
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {vocabs.map((vocab) => {
                  const isSelected = selectedVocabIds.has(vocab.vocab_id);
                  return (
                    <label
                      key={vocab.vocab_id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#4aa6e0] bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleVocab(vocab.vocab_id)}
                          className="mt-1 w-5 h-5 text-[#4aa6e0] rounded"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 mb-1">
                            {vocab.word}
                          </div>
                          {vocab.furigana && (
                            <div className="text-sm text-slate-500 mb-1">
                              {vocab.furigana}
                            </div>
                          )}
                          <div className="text-sm text-slate-600">
                            {vocab.meaning}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || selectedVocabIds.size === 0}
              className="flex-1 rounded-lg bg-[#4aa6e0] hover:bg-[#3a8bc0] text-white px-4 py-2 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang tạo..." : `Tạo flashcard (${selectedVocabIds.size} thẻ)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

