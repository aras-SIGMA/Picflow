// api/category.js
// Semua endpoint CRUD untuk categories.
// Router dipakai supaya endpoint bisa dikelompokkan per fitur dalam file terpisah.

import express from "express";
import { z } from "zod";
import pool from "../config/database.js";

const router = express.Router();

// Schema validasi Zod: name wajib diisi dan harus berupa teks
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

// CREATE: tambah category baru
router.post("/", async (req, res, next) => {
  try {
    // Validasi input dengan Zod
    const validation = categorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { name } = validation.data;

    // Tanda "?" dipakai untuk mencegah SQL injection
    const [result] = await pool.query(
      "INSERT INTO categories (name) VALUES (?)",
      [name]
    );

    res.status(201).json({
      message: "Category created",
      data: { id_category: result.insertId, name },
    });
  } catch (error) {
    // Error diteruskan ke errorHandler supaya ditangani di satu tempat
    next(error);
  }
});

// READ: ambil semua categories
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM categories ORDER BY name");

    res.json({
      message: "Categories fetched",
      data: rows,
    });
  } catch (error) {
    next(error);
  }
});

// READ: ambil satu category berdasarkan id
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const [rows] = await pool.query(
      "SELECT * FROM categories WHERE id_category = ?",
      [id]
    );

    // Cek apakah category-nya ada di database
    if (rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({
      message: "Category fetched",
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE: ubah category berdasarkan id
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // Validasi input dengan Zod
    const validation = categorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { name } = validation.data;

    // Cek apakah category-nya ada sebelum di-update
    const [rows] = await pool.query(
      "SELECT * FROM categories WHERE id_category = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    await pool.query("UPDATE categories SET name = ? WHERE id_category = ?", [
      name,
      id,
    ]);

    res.json({
      message: "Category updated",
      data: { id_category: id, name },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE: hapus category berdasarkan id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // Cek apakah category-nya ada sebelum dihapus
    const [rows] = await pool.query(
      "SELECT * FROM categories WHERE id_category = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    await pool.query("DELETE FROM categories WHERE id_category = ?", [id]);

    res.json({ message: "Category deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
