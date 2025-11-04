import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import DiaryCard from "../components/DiaryCard";

export default function Diary() {
  const navigate = useNavigate();

  const [diaries] = useState([
    { id: "1", title: "Title 1", cover: "" },
    { id: "2", title: "Title 2", cover: "" },
    { id: "3", title: "Title 3", cover: "" },
    { id: "4", title: "Title 4", cover: "" },
    { id: "5", title: "Title 5", cover: "" },
  ]);

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const handleOpenDiary = (id) => {
    navigate(`/diary/${id}`);
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-14">
        <Header />

        <main className="p-6">
          {/* controls: + , month, year */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate("/diary/new")}
              className="flex items-center justify-center w-10 h-10 bg-[#77BEF0] hover:bg-[#4aa6e0] text-white rounded-full text-2xl"
              title="Viết nhật ký mới"
            >
              +
            </button>

            <div className="flex items-center gap-3">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-4 py-2 rounded-full bg-[#77BEF0] text-white focus:outline-none"
              >
                <option value="">Month</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="px-4 py-2 rounded-full bg-[#77BEF0] text-white focus:outline-none"
              >
                <option value="">Year</option>
                {[2023, 2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid of diary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {diaries.map((d) => (
              <DiaryCard
                key={d.id}
                id={d.id}
                title={d.title}
                cover={d.cover}
                onClick={handleOpenDiary}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
