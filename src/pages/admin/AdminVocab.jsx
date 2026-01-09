import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";
import { FaEdit, FaTrash, FaPlus, FaEye, FaEyeSlash } from "react-icons/fa";

export default function AdminVocab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters
  const [filterLevel, setFilterLevel] = useState("");
  const [filterPublished, setFilterPublished] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Topics for dropdown
  const [topics, setTopics] = useState([]);

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
    word: "",
    meaning: "",
    furigana: "",
    image_url: "",
    jlpt_level: "N5",
    is_published: false,
    topic_id: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch topics
  useEffect(() => {
    (async function fetchTopics() {
      try {
        const res = await api("/api/topics");
        setTopics(Array.isArray(res) ? res : res.topics || []);
      } catch (err) {
        console.error("Failed to load topics", err);
      }
    })();
  }, []);

  // Fetch vocab items
  useEffect(() => {
    let mounted = true;
    (async function fetchVocab() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("limit", limit);
        if (filterLevel) params.append("jlpt_level", filterLevel);
        if (filterPublished !== "") params.append("is_published", filterPublished);
        if (filterTopic) params.append("topic_id", filterTopic);

        const res = await api(`/api/admin/vocab?${params.toString()}`);
        if (!mounted) return;
        setItems(res.items || []);
        setTotal(res.total || 0);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load vocab", err);
        setError(err.message || "Không thể tải danh sách từ vựng");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, filterLevel, filterPublished, filterTopic, limit, refetchTrigger]);

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
      const res = await api(`/api/admin/search?q=${encodeURIComponent(q)}&type=vocab&limit=100`);
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
      word: "",
      meaning: "",
      furigana: "",
      image_url: "",
      jlpt_level: "N5",
      is_published: false,
      topic_id: "",
    });
    setFormErrors({});
    setModalState({ open: true, type: "create", item: null });
  };

  // Open edit modal
  const handleEdit = (item) => {
    setFormData({
      word: item.word || "",
      meaning: item.meaning || "",
      furigana: item.furigana || "",
      image_url: item.image_url || "",
      jlpt_level: item.jlpt_level || "N5",
      is_published: item.is_published || false,
      topic_id: item.topic_id ? String(item.topic_id) : "",
    });
    setFormErrors({});
    setModalState({ open: true, type: "edit", item });
  };

  // Open delete modal
  const handleDelete = (item) => {
    setModalState({ open: true, type: "delete", item });
  };

  // Toggle publish status
  const handleTogglePublish = async (item) => {
    try {
      setSubmitting(true);
      await api(`/api/admin/vocab/${item.vocab_id}`, {
        method: "PATCH",
        body: JSON.stringify({
          is_published: !item.is_published,
        }),
      });
      setRefetchTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err.message || "Không thể cập nhật trạng thái");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);

    try {
      const payload = {
        word: formData.word.trim(),
        meaning: formData.meaning.trim(),
        furigana: formData.furigana.trim(),
        jlpt_level: formData.jlpt_level,
        is_published: formData.is_published,
        image_url: formData.image_url.trim() || null,
        topic_id: formData.topic_id ? parseInt(formData.topic_id) : null,
      };

      if (modalState.type === "create") {
        await api("/api/admin/vocab", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/api/admin/vocab/${modalState.item.vocab_id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }

      setModalState({ open: false, type: null, item: null });
      setRefetchTrigger((prev) => prev + 1);
    } catch (err) {
      // Backend validation errors are shown in the error message
      setFormErrors({ _general: err.message || "Có lỗi xảy ra" });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      await api(`/api/admin/vocab/${modalState.item.vocab_id}`, {
        method: "DELETE",
      });
      setModalState({ open: false, type: null, item: null });
      setRefetchTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err.message || "Không thể xóa từ vựng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Quản Lý Từ Vựng">
      <div className="space-y-6 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: "#77BEF0" }}>
            Quản Lý Từ Vựng
          </h2>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <FaPlus />
            <span>Thêm từ vựng</span>
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
                placeholder="Tìm kiếm từ vựng (từ, nghĩa, furigana)..."
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
                Cấp độ JLPT
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterLevel}
                onChange={(e) => {
                  setFilterLevel(e.target.value);
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterPublished}
                onChange={(e) => {
                  setFilterPublished(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                <option value="true">Đã xuất bản</option>
                <option value="false">Chưa xuất bản</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chủ đề
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterTopic}
                onChange={(e) => {
                  setFilterTopic(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                {topics.map((topic) => (
                  <option key={topic.topic_id} value={topic.topic_id}>
                    {topic.topic_name}
                  </option>
                ))}
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
                    Từ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Furigana
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Nghĩa
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Cấp độ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Chủ đề
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Trạng thái
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
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        Đang tìm kiếm...
                      </td>
                    </tr>
                  ) : searchResults.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        Không tìm thấy kết quả
                      </td>
                    </tr>
                  ) : (
                    searchResults.map((item) => {
                      const topicName = item.topic?.topic_name || item.topic_id ? topics.find((t) => t.topic_id === item.topic_id)?.topic_name || "-" : "-";
                      return (
                        <tr key={item.vocab_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.vocab_id}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.word}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {item.furigana}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {item.meaning}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.jlpt_level}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {topicName}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.is_published ? "Đã xuất bản" : "Chưa xuất bản"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  const fullItem = items.find(i => i.vocab_id === item.vocab_id);
                                  if (fullItem) handleTogglePublish(fullItem);
                                }}
                                disabled={submitting}
                                className="p-2 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
                                title="Xuất bản/Ẩn"
                              >
                                <FaEye />
                              </button>
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
                      );
                    })
                  )
                ) : loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      Đang tải...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      Không có từ vựng nào
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const topicName =
                      topics.find((t) => t.topic_id === item.topic_id)
                        ?.topic_name || "-";
                    return (
                      <tr key={item.vocab_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.vocab_id}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {item.word}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.furigana}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.meaning}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.jlpt_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {topicName}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {item.is_published ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Đã xuất bản
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Chưa xuất bản
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleTogglePublish(item)}
                              disabled={submitting}
                              className="p-2 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
                              title={
                                item.is_published
                                  ? "Ẩn khỏi công khai"
                                  : "Xuất bản"
                              }
                            >
                              {item.is_published ? (
                                <FaEyeSlash />
                              ) : (
                                <FaEye />
                              )}
                            </button>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!searchQuery && total > limit && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)}{" "}
                trong tổng số {total} từ vựng
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
          <div className="bg-white rounded-xl shadow-2xl z-60 max-w-2xl w-full max-h-[90vh] flex flex-col relative">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold" style={{ color: "#77BEF0" }}>
                {modalState.type === "create" ? "Thêm từ vựng" : "Chỉnh sửa từ vựng"}
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
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 min-h-0">
              {formErrors._general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {formErrors._general}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Từ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      formErrors.word ? "border-red-300" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    value={formData.word}
                    onChange={(e) =>
                      setFormData({ ...formData, word: e.target.value })
                    }
                    required
                  />
                  {formErrors.word && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.word}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nghĩa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      formErrors.meaning ? "border-red-300" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    value={formData.meaning}
                    onChange={(e) =>
                      setFormData({ ...formData, meaning: e.target.value })
                    }
                    required
                  />
                  {formErrors.meaning && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.meaning}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Furigana <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className={`w-full px-4 py-2 rounded-lg border ${
                      formErrors.furigana
                        ? "border-red-300"
                        : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    value={formData.furigana}
                    onChange={(e) =>
                      setFormData({ ...formData, furigana: e.target.value })
                    }
                    rows={2}
                    required
                  />
                  {formErrors.furigana && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.furigana}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cấp độ JLPT <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full px-4 py-2 rounded-lg border ${
                      formErrors.jlpt_level
                        ? "border-red-300"
                        : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    value={formData.jlpt_level}
                    onChange={(e) =>
                      setFormData({ ...formData, jlpt_level: e.target.value })
                    }
                    required
                  >
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </select>
                  {formErrors.jlpt_level && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.jlpt_level}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL hình ảnh
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chủ đề
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.topic_id}
                    onChange={(e) =>
                      setFormData({ ...formData, topic_id: e.target.value })
                    }
                  >
                    <option value="">Không có chủ đề</option>
                    {topics.map((topic) => (
                      <option key={topic.topic_id} value={topic.topic_id}>
                        {topic.topic_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={formData.is_published}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_published: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Xuất bản
                    </span>
                  </label>
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
                Xóa từ vựng
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
                Bạn có chắc muốn xóa từ vựng{" "}
                <strong>{modalState.item?.word}</strong>? Hành động này không
                thể hoàn tác.
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

