// api/category.js
// CRUD tabel categories (Supabase PostgreSQL).
// GET publik; mutasi (POST/PUT/DELETE) khusus role admin.
// Skema: id (serial), name (unique), slug (unique), created_at.

import express from "express";
import { z } from "zod";
import supabase from "../config/supabase.js";
import verifyToken, { verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
const adminOnly = [verifyToken, verifyAdmin];

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

// Slug sederhana dari nama kategori.
function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Petakan baris Supabase ke bentuk lama frontend (id_category).
function serializeCategory(row) {
  return {
    id_category: row.id,
    name: row.name,
    slug: row.slug,
    created_at: row.created_at,
  };
}

// CREATE (khusus admin)
router.post("/", adminOnly, async (req, res, next) => {
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

    const { data, error } = await supabase
      .from("categories")
      .insert({ name, slug })
      .select("id, name, slug, created_at")
      .single();

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
});

// READ all
router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, created_at")
      .order("name");

    if (error) return next(new Error(error.message));

    res.json({
      message: "Categories fetched",
      data: (data || []).map(serializeCategory),
    });
  } catch (error) {
    next(error);
  }
});

// READ one
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) return next(new Error(error.message));
    if (!data) return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category fetched", data: serializeCategory(data) });
  } catch (error) {
    next(error);
  }
});

// UPDATE (khusus admin)
router.put("/:id", adminOnly, async (req, res, next) => {
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

    const { data, error } = await supabase
      .from("categories")
      .update({ name, slug })
      .eq("id", id)
      .select("id, name, slug, created_at")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ message: "Data already exists" });
      }
      return next(new Error(error.message));
    }
    if (!data) return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category updated", data: serializeCategory(data) });
  } catch (error) {
    next(error);
  }
});

// DELETE (khusus admin)
router.delete("/:id", adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      // 23503 = foreign key violation (masih dipakai foto).
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
});

export default router;
