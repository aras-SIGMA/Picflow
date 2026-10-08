// server.js
// File utama: menyusun Express, memasang middleware, dan mendaftarkan router.

import express from "express";
import cors from "cors";
import "dotenv/config"; // load file .env
import categoryRouter from "./api/category.js";
import authRouter from "./api/auth.js";
import photoRouter from "./api/photo.js";
import errorHandler from "./middleware/errorHandler.js";
import pool from "./config/database.js";

const app = express();

// Izinkan frontend (domain lain) memanggil API ini (CORS)
app.use(cors());

// Agar Express bisa membaca body JSON dari request
app.use(express.json());

// Agar file di folder uploads/ bisa diakses lewat URL (misal /uploads/namafile.jpg)
app.use("/uploads", express.static("uploads"));

// ====== ENDPOINT UTAMA ======

// Endpoint utama untuk cek API berjalan
app.get("/api", (req, res) => {
  res.json({
    message: "PicFlow API is running",
  });
});

// Endpoint test koneksi database
app.get("/api/test/database", async (req, res, next) => {
  try {
    // Query paling sederhana untuk cek koneksi MySQL
    await pool.query("SELECT 1");

    res.json({
      message: "Database connection successful",
    });
  } catch (error) {
    next(error);
  }
});

// ====== ROUTER API ======

// Semua endpoint categories ada di api/category.js
app.use("/api/categories", categoryRouter);

// Semua endpoint auth yang ada di api/auth.js
app.use("/api/auth", authRouter);

// Semua endpoint photos yang ada di api/photo.js
app.use("/api/photos", photoRouter);

// ====== ERROR HANDLER ======

// Harus dipasang PALING AKHIR setelah semua route
app.use(errorHandler);

// ====== JALANKAN SERVER ======

const port = 8000;

app.listen(port, () => {
  console.log(`PicFlow server is running on http://localhost:${port}`);
});
