export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isNetworkError(error) {
  if (!error || typeof error !== "object") {
    return false;
  }
  const err = /** @type {{ name?: string; message?: string }} */ (error);
  const m = String(err.message || "");
  return (
    err.name === "TypeError" ||
    m.includes("Failed to fetch") ||
    m.includes("NetworkError") ||
    m.includes("Network request failed")
  );
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function apiErrorHint(error) {
  if (isNetworkError(error)) {
    return (
      `Không kết nối được API tại ${BASE_URL}. ` +
      "Hãy chạy backend (japanese-ai-backend: npm run dev). " +
      "Nếu API dùng cổng khác, đặt VITE_API_URL trong .env của frontend."
    );
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Lỗi không xác định";
}

export async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});
  // If body is FormData, we must not set Content-Type.
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.message || `Request failed: ${res.status}`);
  }
  return res.json();
}
