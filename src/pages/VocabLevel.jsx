import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import VocabCard from "../components/VocabCard";
import { api } from "../lib/api";

export default function VocabLevel() {
  const { level } = useParams();
  const [vocabList, setVocabList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVocab() {
      try {
        setLoading(true);
        setError("");
        console.log(level);
        console.log(`/api/vocab?level=${level}`);
        const data = await api(`/api/vocab?level=${level}`);
        // BE trả: { items: [...] }
        console.log(data);
        setVocabList(data.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchVocab();
  }, [level]);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Header />

        <main className="p-6">
          <h1 className="text-2xl font-bold text-[#4aa6e0] mb-6">
            Từ vựng JLPT {level}
          </h1>

          {loading && <p>Đang tải từ vựng...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {!loading && !error && (
            <div className="grid grid-cols-3 gap-6">
              {vocabList.map((item) => (
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
        </main>
      </div>
    </div>
  );
}
