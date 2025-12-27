import React from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function DiaryCard({ id, title, images, created_at, onClick, selectionMode = false, isSelected = false, onToggleSelection }) {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return { day, month, year };
  };

  const dateInfo = formatDate(created_at);
  const firstImage = images && images.length > 0 ? images[0] : null;
  const imageUrl = firstImage 
    ? (firstImage.startsWith('/') ? `${BASE_URL}${firstImage}` : firstImage)
    : null;
  
  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const handleClick = (e) => {
    if (selectionMode) {
      e.stopPropagation();
      if (onToggleSelection) {
        onToggleSelection(id);
      }
    } else {
      onClick(id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer flex flex-col items-start hover:opacity-90 transition-opacity relative ${
        selectionMode && isSelected ? "ring-4 ring-blue-500 rounded-lg" : ""
      }`}
    >
      {selectionMode && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection && onToggleSelection(id)}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 cursor-pointer"
          />
        </div>
      )}
      
      <div className={`w-full aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg overflow-hidden shadow-md ${
        selectionMode && isSelected ? "opacity-80" : ""
      }`}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title || "Diary"} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <div className="text-blue-400 text-4xl font-bold">
              {dateInfo.day || ""}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-3 w-full">
        <div className="text-xs text-gray-500 font-medium mb-1">
          {dateInfo.day && `${dateInfo.day} - ${monthNames[dateInfo.month - 1]} - ${dateInfo.year}`}
        </div>
        <div className="text-sm font-semibold text-gray-800 line-clamp-2">
          {title || "Nhật ký không có tiêu đề"}
        </div>
      </div>
    </div>
  );
}
