// controllers/commentController.js
// Penanganan request & response diskusi komentar karya foto.

import { z } from "zod";
import { commentModel, serializeComment } from "../models/commentModel.js";
import { broadcastEvent } from "../lib/realtime.js";

const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment cannot exceed 1000 characters"),
});

export const commentController = {
  async getComments(req, res, next) {
    try {
      const photoId = req.params.id;
      const { data, error } = await commentModel.findByPhotoId(photoId);

      if (error) return next(new Error(error.message));

      const comments = (data || []).map((c) =>
        serializeComment(c, req.user?.id)
      );

      res.json({
        message: "Comments fetched",
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  },

  async addComment(req, res, next) {
    try {
      const validation = commentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.issues.map((i) => i.message),
        });
      }

      const photoId = req.params.id;

      const { data: photo, error: photoErr } =
        await commentModel.findPhotoById(photoId);

      if (photoErr) return next(new Error(photoErr.message));
      if (!photo) return res.status(404).json({ message: "Photo not found" });

      const { data: inserted, error: insErr } = await commentModel.create({
        photoId,
        userId: req.user.id,
        content: validation.data.content,
      });

      if (insErr) return next(new Error(insErr.message));

      const { count } = await commentModel.countByPhotoId(photoId);
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
      };

      broadcastEvent("comment:added", {
        photo_id: photoId,
        comment: { ...commentPayload, is_owner: false },
        comments_count: commentsCount,
      });

      res.status(201).json({
        message: "Comment added",
        data: {
          comment: { ...commentPayload, is_owner: true },
          comments_count: commentsCount,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteComment(req, res, next) {
    try {
      const { id: photoId, commentId } = req.params;

      const { data: comment, error: cErr } = await commentModel.findById(
        commentId,
        photoId
      );

      if (cErr) return next(new Error(cErr.message));
      if (!comment) return res.status(404).json({ message: "Comment not found" });

      const isCommentAuthor = comment.user_id === req.user.id;
      const isPhotoOwner = comment.photos?.user_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isCommentAuthor && !isPhotoOwner && !isAdmin) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this comment" });
      }

      const { error: delErr } = await commentModel.delete(commentId);
      if (delErr) return next(new Error(delErr.message));

      if (isAdmin && !isCommentAuthor) {
        console.log(
          `[moderation] admin=${req.user.id} deleted comment=${commentId} photo=${photoId}`
        );
      }

      const { count } = await commentModel.countByPhotoId(photoId);
      const commentsCount = count ?? 0;

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
  },
};
