// api/auth.js
// Endpoint register, login, profil user (Supabase Auth), dan upload foto profil.
// Identitas user = Supabase Auth user (uuid). Data publik disimpan di tabel profiles.

import express from "express";
import { z } from "zod";
import fs from "fs/promises";
import supabase from "../config/supabase.js";
import cloudinary from "../config/cloudinary.js";
import verifyToken from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ====== (ZOD) ======
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Bentuk respons user yang seragam untuk frontend lama (id_user dipetakan ke uuid).
function serializeProfile(profile, email) {
  return {
    id_user: profile.id,
    username: profile.username,
    email: email ?? null,
    full_name: profile.full_name,
    bio: profile.bio,
    // Frontend lama membaca profile_picture_url; sumbernya avatar_url.
    profile_picture_url: profile.avatar_url,
    created_at: profile.created_at,
  };
}

// ====== ENDPOINT ======

// REGISTER: buat user Supabase Auth. Trigger DB otomatis mengisi tabel profiles.
router.post("/register", async (req, res, next) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { username, email, password } = validation.data;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (error) {
      // Pesan Supabase untuk email yang sudah dipakai.
      const alreadyExists = /already|registered|exists/i.test(error.message);
      return res.status(alreadyExists ? 409 : 400).json({
        message: alreadyExists ? "Email already registered" : error.message,
      });
    }

    // Login langsung supaya frontend dapat access token.
    const { data: session, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      // User dibuat, tapi login otomatis gagal: minta user login manual.
      return res.status(201).json({
        message: "Register successful, please login",
        data: { id_user: data.user.id, username, email, token: null },
      });
    }

    res.status(201).json({
      message: "Register successful",
      data: {
        id_user: data.user.id,
        username,
        email,
        token: session.session.access_token,
        refresh_token: session.session.refresh_token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// LOGIN: autentikasi lewat Supabase Auth.
router.post("/login", async (req, res, next) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { email, password } = validation.data;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Pesan seragam untuk email/password salah.
    if (error) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", data.user.id)
      .maybeSingle();

    res.json({
      message: "Login successful",
      data: {
        id_user: data.user.id,
        username: profile?.username || data.user.email,
        email: data.user.email,
        token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PROFILE PICTURE: upload ke Cloudinary lalu simpan ke profiles.
router.put(
  "/profile-picture",
  verifyToken,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("avatar_url, avatar_public_id")
        .eq("id", req.user.id)
        .maybeSingle();

      if (!profiles) {
        return res.status(404).json({ message: "User not found" });
      }

      const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        folder: "picflow/profile",
        resource_type: "image",
        transformation: [
          {
            width: 256,
            height: 256,
            crop: "fill",
            gravity: "face",
            fetch_format: "auto",
            quality: "auto",
          },
        ],
      });

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: uploadedImage.secure_url,
          avatar_public_id: uploadedImage.public_id,
        })
        .eq("id", req.user.id);

      if (updateError) {
        // Rollback aset Cloudinary bila update database gagal.
        await cloudinary.uploader
          .destroy(uploadedImage.public_id, { resource_type: "image" })
          .catch(() => {});
        throw new Error(updateError.message);
      }

      if (profiles.avatar_public_id) {
        await cloudinary.uploader
          .destroy(profiles.avatar_public_id, { resource_type: "image" })
          .catch(() => {});
      }

      res.json({
        message: "Profile picture updated",
        data: { profile_picture_url: uploadedImage.secure_url },
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

// ME: profil user yang sedang login.
router.get("/me", verifyToken, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, bio, avatar_url, created_at")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) return next(new Error(error.message));
    if (!data) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Profile fetched",
      data: serializeProfile(data, req.user.email),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
