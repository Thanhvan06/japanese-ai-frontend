import { api } from "../lib/api.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Helper function for API calls with file upload
async function apiWithFile(path, method, formData) {
  const token = localStorage.getItem("token");
  
  // Debug: Log FormData contents
  console.log("Sending FormData:", {
    path,
    method,
    hasFile: formData.has("file"),
    hasTitle: formData.has("title"),
    hasContent: formData.has("content_jp"),
  });
  
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type, let browser set it with boundary for multipart/form-data
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMsg;
    try {
      const errorJson = JSON.parse(errorText);
      errorMsg = errorJson.message || errorJson.error || `Request failed: ${res.status}`;
    } catch {
      errorMsg = errorText || `Request failed: ${res.status}`;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

// Tạo nhật ký mới
export async function createDiary(title, content_jp, coverFile) {
  const formData = new FormData();
  formData.append("title", title || "");
  formData.append("content_jp", content_jp || "");
  if (coverFile) {
    formData.append("file", coverFile);
  }

  return apiWithFile("/api/diaries", "POST", formData);
}

// Lấy danh sách nhật ký
export async function listDiaries(month = null, year = null) {
  let path = "/api/diaries";
  const params = new URLSearchParams();
  if (month) params.append("month", month);
  if (year) params.append("year", year);
  if (params.toString()) path += `?${params.toString()}`;

  return api(path);
}

// Lấy chi tiết 1 nhật ký
export async function getDiary(id) {
  return api(`/api/diaries/${id}`);
}

// Cập nhật nhật ký
export async function updateDiary(id, title, content_jp, coverFile) {
  const formData = new FormData();
  formData.append("title", title || "");
  formData.append("content_jp", content_jp || "");
  if (coverFile) {
    formData.append("file", coverFile);
  }

  return apiWithFile(`/api/diaries/${id}`, "PUT", formData);
}

// Xóa nhật ký
export async function deleteDiary(id) {
  return api(`/api/diaries/${id}`, { method: "DELETE" });
}

