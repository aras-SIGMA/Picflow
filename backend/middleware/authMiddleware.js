// middleware/authMiddleware.js
// Melindungi endpoint yang butuh login.
// Token yang dikirim frontend adalah access token Supabase Auth.
// Di sini token diverifikasi ke Supabase, lalu data user disimpan di req.user.

import supabase from "../config/supabase.js";

export default async function verifyToken(req, res, next) {
  // Ambil header "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  // Header tidak ada atau formatnya salah
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token is required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verifikasi token ke Supabase (juga memastikan user masih ada)
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Simpan user supabase (id = uuid) ke req.user agar dipakai endpoint
    req.user = {
      id: data.user.id,
      email: data.user.email,
      accessToken: token,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
