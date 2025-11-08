import React from "react";

const CloudBackground = ({ children }) => {
  return (
    <div className="relative flex items-center justify-center h-screen w-full bg-skyblue overflow-hidden">
      {/* Clouds */}
      <div className="absolute w-36 h-20 bg-white rounded-full opacity-90 top-1/5 left-[-200px] animate-clouds1 blur-sm"></div>
      <div className="absolute w-48 h-24 bg-white rounded-full opacity-80 top-1/3 left-[-250px] animate-clouds2 blur-sm"></div>
      <div className="absolute w-32 h-16 bg-white rounded-full opacity-85 top-2/3 left-[-180px] animate-clouds3 blur-sm"></div>

      {/* Centered content */}
      {children}
    </div>
  );
};

export default CloudBackground;
