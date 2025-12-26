import React from "react";
import Sidebar from "../../components/Sidebar";

export default function AdminLayout({ children, title = "Admin" }) {
  // AdminLayout now uses the shared Sidebar component so styling is consistent
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 px-12 py-8">
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
  );
}


