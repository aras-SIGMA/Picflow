// api/photo.js
// CRUD photos: upload gambar ke Cloudinary, ekstrak metadata EXIF, lalu
// simpan barisnya ke tabel Supabase (public.photos).
// Semua endpoint wajib login (verifyToken) dan user hanya bisa mengakses
// foto miliknya sendiri (filter user_id = uuid Supabase).

import express from "express";
import { z } from "zod";
import fs from "fs/promises";
import exifr from "exifr";
import supabase from "../config/supabase.js";
import cloudinary from "../config/cloudinary.js";
import verifyToken, { optionalToken } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { broadcastEvent } from "../lib/realtime.js";

const router = express.Router();

const photoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  id_category: z.coerce.number().int().positive("Category is required"),
});

// ====== HELPER ======

function getCloudinaryDeliveryUrl(imageUrl, width) {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  if (!imageUrl.includes("/upload/")) return imageUrl;
  return imageUrl.replace(
    "/upload/",
    `/upload/f_auto,q_auto,w_${width},c_limit/`
  );
}

// Petakan baris Supabase ke bentuk seragam untuk frontend.
function serializePhoto(row, categoryName, isLiked = false) {
  const isCloudinary =
    typeof row.image_url === "string" &&
    row.image_url.includes("res.cloudinary.com");

  const likesCount = Array.isArray(row.likes)
    ? (row.likes[0]?.count ?? 0)
    : typeof row.likes_count === "number"
      ? row.likes_count
      : 0;

  const commentsCount = Array.isArray(row.comments)
    ? (row.comments[0]?.count ?? 0)
    : typeof row.comments_count === "number"
      ? row.comments_count
      : 0;

  const creator = row.profiles
    ? {
        id_user: row.profiles.id,
        username: row.profiles.username,
        avatar_url: row.profiles.avatar_url,
      }
    : null;

  return {
    id_photo: row.id,
    id_user: row.user_id,
    id_category: row.category_id,
    category_name: categoryName ?? row.category_name ?? row.categories?.name ?? null,
    title: row.title,
    description: row.description,
    image_url: row.image_url,
    thumbnail_url: isCloudinary
      ? getCloudinaryDeliveryUrl(row.image_url, 400)
      : row.image_url,
    medium_url: isCloudinary
      ? getCloudinaryDeliveryUrl(row.image_url, 1080)
      : row.image_url,
    high_res_url: isCloudinary
      ? getCloudinaryDeliveryUrl(row.image_url, 2048)
      : row.image_url,
    cloudinary_public_id: row.cloudinary_public_id,
    width: row.width,
    height: row.height,
    camera_make: row.camera_make,
    camera_model: row.camera_model,
    lens: row.lens,
    focal_length: row.focal_length,
    aperture: row.aperture,
    shutter_speed: row.shutter_speed,
    iso: row.iso,
    taken_at: row.taken_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    likes_count: likesCount,
    comments_count: commentsCount,
    is_liked: Boolean(isLiked),
    creator,
  };
}

// Ekstrak metadata EXIF dari file. Gagal parse -> kembalikan objek kosong (tidak fatal).
async function extractExif(filePath) {
  try {
    const data = await exifr.parse(filePath, {
      pick: [
        "Make",
        "Model",
        "LensModel",
        "FocalLength",
        "FNumber",
        "ExposureTime",
        "ISO",
        "DateTimeOriginal",
      ],
    });
    if (!data) return {};

    const focal =
      data.FocalLength != null ? `${Math.round(data.FocalLength)}mm` : null;
    const aperture =
      data.FNumber != null ? `f/${Number(data.FNumber)}` : null;

    let shutter = null;
    if (data.ExposureTime != null) {
      shutter =
        data.ExposureTime < 1
          ? `1/${Math.round(1 / data.ExposureTime)}s`
          : `${data.ExposureTime}s`;
    }

    let takenAt = null;
    if (data.DateTimeOriginal) {
      const d = new Date(data.DateTimeOriginal);
      if (!Number.isNaN(d.getTime())) {
        takenAt = d.toISOString();
      }
    }

    return {
      camera_make: data.Make ? String(data.Make).trim() : null,
      camera_model: data.Model ? String(data.Model).trim() : null,
      lens: data.LensModel ? String(data.LensModel).trim() : null,
      focal_length: focal,
      aperture,
      shutter_speed: shutter,
      iso: typeof data.ISO === "number" ? data.ISO : null,
      taken_at: takenAt,
    };
  } catch {
    return {};
  }
}

