import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../i18n/translations";

export default function AdminAudit() {
  const { language } = useLanguage();
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
    <AdminLayout title={t("adminAudit.pageTitle", language)}>
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
                {t("adminAudit.filters.adminIdLabel", language)}
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
                placeholder={t("adminAudit.filters.adminIdPlaceholder", language)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("adminAudit.filters.targetUserIdLabel", language)}
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
                placeholder={t("adminAudit.filters.targetUserIdPlaceholder", language)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("adminAudit.filters.actionLabel", language)}
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t("adminAudit.filters.all", language)}</option>
                {actions
                  .filter((a) => a)
                  .map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2 justify-start sm:justify-end w-full">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {t("adminAudit.resetFilter", language)}
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
                    {t("adminAudit.table.time", language)}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    {t("adminAudit.table.admin", language)}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    {t("adminAudit.table.targetUser", language)}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    {t("adminAudit.table.action", language)}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    {t("adminAudit.table.details", language)}
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
                      {t("adminAudit.table.loading", language)}
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {t("adminAudit.table.empty", language)}
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
                {t("adminAudit.pagination.showing", language, {
                  start: (page - 1) * limit + 1,
                  end: Math.min(page * limit, total),
                  total,
                })}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t("adminAudit.pagination.prev", language)}
                </button>
                <button
                  type="button"
                  disabled={page * limit >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t("adminAudit.pagination.next", language)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

