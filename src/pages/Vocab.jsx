// src/pages/Vocab.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import LevelCard from "../components/LevelCard";
import TopicCard from "../components/TopicCard";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/translations";

const API_BASE = "http://localhost:4000";

export default function Vocab() {
  const levels = ["N5", "N4", "N3", "N2", "N1"];
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [selectedTopic, setSelectedTopic] = useState("");

  const navigate = useNavigate();
  const { language } = useLanguage();

  // load topics theo cấp độ
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoadingTopics(true);
        const res = await axios.get(`${API_BASE}/api/topics`);
        setTopics(res.data);
      } catch (err) {
        console.error("Fetch topics error:", err.response?.data || err.message);
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchTopics();
  }, []);

  const handleOpenTopic = (topicId) => {
    navigate(`/vocab/topic/${topicId}`);
  };

  const handleStartMatching = () => {
    const params = new URLSearchParams({ level: selectedLevel });
    if (selectedTopic) params.append("topic", selectedTopic);
    navigate(`/vocab/practice/matching?${params.toString()}`);
  };

  const handleStartTest = () => {
    const params = new URLSearchParams({ level: selectedLevel });
    if (selectedTopic) params.append("topic", selectedTopic);
    navigate(`/vocab/practice/test?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          {/* ===== LUYỆN TẬP TỪ VỰNG ===== */}
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-[#4aa6e0]">
              {t("vocab.title", language)}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10">
            {/* Matching Cards Card */}
            <div className="rounded-2xl border-2 border-[#4aa6e0] bg-white p-6 shadow-lg hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-bold text-[#4aa6e0] mb-4">
                {t("vocab.matchingCards", language)}
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                {t("vocab.matchingDescription", language)}
              </p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t("vocab.level", language)}
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4aa6e0]"
                  >
                    {levels.map((lv) => (
                      <option key={lv} value={lv}>
                        {lv}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Chủ đề (tùy chọn)
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4aa6e0]"
                  >
                    <option value="">Tất cả chủ đề</option>
                    {topics
                      .filter((topic) => topic._count?.vocabitems > 0)
                      .map((topic) => (
                        <option key={topic.topic_id} value={topic.topic_id}>
                          {topic.topic_name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleStartMatching}
                className="w-full rounded-lg bg-[#4aa6e0] hover:bg-[#3a8bc0] text-white px-4 py-3 font-semibold transition-colors"
              >
                {t("vocab.startPractice", language)}
              </button>
            </div>

            {/* Random Test Card */}
            <div className="rounded-2xl border-2 border-[#4aa6e0] bg-white p-6 shadow-lg hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-bold text-[#4aa6e0] mb-4">
                {t("vocab.randomTest", language)}
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                {t("vocab.randomTestDescription", language)}
              </p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t("vocab.level", language)}
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4aa6e0]"
                  >
                    {levels.map((lv) => (
                      <option key={lv} value={lv}>
                        {lv}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t("vocab.topic", language)}
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4aa6e0]"
                  >
                    <option value="">{t("vocab.allTopics", language)}</option>
                    {topics
                      .filter((topic) => topic._count?.vocabitems > 0)
                      .map((topic) => (
                        <option key={topic.topic_id} value={topic.topic_id}>
                          {topic.topic_name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleStartTest}
                className="w-full rounded-lg bg-[#4aa6e0] hover:bg-[#3a8bc0] text-white px-4 py-3 font-semibold transition-colors"
              >
                {t("vocab.startTest", language)}
              </button>
            </div>
          </div>

          {/* ===== TỪ VỰNG THEO CẤP ĐỘ ===== */}
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-2xl font-bold text-[#4aa6e0]">
              {t("vocab.jlpt", language)}
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
              {t("vocab.vocabByTopic", language)}
            </h1>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 min-h-[220px]">
            {loadingTopics ? (
              <p className="text-sm text-slate-500">{t("vocab.loadingTopics", language)}</p>
            ) : topics.length === 0 ? (
              <p className="text-sm text-slate-500">{t("vocab.noTopics", language)}</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {topics
                  .filter((topic) => topic._count?.vocabitems > 0)
                  .map((topic) => (
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
