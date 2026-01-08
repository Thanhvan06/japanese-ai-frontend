import React from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

export default function AdminLayout({ children, title = "Admin" }) {
  // AdminLayout now uses the shared Header and Sidebar components so styling is consistent
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 md:p-8">
          {title && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#77BEF0" }}>{title}</h1>
                <div className="text-sm text-gray-500 mt-1">Quản trị hệ thống</div>
              </div>
            </div>
          )}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


