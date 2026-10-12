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
import userRouter from "./api/user.js";
import errorHandler from "./middleware/errorHandler.js";
import supabase from "./config/supabase.js";
import { subscribeLocalEvents } from "./lib/realtime.js";

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

// Endpoint Server-Sent Events (SSE) untuk real-time stream interaksi sosial (latency <= 250ms)
app.get("/api/realtime/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.write(`data: ${JSON.stringify({ event: "connected", timestamp: Date.now() })}\n\n`);

  const unsubscribe = subscribeLocalEvents(({ event, payload, timestamp }) => {
    res.write(
      `event: ${event}\ndata: ${JSON.stringify({ ...payload, timestamp })}\n\n`
    );
  });

  const keepAliveInterval = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(keepAliveInterval);
    unsubscribe();
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

// Semua endpoint users / social interaction ada di api/user.js
app.use("/api/users", userRouter);

// ====== ERROR HANDLER ======

// Harus dipasang PALING AKHIR setelah semua route
app.use(errorHandler);

// ====== JALANKAN SERVER ======

const port = 8000;

app.listen(port, () => {
  console.log(`PicFlow server is running on http://localhost:${port}`);
});
