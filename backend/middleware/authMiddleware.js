// middleware/authMiddleware.js
// Middleware untuk melindungi endpoint yang butuh login.
// Cara kerjanya: baca header Authorization, verifikasi token JWT,
// lalu simpan data user di req.user agar bisa dipakai endpoint berikutnya.

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

export default function verifyToken(req, res, next) {
  // Ambil header "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  // Header tidak ada atau formatnya salah
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token is required" });
  }

  // Potong bagian "Bearer " agar tersisa token-nya saja
  const token = authHeader.split(" ")[1];

  try {
    // Verifikasi token: kalau tidak valid/kadaluarsa, akan throw error
    const decoded = jwt.verify(token, JWT_SECRET);

    // Simpan payload (id_user) ke req.user agar dipakai endpoint tujuan
    req.user = decoded;

    next(); // lanjut ke endpoint
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
