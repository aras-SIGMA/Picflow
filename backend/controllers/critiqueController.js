// controllers/critiqueController.js
// Penanganan telaah teknis 4 pilar fotografi (komposisi, pencahayaan, warna, cerita).

import { z } from "zod";
import {
  critiqueModel,
  serializeCritique,
  calculateCritiqueStats,
} from "../models/critiqueModel.js";
import { broadcastEvent } from "../lib/realtime.js";

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
    .min(1, "Rating konsep/cerita minimal 1")
    .max(5, "Rating konsep/cerita maksimal 5"),
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

export const critiqueController = {
  async getCritiques(req, res, next) {
    try {
      const photoId = req.params.id;
      const { data, error } = await critiqueModel.findByPhotoId(photoId);

      if (error) return next(new Error(error.message));

      const critiques = (data || []).map((c) =>
        serializeCritique(c, req.user?.id)
      );
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
  },

  async createCritique(req, res, next) {
    try {
      const validation = critiqueSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.issues.map((i) => i.message),
        });
      }

      const photoId = req.params.id;

      const { data: photo, error: photoErr } =
        await critiqueModel.findPhotoById(photoId);

      if (photoErr) return next(new Error(photoErr.message));
      if (!photo) return res.status(404).json({ message: "Photo not found" });

      if (photo.user_id === req.user.id) {
        return res.status(400).json({
          message: "Anda tidak dapat memberikan kritik pada karya Anda sendiri.",
        });
      }

      const { data: existingCritique, error: existErr } =
        await critiqueModel.findByUserAndPhoto(photoId, req.user.id);

      if (existErr) return next(new Error(existErr.message));
      if (existingCritique) {
        return res.status(409).json({
          message:
            "Anda sudah memberikan kritik pada karya ini. Silakan sunting kritik Anda.",
          id_critique: existingCritique.id,
        });
      }

      const { data: insData, error: insErr } = await critiqueModel.create({
        photo_id: photoId,
        user_id: req.user.id,
        ...validation.data,
      });

      if (insErr) return next(new Error(insErr.message));

      const createdCritique = serializeCritique(insData, req.user.id);

      broadcastEvent("critique:added", {
        photo_id: photoId,
        critique: { ...createdCritique, is_owner: false },
      });

      res.status(201).json({
        message: "Critique submitted successfully",
        data: { ...createdCritique, is_owner: true },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateCritique(req, res, next) {
    try {
      const validation = critiqueSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.issues.map((i) => i.message),
        });
      }

      const { id: photoId, critiqueId } = req.params;

      const { data: existing, error: findErr } =
        await critiqueModel.findById(critiqueId, photoId);

      if (findErr) return next(new Error(findErr.message));
      if (!existing) {
        return res.status(404).json({ message: "Critique not found" });
      }

      if (existing.user_id !== req.user.id) {
        return res.status(403).json({
          message: "Anda hanya dapat menyunting kritik milik Anda sendiri",
        });
      }

      const { data: updatedData, error: updErr } =
        await critiqueModel.update(critiqueId, validation.data);

      if (updErr) return next(new Error(updErr.message));

      const updatedCritique = serializeCritique(updatedData, req.user.id);

      broadcastEvent("critique:updated", {
        photo_id: photoId,
        critique: { ...updatedCritique, is_owner: false },
      });

      res.json({
        message: "Critique updated successfully",
        data: { ...updatedCritique, is_owner: true },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteCritique(req, res, next) {
    try {
      const { id: photoId, critiqueId } = req.params;

      const { data: critique, error: cErr } =
        await critiqueModel.findById(critiqueId, photoId);

      if (cErr) return next(new Error(cErr.message));
      if (!critique) {
        return res.status(404).json({ message: "Critique not found" });
      }

      const isAuthor = critique.user_id === req.user.id;
      const isPhotoOwner = critique.photos?.user_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isAuthor && !isPhotoOwner && !isAdmin) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this critique" });
      }

      const { error: delErr } = await critiqueModel.delete(critiqueId);
      if (delErr) return next(new Error(delErr.message));

      if (isAdmin && !isAuthor) {
        console.log(
          `[moderation] admin=${req.user.id} deleted critique=${critiqueId} photo=${photoId}`
        );
      }

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
  },
};
