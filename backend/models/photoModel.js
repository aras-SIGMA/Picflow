// models/photoModel.js
// Query database Supabase tabel photos & likes, delivery URL Cloudinary, dan serializer.

import supabase from "../config/supabase.js";

export function getCloudinaryDeliveryUrl(imageUrl, width) {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  if (!imageUrl.includes("/upload/")) return imageUrl;
  return imageUrl.replace(
    "/upload/",
    `/upload/f_auto,q_auto,w_${width},c_limit/`
  );
}

export function serializePhoto(row, categoryName, isLiked = false) {
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

export const photoModel = {
  async findCategoryById(categoryId) {
    return supabase
      .from("categories")
      .select("id, name")
      .eq("id", categoryId)
      .maybeSingle();
  },

  async insertPhoto(payload) {
    return supabase
      .from("photos")
      .insert(payload)
      .select("*, categories(name), profiles(id, username, avatar_url)")
      .single();
  },

  async findFollowingUserIds(followerId) {
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", followerId);

    return (data || []).map((r) => r.following_id);
  },

  async queryFeed({ feed, userId, targetUserId, categoryId }) {
    let query = supabase
      .from("photos")
      .select(
        "*, categories(name), profiles(id, username, avatar_url), likes(count), comments(count)"
      )
      .order("created_at", { ascending: false });

    if (feed === "my" || feed === "mine") {
      query = query.eq("user_id", userId);
    } else if (feed === "following") {
      const followingIds = await this.findFollowingUserIds(userId);
      if (followingIds.length === 0) return { data: [], error: null };
      query = query.in("user_id", followingIds);
    } else if (targetUserId) {
      query = query.eq("user_id", targetUserId);
    }

    if (categoryId && categoryId !== "all") {
      const parsedCatId = Number(categoryId);
      if (Number.isInteger(parsedCatId) && parsedCatId > 0) {
        query = query.eq("category_id", parsedCatId);
      }
    }

    return query;
  },

  async findUserLikesForPhotos(userId, photoIds) {
    if (!userId || !photoIds || photoIds.length === 0) return new Set();
    const { data } = await supabase
      .from("likes")
      .select("photo_id")
      .eq("user_id", userId)
      .in("photo_id", photoIds);

    return new Set((data || []).map((l) => l.photo_id));
  },

  async findById(photoId) {
    return supabase
      .from("photos")
      .select(
        "*, categories(name), profiles(id, username, avatar_url), likes(count), comments(count)"
      )
      .eq("id", photoId)
      .maybeSingle();
  },

  async findUserLike(photoId, userId) {
    if (!userId) return null;
    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("photo_id", photoId)
      .eq("user_id", userId)
      .maybeSingle();

    return data;
  },

  async findOwnerPhotoById(photoId, userId) {
    return supabase
      .from("photos")
      .select("*")
      .eq("id", photoId)
      .eq("user_id", userId)
      .maybeSingle();
  },

  async updatePhoto(photoId, payload) {
    return supabase
      .from("photos")
      .update(payload)
      .eq("id", photoId)
      .select(
        "*, categories(name), profiles(id, username, avatar_url), likes(count), comments(count)"
      )
      .single();
  },

  async findPhotoForDelete(photoId) {
    return supabase
      .from("photos")
      .select("id, user_id, cloudinary_public_id")
      .eq("id", photoId)
      .maybeSingle();
  },

  async deletePhoto(photoId) {
    return supabase.from("photos").delete().eq("id", photoId);
  },

  async findLike(photoId, userId) {
    return supabase
      .from("likes")
      .select("id")
      .eq("photo_id", photoId)
      .eq("user_id", userId)
      .maybeSingle();
  },

  async insertLike(photoId, userId) {
    return supabase.from("likes").insert({ photo_id: photoId, user_id: userId });
  },

  async deleteLike(likeId) {
    return supabase.from("likes").delete().eq("id", likeId);
  },

  async countLikes(photoId) {
    return supabase
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("photo_id", photoId);
  },
};
