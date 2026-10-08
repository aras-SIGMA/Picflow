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

  // Duplikat data (kolom unique di MySQL), misal nama category sudah dipakai
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      message: "Data already exists",
    });
  }

  console.error("Server error:", err.message);

  // Jangan tampilkan detail error internal ke client (bisa bocorkan info sensitif)
  res.status(500).json({
    message: "Internal server error",
  });
}
