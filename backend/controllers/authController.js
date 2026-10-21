// controllers/authController.js
// Penanganan request & response autentikasi & profil akun.

import { z } from "zod";
import fs from "fs/promises";
import supabase, { createAuthClient } from "../config/supabase.js";
import cloudinary from "../config/cloudinary.js";
import { userModel, serializeProfile } from "../models/userModel.js";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const authController = {
  async register(req, res, next) {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.issues.map((issue) => issue.message),
        });
      }

      const { username, email, password } = validation.data;

      const { data: existingProfile, error: profileErr } =
        await userModel.findProfileByUsername(username);

      if (profileErr) return next(new Error(profileErr.message));
      if (existingProfile) {
        return res.status(409).json({ message: "Username already taken" });
      }

      const { data, error } = await userModel.createAuthUser({
        email,
        password,
        username,
      });

      if (error) {
        const alreadyExists = /already|registered|exists/i.test(error.message);
        return res.status(alreadyExists ? 409 : 400).json({
          message: alreadyExists ? "Email already registered" : error.message,
        });
      }

      const authClient = createAuthClient();
      const { data: session, error: signInError } =
        await authClient.auth.signInWithPassword({ email, password });

      if (signInError) {
        return res.status(201).json({
          message: "Register successful, please login",
          data: { id_user: data.user.id, username, email, role: "user", token: null },
        });
      }

      res.status(201).json({
        message: "Register successful",
        data: {
          id_user: data.user.id,
          username,
          email,
          role: "user",
          token: session.session.access_token,
          refresh_token: session.session.refresh_token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.issues.map((issue) => issue.message),
        });
      }

      const { email, password } = validation.data;

      const authClient = createAuthClient();
      const { data, error } = await authClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const { data: profile } = await userModel.findProfileById(data.user.id);

      res.json({
        message: "Login successful",
        data: {
          id_user: data.user.id,
          username: profile?.username || data.user.email,
          email: data.user.email,
          role: profile?.role === "admin" ? "admin" : "user",
          token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfilePicture(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const { data: profiles } = await userModel.findProfileById(req.user.id);
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

      const { error: updateError } = await userModel.updateAvatar(req.user.id, {
        avatarUrl: uploadedImage.secure_url,
        avatarPublicId: uploadedImage.public_id,
      });

      if (updateError) {
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

  async getMe(req, res, next) {
    try {
      const { data, error } = await userModel.findProfileById(req.user.id);
      if (error) return next(new Error(error.message));
      if (!data) return res.status(404).json({ message: "User not found" });

      res.json({
        message: "Profile fetched",
        data: serializeProfile(data, req.user.email),
      });
    } catch (error) {
      next(error);
    }
  },
};
