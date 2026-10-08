// src/lib/api.js
// Satu pintu koneksi Next.js -> Express.
// Semua fetch ke NEXT_PUBLIC_API_URL, token JWT disimpan di localStorage.

// NEXT_PUBLIC_API_URL boleh berupa "http://localhost:8000" atau nilai lama
// "http://localhost:8000/api". Semua endpoint di bawah tetap memakai prefix /api.
const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const API_URL = configuredApiUrl.endsWith("/api")
  ? configuredApiUrl
  : `${configuredApiUrl}/api`;
const FILE_URL = configuredApiUrl.endsWith("/api")
  ? configuredApiUrl.slice(0, -4)
  : configuredApiUrl;

// ====== TOKEN ======
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("picflow_token");
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem("picflow_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("picflow_token");
}

// ====== FETCH DASAR ======
// Otomatis pasang Authorization: Bearer <token>, kecuali opt.auth=false
async function apiFetch(path, { method = "GET", body, formData, auth = true } = {}) {
  const headers = {};
  if (!(body instanceof FormData) && !formData && body) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: formData || (body instanceof FormData ? body : body ? JSON.stringify(body) : undefined),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // Backend selalu JSON, tapi jaga-jaga kalau kosong
  }
  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.errors = data?.errors;
    throw err;
  }
  return data;
}

// Ubah "/uploads/xxx.jpg" jadi URL penuh ke Express
export function fileUrl(imageUrl) {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${FILE_URL}${imageUrl}`;
}

// ====== AUTH ======
export const register = (payload) =>
  apiFetch("/auth/register", { method: "POST", body: payload, auth: false });
export const login = (payload) =>
  apiFetch("/auth/login", { method: "POST", body: payload, auth: false });
export const getMe = () => apiFetch("/auth/me");
export const uploadProfilePicture = (formData) =>
  apiFetch("/auth/profile-picture", { method: "PUT", formData });

// ====== PHOTOS ======
export const listPhotos = () => apiFetch("/photos");
export const getPhoto = (id) => apiFetch(`/photos/${id}`);
export const createPhoto = (formData) =>
  apiFetch("/photos", { method: "POST", formData });
export const updatePhoto = (id, formData) =>
  apiFetch(`/photos/${id}`, { method: "PUT", formData });
export const deletePhoto = (id) =>
  apiFetch(`/photos/${id}`, { method: "DELETE" });

// ====== CATEGORIES ======
export const listCategories = () => apiFetch("/categories", { auth: false });
export const createCategory = (name) =>
  apiFetch("/categories", { method: "POST", body: { name } });
export const deleteCategory = (id) =>
  apiFetch(`/categories/${id}`, { method: "DELETE" });
