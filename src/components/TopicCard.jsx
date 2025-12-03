import { FaFolderOpen } from "react-icons/fa";

export default function TopicCard({ topic, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#77BEF0] transition text-left"
      title={topic.topic_name}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#EAF6FF] p-3 text-[#4aa6e0]">
          <FaFolderOpen />
        </div>

        <div className="flex-1 min-w-0">
          {/* Dòng trên: Level */}
          <div className="text-xs font-semibold text-[#4aa6e0]">
            {topic.jlpt_level}
          </div>

          {/* Dòng dưới: Tên chủ đề */}
          <div className="mt-1 text-sm font-semibold truncate text-slate-900">
            {topic.topic_name}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">Xem từ vựng của chủ đề này</div>
    </button>
  );
}
