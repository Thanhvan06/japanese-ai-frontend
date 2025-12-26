import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    (async function fetchUsers() {
      try {
        const res = await api("/api/admin/users");
        if (!mounted) return;
        setUsers(res.users || res);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const totalUsers = users.length;
  const onlineUsers = users.filter((u) => u.is_active).length;
  const totalCourses = 105; // placeholder — replace with real endpoint if available

  const filteredUsers = users.filter((u) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (u.display_name || u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  return (
    <AdminLayout title="Trang chủ">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm text-gray-500">Tổng số người dùng</div>
            <div className="mt-6 text-3xl font-bold text-gray-800">{loading ? "--" : totalUsers}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm text-gray-500">Tổng số người online</div>
            <div className="mt-6 text-3xl font-bold text-gray-800">{loading ? "--" : onlineUsers}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm text-gray-500">Tổng số học phần</div>
            <div className="mt-6 text-3xl font-bold text-gray-800">{totalCourses}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-gray-100">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"></path>
              </svg>
            </div>
            <input
              className="flex-1 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100"
              placeholder="Tìm kiếm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="px-4 py-2 text-white rounded-lg" style={{ background: "#77BEF0" }}>Tìm kiếm</button>
          </div>
        </div>

        {/* Optionally show preview of filtered users or other widgets */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Kết quả tìm kiếm</div>
          {loading ? (
            <div>Đang tải...</div>
          ) : (
            <div className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{filteredUsers.length}</span> người dùng
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


