import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import LevelCard from "../components/LevelCard";

export default function Grammar() {
  const levels = ["N5", "N4", "N3", "N2", "N1"];
  const navigate = useNavigate();

  const handlePracticeClick = (type) => {
    navigate(`/grammar/practice?questionType=${type}`);
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <h2 className="text-2xl font-bold text-[#4aa6e0] mb-6">Ngữ pháp</h2>
          
          {/* Practice Cards */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div
              onClick={() => handlePracticeClick("multiple_choice")}
              className="rounded-2xl border-2 border-[#4aa6e0] bg-white p-6 shadow-lg 
               cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <h3 className="text-xl font-bold text-[#4aa6e0] mb-2">Luyện tập trắc nghiệm</h3>
              <p className="text-sm text-slate-600">Chọn đáp án đúng cho các câu hỏi ngữ pháp</p>
            </div>
            
            <div
              onClick={() => handlePracticeClick("sentence_arrangement")}
              className="rounded-2xl border-2 border-[#4aa6e0] bg-white p-6 shadow-lg 
               cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <h3 className="text-xl font-bold text-[#4aa6e0] mb-2">Sắp xếp câu</h3>
              <p className="text-sm text-slate-600">Sắp xếp các từ thành câu hoàn chỉnh</p>
            </div>
          </div>

          {/* Level Cards */}
          <h3 className="text-2xl font-bold text-[#4aa6e0] mb-6">JLPT</h3>
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
