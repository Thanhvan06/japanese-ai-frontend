import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../i18n/translations";

export default function AdminManagers() {
  const { language } = useLanguage();
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
      setError(err.message || t("adminManagers.errors.loadAdmins", language));
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
      setError(err.message || t("adminManagers.errors.demoteAdmin", language));
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleDisplay = (u) => {
    if (u.adminRole === "super_admin")
      return t("adminManagers.roles.superAdmin", language);
    if (u.adminRole === "content_manager")
      return t("adminManagers.roles.contentManager", language);
    return t("adminManagers.roles.admin", language);
  };

  return (
    <AdminLayout title={t("adminManagers.pageTitle", language)}>
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
          {t("adminManagers.description", language)}
        </p>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              {t("adminManagers.loading", language)}
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              {t("adminManagers.empty", language)}
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
                      {t("adminManagers.table.name", language)}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      {t("adminManagers.table.adminRole", language)}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      {t("adminManagers.table.actions", language)}
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
                          {t("adminManagers.actions.demoteAdmin", language)}
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

