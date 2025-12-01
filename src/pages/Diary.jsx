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

  const handleOpenDiary = (id) => {
    if (selectionMode) {
      // Toggle selection instead of opening
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    } else {
      navigate(`/diary/${id}`);
    }
  };

  const handleToggleSelection = (id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

      // Delete all selected diaries
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`${BASE_URL}/api/diaries/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter((r) => r.status === "rejected" || !r.value.ok);

      if (failed.length > 0) {
        alert(`Đã xóa ${selectedIds.size - failed.length}/${selectedIds.size} nhật ký. Một số nhật ký không thể xóa.`);
      } else {
        // Refresh the list
        await fetchDiaries();
      }

      // Reset selection
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Error deleting diaries:", error);
      alert("Có lỗi xảy ra khi xóa nhật ký");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-14">
        <Header />

        <main className="p-6">
          {/* Top bar with filters and create button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={selectionMode}
                className="px-4 py-2 rounded-lg bg-[#77BEF0] text-white focus:outline-none cursor-pointer hover:bg-[#4aa6e0] transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-4 py-2 rounded-lg bg-[#77BEF0] text-white focus:outline-none cursor-pointer hover:bg-[#4aa6e0] transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2"
                  >
                    <span>🗑️</span>
                    <span>Xóa ({selectedIds.size})</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="flex items-center justify-center w-12 h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
                    title="Chọn để xóa"
                  >
                    🗑️
                  </button>
                  <button
                    onClick={() => navigate("/diary/new")}
                    className="flex items-center justify-center w-12 h-12 bg-[#77BEF0] hover:bg-[#4aa6e0] text-white rounded-full text-2xl shadow-lg hover:shadow-xl transition-all"
                    title="Viết nhật ký mới"
                  >
                    +
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Grid of diary cards */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-gray-400">Đang tải...</div>
            </div>
          ) : diaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="text-lg mb-2">Chưa có nhật ký nào</div>
              <div className="text-sm">Hãy tạo nhật ký mới để bắt đầu!</div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa {selectedIds.size} nhật ký đã chọn không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
