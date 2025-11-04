import React from "react";

export default function VocabCard({ word, meaning, image }) {
  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200 overflow-hidden">
      {/* Bên trái: từ và nghĩa */}
      <div className="flex flex-col justify-center px-4 py-3 w-2/3">
        <p className="text-xl font-semibold text-gray-800">{word}</p>
        <p className="text-gray-500 text-sm">{meaning}</p>
      </div>

      {/* Bên phải: hình ảnh minh họa */}
      <div className="w-24 h-24 flex-shrink-0">
        <img
          src={image}
          alt={word}
          className="object-cover w-full h-full rounded-r-xl"
        />
      </div>
    </div>
  );
}
