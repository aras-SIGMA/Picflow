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
import verifyToken from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Semua route di file ini wajib login
router.use(verifyToken);

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

// Petakan baris Supabase ke bentuk lama frontend.
function serializePhoto(row, categoryName) {
  const isCloudinary =
    typeof row.image_url === "string" &&
    row.image_url.includes("res.cloudinary.com");

  return {
    id_photo: row.id,
    id_user: row.user_id,
    id_category: row.category_id,
    category_name: categoryName ?? row.category_name ?? null,
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

// ====== ROUTES ======

// CREATE: tambah foto baru + upload ke Cloudinary + EXIF.
router.post("/", upload.single("image"), async (req, res, next) => {
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
      .select("*")
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
      data: serializePhoto(data),
    });
  } catch (error) {
    await cleanupTemp(req.file);
    next(error);
  }
});

// READ: semua foto milik user yang login.
router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("photos")
      .select("*, categories(name)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return next(new Error(error.message));

    res.json({
      message: "Photos fetched",
      data: (data || []).map((row) =>
        serializePhoto(row, row.categories?.name),
      ),
    });
  } catch (error) {
    next(error);
  }
});

// READ: satu foto milik sendiri.
router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("photos")
      .select("*, categories(name)")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) return next(new Error(error.message));
    if (!data) return res.status(404).json({ message: "Photo not found" });

    res.json({
      message: "Photo fetched",
      data: serializePhoto(data, data.categories?.name),
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE: ubah data foto, gambar boleh diganti (opsional).
router.put("/:id", upload.single("image"), async (req, res, next) => {
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
router.delete("/:id", async (req, res, next) => {
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
