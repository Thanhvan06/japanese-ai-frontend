const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Gọi API không cần token
 */
async function apiPublic(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Gửi yêu cầu quên mật khẩu
 * @param {string} email - Email người dùng
 */
export async function forgotPassword(email) {
  return apiPublic("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/**
 * Đặt lại mật khẩu với token
 * @param {string} token - Reset token từ email
 * @param {string} password - Mật khẩu mới
 */
export async function resetPassword(token, password) {
  return apiPublic("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

