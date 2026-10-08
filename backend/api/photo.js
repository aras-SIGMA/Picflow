// api/photo.js
// Semua endpoint CRUD untuk photos + upload file dari local storage.
// Semua endpoint BUTUH login (verifyToken), dan user hanya bisa
// mengakses foto miliknya sendiri (filter id_user).

import express from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";
import pool from "../config/database.js";
import verifyToken from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Semua route di file ini wajib login
router.use(verifyToken);

// Schema validasi Zod
const photoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  id_category: z.coerce.number().int().positive("Category is required"),
});

// ====== HELPER ======

// Hapus file fisik di uploads/ (dipakai saat validasi gagal / update / delete)
// Dibungkus try-catch agar tidak crash kalau file sudah tidak ada
function deleteFile(imageUrl) {
  if (!imageUrl) return;
  // imageUrl tersimpan sebagai "/uploads/namafile.jpg"
  const filename = path.basename(imageUrl);
  const filepath = path.join("uploads", filename);
  try {
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch {
    // Abaikan: file mungkin sudah dihapus manual
  }
}

// CREATE: tambah foto baru + upload file image
// Form-data: title, id_category, description (opsional), image (file wajib)
router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    // File wajib ada (multer menyimpannya di req.file)
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    // Validasi field teks dengan Zod
    const validation = photoSchema.safeParse(req.body);
    if (!validation.success) {
      // Input salah -> hapus file yang terlanjur ter-upload agar tidak jadi sampah
      deleteFile(`/uploads/${req.file.filename}`);
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { title, description, id_category } = validation.data;

    // Cek apakah category-nya ada di database
    const [categories] = await pool.query(
      "SELECT id_category FROM categories WHERE id_category = ?",
      [id_category]
    );
    if (categories.length === 0) {
      deleteFile(`/uploads/${req.file.filename}`);
      return res.status(404).json({ message: "Category not found" });
    }

    // Simpan path relatif agar mudah diakses frontend
    const imageUrl = `/uploads/${req.file.filename}`;

    // id_user diambil dari token (req.user), BUKAN dari body, agar aman
    const [result] = await pool.query(
      "INSERT INTO photos (id_user, id_category, title, description, image_url) VALUES (?, ?, ?, ?, ?)",
      [req.user.id_user, id_category, title, description || null, imageUrl]
    );

    res.status(201).json({
      message: "Photo created",
      data: {
        id_photo: result.insertId,
        title,
        description: description || null,
        id_category,
        image_url: imageUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// READ: ambil semua foto milik user yang sedang login
router.get("/", async (req, res, next) => {
  try {
    // JOIN categories agar nama category ikut terkirim
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM photos p
       JOIN categories c ON c.id_category = p.id_category
       WHERE p.id_user = ?
       ORDER BY p.created_at DESC`,
      [req.user.id_user]
    );

    res.json({
      message: "Photos fetched",
      data: rows,
    });
  } catch (error) {
    next(error);
  }
});

// READ: ambil satu foto milik sendiri berdasarkan id
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM photos p
       JOIN categories c ON c.id_category = p.id_category
       WHERE p.id_photo = ? AND p.id_user = ?`,
      [id, req.user.id_user]
    );

    // Tidak ketemu = tidak ada ATAU bukan milik user ini
    if (rows.length === 0) {
      return res.status(404).json({ message: "Photo not found" });
    }

    res.json({
      message: "Photo fetched",
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE: ubah data foto, file image boleh diganti (opsional)
// Form-data: title, id_category, description (opsional), image (opsional)
router.put("/:id", upload.single("image"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // Validasi field teks dengan Zod
    const validation = photoSchema.safeParse(req.body);
    if (!validation.success) {
      // Kalau ada file baru tapi validasi gagal, hapus file baru itu
      if (req.file) deleteFile(`/uploads/${req.file.filename}`);
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { title, description, id_category } = validation.data;

    // Cek apakah foto-nya ada DAN milik user ini
    const [rows] = await pool.query(
      "SELECT * FROM photos WHERE id_photo = ? AND id_user = ?",
      [id, req.user.id_user]
    );
    if (rows.length === 0) {
      if (req.file) deleteFile(`/uploads/${req.file.filename}`);
      return res.status(404).json({ message: "Photo not found" });
    }

    // Cek apakah category baru-nya ada
    const [categories] = await pool.query(
      "SELECT id_category FROM categories WHERE id_category = ?",
      [id_category]
    );
    if (categories.length === 0) {
      if (req.file) deleteFile(`/uploads/${req.file.filename}`);
      return res.status(404).json({ message: "Category not found" });
    }

    const oldPhoto = rows[0];

    // Kalau user upload file baru, pakai itu; kalau tidak, pakai yang lama
    let imageUrl = oldPhoto.image_url;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    await pool.query(
      "UPDATE photos SET id_category = ?, title = ?, description = ?, image_url = ? WHERE id_photo = ?",
      [id_category, title, description || null, imageUrl, id]
    );

    // File lama baru dihapus setelah update database berhasil.
    // Jika query gagal, foto yang sedang dipakai user tetap aman.
    if (req.file) {
      deleteFile(oldPhoto.image_url);
    }

    res.json({
      message: "Photo updated",
      data: {
        id_photo: id,
        title,
        description: description || null,
        id_category,
        image_url: imageUrl,
      },
    });
  } catch (error) {
    // Kalau query database gagal setelah file baru disimpan oleh Multer,
    // hapus file baru tersebut agar tidak menjadi file yatim.
    if (req.file) deleteFile(`/uploads/${req.file.filename}`);
    next(error);
  }
});

// DELETE: hapus foto milik sendiri + file fisiknya
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // Cek apakah foto-nya ada DAN milik user ini sebelum dihapus
    const [rows] = await pool.query(
      "SELECT * FROM photos WHERE id_photo = ? AND id_user = ?",
      [id, req.user.id_user]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Photo not found" });
    }

    await pool.query("DELETE FROM photos WHERE id_photo = ?", [id]);

    // Hapus file fisik setelah row database terhapus
    deleteFile(rows[0].image_url);

    res.json({ message: "Photo deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
