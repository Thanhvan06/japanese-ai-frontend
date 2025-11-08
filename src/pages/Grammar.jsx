import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import LevelCard from "../components/LevelCard";

export default function Grammar() {
  const levels = ["N5", "N4", "N3", "N2", "N1"];

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-14">
        <Header />
        <main className="p-6">
          <h2 className="text-2xl font-bold mb-4">Ngữ pháp</h2>
          <div className="grid grid-cols-5 gap-6">
            {levels.map((level) => (
              <LevelCard key={level} level={level} type="grammar" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
