// models/commentModel.js
// Query database Supabase tabel comments & serializer.

import supabase from "../config/supabase.js";

export function serializeComment(row, currentUserId = null) {
  return {
    id_comment: row.id,
    id_photo: row.photo_id,
    id_user: row.user_id,
    content: row.content,
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

export const commentModel = {
  async findPhotoById(photoId) {
    return supabase
      .from("photos")
      .select("id")
      .eq("id", photoId)
      .maybeSingle();
  },

  async findByPhotoId(photoId) {
    return supabase
      .from("comments")
      .select(
        "id, user_id, photo_id, content, created_at, updated_at, profiles(id, username, avatar_url)"
      )
      .eq("photo_id", photoId)
      .order("created_at", { ascending: true });
  },

  async findById(commentId, photoId) {
    return supabase
      .from("comments")
      .select("id, user_id, photo_id, photos(user_id)")
      .eq("id", commentId)
      .eq("photo_id", photoId)
      .maybeSingle();
  },

  async create({ photoId, userId, content }) {
    return supabase
      .from("comments")
      .insert({
        photo_id: photoId,
        user_id: userId,
        content,
      })
      .select(
        "id, user_id, photo_id, content, created_at, updated_at, profiles(id, username, avatar_url)"
      )
      .single();
  },

  async delete(commentId) {
    return supabase.from("comments").delete().eq("id", commentId);
  },

  async countByPhotoId(photoId) {
    return supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("photo_id", photoId);
  },
};
