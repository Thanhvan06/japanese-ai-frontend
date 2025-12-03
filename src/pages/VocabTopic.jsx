// src/pages/VocabTopic.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import VocabCard from "../components/VocabCard";

const API_BASE = "http://localhost:4000";

export default function VocabTopic() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [vocab, setVocab] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/topics/${topicId}/vocab`);
        setTopic(res.data.topic);
        setVocab(res.data.vocab || []);
      } catch (err) {
        console.error("Fetch topic vocab error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopicData();
  }, [topicId]);

  const handleFlashcard = () => {
    navigate(`/flashcard?topicId=${topicId}`);
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ← Quay lại
              </button>

              <h1 className="mt-2 text-2xl font-bold text-slate-800">
                {topic ? topic.topic_name : "Chủ đề từ vựng"}
              </h1>

              {topic && (
                <p className="mt-1 text-sm text-slate-500">
                  Cấp độ: {topic.jlpt_level}
                </p>
              )}
            </div>

            <button
              onClick={handleFlashcard}
              className="rounded-full bg-[#77BEF0] hover:bg-[#4aa6e0] text-white px-5 py-2 text-sm font-semibold shadow-sm"
            >
              Học với Flashcard
            </button>
          </div>

          <div className="p-6 bg-white border rounded-2xl border-slate-200">
            {loading ? (
              <p className="text-sm text-slate-500">Đang tải từ vựng...</p>
            ) : vocab.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có từ vựng nào trong chủ đề này.</p>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {vocab.map((item) => (
                  <VocabCard
                    key={item.vocab_id}
                    word={
                      item.furigana
                        ? `${item.word} (${item.furigana})`
                        : item.word
                    }
                    meaning={item.meaning}
                    image={item.image_url}
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
