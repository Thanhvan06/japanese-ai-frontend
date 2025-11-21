import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { api } from "../lib/api";

export default function GrammarDetail() {
  const { grammarId } = useParams();
  const [grammar, setGrammar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);
        setError("");
        const data = await api(`/api/grammar/${grammarId}`);
        setGrammar(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [grammarId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 ml-14">
          <Header />
          <main className="p-10">
            <p>Đang tải chi tiết ngữ pháp...</p>
          </main>
        </div>
      </div>
    );
  }

  if (error || !grammar) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 ml-14">
          <Header />
          <main className="p-10">
            <p className="text-red-500">
              {error || "Không tìm thấy thông tin ngữ pháp."}
            </p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-14">
        <Header />
        <main className="p-10">
          <h2 className="mb-6 text-4xl font-bold">
            {grammar.grammar_structure}
          </h2>

          <p className="mb-2 font-semibold">Ý nghĩa:</p>
          <p className="mb-4 whitespace-pre-line">
            {grammar.explanation_viet}
          </p>

          <p className="mb-2 font-semibold">Ví dụ:</p>
          <p className="whitespace-pre-line">{grammar.example_jp}</p>
          <p className="mb-2 font-semibold">Dịch nghĩa:</p>
          <p className="whitespace-pre-line">{grammar.example_viet}</p>
        </main>
      </div>
    </div>
  );
}
