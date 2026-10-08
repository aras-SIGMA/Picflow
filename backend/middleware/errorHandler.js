// middleware/errorHandler.js
// Middleware untuk menangani semua error dari endpoint.
// Dipasang sekali di server.js, jadi setiap endpoint cukup memanggil
// next(error) tanpa perlu menulis response error sendiri.

//(err, req, res, next) — urutan parameternya penting agar Express
//mengenali ini sebagai error handler.
export default function errorHandler(err, req, res, next) {
  // Error dari Multer (file terlalu besar, dll) -> kirim 400 agar jelas di client
  if (err.name === "MulterError") {
    return res.status(400).json({
      message: err.code === "LIMIT_FILE_SIZE" ? "Image too large (max 5MB)" : err.message,
    });
  }

  // Error dari fileFilter kita (bukan gambar) -> kirim 400 juga
  if (err.message === "Only image files are allowed (jpg, jpeg, png, webp, gif)") {
    return res.status(400).json({ message: err.message });
  }

  // Duplikat data (unique constraint PostgreSQL, mis. nama category sudah dipakai)
  if (err.code === "23505") {
    return res.status(409).json({
      message: "Data already exists",
    });
  }

  // Melanggar foreign key (mis. kategori masih dipakai foto)
  if (err.code === "23503") {
    return res.status(409).json({
      message: "Data is still referenced by other records",
    });
  }

  console.error("Server error:", err.message);

  // Jangan tampilkan detail error internal ke client (bisa bocorkan info sensitif)
  res.status(500).json({
    message: "Internal server error",
  });
}
