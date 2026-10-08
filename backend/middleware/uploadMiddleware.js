// middleware/uploadMiddleware.js
// Konfigurasi Multer untuk menerima file foto dari local storage kita.
// Hasil upload disimpan di folder uploads/ dan nama file dibuat unik
// agar tidak tabrakan.

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pastikan folder uploads/ selalu ada (kalau belum, buat otomatis)
const uploadDir = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Atur tempat simpan + nama file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Ambil ekstensi asli (.jpg, .png, dst) lalu bikin nama unik
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Hanya izinkan file gambar (tolak file lain seperti .exe, .pdf)
function fileFilter(req, file, cb) {
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".tif", ".tiff"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowed.includes(ext) || file.mimetype === "image/tiff") {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpg, jpeg, png, webp, gif, tiff)"));
  }
}

// Batas ukuran 25MB sesuai spesifikasi PRD
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Export agar bisa dipakai di api/photo.js sebagai upload.single("image")
export default upload;
