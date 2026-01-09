import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";
import { FaEdit, FaTrash, FaPlus, FaGripVertical, FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function AdminGrammarExercises() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters
  const [filterGrammarId, setFilterGrammarId] = useState("");
  const [filterQuestionType, setFilterQuestionType] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Grammar list for dropdown
  const [grammars, setGrammars] = useState([]);

  // Refetch trigger
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Modal state
  const [modalState, setModalState] = useState({
    open: false,
    type: null, // 'create' | 'edit' | 'delete'
    item: null,
  });

  // Form state
  const [formData, setFormData] = useState({
    grammar_id: "",
    question_type: "multiple_choice",
    question_text: "",
    question_suffix: "",
    explanation_note: "",
    difficulty_level: "N5",
    options: [{ option_text: "", is_correct: false }],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch grammars for dropdown
  useEffect(() => {
    (async function fetchGrammars() {
      try {
        const res = await api("/api/admin/grammar?page=1&limit=1000");
        setGrammars(res.items || []);
      } catch (err) {
        console.error("Failed to load grammars", err);
      }
    })();
  }, []);

  // Fetch exercises
  useEffect(() => {
    let mounted = true;
    (async function fetchExercises() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("limit", limit);
        if (filterGrammarId) params.append("grammar_id", filterGrammarId);
        if (filterQuestionType) params.append("question_type", filterQuestionType);
        if (filterDifficulty) params.append("difficulty_level", filterDifficulty);

        const res = await api(`/api/admin/grammar-exercises?${params.toString()}`);
        if (!mounted) return;
        setItems(res.items || []);
        setTotal(res.total || 0);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load exercises", err);
        setError(err.message || "Không thể tải danh sách bài tập");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, filterGrammarId, filterQuestionType, filterDifficulty, limit, refetchTrigger]);

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api(`/api/admin/search?q=${encodeURIComponent(q)}&type=all&limit=100`);
      setSearchResults(res.items || []);
    } catch (err) {
      console.error("Search failed", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  // Open create modal
  const handleCreate = () => {
    setFormData({
      grammar_id: "",
      question_type: "multiple_choice",
      question_text: "",
      question_suffix: "",
      explanation_note: "",
      difficulty_level: "N5",
      options: [{ option_text: "", is_correct: false }],
    });
    setFormErrors({});
    setModalState({ open: true, type: "create", item: null });
  };

  // Open edit modal
  const handleEdit = (item) => {
    const options = (item.options || []).map((opt) => ({
      option_text: opt.option_text || "",
      is_correct: opt.is_correct || false,
      sort_order: opt.sort_order ?? null,
    }));

    // Sort options by sort_order for sentence_arrangement
    if (item.question_type === "sentence_arrangement") {
      options.sort((a, b) => {
        const orderA = a.sort_order ?? 999;
        const orderB = b.sort_order ?? 999;
        return orderA - orderB;
      });
    }

    setFormData({
      grammar_id: String(item.grammar_id || ""),
      question_type: item.question_type || "multiple_choice",
      question_text: item.question_text || "",
      question_suffix: item.question_suffix || "",
      explanation_note: item.explanation_note || "",
      difficulty_level: item.difficulty_level || "N5",
      options: options.length > 0 ? options : [{ option_text: "", is_correct: false }],
    });
    setFormErrors({});
    setModalState({ open: true, type: "edit", item });
  };

  // Open delete modal
  const handleDelete = (item) => {
    setModalState({ open: true, type: "delete", item });
  };

  // Handle question type change
  const handleQuestionTypeChange = (questionType) => {
    setFormData((prev) => {
      // Reset options based on question type
      if (questionType === "multiple_choice") {
        return {
          ...prev,
          question_type: questionType,
          options: prev.options.length > 0
            ? prev.options.map((opt) => ({
                option_text: opt.option_text,
                is_correct: false,
              }))
            : [{ option_text: "", is_correct: false }],
        };
      } else {
        // sentence_arrangement
        return {
          ...prev,
          question_type: questionType,
          options: prev.options.length > 0
            ? prev.options.map((opt, idx) => ({
                option_text: opt.option_text,
                sort_order: idx + 1,
              }))
            : [{ option_text: "", sort_order: 1 }],
        };
      }
    });
  };

  // Add option
  const handleAddOption = () => {
    setFormData((prev) => {
      const newOption =
        prev.question_type === "multiple_choice"
          ? { option_text: "", is_correct: false }
          : { option_text: "", sort_order: prev.options.length + 1 };
      return {
        ...prev,
        options: [...prev.options, newOption],
      };
    });
  };

  // Remove option
  const handleRemoveOption = (index) => {
    setFormData((prev) => {
      const newOptions = prev.options.filter((_, i) => i !== index);
      // Reorder sort_order for sentence_arrangement
      if (prev.question_type === "sentence_arrangement") {
        return {
          ...prev,
          options: newOptions.map((opt, idx) => ({
            ...opt,
            sort_order: idx + 1,
          })),
        };
      }
      return {
        ...prev,
        options: newOptions.length > 0 ? newOptions : [{ option_text: "", is_correct: false }],
      };
    });
  };

  // Update option
  const handleUpdateOption = (index, field, value) => {
    setFormData((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      return { ...prev, options: newOptions };
    });
  };

  // Move option up/down for sentence_arrangement
  const handleMoveOption = (index, direction) => {
    if (formData.question_type !== "sentence_arrangement") return;

    setFormData((prev) => {
      const newOptions = [...prev.options];
      if (direction === "up" && index > 0) {
        [newOptions[index - 1], newOptions[index]] = [
          newOptions[index],
          newOptions[index - 1],
        ];
      } else if (direction === "down" && index < newOptions.length - 1) {
        [newOptions[index], newOptions[index + 1]] = [
          newOptions[index + 1],
          newOptions[index],
        ];
      }
      // Update sort_order
      return {
        ...prev,
        options: newOptions.map((opt, idx) => ({
          ...opt,
          sort_order: idx + 1,
        })),
      };
    });
  };

  // Get preview sentence for sentence_arrangement
  const getPreviewSentence = () => {
    if (formData.question_type !== "sentence_arrangement") return "";
    const words = formData.options
      .filter((opt) => opt.option_text.trim())
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
      .map((opt) => opt.option_text.trim());
    return words.join(" ");
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);

    try {
      // Filter out empty options
      const validOptions = formData.options.filter(
        (opt) => opt.option_text && opt.option_text.trim()
      );

      if (validOptions.length === 0) {
        setFormErrors({ _general: "Cần ít nhất 1 option" });
        setSubmitting(false);
        return;
      }

      const payload = {
        grammar_id: parseInt(formData.grammar_id),
        question_type: formData.question_type,
        question_text: formData.question_text.trim(),
        question_suffix: formData.question_suffix.trim() || null,
        explanation_note: formData.explanation_note.trim() || null,
        difficulty_level: formData.difficulty_level,
        options: validOptions.map((opt, idx) => {
          if (formData.question_type === "multiple_choice") {
            return {
              option_text: opt.option_text.trim(),
              is_correct: opt.is_correct || false,
            };
          } else {
            return {
              option_text: opt.option_text.trim(),
              sort_order: opt.sort_order ?? idx + 1,
            };
          }
        }),
      };

      if (modalState.type === "create") {
        await api("/api/admin/grammar-exercises", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/api/admin/grammar-exercises/${modalState.item.exercise_id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      setModalState({ open: false, type: null, item: null });
      setRefetchTrigger((prev) => prev + 1);
    } catch (err) {
      setFormErrors({ _general: err.message || "Có lỗi xảy ra" });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      await api(`/api/admin/grammar-exercises/${modalState.item.exercise_id}`, {
        method: "DELETE",
      });
      setModalState({ open: false, type: null, item: null });
      setRefetchTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err.message || "Không thể xóa bài tập");
    } finally {
      setSubmitting(false);
    }
  };

  // Get grammar name by id
  const getGrammarName = (grammarId) => {
    const grammar = grammars.find((g) => g.grammar_id === grammarId);
    return grammar ? grammar.grammar_structure : `ID: ${grammarId}`;
  };

  return (
    <AdminLayout title="Quản Lý Bài Tập Ngữ Pháp">
      <div className="space-y-6 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: "#77BEF0" }}>
            Quản Lý Bài Tập Ngữ Pháp
          </h2>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <FaPlus />
            <span>Thêm bài tập</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tìm kiếm bài tập (câu hỏi, ngữ pháp)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {searchLoading ? "Đang tìm..." : "Tìm kiếm"}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Xóa
              </button>
            )}
          </form>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngữ pháp
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterGrammarId}
                onChange={(e) => {
                  setFilterGrammarId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                {grammars.map((g) => (
                  <option key={g.grammar_id} value={g.grammar_id}>
                    {g.grammar_structure}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại câu hỏi
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterQuestionType}
                onChange={(e) => {
                  setFilterQuestionType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                <option value="multiple_choice">Trắc nghiệm</option>
                <option value="sentence_arrangement">Sắp xếp câu</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cấp độ
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterDifficulty}
                onChange={(e) => {
                  setFilterDifficulty(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Ngữ pháp
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Câu hỏi
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Loại
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Cấp độ
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {searchQuery ? (
                  searchLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        Đang tìm kiếm...
                      </td>
                    </tr>
                  ) : searchResults.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        Không tìm thấy kết quả
                      </td>
                    </tr>
                  ) : (
                    searchResults.filter(item => item._type === "grammar").map((item) => {
                      const relatedExercises = items.filter(ex => ex.grammar_id === item.grammar_id);
                      if (relatedExercises.length === 0) {
                        return (
                          <tr key={`search-${item.grammar_id}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-600" colSpan="6">
                              <div className="flex items-center justify-between">
                                <span>
                                  <strong>{item.grammar_structure}</strong> - {item.explanation_viet.substring(0, 50)}...
                                </span>
                                <span className="text-xs text-gray-500">Không có bài tập</span>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return relatedExercises.map((ex) => (
                        <tr key={ex.exercise_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {ex.exercise_id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {item.grammar_structure}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {ex.question_text}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                ex.question_type === "multiple_choice"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {ex.question_type === "multiple_choice"
                                ? "Trắc nghiệm"
                                : "Sắp xếp câu"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {ex.difficulty_level}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(ex)}
                                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                title="Chỉnh sửa"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(ex)}
                                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                                title="Xóa"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    }).flat()
                  )
                ) : loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Đang tải...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Không có bài tập nào
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.exercise_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.exercise_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getGrammarName(item.grammar_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {item.question_text}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.question_type === "multiple_choice"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {item.question_type === "multiple_choice"
                            ? "Trắc nghiệm"
                            : "Sắp xếp câu"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.difficulty_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            title="Xóa"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!searchQuery && total > limit && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)}{" "}
                trong tổng số {total} bài tập
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalState.open && (modalState.type === "create" || modalState.type === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black opacity-50 transition-opacity duration-200"
            onClick={() =>
              setModalState({ open: false, type: null, item: null })
            }
          ></div>
          <div className="bg-white rounded-xl shadow-2xl z-60 max-w-4xl w-full max-h-[90vh] flex flex-col relative">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold" style={{ color: "#77BEF0" }}>
                {modalState.type === "create"
                  ? "Thêm bài tập"
                  : "Chỉnh sửa bài tập"}
              </h3>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() =>
                  setModalState({ open: false, type: null, item: null })
                }
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 min-h-0"
            >
              {formErrors._general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {formErrors._general}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngữ pháp <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.grammar_id}
                    onChange={(e) =>
                      setFormData({ ...formData, grammar_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Chọn ngữ pháp</option>
                    {grammars.map((g) => (
                      <option key={g.grammar_id} value={g.grammar_id}>
                        {g.grammar_structure}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại câu hỏi <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.question_type}
                    onChange={(e) => handleQuestionTypeChange(e.target.value)}
                    required
                  >
                    <option value="multiple_choice">Trắc nghiệm</option>
                    <option value="sentence_arrangement">Sắp xếp câu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Câu hỏi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.question_text}
                    onChange={(e) =>
                      setFormData({ ...formData, question_text: e.target.value })
                    }
                    rows={3}
                    required
                    placeholder={
                      formData.question_type === "sentence_arrangement"
                        ? "Câu hỏi (có thể có __ để chỉ vị trí cần điền)"
                        : "Nhập câu hỏi"
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hậu tố câu hỏi
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.question_suffix}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        question_suffix: e.target.value,
                      })
                    }
                    placeholder="Ví dụ: (chọn đáp án đúng)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cấp độ <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.difficulty_level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        difficulty_level: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú giải thích
                  </label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.explanation_note}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        explanation_note: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="Giải thích đáp án đúng"
                  />
                </div>

                {/* Options Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {formData.question_type === "multiple_choice"
                        ? "Đáp án"
                        : "Các từ để sắp xếp"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Thêm
                    </button>
                  </div>

                  {formData.question_type === "multiple_choice" ? (
                    /* Multiple Choice Options */
                    <div className="space-y-3">
                      {formData.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={option.is_correct || false}
                            onChange={(e) =>
                              handleUpdateOption(index, "is_correct", e.target.checked)
                            }
                            title="Đáp án đúng"
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={option.option_text}
                            onChange={(e) =>
                              handleUpdateOption(index, "option_text", e.target.value)
                            }
                            placeholder={`Đáp án ${index + 1}`}
                            required
                          />
                          {formData.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(index)}
                              className="p-2 text-red-600 hover:text-red-700"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Sentence Arrangement Options */
                    <div className="space-y-3">
                      {formData.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                        >
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveOption(index, "up")}
                              disabled={index === 0}
                              className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Lên"
                            >
                              <FaArrowUp />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOption(index, "down")}
                              disabled={index === formData.options.length - 1}
                              className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Xuống"
                            >
                              <FaArrowDown />
                            </button>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">
                                Thứ tự: {option.sort_order ?? index + 1}
                              </span>
                            </div>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              value={option.option_text}
                              onChange={(e) =>
                                handleUpdateOption(index, "option_text", e.target.value)
                              }
                              placeholder={`Từ ${index + 1}`}
                              required
                            />
                          </div>
                          {formData.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(index)}
                              className="p-2 text-red-600 hover:text-red-700"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Preview Sentence */}
                      {getPreviewSentence() && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm font-medium text-blue-900 mb-1">
                            Xem trước câu đúng:
                          </div>
                          <div className="text-lg text-blue-800">
                            {getPreviewSentence()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-2 rounded-b-xl">
              <button
                type="button"
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
                onClick={() =>
                  setModalState({ open: false, type: null, item: null })
                }
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
                disabled={submitting}
              >
                {submitting
                  ? "Đang xử lý..."
                  : modalState.type === "create"
                  ? "Thêm"
                  : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalState.open && modalState.type === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black opacity-50 transition-opacity duration-200"
            onClick={() =>
              setModalState({ open: false, type: null, item: null })
            }
          ></div>
          <div className="bg-white rounded-xl shadow-2xl z-60 max-w-md w-full">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold" style={{ color: "#77BEF0" }}>
                Xóa bài tập
              </h3>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() =>
                  setModalState({ open: false, type: null, item: null })
                }
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                Bạn có chắc muốn xóa bài tập này? Hành động này không thể hoàn
                tác.
              </p>
            </div>
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-2 rounded-b-xl">
              <button
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
                onClick={() =>
                  setModalState({ open: false, type: null, item: null })
                }
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

