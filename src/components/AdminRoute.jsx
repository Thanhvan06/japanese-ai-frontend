import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api";

// Protect admin routes: call /api/auth/me and verify role === 'admin'
export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading"); // loading | ok | denied

  useEffect(() => {
    let mounted = true;
    (async function check() {
      try {
        const res = await api("/api/auth/me");
        if (!mounted) return;
        if (res.user?.role === "admin" || res.role === "admin") {
          setStatus("ok");
        } else {
          setStatus("denied");
        }
      } catch (err) {
        setStatus("denied");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (status === "loading") return null;
  if (status === "denied") return <Navigate to="/home" replace />;
  return children;
}



