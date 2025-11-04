import { Link } from "react-router-dom";

export default function LevelCard({ level, type }) {
  return (
    <Link
      to={`/${type}/${level}`}
      className="block bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200"
    >
      <div className="flex items-center justify-center h-28">
        <span className="text-2xl font-bold text-[#4aa6e0]">{level}</span>
      </div>
    </Link>
  );
}
