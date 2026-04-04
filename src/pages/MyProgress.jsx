import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { FaChartLine } from "react-icons/fa";
import { api } from "../lib/api";

const TABS = [
  { id: "reading", label: "Luyện đọc" },
  { id: "listening", label: "Luyện nghe" },
  { id: "speaking", label: "Luyện nói" },
];

function StatCard({ title, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8F4FD] shadow-sm p-4">
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
        <StatCard title="Bài đã làm" value={data.distinctItems} sub="số bài khác nhau" />
        <StatCard title="Tỷ lệ đúng (theo lượt)" value={acc} />
      </div>
      <div className="bg-white rounded-xl border border-[#E8F4FD] shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8F4FD] font-medium text-gray-800">
          Lịch sử gần đây — {skillLabel}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F6FBFF] text-gray-600">
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
                    Chưa có hoạt động. Hãy luyện tập để ghi nhận tiến độ.
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
      <div className="bg-white rounded-xl border border-[#E8F4FD] shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8F4FD] font-medium text-gray-800">
          Lịch sử gần đây — Luyện nói
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F6FBFF] text-gray-600">
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
                    Chưa có bản ghi. Hãy luyện nói để xem tiến độ tại đây.
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
                    <td className="px-4 py-2 font-medium text-[#4aa6e0]">
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

export default function MyProgress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("reading");

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setError("unauthorized");
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api("/api/progress/me");
      setData(res);
    } catch (e) {
      const m = String(e?.message || "");
      if (
        m.includes("401") ||
        m.includes("Thiếu token") ||
        m.includes("Token không hợp lệ")
      ) {
        setError("unauthorized");
      } else {
        setError(e?.message || "Không tải được dữ liệu");
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <FaChartLine className="text-3xl text-[#4aa6e0]" />
            <h1 className="text-2xl font-bold text-[#4aa6e0]">Tiến độ học tập</h1>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Theo dõi luyện đọc, luyện nghe và luyện nói của bạn.
          </p>

          {error === "unauthorized" && (
            <div className="p-6 rounded-xl bg-[#F6FBFF] border border-[#E8F4FD] text-center">
              <p className="text-gray-700 mb-4">
                Đăng nhập để xem tiến độ và lịch sử luyện tập.
              </p>
              <Link
                to="/signin"
                className="inline-block px-6 py-2.5 rounded-lg text-white font-medium bg-[#4aa6e0] hover:bg-[#3a8bc0]"
              >
                Đăng nhập
              </Link>
            </div>
          )}

          {error && error !== "unauthorized" && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 text-sm border border-red-100">
              {error}
              <button
                type="button"
                onClick={load}
                className="ml-3 underline text-red-900"
              >
                Thử lại
              </button>
            </div>
          )}

          {loading && !error && (
            <p className="text-gray-600">Đang tải tiến độ...</p>
          )}

          {!loading && data && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="text-sm text-gray-600">
                  Xin chào,{" "}
                  <span className="font-semibold text-gray-900">
                    {data.user?.display_name || "bạn"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={load}
                  className="text-sm px-4 py-2 rounded-lg border border-[#4aa6e0]/40 text-[#0F6DB0] hover:bg-[#F6FBFF]"
                >
                  Làm mới
                </button>
              </div>

              <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border border-b-0 transition ${
                      tab === t.id
                        ? "bg-white text-[#4aa6e0] border-gray-200 -mb-px"
                        : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

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
          )}
        </main>
      </div>
    </div>
  );
}
