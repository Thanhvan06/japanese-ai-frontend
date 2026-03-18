import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";
import { FaEdit, FaEye, FaEyeSlash, FaPlus, FaTrash } from "react-icons/fa";

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const EXERCISE_TYPES = [
  { value: "reading_comprehension", label: "Đọc hiểu" },
  { value: "fill_in_the_blank", label: "Điền vào chỗ trống" },
];

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export default function AdminReading() {
  const [tab, setTab] = useState("sets"); // sets | items

  // Sets state
  const [sets, setSets] = useState([]);
  const [setsTotal, setSetsTotal] = useState(0);
  const [setsLoading, setSetsLoading] = useState(true);
  const [setsError, setSetsError] = useState(null);
  const [setsPage, setSetsPage] = useState(1);
  const setsLimit = 20;
  const [filterLevel, setFilterLevel] = useState("");
  const [filterPublished, setFilterPublished] = useState("");

  // Items state
  const [items, setItems] = useState([]);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState(null);
  const [itemsPage, setItemsPage] = useState(1);
  const itemsLimit = 20;
  const [selectedSetId, setSelectedSetId] = useState("");
  const [filterType, setFilterType] = useState("");

  // Refetch trigger
  const [refetch, setRefetch] = useState(0);

  // Modal state
  const [modalState, setModalState] = useState({
    open: false,
    type: null, // create_set | edit_set | delete_set | create_item | edit_item | delete_item
    item: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const [setForm, setSetForm] = useState({
    title: "",
    jlpt_level: "N5",
    is_published: false,
  });

  const [itemForm, setItemForm] = useState({
    set_id: "",
    exercise_type: "reading_comprehension",
    passage: "",
    question: "",
    optionsJson: '["A","B","C","D"]',
    correct_index: 0,
    blanksJson:
      '[{"position":1,"options":["日本語","英語"],"correct_index":0}]',
    explain_viet: "",
  });

  const setOptions = useMemo(() => {
    return sets.map((s) => ({
      value: String(s.set_id),
      label: `#${s.set_id} · ${s.jlpt_level} · ${s.title}`,
    }));
  }, [sets]);

  useEffect(() => {
    let mounted = true;
    (async function fetchSets() {
      try {
        setSetsLoading(true);
        setSetsError(null);
        const params = new URLSearchParams();
        params.append("page", setsPage);
        params.append("limit", setsLimit);
        if (filterLevel) params.append("jlpt_level", filterLevel);
        if (filterPublished !== "") params.append("is_published", filterPublished);
        const res = await api(`/api/admin/reading/sets?${params.toString()}`);
        if (!mounted) return;
        setSets(res.items || []);
        setSetsTotal(res.total || 0);
      } catch (err) {
        if (!mounted) return;
        setSetsError(err.message || "Không thể tải danh sách bộ bài đọc");
      } finally {
        if (mounted) setSetsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [setsPage, setsLimit, filterLevel, filterPublished, refetch]);

  useEffect(() => {
    if (tab !== "items") return;
    let mounted = true;
    (async function fetchItems() {
      try {
        setItemsLoading(true);
        setItemsError(null);
        const params = new URLSearchParams();
        params.append("page", itemsPage);
        params.append("limit", itemsLimit);
        if (selectedSetId) params.append("set_id", selectedSetId);
        if (filterType) params.append("exercise_type", filterType);
        const res = await api(`/api/admin/reading/items?${params.toString()}`);
        if (!mounted) return;
        setItems(res.items || []);
        setItemsTotal(res.total || 0);
      } catch (err) {
        if (!mounted) return;
        setItemsError(err.message || "Không thể tải danh sách bài đọc");
      } finally {
        if (mounted) setItemsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [tab, itemsPage, itemsLimit, selectedSetId, filterType, refetch]);

  const openCreateSet = () => {
    setSetForm({ title: "", jlpt_level: "N5", is_published: false });
    setModalState({ open: true, type: "create_set", item: null });
  };

  const openEditSet = (s) => {
    setSetForm({
      title: s.title || "",
      jlpt_level: s.jlpt_level || "N5",
      is_published: !!s.is_published,
    });
    setModalState({ open: true, type: "edit_set", item: s });
  };

  const openDeleteSet = (s) => {
    setModalState({ open: true, type: "delete_set", item: s });
  };

  const openCreateItem = () => {
    setItemForm((prev) => ({
      ...prev,
      set_id: selectedSetId || "",
      passage: "",
      question: "",
      correct_index: 0,
      explain_viet: "",
    }));
    setModalState({ open: true, type: "create_item", item: null });
  };

  const openEditItem = (it) => {
    setItemForm({
      set_id: String(it.set_id),
      exercise_type: it.exercise_type || "reading_comprehension",
      passage: it.passage || "",
      question: it.question || "",
      optionsJson: it.options_json || '["A","B","C","D"]',
      correct_index: it.correct_index ?? 0,
      blanksJson:
        it.blanks_json ||
        '[{"position":1,"options":["日本語","英語"],"correct_index":0}]',
      explain_viet: it.explain_viet || "",
    });
    setModalState({ open: true, type: "edit_item", item: it });
  };

  const openDeleteItem = (it) => {
    setModalState({ open: true, type: "delete_item", item: it });
  };

  const togglePublishSet = async (s) => {
    try {
      setSubmitting(true);
      await api(`/api/admin/reading/sets/${s.set_id}/publish`, { method: "PATCH" });
      setRefetch((v) => v + 1);
    } catch (err) {
      setSetsError(err.message || "Không thể cập nhật trạng thái");
    } finally {
      setSubmitting(false);
    }
  };

  const submitSet = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        title: setForm.title.trim(),
        jlpt_level: setForm.jlpt_level,
        is_published: !!setForm.is_published,
      };

      if (modalState.type === "create_set") {
        await api("/api/admin/reading/sets", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/api/admin/reading/sets/${modalState.item.set_id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      setModalState({ open: false, type: null, item: null });
      setRefetch((v) => v + 1);
    } catch (err) {
      setSetsError(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteSet = async () => {
    try {
      setSubmitting(true);
      await api(`/api/admin/reading/sets/${modalState.item.set_id}`, {
        method: "DELETE",
      });
      setModalState({ open: false, type: null, item: null });
      setRefetch((v) => v + 1);
    } catch (err) {
      setSetsError(err.message || "Không thể xóa");
    } finally {
      setSubmitting(false);
    }
  };

  const submitItem = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        set_id: Number(itemForm.set_id),
        exercise_type: itemForm.exercise_type,
        passage: itemForm.passage.trim(),
        question:
          itemForm.exercise_type === "reading_comprehension"
            ? itemForm.question.trim()
            : null,
        options:
          itemForm.exercise_type === "reading_comprehension"
            ? safeJsonParse(itemForm.optionsJson, [])
            : undefined,
        correct_index:
          itemForm.exercise_type === "reading_comprehension"
            ? Number(itemForm.correct_index)
            : null,
        blanks:
          itemForm.exercise_type === "fill_in_the_blank"
            ? safeJsonParse(itemForm.blanksJson, [])
            : undefined,
        explain_viet: itemForm.explain_viet.trim() || null,
      };

      if (!payload.set_id) {
        throw new Error("Vui lòng chọn Set");
      }

      if (modalState.type === "create_item") {
        await api("/api/admin/reading/items", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/api/admin/reading/items/${modalState.item.item_id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      setModalState({ open: false, type: null, item: null });
      setRefetch((v) => v + 1);
    } catch (err) {
      setItemsError(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteItem = async () => {
    try {
      setSubmitting(true);
      await api(`/api/admin/reading/items/${modalState.item.item_id}`, {
        method: "DELETE",
      });
      setModalState({ open: false, type: null, item: null });
      setRefetch((v) => v + 1);
    } catch (err) {
      setItemsError(err.message || "Không thể xóa");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Quản Lý Luyện Đọc">
      <div className="space-y-6 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: "#77BEF0" }}>
            Quản Lý Luyện Đọc
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTab("sets")}
              className={`px-4 py-2 rounded-lg border ${
                tab === "sets"
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              Bộ bài đọc
            </button>
            <button
              onClick={() => setTab("items")}
              className={`px-4 py-2 rounded-lg border ${
                tab === "items"
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              Bài đọc
            </button>
          </div>
        </div>

        {tab === "sets" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">
                  JLPT Level
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  value={filterLevel}
                  onChange={(e) => {
                    setSetsPage(1);
                    setFilterLevel(e.target.value);
                  }}
                >
                  <option value="">Tất cả</option>
                  {JLPT_LEVELS.map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">
                  Trạng thái
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  value={filterPublished}
                  onChange={(e) => {
                    setSetsPage(1);
                    setFilterPublished(e.target.value);
                  }}
                >
                  <option value="">Tất cả</option>
                  <option value="true">Đang publish</option>
                  <option value="false">Chưa publish</option>
                </select>
              </div>
              <div className="flex-1 flex gap-2 justify-end">
                <button
                  onClick={openCreateSet}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  <FaPlus />
                  <span>Thêm set</span>
                </button>
              </div>
            </div>

            {setsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {setsError}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        JLPT
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Tiêu đề
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Số bài
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Publish
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {setsLoading ? (
                      <tr>
                        <td className="px-4 py-6 text-center" colSpan={6}>
                          Đang tải...
                        </td>
                      </tr>
                    ) : sets.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-center" colSpan={6}>
                          Chưa có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      sets.map((s) => (
                        <tr key={s.set_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {s.set_id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {s.jlpt_level}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {s.title}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {s._count?.items ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              disabled={submitting}
                              onClick={() => togglePublishSet(s)}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                                s.is_published
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {s.is_published ? <FaEye /> : <FaEyeSlash />}
                              <span>{s.is_published ? "On" : "Off"}</span>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => openEditSet(s)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Sửa"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => openDeleteSet(s)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
            </div>
          </div>
        )}

        {tab === "items" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Set</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  value={selectedSetId}
                  onChange={(e) => {
                    setItemsPage(1);
                    setSelectedSetId(e.target.value);
                  }}
                >
                  <option value="">Tất cả</option>
                  {setOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">
                  Loại bài
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  value={filterType}
                  onChange={(e) => {
                    setItemsPage(1);
                    setFilterType(e.target.value);
                  }}
                >
                  <option value="">Tất cả</option>
                  {EXERCISE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 flex gap-2 justify-end">
                <button
                  onClick={openCreateItem}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  <FaPlus />
                  <span>Thêm bài</span>
                </button>
              </div>
            </div>

            {itemsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {itemsError}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Set
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Loại
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Passage
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {itemsLoading ? (
                      <tr>
                        <td className="px-4 py-6 text-center" colSpan={5}>
                          Đang tải...
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-center" colSpan={5}>
                          Chưa có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      items.map((it) => (
                        <tr key={it.item_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {it.item_id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            #{it.set_id} · {it.set?.jlpt_level} · {it.set?.title}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {it.exercise_type}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-xl">
                            <div className="line-clamp-2">{it.passage}</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => openEditItem(it)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Sửa"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => openDeleteItem(it)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
            </div>
          </div>
        )}

        {modalState.open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="font-semibold text-gray-800">
                  {modalState.type === "create_set" && "Thêm set"}
                  {modalState.type === "edit_set" && "Sửa set"}
                  {modalState.type === "delete_set" && "Xóa set"}
                  {modalState.type === "create_item" && "Thêm bài đọc"}
                  {modalState.type === "edit_item" && "Sửa bài đọc"}
                  {modalState.type === "delete_item" && "Xóa bài đọc"}
                </div>
                <button
                  className="px-3 py-1 rounded-lg hover:bg-gray-100"
                  onClick={() =>
                    setModalState({ open: false, type: null, item: null })
                  }
                >
                  Đóng
                </button>
              </div>

              <div className="p-4">
                {(modalState.type === "create_set" ||
                  modalState.type === "edit_set") && (
                  <form onSubmit={submitSet} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Tiêu đề
                      </label>
                      <input
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        value={setForm.title}
                        onChange={(e) =>
                          setSetForm((p) => ({ ...p, title: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          JLPT
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          value={setForm.jlpt_level}
                          onChange={(e) =>
                            setSetForm((p) => ({
                              ...p,
                              jlpt_level: e.target.value,
                            }))
                          }
                        >
                          {JLPT_LEVELS.map((lv) => (
                            <option key={lv} value={lv}>
                              {lv}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <input
                          type="checkbox"
                          checked={setForm.is_published}
                          onChange={(e) =>
                            setSetForm((p) => ({
                              ...p,
                              is_published: e.target.checked,
                            }))
                          }
                        />
                        <span className="text-sm text-gray-700">
                          Publish ngay
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg border border-gray-200"
                        onClick={() =>
                          setModalState({ open: false, type: null, item: null })
                        }
                      >
                        Hủy
                      </button>
                      <button
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white"
                      >
                        {submitting ? "Đang lưu..." : "Lưu"}
                      </button>
                    </div>
                  </form>
                )}

                {modalState.type === "delete_set" && (
                  <div className="space-y-4">
                    <div>
                      Bạn chắc chắn muốn xóa set{" "}
                      <strong>#{modalState.item?.set_id}</strong>?
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        className="px-4 py-2 rounded-lg border border-gray-200"
                        onClick={() =>
                          setModalState({ open: false, type: null, item: null })
                        }
                      >
                        Hủy
                      </button>
                      <button
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white"
                        onClick={confirmDeleteSet}
                      >
                        {submitting ? "Đang xóa..." : "Xóa"}
                      </button>
                    </div>
                  </div>
                )}

                {(modalState.type === "create_item" ||
                  modalState.type === "edit_item") && (
                  <form onSubmit={submitItem} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Set
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          value={itemForm.set_id}
                          onChange={(e) =>
                            setItemForm((p) => ({ ...p, set_id: e.target.value }))
                          }
                        >
                          <option value="">Chọn set</option>
                          {setOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Loại
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          value={itemForm.exercise_type}
                          onChange={(e) =>
                            setItemForm((p) => ({
                              ...p,
                              exercise_type: e.target.value,
                            }))
                          }
                        >
                          {EXERCISE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Passage
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg min-h-[120px]"
                        value={itemForm.passage}
                        onChange={(e) =>
                          setItemForm((p) => ({ ...p, passage: e.target.value }))
                        }
                      />
                    </div>

                    {itemForm.exercise_type === "reading_comprehension" && (
                      <>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Question
                          </label>
                          <input
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                            value={itemForm.question}
                            onChange={(e) =>
                              setItemForm((p) => ({
                                ...p,
                                question: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Options (JSON array)
                            </label>
                            <textarea
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg min-h-[120px] font-mono text-sm"
                              value={itemForm.optionsJson}
                              onChange={(e) =>
                                setItemForm((p) => ({
                                  ...p,
                                  optionsJson: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Correct index
                            </label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                              value={itemForm.correct_index}
                              onChange={(e) =>
                                setItemForm((p) => ({
                                  ...p,
                                  correct_index: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {itemForm.exercise_type === "fill_in_the_blank" && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Blanks (JSON array)
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg min-h-[160px] font-mono text-sm"
                          value={itemForm.blanksJson}
                          onChange={(e) =>
                            setItemForm((p) => ({
                              ...p,
                              blanksJson: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Giải thích (VI)
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg min-h-[80px]"
                        value={itemForm.explain_viet}
                        onChange={(e) =>
                          setItemForm((p) => ({
                            ...p,
                            explain_viet: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg border border-gray-200"
                        onClick={() =>
                          setModalState({ open: false, type: null, item: null })
                        }
                      >
                        Hủy
                      </button>
                      <button
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white"
                      >
                        {submitting ? "Đang lưu..." : "Lưu"}
                      </button>
                    </div>
                  </form>
                )}

                {modalState.type === "delete_item" && (
                  <div className="space-y-4">
                    <div>
                      Bạn chắc chắn muốn xóa bài{" "}
                      <strong>#{modalState.item?.item_id}</strong>?
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        className="px-4 py-2 rounded-lg border border-gray-200"
                        onClick={() =>
                          setModalState({ open: false, type: null, item: null })
                        }
                      >
                        Hủy
                      </button>
                      <button
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white"
                        onClick={confirmDeleteItem}
                      >
                        {submitting ? "Đang xóa..." : "Xóa"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


