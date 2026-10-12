// api/user.js
// Endpoint profil kreator & interaksi sosial follow / unfollow.

import express from "express";
import supabase from "../config/supabase.js";
import verifyToken from "../middleware/authMiddleware.js";
import { broadcastEvent } from "../lib/realtime.js";

const router = express.Router();
router.use(verifyToken);

// TOGGLE FOLLOW / UNFOLLOW: follow atau batalkan follow creator.
router.post("/:id/follow", async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Pastikan target user ada
    const { data: targetProfile, error: targetErr } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetErr) return next(new Error(targetErr.message));
    if (!targetProfile) {
      return res.status(404).json({ message: "Creator not found" });
    }

    // Cek apakah sudah follow
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", req.user.id)
      .eq("following_id", targetUserId)
      .maybeSingle();

    let isFollowing = false;
    if (existingFollow) {
      const { error: delErr } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", req.user.id)
        .eq("following_id", targetUserId);

      if (delErr) return next(new Error(delErr.message));
      isFollowing = false;
    } else {
      const { error: insErr } = await supabase
        .from("follows")
        .insert({
          follower_id: req.user.id,
          following_id: targetUserId,
        });

      if (insErr) return next(new Error(insErr.message));
      isFollowing = true;
    }

    // Hitung follower count terbaru
    const { count: followersCount } = await supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", targetUserId);

    const followersTotal = followersCount ?? 0;

    // Broadcast update status follow real-time
    broadcastEvent("creator:followed", {
      creator_id: targetUserId,
      follower_id: req.user.id,
      is_following: isFollowing,
      followers_count: followersTotal,
    });

    res.json({
      message: isFollowing ? "Followed creator" : "Unfollowed creator",
      data: {
        is_following: isFollowing,
        followers_count: followersTotal,
      },
    });
  } catch (error) {
    next(error);
  }
});

// STATUS FOLLOW: status apakah user saat ini mem-follow kreator target.
router.get("/:id/follow-status", async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    const [isFollowRes, followersRes, followingRes] = await Promise.all([
      supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", req.user.id)
        .eq("following_id", targetUserId)
        .maybeSingle(),
      supabase
        .from("follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("following_id", targetUserId),
      supabase
        .from("follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("follower_id", targetUserId),
    ]);

    res.json({
      message: "Follow status fetched",
      data: {
        is_following: Boolean(isFollowRes.data),
        followers_count: followersRes.count ?? 0,
        following_count: followingRes.count ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