// Hapus file temporary sisa upload Multer.
async function cleanupTemp(file) {
  if (file?.path) await fs.unlink(file.path).catch(() => {});
}

// Upload file lokal (hasil Multer) ke Cloudinary, lalu hapus temp-nya.
// Sertakan transformasi eager 3 breakpoint (400px, 1080px, 2048px) format WebP/AVIF otomatis.
async function uploadToCloudinary(file, folder) {
  const result = await cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: "image",
    eager: [
      { width: 400, crop: "limit", fetch_format: "auto", quality: "auto" },
      { width: 1080, crop: "limit", fetch_format: "auto", quality: "auto" },
      { width: 2048, crop: "limit", fetch_format: "auto", quality: "auto" },
    ],
    eager_async: false,
  });
  await cleanupTemp(file);
  return result;
}

const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment cannot exceed 1000 characters"),
});

const critiqueSchema = z.object({
  rating_composition: z.coerce
    .number()
    .int()
    .min(1, "Rating komposisi minimal 1")
    .max(5, "Rating komposisi maksimal 5"),
  rating_lighting: z.coerce
    .number()
    .int()
    .min(1, "Rating pencahayaan minimal 1")
    .max(5, "Rating pencahayaan maksimal 5"),
  rating_color: z.coerce
    .number()
    .int()
    .min(1, "Rating warna minimal 1")
    .max(5, "Rating warna maksimal 5"),
  rating_concept: z.coerce
    .number()
    .int()
    .min(1, "Rating konsep minimal 1")
    .max(5, "Rating konsep maksimal 5"),
  strengths: z
    .string()
    .trim()
    .min(3, "Poin kekuatan minimal 3 karakter")
    .max(2000, "Poin kekuatan maksimal 2000 karakter"),
  improvements: z
    .string()
    .trim()
    .min(3, "Saran perbaikan minimal 3 karakter")
    .max(2000, "Saran perbaikan maksimal 2000 karakter"),
});

function calculateCritiqueStats(critiques) {
  if (!critiques || critiques.length === 0) {
    return {
      total_critiques: 0,
      avg_composition: 0,
      avg_lighting: 0,
      avg_color: 0,
      avg_concept: 0,
      overall_avg: 0,
    };
  }
  const sum = critiques.reduce(
    (acc, c) => {
      acc.composition += c.rating_composition;
      acc.lighting += c.rating_lighting;
      acc.color += c.rating_color;
      acc.concept += c.rating_concept;
      return acc;
    },
    { composition: 0, lighting: 0, color: 0, concept: 0 }
  );
  const n = critiques.length;
  const avg_composition = +(sum.composition / n).toFixed(1);
  const avg_lighting = +(sum.lighting / n).toFixed(1);
  const avg_color = +(sum.color / n).toFixed(1);
  const avg_concept = +(sum.concept / n).toFixed(1);
  const overall_avg = +(
    (avg_composition + avg_lighting + avg_color + avg_concept) /
    4
  ).toFixed(1);

  return {
    total_critiques: n,
    avg_composition,
    avg_lighting,
    avg_color,
    avg_concept,
    overall_avg,
  };
}

// ====== ROUTES ======

// CREATE: tambah foto baru + upload ke Cloudinary + EXIF.
router.post("/", verifyToken, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const validation = photoSchema.safeParse(req.body);
    if (!validation.success) {
      await cleanupTemp(req.file);
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { title, description, id_category } = validation.data;

    // Pastikan kategori ada.
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("id", id_category)
      .maybeSingle();

    if (!category) {
      await cleanupTemp(req.file);
      return res.status(404).json({ message: "Category not found" });
    }

    // EXIF dibaca dari file sebelum file dihapus oleh uploadToCloudinary.
    const exif = await extractExif(req.file.path);

    const uploadedImage = await uploadToCloudinary(req.file, "picflow/photos");

    const { data, error } = await supabase
      .from("photos")
      .insert({
        user_id: req.user.id,
        category_id: id_category,
        title,
        description: description || null,
        image_url: uploadedImage.secure_url,
        cloudinary_public_id: uploadedImage.public_id,
        width: uploadedImage.width,
        height: uploadedImage.height,
        aspect_ratio: uploadedImage.aspect_ratio
          ? Number(uploadedImage.aspect_ratio.toFixed(2))
          : null,
        ...exif,
      })
      .select("*, categories(name), profiles(id, username, avatar_url)")
      .single();

    if (error) {
      // Rollback aset Cloudinary bila insert gagal.
      await cloudinary.uploader
        .destroy(uploadedImage.public_id, { resource_type: "image" })
        .catch(() => {});
      return next(new Error(error.message));
    }

    res.status(201).json({
      message: "Photo created",
      data: serializePhoto(data, data.categories?.name, false),
    });
  } catch (error) {
    await cleanupTemp(req.file);
    next(error);
  }
});

