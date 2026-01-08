export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});
  // If body is FormData, we must not set Content-Type; detect it
  const isForm = options.body instanceof FormData;
  if (!isForm) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.message || `Request failed: ${res.status}`);
  }
  return res.json();
}
