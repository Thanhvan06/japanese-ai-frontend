import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  // Hàm gọi API tiện ích
  async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      let msg;
      try {
        msg = await res.json();
      } catch (e) {
        msg = { message: `Request failed with status ${res.status}` };
      }
      
      if (msg.errors && Array.isArray(msg.errors) && msg.errors.length > 0) {
        const errorMessages = msg.errors.map(e => {
          const field = e.path && e.path.length > 0 ? e.path.join(".") : "field";
          return `${field}: ${e.message}`;
        }).join(". ");
        throw new Error(errorMessages);
      }
      
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
        // Validate trước khi gửi
        if (!email || !password || !displayName) {
          setMessage("Vui lòng điền đầy đủ thông tin");
          setLoading(false);
          return;
        }
        
        // Gọi API đăng ký
        console.log("Registering with:", { email, displayName, passwordLength: password.length });
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
        // lưu token và user public (nếu backend trả về user)
        if (res.token) localStorage.setItem("token", res.token);
        if (res.user) localStorage.setItem("user", JSON.stringify(res.user));
        setMessage("Đăng nhập thành công!");
        // Xử lý redirect sau khi đăng nhập
        setTimeout(() => {
          const role = res.user?.role || (JSON.parse(localStorage.getItem("user") || "{}").role);
          
          // Nếu có returnUrl và user là admin → redirect đến returnUrl
          if (returnUrl && role === "admin") {
            navigate(returnUrl);
          } 
          // Nếu là admin → chuyển hướng đến admin dashboard
          else if (role === "admin") {
            navigate("/admin");
          } 
          // Nếu có returnUrl nhưng không phải admin → về home
          else if (returnUrl) {
            navigate("/home");
          }
          // Mặc định → về home
          else {
            navigate("/home");
          }
        }, 1000);
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
          {isSignUp ? "Đăng ký" : "Đăng nhập"}
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
          {isSignUp && (
            <p className="text-xs text-gray-600 text-left">
              Mật khẩu phải có: tối thiểu 6 ký tự, 1 chữ thường, 1 chữ hoa, 1 ký tự đặc biệt
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#77BEF0] hover:bg-[#4a9ed3] text-white font-semibold py-2 rounded-md transition-all duration-200 disabled:opacity-70"
          >
            {loading
              ? "Processing..."
              : isSignUp
              ? "Đăng ký"
              : "Đăng nhập"}
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

        {!isSignUp && (
          <p className="mt-2 text-sm">
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-[#77BEF0] hover:underline"
            >
              Quên mật khẩu?
            </button>
          </p>
        )}

        <p className="mt-4 text-sm">
          {isSignUp ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#77BEF0] hover:underline"
          >
            {isSignUp ? "Đăng nhập" : "Đăng ký"}
          </button>
        </p>
      </div>
    </div>
  );
}
