import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../lib/auth.service.js";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setMessage("Token không hợp lệ. Vui lòng kiểm tra lại link.");
    }
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Token không hợp lệ");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setMessage("Đặt lại mật khẩu thành công!");
      setTimeout(() => navigate("/signin"), 2000);
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
          Đặt lại mật khẩu
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#77BEF0]"
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#77BEF0]"
            required
            minLength={6}
          />

          <button
            type="submit"
            disabled={loading || !token}
            className="bg-[#77BEF0] hover:bg-[#4a9ed3] text-white font-semibold py-2 rounded-md transition-all duration-200 disabled:opacity-70"
          >
            {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
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
          <button
            onClick={() => navigate("/signin")}
            className="text-[#77BEF0] hover:underline"
          >
            Quay lại đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
}