// READ: feed foto (Explore komunitas, Following, atau My photos).
router.get("/", optionalToken, async (req, res, next) => {
  try {
    const feed = req.query.feed || "explore";
    const categoryId = req.query.category_id || req.query.id_category;
    const targetUserId = req.query.user_id;

    let query = supabase
      .from("photos")
      .select(
        "*, categories(name), profiles(id, username, avatar_url), likes(count), comments(count)"
      )
      .order("created_at", { ascending: false });

    if (feed === "my" || feed === "mine") {
      if (!req.user) {
        return res.status(401).json({ message: "Login required to access your photos" });
      }
      query = query.eq("user_id", req.user.id);
    } else if (feed === "following") {
      if (!req.user) {
        return res.status(401).json({ message: "Login required to access following feed" });
      }
      // Ambil daftar user yang di-follow oleh user saat ini
      const { data: followRows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", req.user.id);

      const followingIds = (followRows || []).map((r) => r.following_id);
      if (followingIds.length === 0) {
        return res.json({ message: "Photos fetched", data: [] });
      }
      query = query.in("user_id", followingIds);
    } else if (targetUserId) {
      query = query.eq("user_id", targetUserId);
    }

    if (categoryId && categoryId !== "all") {
      query = query.eq("category_id", Number(categoryId));
    }

    const { data, error } = await query;
    if (error) return next(new Error(error.message));

    // Ambil daftar like milik user saat ini untuk menandai is_liked (jika user login)
    const photoIds = (data || []).map((p) => p.id);
    let userLikedSet = new Set();
    if (photoIds.length > 0 && req.user?.id) {
      const { data: userLikes } = await supabase
        .from("likes")
        .select("photo_id")
        .eq("user_id", req.user.id)
        .in("photo_id", photoIds);

      userLikedSet = new Set((userLikes || []).map((l) => l.photo_id));
    }

    res.json({
      message: "Photos fetched",
      data: (data || []).map((row) =>
        serializePhoto(row, row.categories?.name, userLikedSet.has(row.id))
      ),
    });
  } catch (error) {
    next(error);
  }
});

// READ: satu foto detail.
router.get("/:id", optionalToken, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("photos")
      .select(
        "*, categories(name), profiles(id, username, avatar_url), likes(count), comments(count)"
      )
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) return next(new Error(error.message));
    if (!data) return res.status(404).json({ message: "Photo not found" });

    // Cek apakah user saat ini menyukai foto ini (jika login)
    let userLike = null;
    if (req.user?.id) {
      const { data: likeRow } = await supabase
        .from("likes")
        .select("id")
        .eq("photo_id", data.id)
        .eq("user_id", req.user.id)
        .maybeSingle();
      userLike = likeRow;
    }

    const serialized = serializePhoto(
      data,
      data.categories?.name,
      Boolean(userLike)
    );
    serialized.is_owner = Boolean(req.user?.id && data.user_id === req.user.id);

    res.json({
      message: "Photo fetched",
      data: serialized,
    });
  } catch (error) {
    next(error);
  }
});

