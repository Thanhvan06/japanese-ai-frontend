import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";

export default function AdminManagers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api("/api/admin/users?page=1&limit=1000");
      const allUsers = res.users || [];
      const admins = allUsers.filter((u) => u.role === "admin");
      setItems(admins);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách admin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleDemote = async (userId) => {
    try {
      setActionLoading(true);
      await api(`/api/admin/users/${userId}/demote`, {
        method: "POST",
      });
      await fetchAdmins();
    } catch (err) {
      setError(err.message || "Không thể hủy quyền admin");
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleDisplay = (u) => {
    if (u.adminRole === "super_admin") return "Super Admin";
    if (u.adminRole === "content_manager") return "Admin nội dung";
    return "Admin";
  };

  return (
    <AdminLayout title="Quản lý Admin">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <p className="text-sm text-gray-600">
          Danh sách các tài khoản admin hiện tại. Chỉ Super Admin mới có thể hủy
          quyền admin của tài khoản khác.
        </p>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              Đang tải...
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              Chưa có admin nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Tên
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Vai trò admin
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((u) => (
                    <tr key={u.user_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{u.user_id}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {u.display_name || u.email}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{u.email}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {getRoleDisplay(u)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleDemote(u.user_id)}
                          className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Hủy quyền Admin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

