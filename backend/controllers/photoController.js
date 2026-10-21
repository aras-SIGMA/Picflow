// controllers/photoController.js
// Penanganan portofolio karya foto, upload Cloudinary, feed, dan like.

import { z } from "zod";
import fs from "fs/promises";
import cloudinary from "../config/cloudinary.js";
import { extractExif } from "../lib/exif.js";
import { photoModel, serializePhoto } from "../models/photoModel.js";
import { broadcastEvent } from "../lib/realtime.js";

const photoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  id_category: z.coerce.number().int().positive("Category is required"),
});

async function cleanupTemp(file) {
  if (file?.path) await fs.unlink(file.path).catch(() => {});
}

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

export const photoController = {
  async createPhoto(req, res, next) {
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

      const { data: category } = await photoModel.findCategoryById(id_category);
      if (!category) {
        await cleanupTemp(req.file);
        return res.status(404).json({ message: "Category not found" });
      }

      const exif = await extractExif(req.file.path);
      const uploadedImage = await uploadToCloudinary(req.file, "picflow/photos");

      const { data, error } = await photoModel.insertPhoto({
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
      });

      if (error) {
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
  },

  async getFeed(req, res, next) {
    try {
      const feed = req.query.feed || "explore";
      const categoryId = req.query.category_id || req.query.id_category;
      const targetUserId = req.query.user_id;

      if ((feed === "my" || feed === "mine") && !req.user) {
        return res
          .status(401)
          .json({ message: "Login required to access your photos" });
      }
      if (feed === "following" && !req.user) {
        return res
          .status(401)
          .json({ message: "Login required to access following feed" });
      }

      const { data, error } = await photoModel.queryFeed({
        feed,
        userId: req.user?.id,
        targetUserId,
        categoryId,
      });

      if (error) return next(new Error(error.message));

      const photoIds = (data || []).map((p) => p.id);
      const userLikedSet = await photoModel.findUserLikesForPhotos(
        req.user?.id,
        photoIds
      );

      res.json({
        message: "Photos fetched",
        data: (data || []).map((row) =>
          serializePhoto(row, row.categories?.name, userLikedSet.has(row.id))
        ),
      });
    } catch (error) {
      next(error);
    }
  },

  async getDetail(req, res, next) {
    try {
      const { data, error } = await photoModel.findById(req.params.id);

      if (error) return next(new Error(error.message));
      if (!data) return res.status(404).json({ message: "Photo not found" });

      const userLike = await photoModel.findUserLike(data.id, req.user?.id);
      const serialized = serializePhoto(
        data,
        data.categories?.name,
        Boolean(userLike)
      );
      serialized.is_owner = Boolean(
        req.user?.id && data.user_id === req.user.id
      );

      res.json({
        message: "Photo fetched",
        data: serialized,
      });
    } catch (error) {
      next(error);
    }
  },

  async updatePhoto(req, res, next) {
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

      const { data: existing } = await photoModel.findOwnerPhotoById(
        req.params.id,
        req.user.id
      );

      if (!existing) {
        await cleanupTemp(req.file);
        return res.status(404).json({ message: "Photo not found" });
      }

      const { data: category } = await photoModel.findCategoryById(id_category);
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
        const exif = await extractExif(req.file.path);
        const uploadedImage = await uploadToCloudinary(
          req.file,
          "picflow/photos"
        );
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

      const { data, error } = await photoModel.updatePhoto(
        req.params.id,
        updatePayload
      );

      if (error) {
        if (newPublicId) {
          await cloudinary.uploader
            .destroy(newPublicId, { resource_type: "image" })
            .catch(() => {});
        }
        return next(new Error(error.message));
      }

      if (newPublicId && existing.cloudinary_public_id) {
        await cloudinary.uploader
          .destroy(existing.cloudinary_public_id, { resource_type: "image" })
          .catch(() => {});
      }

      const userLike = await photoModel.findUserLike(data.id, req.user.id);
      const isLiked = Boolean(userLike);
      const serialized = serializePhoto(data, data.categories?.name, isLiked);
      serialized.is_owner = true;

      res.json({
        message: "Photo updated",
        data: serialized,
      });
    } catch (error) {
      await cleanupTemp(req.file);
      next(error);
    }
  },

  async deletePhoto(req, res, next) {
    try {
      const { data: existing } = await photoModel.findPhotoForDelete(
        req.params.id
      );

      if (!existing) {
        return res.status(404).json({ message: "Photo not found" });
      }

      const isOwner = existing.user_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isOwner && !isAdmin) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this photo" });
      }

      const { error } = await photoModel.deletePhoto(req.params.id);
      if (error) return next(new Error(error.message));

      if (existing.cloudinary_public_id) {
        await cloudinary.uploader
          .destroy(existing.cloudinary_public_id, { resource_type: "image" })
          .catch(() => {});
      }

      if (!isOwner && isAdmin) {
        console.log(
          `[moderation] admin=${req.user.id} deleted photo=${existing.id} owner=${existing.user_id}`
        );
      }

      broadcastEvent("photo:deleted", {
        photo_id: existing.id,
        user_id: existing.user_id,
        by_admin: !isOwner && isAdmin,
      });

      res.json({ message: "Photo deleted" });
    } catch (error) {
      next(error);
    }
  },

  async toggleLike(req, res, next) {
    try {
      const photoId = req.params.id;

      const { data: photo, error: photoErr } =
        await photoModel.findById(photoId);

      if (photoErr) return next(new Error(photoErr.message));
      if (!photo) return res.status(404).json({ message: "Photo not found" });

      const { data: existingLike } = await photoModel.findLike(
        photoId,
        req.user.id
      );

      let isLiked = false;
      if (existingLike) {
        const { error: delErr } = await photoModel.deleteLike(existingLike.id);
        if (delErr) return next(new Error(delErr.message));
        isLiked = false;
      } else {
        const { error: insErr } = await photoModel.insertLike(
          photoId,
          req.user.id
        );
        if (insErr) {
          if (insErr.code === "23505") {
            isLiked = true;
          } else {
            return next(new Error(insErr.message));
          }
        } else {
          isLiked = true;
        }
      }

      const { count } = await photoModel.countLikes(photoId);
      const likesCount = count ?? 0;

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
  },
};
