// models/userModel.js
// Query database Supabase tabel profiles, follows, dan auth.

import supabase from "../config/supabase.js";

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
};
