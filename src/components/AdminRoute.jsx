import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";

// Protect admin routes: call /api/auth/me and verify role === 'admin'
export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading"); // loading | ok | denied | not_logged_in
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async function check() {
      // Kiểm tra token trước
      const token = localStorage.getItem("token");
      if (!token) {
        if (!mounted) return;
        setStatus("not_logged_in");
        return;
      }

      try {
        const res = await api("/api/auth/me");
        if (!mounted) return;
        if (res.user?.role === "admin" || res.role === "admin") {
          setStatus("ok");
        } else {
          setStatus("denied");
        }
      } catch (err) {
        // Nếu lỗi 401 (Unauthorized) hoặc không có token → chưa login
        if (err.message?.includes("401") || err.message?.includes("Thiếu token") || err.message?.includes("Token không hợp lệ")) {
          if (!mounted) return;
          setStatus("not_logged_in");
        } else {
          if (!mounted) return;
          setStatus("denied");
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }
  
  // Chưa login → redirect đến signin với returnUrl
  if (status === "not_logged_in") {
    return <Navigate to={`/signin?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  // Không phải admin → redirect đến home
  if (status === "denied") {
    return <Navigate to="/home" replace />;
  }
  
  return children;
}



