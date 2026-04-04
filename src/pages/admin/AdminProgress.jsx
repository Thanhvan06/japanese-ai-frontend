import { useEffect, useState, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";

const TABS = [
  { id: "reading", label: "Luyện đọc" },
  { id: "listening", label: "Luyện nghe" },
  { id: "speaking", label: "Luyện nói" },
];

function StatCard({ title, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{title}</div>
      <div className="text-2xl font-semibold text-gray-900 mt-1">{value}</div>
      {sub != null && sub !== "" && (
        <div className="text-sm text-gray-600 mt-1">{sub}</div>
      )}
    </div>
  );
}

function formatDt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function ReadingListeningPanel({ data, skillLabel }) {
  if (!data) return null;
  const acc =
    data.accuracyPercent != null ? `${data.accuracyPercent}%` : "—";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Tổng lượt làm" value={data.totalAttempts} />
        <StatCard title="Đúng / Sai" value={`${data.correctAttempts} / ${data.wrongAttempts}`} />
        <StatCard title="Bài đã chạm" value={data.distinctItems} sub="số item khác nhau" />
        <StatCard title="Tỷ lệ đúng (theo lượt)" value={acc} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-800">
          Lịch sử gần đây — {skillLabel}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Thời gian</th>
                <th className="text-left px-4 py-2 font-medium">Cấp độ</th>
                <th className="text-left px-4 py-2 font-medium">Bộ / loại</th>
                <th className="text-left px-4 py-2 font-medium">Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Chưa có dữ liệu
                  </td>
                </tr>
              ) : (
                data.recent.map((row) => (
                  <tr key={row.attempt_id} className="border-t border-gray-100">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatDt(row.created_at)}
                    </td>
                    <td className="px-4 py-2">{row.jlpt_level ?? "—"}</td>
                    <td className="px-4 py-2 max-w-xs truncate" title={row.set_title || ""}>
                      {row.exercise_type ? `${row.exercise_type}` : "—"}
                      {row.set_title ? ` · ${row.set_title}` : ""}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          row.is_correct
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {row.is_correct ? "Đúng" : "Sai"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SpeakingPanel({ data }) {
  if (!data) return null;
  const avg =
    data.avgAccuracy != null ? `${data.avgAccuracy}%` : "—";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Tổng lượt luyện" value={data.totalAttempts} />
        <StatCard title="Điểm TB (accuracy)" value={avg} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-800">
          Lịch sử gần đây — Luyện nói
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Thời gian</th>
                <th className="text-left px-4 py-2 font-medium">Cấp độ</th>
                <th className="text-left px-4 py-2 font-medium">Chủ đề</th>
                <th className="text-left px-4 py-2 font-medium">Câu</th>
                <th className="text-left px-4 py-2 font-medium">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Chưa có dữ liệu
                  </td>
                </tr>
              ) : (
                data.recent.map((row) => (
                  <tr key={row.attempt_id} className="border-t border-gray-100">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatDt(row.created_at)}
                    </td>
                    <td className="px-4 py-2">{row.jlpt_level ?? "—"}</td>
                    <td className="px-4 py-2">{row.topic ?? "—"}</td>
                    <td className="px-4 py-2 max-w-md truncate" title={row.phrase_jp || ""}>
                      {row.phrase_jp ?? "—"}
                    </td>
                    <td className="px-4 py-2 font-medium text-[#0F6DB0]">
                      {row.accuracy_score != null
                        ? `${Math.round(row.accuracy_score)}%`
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminProgress() {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [data, setData] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("reading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api("/api/admin/users?limit=200");
        if (cancelled) return;
        setUsers(res.users || []);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Không tải được danh sách người dùng");
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadProgress = useCallback(async () => {
    if (!userId) {
      setError("Vui lòng chọn người dùng");
      return;
    }
    setLoadingProgress(true);
    setError(null);
    try {
      const res = await api(`/api/admin/progress/user/${userId}`);
      setData(res);
    } catch (e) {
      setData(null);
      setError(e?.message || "Không tải được tiến độ");
    } finally {
      setLoadingProgress(false);
    }
  }, [userId]);

  return (
    <AdminLayout title="Quản lý tiến độ">
      <p className="text-sm text-gray-600 mb-6">
        Xem thống kê và lịch sử luyện đọc, luyện nghe, luyện nói theo từng người
        dùng.
      </p>

      <div className="flex flex-wrap gap-4 items-end mb-8 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="min-w-[240px] flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Người dùng
          </label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 bg-white"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setData(null);
            }}
            disabled={loadingUsers}
          >
            <option value="">
              {loadingUsers ? "Đang tải…" : "— Chọn người dùng —"}
            </option>
            {users.map((u) => (
              <option key={u.user_id} value={String(u.user_id)}>
                {u.display_name} ({u.email})
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={loadProgress}
          disabled={!userId || loadingProgress}
          className="px-5 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
          style={{ background: "#77BEF0" }}
        >
          {loadingProgress ? "Đang tải…" : "Tải tiến độ"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 text-sm border border-red-100">
          {error}
        </div>
      )}

      {data && (
        <div>
          <div className="mb-2 text-sm text-gray-600">
            Đang xem:{" "}
            <span className="font-medium text-gray-900">
              {data.user.display_name}
            </span>{" "}
            <span className="text-gray-400">({data.user.email})</span>
          </div>

          <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border border-b-0 transition ${
                  tab === t.id
                    ? "bg-white text-[#0F6DB0] border-gray-200 -mb-px"
                    : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="pb-8">
            {tab === "reading" && (
              <ReadingListeningPanel data={data.reading} skillLabel="Luyện đọc" />
            )}
            {tab === "listening" && (
              <ReadingListeningPanel
                data={data.listening}
                skillLabel="Luyện nghe"
              />
            )}
            {tab === "speaking" && <SpeakingPanel data={data.speaking} />}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
