// controllers/categoryController.js
// Penanganan request & response HTTP untuk entitas Category.

import { z } from "zod";
import { categoryModel, toSlug, serializeCategory } from "../models/categoryModel.js";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const categoryController = {
  async getAll(req, res, next) {
    try {
      const { data, error } = await categoryModel.getAll();
      if (error) return next(new Error(error.message));

      res.json({
        message: "Categories fetched",
        data: (data || []).map(serializeCategory),
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const id = Number(req.params.id);
      const { data, error } = await categoryModel.getById(id);

      if (error) return next(new Error(error.message));
      if (!data) return res.status(404).json({ message: "Category not found" });

      res.json({
        message: "Category fetched",
        data: serializeCategory(data),
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const validation = categorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.issues.map((issue) => issue.message),
        });
      }

      const { name } = validation.data;
      const slug = toSlug(name);

      const { data, error } = await categoryModel.create({ name, slug });
      if (error) {
        if (error.code === "23505") {
          return res.status(409).json({ message: "Data already exists" });
        }
        return next(new Error(error.message));
      }

      res.status(201).json({
        message: "Category created",
        data: serializeCategory(data),
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const id = Number(req.params.id);
      const validation = categorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.issues.map((issue) => issue.message),
        });
      }

      const { name } = validation.data;
      const slug = toSlug(name);

      const { data, error } = await categoryModel.update(id, { name, slug });
      if (error) {
        if (error.code === "23505") {
          return res.status(409).json({ message: "Data already exists" });
        }
        return next(new Error(error.message));
      }
      if (!data) return res.status(404).json({ message: "Category not found" });

      res.json({
        message: "Category updated",
        data: serializeCategory(data),
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const id = Number(req.params.id);
      const { data, error } = await categoryModel.delete(id);

      if (error) {
        if (error.code === "23503") {
          return res
            .status(409)
            .json({ message: "Category is still used by photos" });
        }
        return next(new Error(error.message));
      }
      if (!data) return res.status(404).json({ message: "Category not found" });

      res.json({ message: "Category deleted" });
    } catch (error) {
      next(error);
    }
  },
};
