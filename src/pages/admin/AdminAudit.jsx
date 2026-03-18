import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";

export default function AdminAudit() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const [filterAdminId, setFilterAdminId] = useState("");
  const [filterTargetId, setFilterTargetId] = useState("");
  const [filterAction, setFilterAction] = useState("");

  useEffect(() => {
    let mounted = true;
    (async function fetchAudit() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("limit", limit);
        if (filterAdminId) params.append("admin_id", filterAdminId);
        if (filterTargetId) params.append("target_user_id", filterTargetId);
        if (filterAction) params.append("action", filterAction);
        const res = await api(`/api/admin/audit?${params.toString()}`);
        if (!mounted) return;
        setItems(Array.isArray(res.items) ? res.items : []);
        setTotal(res.total || 0);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Không thể tải audit log");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, limit, filterAdminId, filterTargetId, filterAction]);

  const actions = [
    "",
    "PROMOTE_ADMIN",
    "DEMOTE_ADMIN",
    "DELETE_USER",
    "ACTIVATE_USER",
    "DEACTIVATE_USER",
  ];

  const handleResetFilters = () => {
    setFilterAdminId("");
    setFilterTargetId("");
    setFilterAction("");
    setPage(1);
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString("vi-VN");
    } catch {
      return value;
    }
  };

  return (
    <AdminLayout title="Nhật ký hành động Admin">
      <div className="space-y-6">
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

        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin ID
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterAdminId}
                onChange={(e) => {
                  setFilterAdminId(e.target.value);
                  setPage(1);
                }}
                placeholder="Ví dụ: 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User mục tiêu ID
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterTargetId}
                onChange={(e) => {
                  setFilterTargetId(e.target.value);
                  setPage(1);
                }}
                placeholder="Ví dụ: 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hành động
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                {actions
                  .filter((a) => a)
                  .map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Xóa lọc
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Admin
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    User mục tiêu
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Hành động
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Không có bản ghi nào
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    let parsedDetails = null;
                    if (item.details) {
                      try {
                        parsedDetails = JSON.parse(item.details);
                      } catch {
                        parsedDetails = item.details;
                      }
                    }
                    const adminLabel =
                      item.admin_user?.display_name ||
                      item.admin_user?.email ||
                      item.admin_user_id;
                    return (
                      <tr key={item.audit_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">
                          {item.audit_id}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatDateTime(item.created_at)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="flex flex-col">
                            <span className="font-medium">{adminLabel}</span>
                            <span className="text-xs text-gray-500">
                              ID: {item.admin_user_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.target_user_id ? (
                            <span>ID: {item.target_user_id}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {parsedDetails
                            ? typeof parsedDetails === "string"
                              ? parsedDetails
                              : JSON.stringify(parsedDetails)
                            : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && total > limit && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-700">
              <div>
                Hiển thị {(page - 1) * limit + 1} -{" "}
                {Math.min(page * limit, total)} trong tổng số {total} bản ghi
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={page * limit >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

