import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CloudBackground from "../components/CloudBackground";

// Hàm tiện ích gọi API
async function api(path, options = {}) {
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Trả về cả errors nếu có
    throw data;
  }
  return data;
}

const SignUp = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ displayName, email, password }),
      });
      localStorage.setItem("token", res.token);
      setMessage("Đăng ký thành công!");
      setTimeout(() => navigate("/signin"), 1500);
    } catch (err) {
      // Nếu backend trả về errors (Zod validation)
      if (err.errors && Array.isArray(err.errors)) {
        setMessage(err.errors.map(e => e.message).join(". "));
      } else if (err.message) {
        setMessage(err.message);
      } else {
        setMessage("Có lỗi xảy ra");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CloudBackground>
      <form
        onSubmit={handleSubmit}
        className="z-10 bg-white/90 p-8 rounded-xl shadow-xl flex flex-col gap-4 w-[320px] text-center animate-fadeIn"
      >
        <h2 className="text-2xl font-bold text-gray-800">Sign Up</h2>

        <input
          type="text"
          placeholder="Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-skyblue"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-skyblue"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-skyblue"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-skyblue hover:bg-[#5aa6db] text-white py-2 rounded-md font-medium transition-colors disabled:opacity-70"
        >
          {loading ? "Đang tạo..." : "Create Account"}
        </button>

        {message && (
          <p
            className={`text-sm mt-2 ${
              message.includes("thành công") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-sm text-gray-700">
          Already have an account?{" "}
          <Link to="/signin" className="text-blue-700 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </form>
    </CloudBackground>
  );
};

export default SignUp;
