import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function AdminSpeaking() {
  const [level, setLevel] = useState("");
  const [topic, setTopic] = useState("");
  const [phrases, setPhrases] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id: number }
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    jp: "",
    romaji: "",
    vi: "",
    topic: "",
    jlpt_level: "",
    is_published: true,
  });

  const levels = ["N5", "N4", "N3", "N2", "N1"];

  async function loadOverview(currentLevel, currentTopic) {
    try {
      const params = new URLSearchParams();
      if (currentLevel) params.set("level", currentLevel);
      if (currentTopic) params.set("topic", currentTopic);
      const query = params.toString();
      const res = await api(
        `/api/speaking/admin/stats/overview${
          query ? `?${query}` : ""
        }`
      );
      setOverview(res);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadPhrases(currentLevel, currentTopic) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (currentLevel) params.set("level", currentLevel);
      if (currentTopic) params.set("topic", currentTopic);
      const query = params.toString();
      const res = await api(
        `/api/speaking/admin/phrases${query ? `?${query}` : ""}`
      );
      setPhrases(res.items || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Không tải được danh sách câu nói");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview(level, topic);
    loadPhrases(level, topic);
  }, [level, topic]);

  function openCreate() {
    setEditing(null);
    setForm({
      jp: "",
      romaji: "",
      vi: "",
      topic: topic || "",
      jlpt_level: level || "",
      is_published: true,
    });
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      jp: p.jp || "",
      romaji: p.romaji || "",
      vi: p.vi || "",
      topic: p.topic || "",
      jlpt_level: p.jlpt_level || "",
      is_published: p.is_published !== false,
    });
  }

  async function submitForm(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        jp: form.jp,
        romaji: form.romaji,
        vi: form.vi,
        topic: form.topic,
        jlpt_level: form.jlpt_level,
        is_published: form.is_published,
      };
      if (editing) {
        await api(
          `/api/speaking/admin/phrases/${editing.phrase_id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await api("/api/speaking/admin/phrases", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setEditing(null);
      await loadOverview(level, topic);
      await loadPhrases(level, topic);
    } catch (err) {
      console.error(err);
      setError(err.message || "Lưu câu mẫu thất bại");
    } finally {
      setSaving(false);
    }
  }

  function askDeletePhrase(p) {
    setDeleteTarget({ id: p.phrase_id });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      setDeleteBusy(true);
      await api(`/api/speaking/admin/phrases/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (editing?.phrase_id === deleteTarget.id) setEditing(null);
      await loadOverview(level, topic);
      await loadPhrases(level, topic);
    } catch (err) {
      console.error(err);
      setError(err.message || "Xóa câu mẫu thất bại");
    } finally {
      setDeleteBusy(false);
      setDeleteTarget(null);
    }
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
  }

  return (
    <AdminLayout title="Quản lý luyện nói">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Chủ đề:</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
              placeholder="Nhập chủ đề (tùy chọn)"
            />
          </div>
        </div>

        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Số câu mẫu"
              value={overview.totalPhrases}
            />
            <StatCard
              label="Tổng lượt luyện"
              value={overview.totalAttempts}
            />
            <StatCard
              label="Điểm TB"
              value={`${overview.averageScore || 0}`}
            />
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-800">
            Danh sách câu luyện nói
          </h2>
          <button
            type="button"
            onClick={openCreate}
            className="px-3 py-1.5 text-xs rounded-md text-white"
            style={{ background: "#77BEF0" }}
          >
            Thêm câu mẫu
          </button>
        </div>

        <div className="rounded-lg shadow-sm bg-white p-2 overflow-x-auto">
          <table className="min-w-[1100px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left">Câu JP</th>
                  <th className="px-3 py-3 text-left">Romaji</th>
                  <th className="px-3 py-3 text-left">Nghĩa Việt</th>
                  <th className="px-3 py-3 text-left">Chủ đề</th>
                  <th className="px-3 py-3 text-left">Level</th>
                  <th className="px-3 py-3 text-center">Audio</th>
                  <th className="px-3 py-3 text-center">Lượt</th>
                  <th className="px-3 py-3 text-center">Điểm TB</th>
                  <th className="px-3 py-3 text-center">Hành động</th>
                </tr>
              </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-4 text-center text-gray-500"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : phrases.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-4 text-center text-gray-500"
                  >
                    Chưa có câu mẫu nào
                  </td>
                </tr>
              ) : (
                phrases.map((p) => (
                  <tr key={p.phrase_id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="line-clamp-2">
                        {p.jp}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {p.romaji}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {p.vi}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {p.topic}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {p.jlpt_level}
                    </td>
                    <td className="px-3 py-3 text-center text-xs">
                      {p.audio_url ? "Có" : "Không"}
                    </td>
                    <td className="px-3 py-3 text-center text-xs">
                      {p.attempts}
                    </td>
                    <td className="px-3 py-3 text-center text-xs">
                      {p.averageScore}
                    </td>
                    <td className="px-3 py-3 text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="Sửa"
                          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                          onClick={() => openEdit(p)}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Xóa"
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                          onClick={() => askDeletePhrase(p)}
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
        {/* Form tạo (create only) */}
        {!editing && (form.jp || form.vi) && (
          <div className="mt-8 pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">
              {editing
                ? "Sửa câu luyện nói"
                : "Thêm câu luyện nói mới"}
            </h3>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={submitForm}
            >
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-700">
                  Câu JP
                </label>
                <textarea
                  value={form.jp}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      jp: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm w-full"
                  rows={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Romaji
                </label>
                <input
                  value={form.romaji}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      romaji: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Nghĩa Việt
                </label>
                <input
                  value={form.vi}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      vi: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Chủ đề
                </label>
                <input
                  value={form.topic}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      topic: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Cấp độ JLPT
                </label>
                <select
                  value={form.jlpt_level}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      jlpt_level: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">Không đặt</option>
                  {levels.map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="speaking_published"
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      is_published: e.target.checked,
                    }))
                  }
                />
                <label
                  htmlFor="speaking_published"
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
                  {saving ? "Đang lưu..." : "Lưu câu mẫu"}
                </button>
                {editing && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md border text-sm"
                    onClick={() => setEditing(null)}
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {editing && (
        <UpdateModal
          title="Sửa câu luyện nói"
          busy={saving}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={submitForm}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-700">Câu JP</label>
                <textarea
                  value={form.jp}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      jp: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Romaji</label>
                <input
                  value={form.romaji}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      romaji: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Nghĩa Việt</label>
                <input
                  value={form.vi}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      vi: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Chủ đề</label>
                <input
                  value={form.topic}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      topic: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Cấp độ JLPT</label>
                <select
                  value={form.jlpt_level}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      jlpt_level: e.target.value,
                    }))
                  }
                  className="px-3 py-2 shadow-sm rounded-md text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Không đặt</option>
                  {levels.map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <input
                  id="speaking_published_modal"
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      is_published: e.target.checked,
                    }))
                  }
                />
                <label
                  htmlFor="speaking_published_modal"
                  className="text-sm text-gray-700"
                >
                  Đã xuất bản
                </label>
              </div>
              <div className="md:col-span-2 flex gap-3 mt-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-all duration-150 text-sm"
                  onClick={() => setEditing(null)}
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
                  {saving ? "Đang lưu..." : "Lưu câu mẫu"}
                </button>
              </div>
            </div>
          </form>
        </UpdateModal>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Xóa câu luyện nói"
          description="Thao tác này sẽ xóa câu khỏi hệ thống."
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

function DeleteConfirmModal({
  title,
  description,
  onCancel,
  onConfirm,
  busy,
}) {
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

