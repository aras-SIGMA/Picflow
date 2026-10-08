// api/auth.js
// Endpoint untuk register, login, dan mengambil profil user yang sedang login.
// Password di-hash dengan bcrypt, identitas user dikirim lewat JWT.

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import pool from "../config/database.js";
import verifyToken from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Secret key JWT dari .env
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// ====== (ZOD) ======

// Schema register: username, email, dan password punya aturan masing-masing
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Schema login: cukup cek tipe datanya saja
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// ====== HELPER ======

// Membuat JWT berisi id_user
function generateToken(id_user) {
  return jwt.sign({ id_user }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ====== ENDPOINT ======

// REGISTER: daftar user baru
router.post("/register", async (req, res, next) => {
  try {
    // Validasi input dengan Zod
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { username, email, password } = validation.data;

    // Cek apakah email sudah terdaftar
    const [existing] = await pool.query(
      "SELECT id_user FROM users WHERE email = ?",
      [email],
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Hash password (JANGAN pernah simpan password asli ke database)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru ke database
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword],
    );

    // Buat token agar user langsung bisa dipakai login
    const token = generateToken(result.insertId);

    res.status(201).json({
      message: "Register successful",
      data: {
        id_user: result.insertId,
        username,
        email,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// LOGIN: masuk dengan email dan password
router.post("/login", async (req, res, next) => {
  try {
    // Validasi input dengan Zod
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { email, password } = validation.data;

    // Cari user berdasarkan email
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    // Sengaja pesan errornya sama untuk email salah / password salah,
    // supaya orang lain tidak bisa menebak email mana yang terdaftar
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];

    // Bandingkan password input dengan hash di database
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Login berhasil: buat token JWT
    const token = generateToken(user.id_user);

    res.json({
      message: "Login successful",
      data: {
        id_user: user.id_user,
        username: user.username,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put(
  "/profile-picture",
  verifyToken,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const [users] = await pool.query(
        "SELECT profile_picture_public_id FROM users WHERE id_user = ?",
        [req.user.id_user],
      );

      if (users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        folder: "picflow/profile",
        resource_type: "image",
      });

      try {
        await pool.query(
          `UPDATE users
           SET profile_picture_url = ?, profile_picture_public_id = ?
           WHERE id_user = ?`,
          [uploadedImage.secure_url, uploadedImage.public_id, req.user.id_user],
        );
      } catch (databaseError) {
        await cloudinary.uploader
          .destroy(uploadedImage.public_id, { resource_type: "image" })
          .catch(() => {});

        throw databaseError;
      }

      const oldPublicId = users[0].profile_picture_public_id;

      if (oldPublicId) {
        await cloudinary.uploader
          .destroy(oldPublicId, { resource_type: "image" })
          .catch(() => {});
      }

      res.json({
        message: "Profile picture updated",
        data: {
          profile_picture_url: uploadedImage.secure_url,
        },
      });
    } catch (error) {
      next(error);
    } finally {
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }
    }
  },
);

// ME: profil user yang sedang login (butuh token)
router.get("/me", verifyToken, async (req, res, next) => {
  try {
    // req.user diisi oleh authMiddleware setelah token diverifikasi
    const [rows] = await pool.query(
      "SELECT id_user, username, email, created_at, profile_picture_url FROM users WHERE id_user = ?",
      [req.user.id_user],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile fetched",
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
