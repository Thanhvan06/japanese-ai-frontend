import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";
import { Link } from "react-router-dom";
import { FaEllipsisV, FaEye } from "react-icons/fa";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [modalState, setModalState] = useState({ open: false, type: null, user: null, details: null });
  const [reason, setReason] = useState("");
  

  return (
    <AdminLayout title="">
      <div className="space-y-6 mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: "#77BEF0" }}>Quản Lý Người Dùng</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-medium text-gray-700">{users.filter(u => u.is_active).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M13 7a3 3 0 11-6 0 3 3 0 016 0z"/><path fillRule="evenodd" d="M2 13.5A6.5 6.5 0 0110.5 7h.5a6.5 6.5 0 016.5 6.5V17H2v-3.5z" clipRule="evenodd"/></svg>
              <span className="text-sm font-medium text-gray-700">{users.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-100"
                placeholder="Tìm kiếm theo tên hoặc email"
                value={query}
                onChange={(e) => { setQuery(e.target.value); }}
              />
            </div>
            <div className="flex items-center gap-3">
              <select className="px-3 py-2 border rounded-lg bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Kích hoạt</option>
                <option value="inactive">Chưa kích hoạt</option>
              </select>
              <select className="px-3 py-2 border rounded-lg bg-white" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="all">Tất cả role</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm">
          {/* header pill */}
          <div className="overflow-hidden rounded-md px-4 py-2 mb-4" style={{ background: "rgba(119,190,240,0.18)" }}>
            <div className="grid grid-cols-12 gap-4 text-sm text-gray-700">
              <div className="col-span-1 whitespace-nowrap">Số thứ tự</div>
              <div className="col-span-3 whitespace-nowrap">Tên</div>
              <div className="col-span-1 whitespace-nowrap">Ảnh đại diện</div>
              <div className="col-span-4 whitespace-nowrap">Email</div>
              <div className="col-span-1 whitespace-nowrap">Role</div>
              <div className="col-span-1 whitespace-nowrap">Trạng thái</div>
              <div className="col-span-1 text-right whitespace-nowrap">Cài đặt</div>
            </div>
          </div>

          {loading ? (
            <div>Đang tải...</div>
          ) : (
            <>
              <div>
                {(() => {
                  const filtered = users.filter((u) => {
                    if (!query) return true;
                    const q = query.toLowerCase();
                    return (u.display_name || u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
                  });
                  let slice = filtered;
                  if (filterStatus !== "all") {
                    slice = slice.filter(u => filterStatus === "active" ? u.is_active : !u.is_active);
                  }
                  if (filterRole !== "all") {
                    slice = slice.filter(u => (u.role || u.adminRole || "user") === filterRole);
                  }
                  return (
                    <>
                      <div className="divide-y divide-gray-100">
                        {slice.map((u, idx) => (
                          <div key={u.user_id || u.id || idx} className="grid grid-cols-12 gap-4 items-center py-6">
                            <div className="col-span-1 text-sm text-gray-700 flex items-center pl-4">{idx + 1}</div>
                            <div className="col-span-3 text-sm text-gray-800 whitespace-nowrap">{u.display_name || u.name || u.email}</div>
                            <div className="col-span-1">
                              { (u.avatar_url || u.avatar) ? (
                                <img className="w-12 h-12 rounded-md object-cover border" src={u.avatar_url || u.avatar} alt="avatar" />
                              ) : (
                                <div className="w-12 h-12 rounded-md flex items-center justify-center text-white font-semibold" style={{ background: "#77BEF0" }}>
                                  {(u.display_name || u.name || u.email || "U").charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="col-span-4 text-sm text-gray-600">{u.email}</div>
                            <div className="col-span-1 text-sm text-gray-600">{u.role || u.adminRole || "-"}</div>
                            <div className="col-span-1 text-sm text-gray-600">
                              {u.is_active ? "Kích hoạt" : "Chưa kích hoạt"}
                            </div>
                            <div className="col-span-1 text-right relative">
                              <button
                                onClick={() => setMenuOpenId((prev) => (prev === (u.user_id ?? u.id) ? null : (u.user_id ?? u.id)))}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-md text-gray-600 hover:bg-sky-50 hover:text-sky-600 transition-colors focus:outline-none"
                                aria-label="Actions"
                              >
                                <FaEllipsisV />
                              </button>
                              {menuOpenId === (u.user_id ?? u.id) && (
                                <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50 }}>
                                  <div className="bg-white rounded-md shadow-lg border w-56">
                                    <button
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                      onClick={() => {
                                        setMenuOpenId(null);
                                        setModalState({ open: true, type: "activate", user: u, details: null });
                                        setReason("");
                                      }}
                                    >
                                      Activate tài khoản
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                      onClick={() => {
                                        setMenuOpenId(null);
                                        setModalState({ open: true, type: "deactivate", user: u, details: null });
                                        setReason("");
                                      }}
                                    >
                                      Deactivate tài khoản
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                      onClick={async () => {
                                        setMenuOpenId(null);
                                        try {
                                          const res = await api(`/api/admin/users/${u.user_id ?? u.id}`);
                                          setModalState({ open: true, type: "view", user: u, details: res.user || res });
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }}
                                    >
                                      Xem thông tin chi tiết
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      
                      {/* context modals */}
                      {modalState.open && modalState.type && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                          <div className="absolute inset-0 bg-black opacity-30" onClick={() => setModalState({ open: false, type: null, user: null, details: null })}></div>
                          <div className="bg-white rounded-lg p-6 z-60 max-w-lg w-full">
                            {modalState.type === "view" && modalState.details && (
                              <>
                                <h3 className="text-lg font-semibold mb-4">Thông tin người dùng</h3>
                                <div className="space-y-2 text-sm text-gray-700">
                                  <div><strong>Name:</strong> {modalState.details.display_name || modalState.details.name}</div>
                                  <div><strong>Email:</strong> {modalState.details.email}</div>
                                  <div><strong>Role:</strong> {modalState.details.role}</div>
                                  <div><strong>Last login:</strong> {modalState.details.last_login || "N/A"}</div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                  <button className="px-4 py-2 bg-gray-100 rounded-md" onClick={() => setModalState({ open: false, type: null, user: null, details: null })}>Đóng</button>
                                </div>
                              </>
                            )}
                            {(modalState.type === "activate" || modalState.type === "deactivate") && (
                              <>
                                <h3 className="text-lg font-semibold mb-4">{modalState.type === "activate" ? "Kích hoạt tài khoản" : "Vô hiệu hóa tài khoản"}</h3>
                                <div className="text-sm text-gray-700 mb-3">Bạn có chắc muốn {modalState.type === "activate" ? "kích hoạt" : "vô hiệu hóa"} tài khoản này?</div>
                                <textarea className="w-full p-2 border rounded-md" placeholder="Lý do (tùy chọn)" value={reason} onChange={(e) => setReason(e.target.value)} />
                                <div className="mt-4 flex justify-end gap-2">
                                  <button className="px-4 py-2 bg-gray-100 rounded-md" onClick={() => setModalState({ open: false, type: null, user: null, details: null })}>Hủy</button>
                                  <button
                                    className="px-4 py-2 bg-sky-500 text-white rounded-md"
                                    onClick={async () => {
                                      const targetId = modalState.user?.user_id ?? modalState.user?.id;
                                      if (!targetId) return;
                                      try {
                                        await api(`/api/admin/users/${targetId}`, {
                                          method: "PATCH",
                                          body: JSON.stringify({ is_active: modalState.type === "activate", reason }),
                                        });
                                        setUsers((prev) => prev.map(p => ((p.user_id ?? p.id) === targetId ? { ...p, is_active: modalState.type === "activate" } : p)));
                                      } catch (err) {
                                        console.error(err);
                                      } finally {
                                        setModalState({ open: false, type: null, user: null, details: null });
                                        setReason("");
                                      }
                                    }}
                                  >
                                    Xác nhận
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


