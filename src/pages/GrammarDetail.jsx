import { useParams } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function GrammarDetail() {
  const { level, grammarId } = useParams();

  const grammar = {
    title: "によって",
    meaning: "Diễn tả sự khác biệt tùy theo chủ thể, hoàn cảnh",
    example: "人によって意見が違う。",
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-14">
        <Header />
        <main className="p-10">
          <h2 className="text-4xl font-bold mb-6">{grammar.title}</h2>
          <p className="font-semibold mb-2">Ý nghĩa:</p>
          <p className="mb-4">{grammar.meaning}</p>
          <p className="font-semibold mb-2">Ví dụ:</p>
          <p>{grammar.example}</p>
        </main>
      </div>
    </div>
  );
}
