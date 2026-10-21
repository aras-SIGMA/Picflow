// models/userModel.js
// Query database Supabase tabel profiles, follows, dan auth.

import supabase from "../config/supabase.js";
import { calculateCritiqueStats } from "./critiqueModel.js";

export function serializeProfile(profile, email) {
  return {
    id_user: profile.id,
    username: profile.username,
    email: email ?? null,
    full_name: profile.full_name,
    bio: profile.bio,
    profile_picture_url: profile.avatar_url,
    role: profile.role === "admin" ? "admin" : "user",
    created_at: profile.created_at,
  };
}

export const userModel = {
  async findProfileByUsername(username) {
    return supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
  },

  async findProfileById(userId) {
    return supabase
      .from("profiles")
      .select("id, username, full_name, bio, avatar_url, avatar_public_id, role, created_at")
      .eq("id", userId)
      .maybeSingle();
  },

  async updateAvatar(userId, { avatarUrl, avatarPublicId }) {
    return supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        avatar_public_id: avatarPublicId,
      })
      .eq("id", userId);
  },

  async updateProfile(userId, { fullName, bio, username }) {
    const payload = { updated_at: new Date().toISOString() };
    if (fullName !== undefined) payload.full_name = fullName ? fullName.trim() : null;
    if (bio !== undefined) payload.bio = bio ? bio.trim() : null;
    if (username !== undefined) payload.username = username.trim().toLowerCase();

    return supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select("id, username, full_name, bio, avatar_url, avatar_public_id, role, created_at")
      .single();
  },

  async createAuthUser({ email, password, username }) {
    return supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });
  },

  async findFollow(followerId, followingId) {
    return supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();
  },

  async insertFollow(followerId, followingId) {
    return supabase.from("follows").insert({
      follower_id: followerId,
      following_id: followingId,
    });
  },

  async deleteFollow(followerId, followingId) {
    return supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
  },

  async countFollowers(userId) {
    return supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", userId);
  },

  async countFollowing(userId) {
    return supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("follower_id", userId);
  },

  async getDashboardData(userId, period = "30d") {
    // 1. Ambil data profil, foto user, followers & following secara paralel
    const [
      profileRes,
      photosRes,
      followersCountRes,
      followingCountRes,
      followHistoryRes,
    ] = await Promise.all([
      this.findProfileById(userId),
      supabase
        .from("photos")
        .select("id, title, image_url, created_at, likes(count), comments(count)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      this.countFollowers(userId),
      this.countFollowing(userId),
      supabase
        .from("follows")
        .select("created_at")
        .eq("following_id", userId),
    ]);

    if (profileRes.error) throw new Error(profileRes.error.message);
    if (photosRes.error) throw new Error(photosRes.error.message);

    const userPhotos = photosRes.data || [];
    const photoIds = userPhotos.map((p) => p.id);

    // 2. Ambil riwayat likes, comments, dan critiques pada foto-foto milik user
    let likesHistory = [];
    let commentsHistory = [];
    let critiquesData = [];

    if (photoIds.length > 0) {
      const [likesRes, commentsRes, critiquesRes] = await Promise.all([
        supabase
          .from("likes")
          .select("created_at")
          .in("photo_id", photoIds),
        supabase
          .from("comments")
          .select("created_at")
          .in("photo_id", photoIds),
        supabase
          .from("critiques")
          .select(
            "id, photo_id, user_id, rating_composition, rating_lighting, rating_color, rating_concept, strengths, improvements, created_at, profiles(id, username, avatar_url)"
          )
          .in("photo_id", photoIds)
          .order("created_at", { ascending: false }),
      ]);

      likesHistory = likesRes.data || [];
      commentsHistory = commentsRes.data || [];
      critiquesData = critiquesRes.data || [];
    }

    // 3. Hitung metrik agregat kumulatif
    const totalPosts = userPhotos.length;
    const totalLikes = userPhotos.reduce(
      (sum, p) => sum + (p.likes?.[0]?.count ?? 0),
      0
    );
    const totalComments = userPhotos.reduce(
      (sum, p) => sum + (p.comments?.[0]?.count ?? 0),
      0
    );
    const critiqueStats = calculateCritiqueStats(critiquesData);

    // 4. Hitung top 4 performing shots
    const topPhotos = [...userPhotos]
      .map((p) => ({
        id_photo: p.id,
        title: p.title,
        image_url: p.image_url,
        created_at: p.created_at,
        likes_count: p.likes?.[0]?.count ?? 0,
        comments_count: p.comments?.[0]?.count ?? 0,
      }))
      .sort(
        (a, b) =>
          b.likes_count * 2 + b.comments_count - (a.likes_count * 2 + a.comments_count)
      )
      .slice(0, 4);

    // 5. Susun timeline harian berdasarkan rentang waktu yang dipilih
    let numDays = 30;
    if (period === "7d") numDays = 7;
    else if (period === "all" || period === "90d") numDays = 90;

    const timelineMap = new Map();
    const today = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0];
      timelineMap.set(key, {
        date: key,
        likes: 0,
        followers: 0,
        comments: 0,
        critiques: 0,
        posts: 0,
        total_engagement: 0,
      });
    }

    // Agregasi likes
    likesHistory.forEach((item) => {
      if (!item.created_at) return;
      const key = item.created_at.split("T")[0];
      const entry = timelineMap.get(key);
      if (entry) {
        entry.likes += 1;
        entry.total_engagement += 1;
      }
    });

    // Agregasi new followers
    (followHistoryRes.data || []).forEach((item) => {
      if (!item.created_at) return;
      const key = item.created_at.split("T")[0];
      const entry = timelineMap.get(key);
      if (entry) {
        entry.followers += 1;
        entry.total_engagement += 1;
      }
    });

    // Agregasi comments
    commentsHistory.forEach((item) => {
      if (!item.created_at) return;
      const key = item.created_at.split("T")[0];
      const entry = timelineMap.get(key);
      if (entry) {
        entry.comments += 1;
        entry.total_engagement += 1;
      }
    });

    // Agregasi critiques
    critiquesData.forEach((item) => {
      if (!item.created_at) return;
      const key = item.created_at.split("T")[0];
      const entry = timelineMap.get(key);
      if (entry) {
        entry.critiques += 1;
        entry.total_engagement += 1;
      }
    });

    // Agregasi post uploads
    userPhotos.forEach((item) => {
      if (!item.created_at) return;
      const key = item.created_at.split("T")[0];
      const entry = timelineMap.get(key);
      if (entry) {
        entry.posts += 1;
      }
    });

    const timeline = Array.from(timelineMap.values());

    return {
      profile: profileRes.data,
      period,
      summary: {
        total_posts: totalPosts,
        total_likes: totalLikes,
        total_comments: totalComments,
        followers_count: followersCountRes.count ?? 0,
        following_count: followingCountRes.count ?? 0,
        total_critiques: critiqueStats.total_critiques,
        overall_critique_score: critiqueStats.overall_avg,
      },
      critique_pillars: {
        composition: critiqueStats.avg_composition,
        lighting: critiqueStats.avg_lighting,
        color: critiqueStats.avg_color,
        concept: critiqueStats.avg_concept,
        total_reviews: critiqueStats.total_critiques,
      },
      top_photos: topPhotos,
      recent_critiques: critiquesData.slice(0, 3).map((c) => ({
        id_critique: c.id,
        rating_composition: c.rating_composition,
        rating_lighting: c.rating_lighting,
        rating_color: c.rating_color,
        rating_concept: c.rating_concept,
        overall_score: +(
          (c.rating_composition +
            c.rating_lighting +
            c.rating_color +
            c.rating_concept) /
          4
        ).toFixed(1),
        strengths: c.strengths,
        improvements: c.improvements,
        created_at: c.created_at,
        reviewer: {
          id: c.profiles?.id,
          username: c.profiles?.username,
          avatar_url: c.profiles?.avatar_url,
        },
      })),
      timeline,
    };
  },
};
