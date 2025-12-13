import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import DiaryCard from "../components/DiaryCard";
import { api } from "../lib/api";

export default function Diary() {
  const navigate = useNavigate();

  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 🔔 message hiển thị inline (thay cho alert)
  const [message, setMessage] = useState(null);

  const fetchDiaries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (month) params.append("month", month);
      if (year) params.append("year", year);

      const queryString = params.toString();
      const url = queryString ? `/api/diaries?${queryString}` : "/api/diaries";
      const data = await api(url);
      setDiaries(data);
    } catch (error) {
      console.error("Error fetching diaries:", error);
      setDiaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiaries();
  }, [month, year]);

  // 🔔 auto hide message
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(t);
  }, [message]);

  const handleOpenDiary = (id) => {
    if (selectionMode) {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.has(id) ? newSet.delete(id) : newSet.add(id);
        return newSet;
      });
    } else {
      navigate(`/diary/${id}`);
    }
  };

  const handleToggleSelection = (id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  // ================= DELETE LOGIC (FIXED) =================
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    setDeleting(true);
    setShowDeleteConfirm(false); // 🔴 đóng modal trước

    try {
      const token = localStorage.getItem("token");
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`${BASE_URL}/api/diaries/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter(
        (r) => r.status === "rejected" || !r.value.ok
      );

      if (failed.length > 0) {
        setMessage({
          type: "warning",
          text: `Đã xóa ${
            selectedIds.size - failed.length
          }/${selectedIds.size} nhật ký.`,
        });
      } else {
        setMessage({
          type: "success",
          text: "Xóa nhật ký thành công.",
        });
      }

      await fetchDiaries();
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Error deleting diaries:", error);
      setMessage({
        type: "error",
        text: "Có lỗi xảy ra khi xóa nhật ký.",
      });
    } finally {
      setDeleting(false);
    }
  };
  // =======================================================

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-14">
        <Header />

        <main className="p-6">
          {/* 🔔 MESSAGE INLINE */}
          {message && (
            <div
              className={`mb-6 rounded-lg px-4 py-3 text-sm border
                ${
                  message.type === "success" &&
                  "bg-green-50 text-green-700 border-green-200"
                }
                ${
                  message.type === "warning" &&
                  "bg-yellow-50 text-yellow-700 border-yellow-200"
                }
                ${
                  message.type === "error" &&
                  "bg-red-50 text-red-700 border-red-200"
                }
              `}
            >
              {message.text}
            </div>
          )}

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={selectionMode}
                className="px-4 py-2 rounded-lg bg-[#77BEF0] text-white"
              >
                <option value="">Tất cả tháng</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("vi-VN", { month: "long" })}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={selectionMode}
                className="px-4 py-2 rounded-lg bg-[#77BEF0] text-white"
              >
                <option value="">Tất cả năm</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              {selectionMode && selectedIds.size > 0 && (
                <span className="text-sm text-gray-600">
                  Đã chọn: {selectedIds.size}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {selectionMode ? (
                <>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={selectedIds.size === 0 || deleting}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg"
                  >
                    Xóa ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="w-12 h-12 bg-red-500 text-white rounded-full"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => navigate("/diary/new")}
                    className="w-12 h-12 bg-[#77BEF0] text-white rounded-full text-2xl"
                  >
                    +
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Diary list */}
          {loading ? (
            <div className="text-center py-20 text-gray-400">Đang tải...</div>
          ) : diaries.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              Chưa có nhật ký nào
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {diaries.map((d) => (
                <DiaryCard
                  key={d.id}
                  id={d.id}
                  title={d.title}
                  images={d.images || []}
                  created_at={d.created_at}
                  onClick={handleOpenDiary}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(d.id)}
                  onToggleSelection={handleToggleSelection}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* DELETE CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Xác nhận xóa</h3>
            <p className="mb-6">
              Bạn có chắc chắn muốn xóa {selectedIds.size} nhật ký không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg"
              >
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
