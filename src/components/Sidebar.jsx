import React, { useState } from "react";

const menuItems = [
  { name: "Trang chủ", icon: "/src/assets/home.png" },
  { name: "Từ vựng", icon: "/src/assets/vocab.png" },
  { name: "Ngữ pháp", icon: "/src/assets/grammar.png" },
  { name: "Nhật ký", icon: "/src/assets/diary.png" },
  { name: "Flashcard", icon: "/src/assets/flashcard.png" },
  { name: "AI Chat", icon: "/src/assets/ai-chat.png" },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      className={`h-screen bg-white border-r border-gray-200 shadow-sm flex flex-col items-center pt-6 transition-all duration-300 ${
        isOpen ? "w-52" : "w-16"
      }`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Menu chính */}
      <ul className="flex flex-col gap-6 mt-4">
        {menuItems.map((item, index) => (
          <li
            key={index}
            className="flex items-center gap-4 text-gray-700 hover:text-[#77BEF0] cursor-pointer transition-all"
          >
            <img
              src={item.icon}
              alt={item.name}
              className="w-6 h-6 object-contain"
            />
            {isOpen && (
              <span className="text-sm font-medium whitespace-nowrap">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
