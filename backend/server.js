// server.js
// File utama: menyusun Express, memasang middleware, dan mendaftarkan router.

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

import categoryRouter from "./api/category.js";
import authRouter from "./api/auth.js";
import photoRouter from "./api/photo.js";
import errorHandler from "./middleware/errorHandler.js";
import supabase from "./config/supabase.js";

const app = express();

// Izinkan frontend (domain lain) memanggil API ini (CORS)
app.use(cors());

// Agar Express bisa membaca body JSON dari request
app.use(express.json());

// ====== ENDPOINT UTAMA ======

// Endpoint utama untuk cek API berjalan
app.get("/api", (req, res) => {
  res.json({
    message: "PicFlow API is running",
  });
});

// Endpoint test koneksi database Supabase
app.get("/api/test/database", async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true });

    if (error) throw new Error(error.message);

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
