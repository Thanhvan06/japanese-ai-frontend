import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import LevelCard from "../components/LevelCard";

export default function Vocab() {
  const levels = ["N5", "N4", "N3", "N2", "N1"];

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-14">
        <Header />
        <main className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <button className="flex items-center justify-center w-10 h-10 bg-[#77BEF0] hover:bg-[#4aa6e0] text-white text-2xl rounded-full">
              +
            </button>
            <button className="bg-[#77BEF0] hover:bg-[#4aa6e0] text-white px-5 py-2 rounded-full font-medium">
              Your Flashcard
            </button>
          </div>

          <div className="grid grid-cols-5 gap-6">
            {levels.map((level) => (
              <LevelCard key={level} level={level} type="vocab" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
