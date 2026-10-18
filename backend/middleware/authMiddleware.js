// middleware/authMiddleware.js
// Melindungi endpoint yang butuh login.
// Token yang dikirim frontend adalah access token Supabase Auth.
// Di sini token diverifikasi ke Supabase, lalu data user disimpan di req.user.
// Role (admin/user) SELALU di-query ulang dari tabel profiles: nilai dari
// klien tidak pernah dipercaya (anti privilege escalation).

import supabase, { createAuthClient } from "../config/supabase.js";

// Ambil role dari tabel profiles. Default "user" bila profil/kolom tidak ada.
async function fetchRole(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return "user";
  return data.role === "admin" ? "admin" : "user";
}

export default async function verifyToken(req, res, next) {
  // Ambil header "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  // Header tidak ada atau formatnya salah
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token is required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verifikasi token ke Supabase via isolated auth client agar client master tidak tercemar session
    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const role = await fetchRole(data.user.id);

    // Simpan user supabase (id = uuid) ke req.user agar dipakai endpoint
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role,
      accessToken: token,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Middleware otorisasi khusus admin. Harus dipasang SETELAH verifyToken.
export function verifyAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Middleware autentikasi opsional: jika token ada dan valid, set req.user.
// Jika tidak ada / invalid, biarkan req.user = null tanpa melempar error 401.
export async function optionalToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.getUser(token);
    if (!error && data?.user) {
      const role = await fetchRole(data.user.id);
      req.user = {
        id: data.user.id,
        email: data.user.email,
        role,
        accessToken: token,
      };
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
}
