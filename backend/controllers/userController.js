// controllers/userController.js
// Penanganan interaksi sosial antar fotografer (follow / unfollow & status).

import { userModel } from "../models/userModel.js";
import { broadcastEvent } from "../lib/realtime.js";

export const userController = {
  async toggleFollow(req, res, next) {
    try {
      const targetUserId = req.params.id;

      if (targetUserId === req.user.id) {
        return res.status(400).json({ message: "You cannot follow yourself" });
      }

      const { data: targetProfile, error: targetErr } =
        await userModel.findProfileById(targetUserId);

      if (targetErr) return next(new Error(targetErr.message));
      if (!targetProfile) {
        return res.status(404).json({ message: "Creator not found" });
      }

      const { data: existingFollow } = await userModel.findFollow(
        req.user.id,
        targetUserId
      );

      let isFollowing = false;
      if (existingFollow) {
        const { error: delErr } = await userModel.deleteFollow(
          req.user.id,
          targetUserId
        );
        if (delErr) return next(new Error(delErr.message));
        isFollowing = false;
      } else {
        const { error: insErr } = await userModel.insertFollow(
          req.user.id,
          targetUserId
        );

        if (insErr) {
          if (insErr.code === "23505") {
            isFollowing = true;
          } else {
            return next(new Error(insErr.message));
          }
        } else {
          isFollowing = true;
        }
      }

      const { count: followersCount } = await userModel.countFollowers(
        targetUserId
      );
      const followersTotal = followersCount ?? 0;

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
  },

  async getFollowStatus(req, res, next) {
    try {
      const targetUserId = req.params.id;

      const [isFollowRes, followersRes, followingRes] = await Promise.all([
        userModel.findFollow(req.user.id, targetUserId),
        userModel.countFollowers(targetUserId),
        userModel.countFollowing(targetUserId),
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
  },

  async getDashboard(req, res, next) {
    try {
      const period = req.query.period || "30d";
      const dashboardData = await userModel.getDashboardData(req.user.id, period);

      res.json({
        message: "Dashboard analytics fetched",
        data: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  },
};
