import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../lib/auth.service.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await forgotPassword(email);
      setMessage("Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu");
      setTimeout(() => navigate("/signin"), 3000);
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
          Quên mật khẩu
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Nhập email của bạn để nhận link đặt lại mật khẩu
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#77BEF0]"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-[#77BEF0] hover:bg-[#4a9ed3] text-white font-semibold py-2 rounded-md transition-all duration-200 disabled:opacity-70"
          >
            {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-3 text-sm ${
              message.includes("thành công") || message.includes("gửi")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <p className="mt-4 text-sm">
          <Link to="/signin" className="text-[#77BEF0] hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

