import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function AdminListening() {
  const [level, setLevel] = useState("");
  const [sets, setSets] = useState([]);
  const [overview, setOverview] = useState(null);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { kind: 'set'|'item', id: number }
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [audioUploadBusy, setAudioUploadBusy] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState("");

  const [editingSet, setEditingSet] = useState(null);
  const [createSetOpen, setCreateSetOpen] = useState(false);
  const [setForm, setSetForm] = useState({
    title: "",
    jlpt_level: "",
    description: "",
    is_published: true,
  });

  const [editingItem, setEditingItem] = useState(null);
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    exercise_type: "multiple_choice",
    question: "",
    transcript_jp: "",
    explain_viet: "",
    optionsText: "",
    wordsText: "",
    correct_index: "",
    audio_url: "",
  });

  const levels = ["N5", "N4", "N3", "N2", "N1"];

  async function loadOverview(currentLevel) {
    try {
      const res = await api(
        `/api/listening/admin/stats/overview${
          currentLevel ? `?level=${currentLevel}` : ""
        }`
      );
      setOverview(res);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadSets(currentLevel) {
    setLoading(true);
    setError("");
    try {
      const res = await api(
        `/api/listening/admin/sets${
          currentLevel ? `?level=${currentLevel}` : ""
        }`
      );
      setSets(res.items || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Không tải được danh sách set");
    } finally {
      setLoading(false);
    }
  }

  async function loadItems(setId) {
    setItems([]);
    if (!setId) return;
    try {
      const res = await api(
        `/api/listening/admin/sets/${setId}/items`
      );
      setItems(res.items || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadOverview(level);
    loadSets(level);
  }, [level]);

  function openCreateSet() {
    setEditingSet(null);
    setCreateSetOpen(true);
    setCreateItemOpen(false);
    setSetForm({
      title: "",
      jlpt_level: level || "N5",
      description: "",
      is_published: true,
    });
  }

  function openEditSet(s) {
    setEditingSet(s);
    setCreateSetOpen(false);
    setCreateItemOpen(false);
    setSetForm({
      title: s.title || "",
      jlpt_level: s.jlpt_level || "",
      description: s.description || "",
      is_published: Boolean(s.is_published),
    });

    // Keep context aligned: when editing from action column,
    // row's onClick does not fire (stopPropagation), so we need to set it here.
    setSelectedSetId(s.set_id);
    setEditingItem(null);
    setItemForm({
      exercise_type: "multiple_choice",
      question: "",
      transcript_jp: "",
      explain_viet: "",
      optionsText: "",
      wordsText: "",
      correct_index: "",
      audio_url: "",
    });
    loadItems(s.set_id);
  }

  async function submitSetForm(e) {
    e.preventDefault();
    const updatingSetId = editingSet?.set_id ?? null;
    setSaving(true);
    try {
      const payload = {
        title: setForm.title,
        jlpt_level: setForm.jlpt_level,
        is_published: setForm.is_published,
      };
      if (editingSet) {
        await api(
          `/api/listening/admin/sets/${editingSet.set_id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await api("/api/listening/admin/sets", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setEditingSet(null);
      setCreateSetOpen(false);
      setCreateItemOpen(false);
      await loadOverview(level);
      await loadSets(level);
      if (updatingSetId && selectedSetId === updatingSetId) {
        await loadItems(updatingSetId);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Lưu bộ bài thất bại");
    } finally {
      setSaving(false);
    }
  }

  function askDeleteSet(setId) {
    setDeleteTarget({ kind: "set", id: setId });
  }

  function askDeleteItem(itemId) {
    setDeleteTarget({ kind: "item", id: itemId });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      setDeleteBusy(true);
      if (deleteTarget.kind === "set") {
        const setId = deleteTarget.id;
        await api(`/api/listening/admin/sets/${setId}`, { method: "DELETE" });

        if (selectedSetId === setId) {
          setSelectedSetId(null);
          setItems([]);
        }
        if (editingSet?.set_id === setId) setEditingSet(null);

        await loadOverview(level);
        await loadSets(level);
      }

      if (deleteTarget.kind === "item") {
        const itemId = deleteTarget.id;
        await api(`/api/listening/admin/items/${itemId}`, { method: "DELETE" });

        if (editingItem?.item_id === itemId) setEditingItem(null);

        await loadOverview(level);
        if (selectedSetId) await loadItems(selectedSetId);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Xóa thất bại");
    } finally {
      setDeleteBusy(false);
      setDeleteTarget(null);
    }
  }

  function openCreateItem() {
    if (!selectedSetId) return;
    setEditingItem(null);
    setCreateItemOpen(true);
    setCreateSetOpen(false);
    setAudioUploadError("");
    setAudioUploadBusy(false);
    setItemForm({
      exercise_type: "multiple_choice",
      question: "",
      transcript_jp: "",
      explain_viet: "",
      optionsText: "",
      wordsText: "",
      correct_index: "",
      audio_url: "",
    });
  }

  function openEditItem(item) {
    setEditingSet(null);
    setCreateSetOpen(false);
    setCreateItemOpen(false);
    if (item?.set_id) setSelectedSetId(item.set_id);
    setEditingItem(item);
    setAudioUploadError("");
    setAudioUploadBusy(false);
    setItemForm({
      exercise_type: item.exercise_type || "multiple_choice",
      question: item.question || "",
      transcript_jp: item.transcript_jp || "",
      explain_viet: item.explain_viet || "",
      optionsText: (item.options || []).join("\n"),
      wordsText: (item.words || []).join(" "),
      correct_index:
        item.correct_index === null ||
        item.correct_index === undefined
          ? ""
          : String(item.correct_index),
      audio_url: item.audio_url || "",
    });
  }

  async function submitItemForm(e) {
    e.preventDefault();
    if (!selectedSetId) return;
    setSaving(true);
    try {
      const options =
        itemForm.optionsText.trim() === ""
          ? null
          : itemForm.optionsText
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);
      const words =
        itemForm.wordsText.trim() === ""
          ? null
          : itemForm.wordsText
              .split(/\s+/)
              .map((s) => s.trim())
              .filter(Boolean);
      const payload = {
        exercise_type: itemForm.exercise_type,
        question: itemForm.question,
        transcript_jp: itemForm.transcript_jp,
        explain_viet: itemForm.explain_viet,
        options,
        words,
        correct_index:
          itemForm.correct_index === ""
            ? null
            : Number(itemForm.correct_index),
        audio_url: itemForm.audio_url,
      };
      if (editingItem) {
        await api(
          `/api/listening/admin/items/${editingItem.item_id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await api(
          `/api/listening/admin/sets/${selectedSetId}/items`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      }
      setEditingItem(null);
      setCreateItemOpen(false);
      await loadOverview(level);
      await loadItems(selectedSetId);
    } catch (err) {
      console.error(err);
      setError(err.message || "Lưu câu hỏi thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function uploadListeningAudioFile(file) {
    if (!file) return;
    setAudioUploadBusy(true);
    setAudioUploadError("");
    try {
      const fd = new FormData();
      fd.append("audio", file);
      const res = await api("/api/listening/upload", {
        method: "POST",
        body: fd,
      });

      if (res?.url) {
        setItemForm((f) => ({ ...f, audio_url: res.url }));
      }
    } catch (err) {
      console.error(err);
      setAudioUploadError(err.message || "Upload audio thất bại");
    } finally {
      setAudioUploadBusy(false);
    }
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
  }

  return (
    <AdminLayout title="Quản lý luyện nghe">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <label className="text-sm text-gray-700">
            Cấp độ JLPT:
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Tất cả</option>
            {levels.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
        </div>

        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Số bộ bài" value={overview.totalSets} />
            <StatCard label="Số câu hỏi" value={overview.totalItems} />
            <StatCard
              label="Tổng lượt làm"
              value={overview.totalAttempts}
            />
            <StatCard
              label="Tỉ lệ đúng TB"
              value={`${overview.averageAccuracy || 0}%`}
            />
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h2 className="font-semibold text-gray-800">
                Danh sách bộ bài nghe
              </h2>
              <button
                type="button"
                onClick={openCreateSet}
                className="px-3 py-1.5 text-xs rounded-md text-white"
                style={{ background: "#77BEF0" }}
              >
                Thêm bộ mới
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg shadow-sm bg-white p-2">
              <table className="min-w-[760px] text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left">Tên bộ</th>
                    <th className="px-3 py-3 text-left">Level</th>
                    <th className="px-3 py-3 text-center">Câu</th>
                    <th className="px-3 py-3 text-center">Lượt</th>
                    <th className="px-3 py-3 text-center">% đúng</th>
                    <th className="px-3 py-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        Đang tải...
                      </td>
                    </tr>
                  ) : sets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        Chưa có bộ bài nghe
                      </td>
                    </tr>
                  ) : (
                    sets.map((s) => (
                      <tr
                        key={s.set_id}
                        onClick={() => {
                          setSelectedSetId(s.set_id);
                          loadItems(s.set_id);
                        }}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedSetId === s.set_id
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-3">
                          <div className="font-medium">{s.title}</div>
                          <div className="text-xs text-gray-500">
                            {s.description}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {s.jlpt_level}
                        </td>
                        <td className="px-3 py-3 text-center text-sm">
                          {s.itemsCount}
                        </td>
                        <td className="px-3 py-3 text-center text-sm">
                          {s.totalAttempts}
                        </td>
                        <td className="px-3 py-3 text-center text-sm">
                          {s.accuracy}%
                        </td>
                        <td
                          className="px-3 py-3 text-right text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              title="Sửa"
                              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                              onClick={() => openEditSet(s)}
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Xóa"
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                              onClick={() => askDeleteSet(s.set_id)}
                            >
                              <FaTrash className="w-4 h-4" />
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

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h2 className="font-semibold text-gray-800">
                Câu hỏi trong bộ
              </h2>
              {selectedSetId && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="text-xs text-gray-500">
                    Đã chọn set #{selectedSetId}
                  </span>
                  <button
                    type="button"
                    onClick={openCreateItem}
                    className="px-3 py-1.5 text-xs rounded-md text-white"
                    style={{ background: "#77BEF0" }}
                  >
                    Thêm câu hỏi
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg shadow-sm bg-white p-2">
              <table className="min-w-[860px] text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left">Câu hỏi</th>
                    <th className="px-3 py-3 text-left">Loại</th>
                    <th className="px-3 py-3 text-center">Audio</th>
                    <th className="px-3 py-3 text-center">Lượt</th>
                    <th className="px-3 py-3 text-center">% đúng</th>
                    <th className="px-3 py-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedSetId ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        Chọn một bộ bài để xem câu hỏi
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        Bộ bài này chưa có câu hỏi
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.item_id} className="hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <div className="line-clamp-2">
                            {item.question}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          {item.exercise_type}
                        </td>
                        <td className="px-3 py-3 text-center text-xs">
                          {item.audio_url ? "Có" : "Không"}
                        </td>
                        <td className="px-3 py-3 text-center text-xs">
                          {item.totalAttempts}
                        </td>
                        <td className="px-3 py-3 text-center text-xs">
                          {item.accuracy}%
                        </td>
                        <td className="px-3 py-3 text-right text-xs">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              title="Sửa"
                              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                              onClick={() => openEditItem(item)}
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Xóa"
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                              onClick={() => askDeleteItem(item.item_id)}
                            >
                              <FaTrash className="w-4 h-4" />
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
        {/* Set form (create only) */}
        {false && (
          <div className="mt-8 pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">
              {editingSet ? "Sửa bộ bài" : "Thêm bộ bài mới"}
            </h3>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={submitSetForm}
            >
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Tên bộ
                </label>
                <input
                  value={setForm.title}
                  onChange={(e) =>
                    setSetForm((f) => ({
                      ...f,
                      title: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Cấp độ JLPT
                </label>
                <select
                  value={setForm.jlpt_level}
                  onChange={(e) =>
                    setSetForm((f) => ({
                      ...f,
                      jlpt_level: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                  required
                >
                  <option value="">Chọn level</option>
                  {levels.map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-700">
                  Mô tả
                </label>
                <textarea
                  value={setForm.description}
                  onChange={(e) =>
                    setSetForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm w-full"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="is_published"
                  type="checkbox"
                  checked={setForm.is_published}
                  onChange={(e) =>
                    setSetForm((f) => ({
                      ...f,
                      is_published: e.target.checked,
                    }))
                  }
                />
                <label
                  htmlFor="is_published"
                  className="text-sm text-gray-700"
                >
                  Đã xuất bản
                </label>
              </div>
              <div className="md:col-span-2 flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-md text-white text-sm"
                  style={{ background: "#77BEF0" }}
                >
                  {saving ? "Đang lưu..." : "Lưu bộ bài"}
                </button>
                {editingSet && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-all duration-150 text-sm"
                    onClick={() => setEditingSet(null)}
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Item form (create only) */}
        {false && (
          <div className="mt-8 pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">
              {editingItem
                ? "Sửa câu hỏi"
                : "Thêm câu hỏi mới cho set " + selectedSetId}
            </h3>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={submitItemForm}
            >
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Loại bài
                </label>
                <select
                  value={itemForm.exercise_type}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      exercise_type: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="multiple_choice">
                    Multiple choice
                  </option>
                  <option value="dictation">Dictation</option>
                  <option value="sentence_ordering">
                    Sắp xếp câu
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Câu hỏi
                </label>
                <input
                  value={itemForm.question}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      question: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-700">
                  Transcript (JP)
                </label>
                <textarea
                  value={itemForm.transcript_jp}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      transcript_jp: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm w-full"
                  rows={2}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-700">
                  Giải thích / dịch Việt
                </label>
                <textarea
                  value={itemForm.explain_viet}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      explain_viet: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm w-full"
                  rows={2}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-700">
                  Đáp án lựa chọn (mỗi dòng một đáp án)
                </label>
                <textarea
                  value={itemForm.optionsText}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      optionsText: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm w-full"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Chỉ số đáp án đúng (0-based)
                </label>
                <input
                  value={itemForm.correct_index}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      correct_index: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                  placeholder="Ví dụ: 0, 1, 2..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Từ/cụm từ cho sắp xếp câu
                </label>
                <input
                  value={itemForm.wordsText}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      wordsText: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                  placeholder="Tách bằng dấu cách"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-700">
                  Audio (upload)
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  disabled={audioUploadBusy}
                  onChange={(e) =>
                    uploadListeningAudioFile(e.target.files?.[0])
                  }
                  className="w-full text-sm"
                />
                {itemForm.audio_url && (
                  <div className="text-xs text-gray-500">
                    Đã có audio: {itemForm.audio_url}
                  </div>
                )}
                {audioUploadBusy && (
                  <div className="text-xs text-gray-500">
                    Đang upload...
                  </div>
                )}
                {audioUploadError && (
                  <div className="text-xs text-red-600">
                    {audioUploadError}
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-md text-white text-sm"
                  style={{ background: "#77BEF0" }}
                >
                  {saving ? "Đang lưu..." : "Lưu câu hỏi"}
                </button>
                {editingItem && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md border text-sm"
                    onClick={() => setEditingItem(null)}
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {(editingSet || createSetOpen) && (
        <UpdateModal
          title={editingSet ? "Sửa bộ bài" : "Thêm bộ bài mới"}
          busy={saving}
          onClose={() => {
            if (editingSet) setEditingSet(null);
            else setCreateSetOpen(false);
          }}
        >
          <form onSubmit={submitSetForm}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Tên bộ</label>
                <input
                  value={setForm.title}
                  onChange={(e) =>
                    setSetForm((f) => ({
                      ...f,
                      title: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Cấp độ JLPT</label>
                <select
                  value={setForm.jlpt_level}
                  onChange={(e) =>
                    setSetForm((f) => ({
                      ...f,
                      jlpt_level: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                >
                  <option value="">Chọn level</option>
                  {levels.map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-700">Mô tả</label>
                <textarea
                  value={setForm.description}
                  onChange={(e) =>
                    setSetForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <input
                  id="is_published"
                  type="checkbox"
                  checked={setForm.is_published}
                  onChange={(e) =>
                    setSetForm((f) => ({
                      ...f,
                      is_published: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="is_published" className="text-sm text-gray-700">
                  Đã xuất bản
                </label>
              </div>
              <div className="md:col-span-2 flex gap-3 mt-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-all duration-150 text-sm"
                  onClick={() => {
                    if (editingSet) setEditingSet(null);
                    else setCreateSetOpen(false);
                  }}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-md text-white text-sm"
                  style={{ background: "#77BEF0" }}
                >
                  {saving ? "Đang lưu..." : "Lưu bộ bài"}
                </button>
              </div>
            </div>
          </form>
        </UpdateModal>
      )}

      {(editingItem || createItemOpen) && (
        <UpdateModal
          title={
            editingItem
              ? "Sửa câu hỏi"
              : "Thêm câu hỏi mới cho set " + selectedSetId
          }
          busy={saving}
          onClose={() => {
            if (editingItem) setEditingItem(null);
            else setCreateItemOpen(false);
          }}
        >
          <form onSubmit={submitItemForm}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Loại bài</label>
                <select
                  value={itemForm.exercise_type}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      exercise_type: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="dictation">Dictation</option>
                  <option value="sentence_ordering">Sắp xếp câu</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Câu hỏi</label>
                <input
                  value={itemForm.question}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      question: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-700">
                  Transcript (JP)
                </label>
                <textarea
                  value={itemForm.transcript_jp}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      transcript_jp: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={2}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-700">
                  Giải thích / dịch Việt
                </label>
                <textarea
                  value={itemForm.explain_viet}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      explain_viet: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={2}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-700">
                  Đáp án lựa chọn (mỗi dòng một đáp án)
                </label>
                <textarea
                  value={itemForm.optionsText}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      optionsText: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Chỉ số đáp án đúng (0-based)
                </label>
                <input
                  value={itemForm.correct_index}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      correct_index: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Ví dụ: 0, 1, 2..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Từ/cụm từ cho sắp xếp câu
                </label>
                <input
                  value={itemForm.wordsText}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      wordsText: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Tách bằng dấu cách"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-700">
                  Audio (upload)
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  disabled={audioUploadBusy}
                  onChange={(e) =>
                    uploadListeningAudioFile(e.target.files?.[0])
                  }
                  className="w-full text-sm"
                />
                {itemForm.audio_url && (
                  <div className="text-xs text-gray-500">
                    Đã có audio: {itemForm.audio_url}
                  </div>
                )}
                {audioUploadBusy && (
                  <div className="text-xs text-gray-500">
                    Đang upload...
                  </div>
                )}
                {audioUploadError && (
                  <div className="text-xs text-red-600">
                    {audioUploadError}
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex gap-3 mt-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-all duration-150 text-sm"
                  onClick={() => {
                    if (editingItem) setEditingItem(null);
                    else setCreateItemOpen(false);
                  }}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-md text-white text-sm"
                  style={{ background: "#77BEF0" }}
                >
                  {saving ? "Đang lưu..." : "Lưu câu hỏi"}
                </button>
              </div>
            </div>
          </form>
        </UpdateModal>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          kind={deleteTarget.kind}
          onCancel={closeDeleteModal}
          onConfirm={confirmDelete}
          busy={deleteBusy}
        />
      )}
    </AdminLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-3 text-xl font-semibold text-gray-800">
        {value}
      </div>
    </div>
  );
}

function DeleteConfirmModal({ kind, onCancel, onConfirm, busy }) {
  const title = kind === "set" ? "Xóa bộ bài" : "Xóa câu hỏi";
  const description =
    kind === "set"
      ? "Thao tác này sẽ xóa toàn bộ câu hỏi trong bộ."
      : "Thao tác này sẽ xóa câu hỏi khỏi bộ.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-5">
        <div className="font-semibold text-gray-900 mb-2">{title}</div>
        <div className="text-sm text-gray-600 mb-4">{description}</div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-all duration-150 text-sm"
            onClick={onCancel}
            disabled={busy}
          >
            Hủy
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-md text-white text-sm"
            style={{ background: "#EF4444" }}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Đang xóa..." : "Xác nhận xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UpdateModal({ title, busy, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-gray-900">{title}</div>
          <button
            type="button"
            className="px-2 py-1 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

