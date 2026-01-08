import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../lib/api";
import { FaEllipsisV, FaCheckCircle, FaTimesCircle, FaInfoCircle, FaUserShield, FaUserMinus, FaCrown } from "react-icons/fa";

export default function AdminUsers() {
  const [allUsers, setAllUsers] = useState([]); // Tất cả users từ API
  const [users, setUsers] = useState([]); // Users đã được filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [currentAdminRole, setCurrentAdminRole] = useState(null);

  // Fetch all users from API (load một lần)
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Load tất cả users (limit lớn để lấy hết)
      const res = await api(`/api/admin/users?page=1&limit=1000`);
      setAllUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load users", err);
      setError(err.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  // Get current admin role
  useEffect(() => {
    let mounted = true;
    (async function getCurrentAdmin() {
      try {
        // Try to get current user info to check admin role
        const res = await api("/api/auth/me").catch(() => null);
        if (!mounted) return;
        if (res?.user) {
          // Fetch admin record to get role
          const adminRes = await api(`/api/admin/users/${res.user.user_id}`).catch(() => null);
          if (adminRes?.user?.adminRole) {
            setCurrentAdminRole(adminRes.user.adminRole);
          }
        }
      } catch (err) {
        // Ignore errors
      }
    })();
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, []); // Initial load only

  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [modalState, setModalState] = useState({ open: false, type: null, user: null, details: null });
  const [reason, setReason] = useState("");
  const [selectedAdminRole, setSelectedAdminRole] = useState("content_manager");
  const [actionLoading, setActionLoading] = useState(false);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpenId && !event.target.closest('.context-menu-container')) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenId]);

  // Filter users ở frontend dựa trên query, filterStatus, và filterRole
  useEffect(() => {
    let filtered = [...allUsers];
    
    // Filter by search query
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(u => 
        (u.email?.toLowerCase().includes(searchLower)) ||
        (u.display_name?.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(u => 
        filterStatus === "active" ? u.is_active : !u.is_active
      );
    }
    
    // Filter by role
    if (filterRole !== "all") {
      if (filterRole === "user") {
        filtered = filtered.filter(u => u.role !== "admin");
      } else if (filterRole === "admin") {
        filtered = filtered.filter(u => u.role === "admin");
      }
    }
    
    setUsers(filtered);
    setTotal(filtered.length);
    setPage(1); // Reset về trang 1 khi filter
  }, [allUsers, query, filterStatus, filterRole]);

  // Handle activate/deactivate
  const handleActivateDeactivate = async (userId, action) => {
    try {
      setActionLoading(true);
      const endpoint = action === "activate" 
        ? `/api/admin/users/${userId}/activate`
        : `/api/admin/users/${userId}/deactivate`;
      
      await api(endpoint, { method: "POST" });
      await fetchAllUsers(); // Reload all users
      setModalState({ open: false, type: null, user: null, details: null });
      setReason("");
    } catch (err) {
      setError(err.message || `Không thể ${action === "activate" ? "kích hoạt" : "vô hiệu hóa"} tài khoản`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle promote to admin
  const handlePromote = async (userId, role) => {
    try {
      setActionLoading(true);
      await api(`/api/admin/users/${userId}/promote`, {
        method: "POST",
        body: JSON.stringify({ role }),
      });
      await fetchAllUsers();
      setModalState({ open: false, type: null, user: null, details: null });
      setSelectedAdminRole("content_manager");
    } catch (err) {
      setError(err.message || "Không thể thăng cấp người dùng");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle demote admin
  const handleDemote = async (userId) => {
    try {
      setActionLoading(true);
      await api(`/api/admin/users/${userId}/demote`, {
        method: "POST",
      });
      await fetchAllUsers();
      setModalState({ open: false, type: null, user: null, details: null });
    } catch (err) {
      setError(err.message || "Không thể hủy quyền admin");
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch user details
  const fetchUserDetails = async (userId) => {
    try {
      const res = await api(`/api/admin/users/${userId}`);
      return res.user;
    } catch (err) {
      console.error("Failed to fetch user details", err);
      return null;
    }
  };

  const handleViewDetails = async (user) => {
    setMenuOpenId(null);
    setModalState({ open: true, type: "view", user, details: null });
    // Fetch full details
    const details = await fetchUserDetails(user.user_id || user.id);
    if (details) {
      setModalState({ open: true, type: "view", user, details });
    }
  };

  const isSuperAdmin = currentAdminRole === "super_admin";
  const getRoleDisplay = (user) => {
    if (user.role === "admin" && user.adminRole) {
      return user.adminRole === "super_admin" ? "Super Admin" : "Admin";
    }
    return "Người dùng";
  };

  const getRoleBadgeColor = (user) => {
    if (user.role === "admin" && user.adminRole === "super_admin") {
      return { backgroundColor: "#FEF3C7", color: "#92400E" }; // Yellow for super admin
    }
    if (user.role === "admin" && user.adminRole === "content_manager") {
      return { backgroundColor: "#E3F2FD", color: "#1976D2" }; // Blue for content manager
    }
    return { backgroundColor: "#F3F4F6", color: "#6B7280" }; // Gray for user
  };

  // Tính số lượng cho mỗi filter option (dựa trên allUsers - chưa filter)
  const roleCounts = {
    all: allUsers.length,
    user: allUsers.filter(u => u.role !== "admin").length,
    admin: allUsers.filter(u => u.role === "admin").length,
  };

  const statusCounts = {
    all: allUsers.length,
    active: allUsers.filter(u => u.is_active).length,
    inactive: allUsers.filter(u => !u.is_active).length,
  };

  return (
    <AdminLayout title="">
      <div className="space-y-6 mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: "#77BEF0" }}>Quản Lý Người Dùng</h2>
        </div>

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

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Tìm kiếm theo tên, email..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); }}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select 
                  className="appearance-none px-4 py-2.5 pr-10 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-gray-400"
                  value={filterRole} 
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">Tất cả vai trò ({roleCounts.all})</option>
                  <option value="user">Người dùng ({roleCounts.user})</option>
                  <option value="admin">Quản trị viên ({roleCounts.admin})</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <select 
                  className="appearance-none px-4 py-2.5 pr-10 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-gray-400"
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái ({statusCounts.all})</option>
                  <option value="active">Đang hoạt động ({statusCounts.active})</option>
                  <option value="inactive">Đã khóa ({statusCounts.inactive})</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm" style={{ overflow: 'visible' }}>
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-semibold text-gray-700">
              <div className="col-span-1 whitespace-nowrap">Số thứ tự</div>
              <div className="col-span-3 whitespace-nowrap">Tên</div>
              <div className="col-span-1 whitespace-nowrap">Ảnh đại diện</div>
              <div className="col-span-4 whitespace-nowrap">Email</div>
              <div className="col-span-1 whitespace-nowrap">Vai trò</div>
              <div className="col-span-1 whitespace-nowrap">Trạng thái</div>
              <div className="col-span-1 text-right whitespace-nowrap"></div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Không có người dùng nào</div>
          ) : (
            <>
              <div>
                {(() => {
                  // Paginate filtered users
                  const startIndex = (page - 1) * limit;
                  const paginatedUsers = users.slice(startIndex, startIndex + limit);
                  
                  return (
                    <>
                      <div className="divide-y divide-gray-200 overflow-visible">
                        {paginatedUsers.map((u, idx) => {
                          return (
                            <div key={u.user_id || u.id || idx} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors relative overflow-visible">
                            <div className="col-span-1 text-sm text-gray-700 font-medium">{startIndex + idx + 1}</div>
                            <div className="col-span-3 text-sm text-gray-900 font-medium whitespace-nowrap">{u.display_name || u.name || u.email}</div>
                            <div className="col-span-1">
                              { (u.avatar_url || u.avatar) ? (
                                <img className="w-10 h-10 rounded-md object-cover border border-gray-200" src={u.avatar_url || u.avatar} alt="avatar" />
                              ) : (
                                <div className="w-10 h-10 rounded-md flex items-center justify-center text-white font-semibold text-sm" style={{ background: "#77BEF0" }}>
                                  {(u.display_name || u.name || u.email || "U").charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="col-span-4 text-sm text-gray-600 truncate">{u.email}</div>
                            <div className="col-span-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={getRoleBadgeColor(u)}>
                                {u.adminRole === "super_admin" && <FaCrown className="mr-1" />}
                                {getRoleDisplay(u)}
                              </span>
                            </div>
                            <div className="col-span-1">
                              {u.is_active ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}>
                                  Đang hoạt động
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ backgroundColor: "#FFEBEE", color: "#C62828" }}>
                                  Đã khóa
                                </span>
                              )}
                            </div>
                            <div className="col-span-1 text-right relative context-menu-container">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId((prev) => (prev === (u.user_id ?? u.id) ? null : (u.user_id ?? u.id)));
                                }}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 focus:outline-none relative z-10"
                                aria-label="Actions"
                              >
                                <FaEllipsisV />
                              </button>
                              {menuOpenId === (u.user_id ?? u.id) && (
                                <div 
                                  className="absolute right-0 top-full mt-1 z-[9999]"
                                  style={{ 
                                    animation: "fadeInSlideDown 0.2s ease-out"
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-56 overflow-hidden">
                                    {u.role !== "admin" && isSuperAdmin && (
                                      <button
                                        className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-200 hover:bg-purple-50"
                                        style={{ 
                                          color: "#7c3aed",
                                          borderBottom: "1px solid #f3f4f6"
                                        }}
                                        onClick={() => {
                                          setMenuOpenId(null);
                                          setModalState({ open: true, type: "promote", user: u, details: null });
                                          setSelectedAdminRole("content_manager");
                                        }}
                                      >
                                        <FaUserShield className="text-purple-600" />
                                        <span className="font-medium">Thăng cấp làm Admin</span>
                                      </button>
                                    )}
                                    {u.role === "admin" && isSuperAdmin && (
                                      <button
                                        className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-200 hover:bg-orange-50"
                                        style={{ 
                                          color: "#ea580c",
                                          borderBottom: "1px solid #f3f4f6"
                                        }}
                                        onClick={() => {
                                          setMenuOpenId(null);
                                          setModalState({ open: true, type: "demote", user: u, details: null });
                                        }}
                                      >
                                        <FaUserMinus className="text-orange-600" />
                                        <span className="font-medium">Hủy quyền Admin</span>
                                      </button>
                                    )}
                                    <button
                                      disabled={u.is_active}
                                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-200 ${
                                        u.is_active 
                                          ? "opacity-50 cursor-not-allowed" 
                                          : "hover:bg-green-50"
                                      }`}
                                      style={{ 
                                        color: u.is_active ? "#9ca3af" : "#059669",
                                        borderBottom: "1px solid #f3f4f6"
                                      }}
                                      onClick={() => {
                                        if (u.is_active) return;
                                        setMenuOpenId(null);
                                        setModalState({ open: true, type: "activate", user: u, details: null });
                                        setReason("");
                                      }}
                                    >
                                      <FaCheckCircle className={u.is_active ? "text-gray-400" : "text-green-600"} />
                                      <span className="font-medium">Kích hoạt tài khoản</span>
                                    </button>
                                    <button
                                      disabled={!u.is_active}
                                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-200 ${
                                        !u.is_active 
                                          ? "opacity-50 cursor-not-allowed" 
                                          : "hover:bg-red-50"
                                      }`}
                                      style={{ 
                                        color: !u.is_active ? "#9ca3af" : "#dc2626",
                                        borderBottom: "1px solid #f3f4f6"
                                      }}
                                      onClick={() => {
                                        if (!u.is_active) return;
                                        setMenuOpenId(null);
                                        setModalState({ open: true, type: "deactivate", user: u, details: null });
                                        setReason("");
                                      }}
                                    >
                                      <FaTimesCircle className={!u.is_active ? "text-gray-400" : "text-red-600"} />
                                      <span className="font-medium">Vô hiệu hóa tài khoản</span>
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-200 hover:bg-blue-50"
                                      style={{ 
                                        color: "#2563eb"
                                      }}
                                      onClick={() => handleViewDetails(u)}
                                    >
                                      <FaInfoCircle className="text-blue-600" />
                                      <span className="font-medium whitespace-nowrap">Xem thông tin chi tiết</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination */}
                      {total > limit && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                          <div className="text-sm text-gray-700">
                            Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)} trong tổng số {total} người dùng
                          </div>
                          <div className="flex gap-2">
                            <button
                              disabled={page === 1}
                              onClick={() => fetchUsers(page - 1, query, filterStatus)}
                              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Trước
                            </button>
                            <button
                              disabled={page * limit >= total}
                              onClick={() => setPage(page + 1)}
                              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Sau
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* context modals */}
                      {modalState.open && modalState.type && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                          <div 
                            className="absolute inset-0 bg-black opacity-50 transition-opacity duration-200" 
                            onClick={() => setModalState({ open: false, type: null, user: null, details: null })}
                          ></div>
                          <div className="bg-white rounded-xl shadow-2xl z-60 max-w-2xl w-full max-h-[90vh] flex flex-col relative">
                            {modalState.type === "view" && modalState.details && (
                              <>
                                {/* Header - Fixed */}
                                <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                                  <h3 className="text-xl font-bold" style={{ color: "#77BEF0" }}>Thông tin người dùng</h3>
                                  <button 
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setModalState({ open: false, type: null, user: null, details: null })}
                                  >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>

                                {/* Content - Scrollable */}
                                <div className="flex-1 overflow-y-auto p-6 min-h-0">
                                  {/* Avatar Section */}
                                  <div className="flex flex-col items-center mb-6">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 mb-4">
                                      {(modalState.details.avatar_url || modalState.details.avatar) ? (
                                        <img 
                                          src={modalState.details.avatar_url || modalState.details.avatar} 
                                          alt="avatar" 
                                          className="w-full h-full object-cover" 
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl" style={{ background: "#77BEF0" }}>
                                          {(modalState.details.display_name || modalState.details.name || modalState.details.email || "U").charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                    <h4 className="text-xl font-semibold text-gray-900">
                                      {modalState.details.display_name || modalState.details.name || "Chưa có tên"}
                                    </h4>
                                    <p className="text-gray-500 text-sm mt-1">{modalState.details.email}</p>
                                  </div>

                                  {/* Info Grid */}
                                  <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                      <div className="text-xs text-gray-500 mb-1">Vai trò</div>
                                      <div className="font-medium text-gray-900">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={getRoleBadgeColor(modalState.details)}>
                                          {modalState.details.adminRole === "super_admin" && <FaCrown className="mr-1" />}
                                          {getRoleDisplay(modalState.details)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                      <div className="text-xs text-gray-500 mb-1">Trạng thái</div>
                                      <div className="font-medium text-gray-900">
                                        {modalState.details.is_active ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}>
                                            Đang hoạt động
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ backgroundColor: "#FFEBEE", color: "#C62828" }}>
                                            Đã khóa
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Details List */}
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between py-3 border-b border-gray-100">
                                      <div className="text-sm text-gray-500">ID người dùng</div>
                                      <div className="text-sm font-medium text-gray-900 text-right">
                                        {modalState.details.user_id || modalState.details.id || "N/A"}
                                      </div>
                                    </div>
                                    <div className="flex items-start justify-between py-3 border-b border-gray-100">
                                      <div className="text-sm text-gray-500">Tên hiển thị</div>
                                      <div className="text-sm font-medium text-gray-900 text-right">
                                        {modalState.details.display_name || modalState.details.name || "Chưa có"}
                                      </div>
                                    </div>
                                    <div className="flex items-start justify-between py-3 border-b border-gray-100">
                                      <div className="text-sm text-gray-500">Email</div>
                                      <div className="text-sm font-medium text-gray-900 text-right">
                                        {modalState.details.email || "N/A"}
                                      </div>
                                    </div>
                                    <div className="flex items-start justify-between py-3 border-b border-gray-100">
                                      <div className="text-sm text-gray-500">Đăng nhập lần cuối</div>
                                      <div className="text-sm font-medium text-gray-900 text-right">
                                        {modalState.details.last_login 
                                          ? new Date(modalState.details.last_login).toLocaleString('vi-VN')
                                          : "Chưa đăng nhập"}
                                      </div>
                                    </div>
                                    <div className="flex items-start justify-between py-3 border-b border-gray-100">
                                      <div className="text-sm text-gray-500">Ngày tạo tài khoản</div>
                                      <div className="text-sm font-medium text-gray-900 text-right">
                                        {modalState.details.created_at 
                                          ? new Date(modalState.details.created_at).toLocaleString('vi-VN')
                                          : "N/A"}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Statistics Section */}
                                  {modalState.details.statistics && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                      <h5 className="text-sm font-semibold text-gray-700 mb-4">Thống kê hoạt động</h5>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <div className="text-xs text-gray-500 mb-1">Bộ flashcard</div>
                                          <div className="text-lg font-semibold text-gray-900">
                                            {modalState.details.statistics.flashcard_sets || 0}
                                          </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <div className="text-xs text-gray-500 mb-1">Thẻ flashcard</div>
                                          <div className="text-lg font-semibold text-gray-900">
                                            {modalState.details.statistics.flashcard_cards || 0}
                                          </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <div className="text-xs text-gray-500 mb-1">Nhật ký</div>
                                          <div className="text-lg font-semibold text-gray-900">
                                            {modalState.details.statistics.diary_entries || 0}
                                          </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <div className="text-xs text-gray-500 mb-1">Phiên chat</div>
                                          <div className="text-lg font-semibold text-gray-900">
                                            {modalState.details.statistics.chat_sessions || 0}
                                          </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <div className="text-xs text-gray-500 mb-1">Từ vựng đã học</div>
                                          <div className="text-lg font-semibold text-gray-900">
                                            {modalState.details.statistics.vocab_learned || 0}
                                          </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <div className="text-xs text-gray-500 mb-1">Ngữ pháp đã học</div>
                                          <div className="text-lg font-semibold text-gray-900">
                                            {modalState.details.statistics.grammar_learned || 0}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Footer - Fixed */}
                                <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end rounded-b-xl">
                                  <button 
                                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
                                    onClick={() => setModalState({ open: false, type: null, user: null, details: null })}
                                  >
                                    Đóng
                                  </button>
                                </div>
                              </>
                            )}
                            {(modalState.type === "activate" || modalState.type === "deactivate") && (
                              <>
                                <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                                  <h3 className="text-xl font-bold" style={{ color: "#77BEF0" }}>
                                    {modalState.type === "activate" ? "Kích hoạt tài khoản" : "Vô hiệu hóa tài khoản"}
                                  </h3>
                                  <button 
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setModalState({ open: false, type: null, user: null, details: null })}
                                  >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 min-h-0">
                                  <div className="text-sm text-gray-700 mb-4">
                                    Bạn có chắc muốn {modalState.type === "activate" ? "kích hoạt" : "vô hiệu hóa"} tài khoản của <strong>{modalState.user?.display_name || modalState.user?.email}</strong>?
                                  </div>
                                  <textarea 
                                    className="w-full p-3 border rounded-md mb-4" 
                                    placeholder="Lý do (tùy chọn)" 
                                    value={reason} 
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                                <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-2 rounded-b-xl">
                                  <button 
                                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
                                    onClick={() => setModalState({ open: false, type: null, user: null, details: null })}
                                    disabled={actionLoading}
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
                                    onClick={() => {
                                      const targetId = modalState.user?.user_id ?? modalState.user?.id;
                                      if (!targetId) return;
                                      handleActivateDeactivate(targetId, modalState.type);
                                    }}
                                    disabled={actionLoading}
                                  >
                                    {actionLoading ? "Đang xử lý..." : "Xác nhận"}
                                  </button>
                                </div>
                              </>
                            )}
                            {modalState.type === "promote" && (
                              <>
                                <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                                  <h3 className="text-xl font-bold" style={{ color: "#77BEF0" }}>Thăng cấp làm Admin</h3>
                                  <button 
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setModalState({ open: false, type: null, user: null, details: null })}
                                  >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 min-h-0">
                                  <div className="text-sm text-gray-700 mb-4">
                                    Bạn có chắc muốn thăng cấp <strong>{modalState.user?.display_name || modalState.user?.email}</strong> làm Admin?
                                  </div>
                                </div>
                                <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-2 rounded-b-xl">
                                  <button 
                                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
                                    onClick={() => setModalState({ open: false, type: null, user: null, details: null })}
                                    disabled={actionLoading}
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
                                    onClick={() => {
                                      const targetId = modalState.user?.user_id ?? modalState.user?.id;
                                      if (!targetId) return;
                                      handlePromote(targetId, "content_manager");
                                    }}
                                    disabled={actionLoading}
                                  >
                                    {actionLoading ? "Đang xử lý..." : "Xác nhận"}
                                  </button>
                                </div>
                              </>
                            )}
                            {modalState.type === "demote" && (
                              <>
                                <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                                  <h3 className="text-xl font-bold" style={{ color: "#77BEF0" }}>Hủy quyền Admin</h3>
                                  <button 
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setModalState({ open: false, type: null, user: null, details: null })}
                                  >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 min-h-0">
                                  <div className="text-sm text-gray-700 mb-4">
                                    Bạn có chắc muốn hủy quyền admin của <strong>{modalState.user?.display_name || modalState.user?.email}</strong>?
                                    <br />
                                    <span className="text-orange-600 font-medium">Người dùng này sẽ trở thành người dùng thường.</span>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-2 rounded-b-xl">
                                  <button 
                                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
                                    onClick={() => setModalState({ open: false, type: null, user: null, details: null })}
                                    disabled={actionLoading}
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
                                    onClick={() => {
                                      const targetId = modalState.user?.user_id ?? modalState.user?.id;
                                      if (!targetId) return;
                                      handleDemote(targetId);
                                    }}
                                    disabled={actionLoading}
                                  >
                                    {actionLoading ? "Đang xử lý..." : "Xác nhận"}
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


