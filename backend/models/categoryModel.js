// models/categoryModel.js
// Query database Supabase tabel categories & serializer.

import supabase from "../config/supabase.js";

export function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function serializeCategory(row) {
  return {
    id_category: row.id,
    name: row.name,
    slug: row.slug,
    created_at: row.created_at,
  };
}

export const categoryModel = {
  async getAll() {
    return supabase
      .from("categories")
      .select("id, name, slug, created_at")
      .order("name");
  },

  async getById(id) {
    return supabase
      .from("categories")
      .select("id, name, slug, created_at")
      .eq("id", id)
      .maybeSingle();
  },

  async create({ name, slug }) {
    return supabase
      .from("categories")
      .insert({ name, slug })
      .select("id, name, slug, created_at")
      .single();
  },

  async update(id, { name, slug }) {
    return supabase
      .from("categories")
      .update({ name, slug })
      .eq("id", id)
      .select("id, name, slug, created_at")
      .maybeSingle();
  },

  async delete(id) {
    return supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
  },
};
