import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { api } from "../lib/api";

export default function GrammarLevel() {
  const { level } = useParams();
  const [grammarList, setGrammarList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchGrammar() {
      try {
        setLoading(true);
        setError("");
        const data = await api(`/api/grammar?level=${level}`);
        // BE trả: { items: [...] }
        setGrammarList(data.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchGrammar();
  }, [level]);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-14">
        <Header />
        <main className="p-6">
          <h2 className="mb-6 text-3xl font-bold">{level}</h2>

          {loading && <p>Đang tải ngữ pháp...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {!loading && !error && (
            <div className="flex flex-col gap-3">
              {grammarList.map((item) => (
                <Link
                  to={`/grammar/${level}/${item.grammar_id}`}
                  key={item.grammar_id}
                  className="flex items-center justify-between px-4 py-3 font-semibold text-white transition-transform rounded-md bg-sky-400 hover:scale-105"
                >
                  <span>{item.grammar_structure}</span>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
