import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/translations";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function DiaryCard({ id, title, images, created_at, onClick, selectionMode = false, isSelected = false, onToggleSelection }) {
  const { language } = useLanguage();
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
    t("diaryCard.months.1", language),
    t("diaryCard.months.2", language),
    t("diaryCard.months.3", language),
    t("diaryCard.months.4", language),
    t("diaryCard.months.5", language),
    t("diaryCard.months.6", language),
    t("diaryCard.months.7", language),
    t("diaryCard.months.8", language),
    t("diaryCard.months.9", language),
    t("diaryCard.months.10", language),
    t("diaryCard.months.11", language),
    t("diaryCard.months.12", language),
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
            alt={title || t("diaryCard.fallbackImageAlt", language)}
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
          {title || t("diaryCard.untitled", language)}
        </div>
      </div>
    </div>
  );
}
