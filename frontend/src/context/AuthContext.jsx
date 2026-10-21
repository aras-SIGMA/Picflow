// src/context/AuthContext.jsx
// Simpan user + token global. Dipakai Navbar & semua page privat.
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, getToken, setToken, clearToken, login as apiLogin, register as apiRegister } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // CHECK: saat reload, cek token masih valid via GET /auth/me
  useEffect(() => {
    async function init() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await getMe();
        setUser(res.data);
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // LOGIN: POST /auth/login lalu simpan token + user
  async function login(payload) {
    const res = await apiLogin(payload);
    setToken(res.data.token);
    setUser({
      id_user: res.data.id_user,
      username: res.data.username,
      email: res.data.email,
      role: res.data.role || "user",
    });
    return res;
  }

  // REGISTER: POST /auth/register lalu simpan token + user
  async function register(payload) {
    const res = await apiRegister(payload);
    setToken(res.data.token);
    setUser({
      id_user: res.data.id_user,
      username: res.data.username,
      email: res.data.email,
      role: res.data.role || "user",
    });
    return res;
  }

  // LOGOUT: hapus token, kembali ke /login
  function logout() {
    clearToken();
    setUser(null);
    router.push("/login");
  }

  // REFRESH: ambil data profil terbaru
  async function refreshUser() {
    try {
      const res = await getMe();
      setUser(res.data);
      return res.data;
    } catch {
      return null;
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
