import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const dummyGrammar = [
  { id: "niyotte", title: "によって", meaning: "Tùy theo", example: "人によって意見が違う。" },
  { id: "node", title: "ので", meaning: "Vì...", example: "雨が降ったので出かけません。" },
];

export default function GrammarLevel() {
  const { level } = useParams();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-14">
        <Header />
        <main className="p-6">
          <h2 className="text-3xl font-bold mb-6">{level}</h2>
          <div className="flex flex-col gap-3">
            {dummyGrammar.map((item) => (
              <Link
                to={`/grammar/${level}/${item.id}`}
                key={item.id}
                className="bg-sky-400 text-white font-semibold px-4 py-3 rounded-md hover:scale-105 transition-transform flex justify-between items-center"
              >
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
