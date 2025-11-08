import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import VocabCard from "../components/VocabCard";
import { useParams } from "react-router-dom";

export default function VocabLevel() {
  const { level } = useParams();

  // Dữ liệu demo (sau này sẽ lấy từ backend)
  const vocabList = [
    {
      word: "猫 (ねこ)",
      meaning: "Con mèo",
      image: "https://thichtrangtri.com/wp-content/uploads/2025/05/hinh-anh-con-meo-cute-1.jpg",
    },
    {
      word: "犬 (いぬ)",
      meaning: "Con chó",
      image: "/images/dogpic.png",
    },
    {
      word: "学校 (がっこう)",
      meaning: "Trường học",
      image: "/images/schoolpic.png",
    },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-14">
        <Header />

        <main className="p-6">
          <h1 className="text-2xl font-bold text-[#4aa6e0] mb-6">
            Từ vựng JLPT {level}
          </h1>

          <div className="grid grid-cols-3 gap-6">
            {vocabList.map((item, index) => (
              <VocabCard
                key={index}
                word={item.word}
                meaning={item.meaning}
                image={item.image}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
