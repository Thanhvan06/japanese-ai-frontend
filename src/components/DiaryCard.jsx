import React from "react";

export default function DiaryCard({ id, title, cover, onClick }) {
  return (
    <div
      onClick={() => onClick(id)}
      className="cursor-pointer flex flex-col items-start"
    >
      <div className="w-40 h-48 bg-gray-200 rounded-md overflow-hidden shadow-sm">
        {cover ? (
          <img src={cover} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-300" />
        )}
      </div>
      <div className="mt-3 text-sm font-semibold text-gray-800">{title}</div>
    </div>
  );
}
