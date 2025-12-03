// src/pages/Vocab.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import LevelCard from "../components/LevelCard";
import TopicCard from "../components/TopicCard";

const API_BASE = "http://localhost:4000";

export default function Vocab() {
  const levels = ["N5", "N4", "N3", "N2", "N1"];
  const [topics, setTopics] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [loadingTopics, setLoadingTopics] = useState(false);

  const navigate = useNavigate();

  // load topics theo cấp độ
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoadingTopics(true);
        const res = await axios.get(`${API_BASE}/api/topics`, {
          params: { level: selectedLevel },
        });
        setTopics(res.data);
      } catch (err) {
        console.error("Fetch topics error:", err.response?.data || err.message);
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchTopics();
  }, [selectedLevel]);

  const handleOpenTopic = (topicId) => {
    navigate(`/vocab/topic/${topicId}`);
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          {/* ===== TỪ VỰNG THEO CẤP ĐỘ ===== */}
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-2xl font-bold text-[#4aa6e0]">
              Từ vựng theo cấp độ
            </h1>
          </div>

          <div className="grid grid-cols-5 gap-6 mb-10">
            {levels.map((level) => (
              <LevelCard key={level} level={level} type="vocab" />
            ))}
          </div>

          {/* =====  TỪ VỰNG THEO CHỦ ĐỀ ===== */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#4aa6e0]">
              Từ vựng theo chủ đề
            </h1>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Cấp độ:</span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#77BEF0]"
              >
                {levels.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 min-h-[220px]">
            {loadingTopics ? (
              <p className="text-sm text-slate-500">Đang tải chủ đề...</p>
            ) : topics.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có chủ đề.</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {topics.map((topic) => (
                  <TopicCard
                    key={topic.topic_id}
                    topic={topic}
                    onClick={() => handleOpenTopic(topic.topic_id)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
