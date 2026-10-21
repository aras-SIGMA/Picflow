// models/critiqueModel.js
// Query database Supabase tabel critiques, serializer, dan kalkulasi statistik 4 pilar.

import supabase from "../config/supabase.js";

export function serializeCritique(row, currentUserId = null) {
  const overall = +(
    (row.rating_composition +
      row.rating_lighting +
      row.rating_color +
      row.rating_concept) /
    4
  ).toFixed(1);

  return {
    id_critique: row.id,
    id_photo: row.photo_id,
    id_user: row.user_id,
    rating_composition: row.rating_composition,
    rating_lighting: row.rating_lighting,
    rating_color: row.rating_color,
    rating_concept: row.rating_concept,
    overall_score: overall,
    strengths: row.strengths,
    improvements: row.improvements,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user: {
      id_user: row.profiles?.id,
      username: row.profiles?.username,
      avatar_url: row.profiles?.avatar_url,
    },
    is_owner: Boolean(currentUserId && row.user_id === currentUserId),
  };
}

export function calculateCritiqueStats(critiques) {
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

export const critiqueModel = {
  async findPhotoById(photoId) {
    return supabase
      .from("photos")
      .select("id, user_id")
      .eq("id", photoId)
      .maybeSingle();
  },

  async findByPhotoId(photoId) {
    return supabase
      .from("critiques")
      .select(
        "id, user_id, photo_id, rating_composition, rating_lighting, rating_color, rating_concept, strengths, improvements, created_at, updated_at, profiles(id, username, avatar_url)"
      )
      .eq("photo_id", photoId)
      .order("created_at", { ascending: false });
  },

  async findByUserAndPhoto(photoId, userId) {
    return supabase
      .from("critiques")
      .select("id")
      .eq("photo_id", photoId)
      .eq("user_id", userId)
      .maybeSingle();
  },

  async findById(critiqueId, photoId) {
    return supabase
      .from("critiques")
      .select("id, user_id, photo_id, photos(user_id)")
      .eq("id", critiqueId)
      .eq("photo_id", photoId)
      .maybeSingle();
  },

  async create(data) {
    return supabase
      .from("critiques")
      .insert(data)
      .select(
        "id, user_id, photo_id, rating_composition, rating_lighting, rating_color, rating_concept, strengths, improvements, created_at, updated_at, profiles(id, username, avatar_url)"
      )
      .single();
  },

  async update(critiqueId, data) {
    return supabase
      .from("critiques")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", critiqueId)
      .select(
        "id, user_id, photo_id, rating_composition, rating_lighting, rating_color, rating_concept, strengths, improvements, created_at, updated_at, profiles(id, username, avatar_url)"
      )
      .single();
  },

  async delete(critiqueId) {
    return supabase.from("critiques").delete().eq("id", critiqueId);
  },
};
