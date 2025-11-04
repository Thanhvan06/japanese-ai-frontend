import React, { useState } from "react";
import { Search } from "lucide-react";

const Header = () => {
  const [language, setLanguage] = useState("vi");

  const toggleLanguage = () => {
    setLanguage((prev) =>
      prev === "vi" ? "en" : prev === "en" ? "jp" : "vi"
    );
  };

  const flagSrc =
    language === "vi"
      ? "/src/assets/vn.png"
      : language === "en"
      ? "/src/assets/eng.png"
      : "/src/assets/jp.png";

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img
          src="/src/assets/home.png"
          alt="Logo"
          className="w-8 h-8 object-contain"
        />
        <h1 className="text-xl font-semibold text-gray-800">Japanese AI</h1>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="relative w-1/3">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="w-full rounded-full border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#77BEF0]"
        />
        <Search className="absolute left-3 top-2.5 text-gray-500 w-5 h-5" />
      </div>

      {/* Ngôn ngữ */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
        onClick={toggleLanguage}
      >
        <img
          src={flagSrc}
          alt="Flag"
          className="w-10 h-10 rounded-sm "
        />
        <span className="text-sm font-medium text-gray-700 uppercase">
          {language}
        </span>
      </div>
    </header>
  );
};

export default Header;
