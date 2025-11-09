import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Hàm gọi API tiện ích
  async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      const msg = await res.json().catch(() => ({}));
      throw new Error(msg.message || `Request failed: ${res.status}`);
    }
    return res.json();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Gọi API đăng ký
        const res = await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, displayName }),
        });
        localStorage.setItem("token", res.token);
        setMessage("Đăng ký thành công!");
        setTimeout(() => {
          setIsSignUp(false); // chuyển sang chế độ đăng nhập
        }, 1500);
      } else {
        // Gọi API đăng nhập
        const res = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem("token", res.token);
        setMessage("Đăng nhập thành công!");
        setTimeout(() => navigate("/home"), 1000); // chuyển về trang chính
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#77BEF0] flex items-center justify-center">
      {/* Cloud layers */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="clouds cloud1"></div>
        <div className="clouds cloud2"></div>
        <div className="clouds cloud3"></div>
      </div>

      {/* Auth Card */}
      <div className="relative z-10 bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 w-[350px] text-center animate-fadeIn">
        <h1 className="text-2xl font-bold mb-4 text-[#77BEF0]">
          {isSignUp ? "Sign Up" : "Sign In"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#77BEF0]"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#77BEF0]"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#77BEF0]"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-[#77BEF0] hover:bg-[#4a9ed3] text-white font-semibold py-2 rounded-md transition-all duration-200 disabled:opacity-70"
          >
            {loading
              ? "Processing..."
              : isSignUp
              ? "Sign Up"
              : "Sign In"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-3 text-sm ${
              message.includes("thành công")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <p className="mt-4 text-sm">
          {isSignUp ? "Already have an account?" : "Don’t have an account?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#77BEF0] hover:underline"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
