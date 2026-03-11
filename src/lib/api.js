const BASE_URL = "http://localhost:4000";

export async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export { BASE_URL };
