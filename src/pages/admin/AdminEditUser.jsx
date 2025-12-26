import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { api, BASE_URL } from "../../lib/api";

export default function AdminEditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async function fetchUser() {
      try {
        const res = await api(`/api/admin/users/${id}`);
        if (!mounted) return;
        setUser(res.user || res);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // If avatarFile is present, upload as multipart/form-data
      if (avatarFile) {
        const form = new FormData();
        form.append("avatar", avatarFile);
        // append other fields
        form.append("display_name", user.display_name || "");
        form.append("role", user.role || "user");
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/api/admin/users/${id}`, {
          method: "PUT",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        if (!res.ok) throw new Error("Update failed");
      } else {
        await api(`/api/admin/users/${id}`, {
          method: "PUT",
          body: JSON.stringify(user),
        });
      }
      navigate("/admin/users");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout title="Edit User">
      <div className="flex justify-center">
        <div className="w-full max-w-3xl bg-white rounded-xl p-10 relative shadow-sm">
          {/* pencil icon top-right */}
          <div className="absolute top-6 right-6">
            <button className="p-2 rounded-full bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 00.707-.293l9.414-9.414a1 1 0 000-1.414L14.12 3h0a1 1 0 00-1.414 0L3 12.707V17a3 3 0 003 3z"></path>
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-36 h-36 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
              {(avatarPreview || user.avatar_url || user.avatar) ? (
                <img src={avatarPreview || user.avatar_url || user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-semibold" style={{ background: "#77BEF0", borderRadius: "9999px" }}>
                  {(user.display_name || user.name || user.email || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <div className="text-base font-semibold text-gray-800">{user.display_name || user.name || "Username"}</div>
              <div className="mt-3 flex items-center gap-6 justify-center text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>10 tiếng 20 phút</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h2l.4 2M7 7h10l1 5H6L7 7z"></path>
                  </svg>
                  <span>20</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-8 max-w-lg mx-auto space-y-4">
            <div className="flex justify-center">
              <label className="inline-flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2">
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  setAvatarFile(f || null);
                  setAvatarPreview(f ? URL.createObjectURL(f) : null);
                }} className="hidden" />
                <span className="text-sm text-gray-600">Thay ảnh đại diện</span>
              </label>
            </div>

            <div>
              <input type="text" value={user.display_name || user.name || ""} onChange={(e) => setUser({ ...user, display_name: e.target.value })} placeholder="Username" className="w-full px-4 py-3 rounded-full bg-gray-50 border border-gray-100" />
            </div>

            <div>
              <input type="email" value={user.email || ""} disabled placeholder="Email" className="w-full px-4 py-3 rounded-full bg-gray-50 border border-gray-100" />
            </div>

            <div>
              <input type="password" value={user.password || ""} onChange={(e) => setUser({ ...user, password: e.target.value })} placeholder="Password" className="w-full px-4 py-3 rounded-full bg-gray-50 border border-gray-100" />
            </div>

            <div className="flex justify-center mt-6">
              <button className="px-6 py-2 text-white rounded-full" type="submit" disabled={saving} style={{ background: "#77BEF0" }}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}