// LIKE / UNLIKE: toggle like foto.
router.post("/:id/like", verifyToken, async (req, res, next) => {
  try {
    const photoId = req.params.id;

    // Pastikan foto ada
    const { data: photo, error: photoErr } = await supabase
      .from("photos")
      .select("id, user_id")
      .eq("id", photoId)
      .maybeSingle();

    if (photoErr) return next(new Error(photoErr.message));
    if (!photo) return res.status(404).json({ message: "Photo not found" });

    // Cek apakah sudah di-like sebelumnya
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("photo_id", photoId)
      .eq("user_id", req.user.id)
      .maybeSingle();

    let isLiked = false;
    if (existingLike) {
      const { error: delErr } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id);
      if (delErr) return next(new Error(delErr.message));
      isLiked = false;
    } else {
      const { error: insErr } = await supabase
        .from("likes")
        .insert({ photo_id: photoId, user_id: req.user.id });
      if (insErr) return next(new Error(insErr.message));
      isLiked = true;
    }

    // Hitung total like terkini
    const { count } = await supabase
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("photo_id", photoId);

    const likesCount = count ?? 0;

    // Broadcast update real-time
    broadcastEvent("photo:liked", {
      photo_id: photoId,
      user_id: req.user.id,
      is_liked: isLiked,
      likes_count: likesCount,
    });

    res.json({
      message: isLiked ? "Photo liked" : "Photo unliked",
      data: {
        is_liked: isLiked,
        likes_count: likesCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// COMMENTS: daftar komentar suatu foto.
router.get("/:id/comments", optionalToken, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("comments")
      .select(
        "id, user_id, photo_id, content, created_at, updated_at, profiles(id, username, avatar_url)"
      )
      .eq("photo_id", req.params.id)
      .order("created_at", { ascending: true });

    if (error) return next(new Error(error.message));

    const comments = (data || []).map((c) => ({
        id_comment: c.id,
        id_photo: c.photo_id,
        id_user: c.user_id,
        content: c.content,
        created_at: c.created_at,
        updated_at: c.updated_at,
        user: {
          id_user: c.profiles?.id,
          username: c.profiles?.username,
          avatar_url: c.profiles?.avatar_url,
        },
        is_owner: Boolean(req.user?.id && c.user_id === req.user.id),
      }));

    res.json({
      message: "Comments fetched",
      data: comments,
    });
  } catch (error) {
    next(error);
  }
});

// COMMENTS: tambah komentar baru.
router.post("/:id/comments", verifyToken, async (req, res, next) => {
  try {
    const validation = commentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues.map((i) => i.message),
      });
    }

    const photoId = req.params.id;

    // Pastikan foto ada
    const { data: photo, error: photoErr } = await supabase
      .from("photos")
      .select("id")
      .eq("id", photoId)
      .maybeSingle();

    if (photoErr) return next(new Error(photoErr.message));
    if (!photo) return res.status(404).json({ message: "Photo not found" });

    const { data: inserted, error: insErr } = await supabase
      .from("comments")
      .insert({
        photo_id: photoId,
        user_id: req.user.id,
        content: validation.data.content,
      })
      .select(
        "id, user_id, photo_id, content, created_at, updated_at, profiles(id, username, avatar_url)"
      )
      .single();

    if (insErr) return next(new Error(insErr.message));

    const { count } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("photo_id", photoId);

    const commentsCount = count ?? 0;
    const commentPayload = {
      id_comment: inserted.id,
      id_photo: inserted.photo_id,
      id_user: inserted.user_id,
      content: inserted.content,
      created_at: inserted.created_at,
      updated_at: inserted.updated_at,
      user: {
        id_user: inserted.profiles?.id,
        username: inserted.profiles?.username,
        avatar_url: inserted.profiles?.avatar_url,
      },
      is_owner: true,
    };

    // Broadcast penambahan komentar real-time
    broadcastEvent("comment:added", {
      photo_id: photoId,
      comment: commentPayload,
      comments_count: commentsCount,
    });

    res.status(201).json({
      message: "Comment added",
      data: {
        comment: commentPayload,
        comments_count: commentsCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// COMMENTS: hapus komentar.
router.delete("/:id/comments/:commentId", verifyToken, async (req, res, next) => {
  try {
    const { id: photoId, commentId } = req.params;

    const { data: comment, error: cErr } = await supabase
      .from("comments")
      .select("id, user_id, photo_id, photos(user_id)")
      .eq("id", commentId)
      .eq("photo_id", photoId)
      .maybeSingle();

    if (cErr) return next(new Error(cErr.message));
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Izin hapus: pembuat komentar atau pemilik foto
    const isCommentAuthor = comment.user_id === req.user.id;
    const isPhotoOwner = comment.photos?.user_id === req.user.id;
    if (!isCommentAuthor && !isPhotoOwner) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    const { error: delErr } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (delErr) return next(new Error(delErr.message));

    const { count } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("photo_id", photoId);

    const commentsCount = count ?? 0;

    // Broadcast penghapusan komentar real-time
    broadcastEvent("comment:deleted", {
      photo_id: photoId,
      comment_id: commentId,
      comments_count: commentsCount,
    });

    res.json({
      message: "Comment deleted",
      data: { comments_count: commentsCount },
    });
  } catch (error) {
    next(error);
  }
});

// CRITIQUES: daftar kritik & saran konstruktif suatu foto beserta statistik.
router.get("/:id/critiques", optionalToken, async (req, res, next) => {
  try {
    const photoId = req.params.id;

    const { data, error } = await supabase
      .from("critiques")
      .select(
        "id, user_id, photo_id, rating_composition, rating_lighting, rating_color, rating_concept, strengths, improvements, created_at, updated_at, profiles(id, username, avatar_url)"
      )
      .eq("photo_id", photoId)
      .order("created_at", { ascending: false });

    if (error) return next(new Error(error.message));

    const critiques = (data || []).map((c) => {
      const overall = +(
        (c.rating_composition +
          c.rating_lighting +
          c.rating_color +
          c.rating_concept) /
        4
      ).toFixed(1);
      return {
        id_critique: c.id,
        id_photo: c.photo_id,
        id_user: c.user_id,
        rating_composition: c.rating_composition,
        rating_lighting: c.rating_lighting,
        rating_color: c.rating_color,
        rating_concept: c.rating_concept,
        overall_score: overall,
        strengths: c.strengths,
        improvements: c.improvements,
        created_at: c.created_at,
        updated_at: c.updated_at,
        user: {
          id_user: c.profiles?.id,
          username: c.profiles?.username,
          avatar_url: c.profiles?.avatar_url,
        },
        is_owner: Boolean(req.user?.id && c.user_id === req.user.id),
      };
    });

    const stats = calculateCritiqueStats(critiques);

    res.json({
      message: "Critiques fetched",
      data: {
        critiques,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

// CRITIQUES: buat kritik baru untuk suatu foto.
router.post("/:id/critiques", verifyToken, async (req, res, next) => {
  try {
    const validation = critiqueSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues.map((i) => i.message),
      });
    }

    const photoId = req.params.id;

    // Pastikan foto ada dan ambil pemiliknya
    const { data: photo, error: photoErr } = await supabase
      .from("photos")
      .select("id, user_id")
      .eq("id", photoId)
      .maybeSingle();

    if (photoErr) return next(new Error(photoErr.message));
    if (!photo) return res.status(404).json({ message: "Photo not found" });

    // Cegah fotografer memberikan kritik pada foto miliknya sendiri
    if (photo.user_id === req.user.id) {
      return res.status(400).json({
        message: "Anda tidak dapat memberikan kritik pada karya Anda sendiri.",
      });
    }

    const {
      rating_composition,
      rating_lighting,
      rating_color,
      rating_concept,
      strengths,
      improvements,
    } = validation.data;

    const { data: insData, error: insErr } = await supabase
      .from("critiques")
      .insert({
        photo_id: photoId,
        user_id: req.user.id,
        rating_composition,
        rating_lighting,
        rating_color,
        rating_concept,
        strengths,
        improvements,
      })
      .select(
        "id, user_id, photo_id, rating_composition, rating_lighting, rating_color, rating_concept, strengths, improvements, created_at, updated_at, profiles(id, username, avatar_url)"
      )
      .single();

    if (insErr) return next(new Error(insErr.message));

    const overall = +(
      (insData.rating_composition +
        insData.rating_lighting +
        insData.rating_color +
        insData.rating_concept) /
      4
    ).toFixed(1);

    const createdCritique = {
      id_critique: insData.id,
      id_photo: insData.photo_id,
      id_user: insData.user_id,
      rating_composition: insData.rating_composition,
      rating_lighting: insData.rating_lighting,
      rating_color: insData.rating_color,
      rating_concept: insData.rating_concept,
      overall_score: overall,
      strengths: insData.strengths,
      improvements: insData.improvements,
      created_at: insData.created_at,
      updated_at: insData.updated_at,
      user: {
        id_user: insData.profiles?.id,
        username: insData.profiles?.username,
        avatar_url: insData.profiles?.avatar_url,
      },
      is_owner: true,
    };

    // Broadcast penambahan kritik real-time
    broadcastEvent("critique:added", {
      photo_id: photoId,
      critique: createdCritique,
    });

    res.status(201).json({
      message: "Critique submitted successfully",
      data: createdCritique,
    });
  } catch (error) {
    next(error);
  }
});

// CRITIQUES: hapus kritik (oleh pembuat atau pemilik foto).
router.delete("/:id/critiques/:critiqueId", verifyToken, async (req, res, next) => {
  try {
    const { id: photoId, critiqueId } = req.params;

    const { data: critique, error: cErr } = await supabase
      .from("critiques")
      .select("id, user_id, photo_id, photos(user_id)")
      .eq("id", critiqueId)
      .eq("photo_id", photoId)
      .maybeSingle();

    if (cErr) return next(new Error(cErr.message));
    if (!critique) {
      return res.status(404).json({ message: "Critique not found" });
    }

    const isAuthor = critique.user_id === req.user.id;
    const isPhotoOwner = critique.photos?.user_id === req.user.id;
    if (!isAuthor && !isPhotoOwner) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this critique" });
    }

    const { error: delErr } = await supabase
      .from("critiques")
      .delete()
      .eq("id", critiqueId);

    if (delErr) return next(new Error(delErr.message));

    broadcastEvent("critique:deleted", {
      photo_id: photoId,
      critique_id: critiqueId,
    });

    res.json({
      message: "Critique deleted",
      data: { id_critique: critiqueId, id_photo: photoId },
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE: ubah data foto, gambar boleh diganti (opsional).
router.put("/:id", verifyToken, upload.single("image"), async (req, res, next) => {
  try {
    const validation = photoSchema.safeParse(req.body);
    if (!validation.success) {
      await cleanupTemp(req.file);
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { title, description, id_category } = validation.data;

    // Foto harus ada dan milik user ini.
    const { data: existing } = await supabase
      .from("photos")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (!existing) {
      await cleanupTemp(req.file);
      return res.status(404).json({ message: "Photo not found" });
    }

    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("id", id_category)
      .maybeSingle();

    if (!category) {
      await cleanupTemp(req.file);
      return res.status(404).json({ message: "Category not found" });
    }

    const updatePayload = {
      category_id: id_category,
      title,
      description: description || null,
    };

    let newPublicId = null;
    if (req.file) {
      // EXIF dibaca dari temp file sebelum dihapus oleh uploadToCloudinary.
      const exif = await extractExif(req.file.path);
      const uploadedImage = await uploadToCloudinary(req.file, "picflow/photos");
      newPublicId = uploadedImage.public_id;
      Object.assign(updatePayload, {
        image_url: uploadedImage.secure_url,
        cloudinary_public_id: uploadedImage.public_id,
        width: uploadedImage.width,
        height: uploadedImage.height,
        aspect_ratio: uploadedImage.aspect_ratio
          ? Number(uploadedImage.aspect_ratio.toFixed(2))
          : null,
        ...exif,
      });
    }

    const { data, error } = await supabase
      .from("photos")
      .update(updatePayload)
      .eq("id", req.params.id)
      .select("*, categories(name)")
      .single();

    if (error) {
      // Rollback gambar baru bila update gagal.
      if (newPublicId) {
        await cloudinary.uploader
          .destroy(newPublicId, { resource_type: "image" })
          .catch(() => {});
      }
      return next(new Error(error.message));
    }

    // Hapus gambar lama setelah update sukses.
    if (newPublicId && existing.cloudinary_public_id) {
      await cloudinary.uploader
        .destroy(existing.cloudinary_public_id, { resource_type: "image" })
        .catch(() => {});
    }

    res.json({
      message: "Photo updated",
      data: serializePhoto(data, data.categories?.name),
    });
  } catch (error) {
    await cleanupTemp(req.file);
    next(error);
  }
});

// DELETE: hapus foto + aset Cloudinary-nya.
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const { data: existing } = await supabase
      .from("photos")
      .select("id, cloudinary_public_id")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (!existing) {
      return res.status(404).json({ message: "Photo not found" });
    }

    const { error } = await supabase
      .from("photos")
      .delete()
      .eq("id", req.params.id);

    if (error) return next(new Error(error.message));

    if (existing.cloudinary_public_id) {
      await cloudinary.uploader
        .destroy(existing.cloudinary_public_id, { resource_type: "image" })
        .catch(() => {});
    }

    res.json({ message: "Photo deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
