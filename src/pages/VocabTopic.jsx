// src/pages/VocabTopic.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import VocabCard from "../components/VocabCard";
import CreateFlashcardFromVocab from "../components/CreateFlashcardFromVocab";

const API_BASE = "http://localhost:4000";

export default function VocabTopic() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [vocab, setVocab] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const levels = ["N5", "N4", "N3", "N2", "N1"];

  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/topics/${topicId}/vocab`, {
          params: { level: selectedLevel }
        });
        setTopic(res.data.topic);
        setVocab(res.data.vocab || []);
      } catch (err) {
        console.error("Fetch topic vocab error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopicData();
  }, [topicId, selectedLevel]);


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

              {topic && topic.topic_description && (
                <p className="mt-1 text-sm text-slate-500">
                  {topic.topic_description}
                </p>
              )}
            </div>

            <button
              onClick={() => setShowFlashcardModal(true)}
              className="rounded-full bg-[#77BEF0] hover:bg-[#4aa6e0] text-white px-5 py-2 text-sm font-semibold shadow-sm"
            >
              Học cùng flashcard
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-slate-500">Cấp độ:</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#77BEF0]"
            >
              {levels.map((lv) => (
                <option
                  data-level={lv}
                  className={"hover:ring-[#77BEF0] option-level-" + lv}
                  key={lv}
                  value={lv}
                >
                  {lv}
                </option>
              ))}
            </select>
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

      <CreateFlashcardFromVocab
        isOpen={showFlashcardModal}
        onClose={() => setShowFlashcardModal(false)}
        onSuccess={() => {
          setShowFlashcardModal(false);
          navigate("/flashcard");
        }}
        sourceType="topic"
        sourceId={topicId}
        vocabList={vocab}
      />
    </div>
  );
}
