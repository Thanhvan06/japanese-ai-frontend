import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";
import { FaEdit, FaTrash, FaPlus, FaEye, FaEyeSlash } from "react-icons/fa";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../i18n/translations";

export default function AdminGrammar() {
  const { language } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters
  const [filterLevel, setFilterLevel] = useState("");
  const [filterPublished, setFilterPublished] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

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
    grammar_structure: "",
    explanation_viet: "",
    example_jp: "",
    example_viet: "",
    jlpt_level: "N5",
    is_published: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch grammar items
  useEffect(() => {
    let mounted = true;
    (async function fetchGrammar() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("limit", limit);
        if (filterLevel) params.append("jlpt_level", filterLevel);
        if (filterPublished !== "") params.append("is_published", filterPublished);

        const res = await api(`/api/admin/grammar?${params.toString()}`);
        if (!mounted) return;
        setItems(res.items || []);
        setTotal(res.total || 0);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load grammar", err);
        setError(err.message || "Không thể tải danh sách ngữ pháp");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, filterLevel, filterPublished, limit, refetchTrigger]);

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
      const res = await api(`/api/admin/search?q=${encodeURIComponent(q)}&type=grammar&limit=100`);
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
      grammar_structure: "",
      explanation_viet: "",
      example_jp: "",
      example_viet: "",
      jlpt_level: "N5",
      is_published: false,
    });
    setFormErrors({});
    setModalState({ open: true, type: "create", item: null });
  };

  // Open edit modal
  const handleEdit = (item) => {
    setFormData({
      grammar_structure: item.grammar_structure || "",
      explanation_viet: item.explanation_viet || "",
      example_jp: item.example_jp || "",
      example_viet: item.example_viet || "",
      jlpt_level: item.jlpt_level || "N5",
      is_published: item.is_published || false,
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
      await api(`/api/admin/grammar/${item.grammar_id}/publish`, {
        method: "PATCH",
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
        grammar_structure: formData.grammar_structure.trim(),
        explanation_viet: formData.explanation_viet.trim(),
        example_jp: formData.example_jp.trim(),
        example_viet: formData.example_viet.trim() || null,
        jlpt_level: formData.jlpt_level,
        is_published: formData.is_published,
      };

      if (modalState.type === "create") {
        await api("/api/admin/grammar", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/api/admin/grammar/${modalState.item.grammar_id}`, {
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
      await api(`/api/admin/grammar/${modalState.item.grammar_id}`, {
        method: "DELETE",
      });
      setModalState({ open: false, type: null, item: null });
      setRefetchTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err.message || "Không thể xóa ngữ pháp");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title={t("adminGrammar.pageTitle", language)}>
      <div className="space-y-6 mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-2xl font-bold" style={{ color: "#77BEF0" }}>
            {t("adminGrammar.pageTitle", language)}
          </h2>
          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors w-full sm:w-auto"
          >
            <FaPlus />
            <span>{t("adminGrammar.createButton", language)}</span>
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
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="flex-1">
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("adminGrammar.search.placeholder", language)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto"
            >
              {searchLoading ? t("adminGrammar.search.loading", language) : t("adminGrammar.search.button", language)}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors w-full sm:w-auto"
              >
                {t("adminGrammar.search.clear", language)}
              </button>
            )}
          </form>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("adminGrammar.filters.levelLabel", language)}
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterLevel}
                onChange={(e) => {
                  setFilterLevel(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t("adminGrammar.filters.all", language)}</option>
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("adminGrammar.filters.statusLabel", language)}
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterPublished}
                onChange={(e) => {
                  setFilterPublished(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t("adminGrammar.filters.all", language)}</option>
                <option value="true">{t("adminGrammar.filters.published", language)}</option>
                <option value="false">{t("adminGrammar.filters.unpublished", language)}</option>
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
                    {t("adminGrammar.table.id", language)}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    {t("adminGrammar.table.structure", language)}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    {t("adminGrammar.table.explanation", language)}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    {t("adminGrammar.table.exampleJp", language)}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    {t("adminGrammar.table.level", language)}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    {t("adminGrammar.table.status", language)}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    {t("adminGrammar.table.actions", language)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {searchQuery ? (
                  searchLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        {t("adminGrammar.table.searchLoading", language)}
                      </td>
                    </tr>
                  ) : searchResults.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        {t("adminGrammar.table.searchEmpty", language)}
                      </td>
                    </tr>
                  ) : (
                    searchResults.map((item) => (
                      <tr key={item.grammar_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.grammar_id}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {item.grammar_structure}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {item.explanation_viet}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {item.example_jp}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.jlpt_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.is_published
                              ? t("adminGrammar.table.published", language)
                              : t("adminGrammar.table.unpublished", language)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                const fullItem = items.find(i => i.grammar_id === item.grammar_id);
                                if (fullItem) handleTogglePublish(fullItem);
                              }}
                              disabled={submitting}
                              className="p-2 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
                              title={
                                item.is_published
                                  ? t(
                                      "adminGrammar.table.publishHideTitleHidden",
                                      language
                                    )
                                  : t(
                                      "adminGrammar.table.publishHideTitlePublished",
                                      language
                                    )
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
                              title={t("adminGrammar.table.editTitle", language)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                              title={t("adminGrammar.table.deleteTitle", language)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                ) : loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      {t("adminGrammar.table.loading", language)}
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      {t("adminGrammar.table.empty", language)}
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.grammar_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.grammar_id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.grammar_structure}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {item.explanation_viet}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {item.example_jp}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.jlpt_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.is_published ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {t("adminGrammar.table.published", language)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {t("adminGrammar.table.unpublished", language)}
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
                                ? t(
                                    "adminGrammar.table.publishHideTitleHidden",
                                    language
                                  )
                                : t(
                                    "adminGrammar.table.publishHideTitlePublished",
                                    language
                                  )
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
                            title={t("adminGrammar.table.editTitle", language)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            title={t("adminGrammar.table.deleteTitle", language)}
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
                {t("adminGrammar.pagination.showing", language, {
                  start: (page - 1) * limit + 1,
                  end: Math.min(page * limit, total),
                  total,
                })}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t("adminGrammar.pagination.prev", language)}
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t("adminGrammar.pagination.next", language)}
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
          <div className="bg-white rounded-xl shadow-2xl z-60 max-w-3xl w-full max-h-[90vh] flex flex-col relative">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold" style={{ color: "#77BEF0" }}>
                {modalState.type === "create"
                  ? t("adminGrammar.modal.createTitle", language)
                  : t("adminGrammar.modal.editTitle", language)}
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
                    {t("adminGrammar.modal.fields.grammarStructure", language)}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      formErrors.grammar_structure ? "border-red-300" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    value={formData.grammar_structure}
                    onChange={(e) =>
                      setFormData({ ...formData, grammar_structure: e.target.value })
                    }
                    required
                  />
                  {formErrors.grammar_structure && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.grammar_structure}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("adminGrammar.modal.fields.explanation", language)}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className={`w-full px-4 py-2 rounded-lg border ${
                      formErrors.explanation_viet
                        ? "border-red-300"
                        : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    value={formData.explanation_viet}
                    onChange={(e) =>
                      setFormData({ ...formData, explanation_viet: e.target.value })
                    }
                    rows={4}
                    required
                  />
                  {formErrors.explanation_viet && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.explanation_viet}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("adminGrammar.modal.fields.exampleJp", language)}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className={`w-full px-4 py-2 rounded-lg border ${
                      formErrors.example_jp ? "border-red-300" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    value={formData.example_jp}
                    onChange={(e) =>
                      setFormData({ ...formData, example_jp: e.target.value })
                    }
                    rows={3}
                    required
                  />
                  {formErrors.example_jp && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.example_jp}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("adminGrammar.modal.fields.exampleViet", language)}
                  </label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.example_viet}
                    onChange={(e) =>
                      setFormData({ ...formData, example_viet: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("adminGrammar.modal.fields.jlptLevel", language)}{" "}
                    <span className="text-red-500">*</span>
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
                      {t("adminGrammar.modal.fields.publish", language)}
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
                {t("adminGrammar.modal.actions.cancel", language)}
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
                disabled={submitting}
              >
                {submitting
                  ? t("adminGrammar.modal.actions.processing", language)
                  : modalState.type === "create"
                  ? t("adminGrammar.modal.actions.create", language)
                  : t("adminGrammar.modal.actions.update", language)}
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
                {t("adminGrammar.deleteModal.title", language)}
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
                {t("adminGrammar.deleteModal.confirmText", language, {
                  grammar: modalState.item?.grammar_structure || "",
                })}
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
                {t("adminGrammar.deleteModal.cancel", language)}
              </button>
              <button
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting
                  ? t("adminGrammar.deleteModal.deleting", language)
                  : t("adminGrammar.deleteModal.delete", language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

