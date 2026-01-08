import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import DiaryCard from "../components/DiaryCard";
import { api } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/translations";

export default function Diary() {
  const navigate = useNavigate();
  const { language } = useLanguage();

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
          text: t("diary.deleteWarning", language, {
            deleted: selectedIds.size - failed.length,
            total: selectedIds.size,
          }),
        });
      } else {
        setMessage({
          type: "success",
          text: t("diary.deleteSuccess", language),
        });
      }

      await fetchDiaries();
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Error deleting diaries:", error);
      setMessage({
        type: "error",
        text: t("diary.deleteError", language),
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
                <option value="">{t("diary.allMonths", language)}</option>
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
                <option value="">{t("diary.allYears", language)}</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              {selectionMode && selectedIds.size > 0 && (
                <span className="text-sm text-gray-600">
                  {t("diary.selected", language, { count: selectedIds.size })}
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
                    {t("diary.delete", language, { count: selectedIds.size })}
                  </button>
                  <button
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                  >
                    {t("diary.cancel", language)}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="w-12 h-12 bg-red-500 text-white rounded-full"
                  >
                    {t("diary.deleteButton", language)}
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
            <div className="text-center py-20 text-gray-400">{t("diary.loading", language)}</div>
          ) : diaries.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              {t("diary.noDiaries", language)}
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
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border-2 border-gray-200">
          <h3 className="text-xl font-bold mb-4">{t("diary.deleteConfirmTitle", language)}</h3>
          <p className="mb-6">
            {t("diary.deleteConfirmMessage", language, { count: selectedIds.size })}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              {t("diary.cancel", language)}
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg"
            >
              {deleting ? t("diary.deleting", language) : t("diary.deleteButton", language)}
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
