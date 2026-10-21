"use client";

// src/components/FollowButton.jsx
// Tombol Follow / Unfollow kreator dengan Optimistic UI update.
import { useState, useEffect, useRef } from "react";
import { UserCheck, UserPlus, UserX } from "lucide-react";
import { toggleFollowUser, getUserFollowStatus } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

export default function FollowButton({
  creatorId,
  initialFollowing = null,
  onFollowChange,
  className = "",
  size = "sm",
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [prevInitialFollowing, setPrevInitialFollowing] = useState(initialFollowing);
  const [following, setFollowing] = useState(
    initialFollowing !== null ? Boolean(initialFollowing) : false
  );
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const lockRef = useRef(false);

  // Jangan render tombol follow jika kreator adalah diri sendiri
  const isSelf = user?.id_user && String(user.id_user) === String(creatorId);

  if (initialFollowing !== prevInitialFollowing) {
    setPrevInitialFollowing(initialFollowing);
    if (initialFollowing !== null) {
      setFollowing(Boolean(initialFollowing));
    }
  }

  useEffect(() => {
    if (initialFollowing !== null) return;
    if (!creatorId || isSelf) return;

    let active = true;
    getUserFollowStatus(creatorId)
      .then((res) => {
        if (active && res?.data?.is_following != null) {
          setFollowing(res.data.is_following);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [creatorId, initialFollowing, isSelf]);

  if (isSelf || !creatorId) return null;

  async function handleClick(e) {
    e.stopPropagation();
    e.preventDefault();
    if (lockRef.current || loading) return;

    lockRef.current = true;
    setLoading(true);

    // Optimistic UI toggle
    const prev = following;
    const next = !prev;
    setFollowing(next);
    onFollowChange?.(next);

    try {
      const res = await toggleFollowUser(creatorId);
      if (res?.data?.is_following != null) {
        setFollowing(res.data.is_following);
        onFollowChange?.(res.data.is_following);
      }
      toast.success(next ? "Following creator." : "Unfollowed creator.");
    } catch (err) {
      setFollowing(prev);
      onFollowChange?.(prev);
      toast.error(err.message || "Failed to update follow status.");
    } finally {
      lockRef.current = false;
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={following ? "Unfollow creator" : "Follow creator"}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
        following
          ? isHovered
            ? "border-red-500/40 bg-red-500/10 text-red-400"
            : "border-line bg-[var(--surface)] text-muted hover:text-ink"
          : "border-accent bg-accent/15 text-accent hover:bg-accent/25"
      } border ${className}`}
    >
      {following ? (
        isHovered ? (
          <>
            <UserX size={12} />
            <span>Unfollow</span>
          </>
        ) : (
          <>
            <UserCheck size={12} />
            <span>Following</span>
          </>
        )
      ) : (
        <>
          <UserPlus size={12} />
          <span>Follow</span>
        </>
      )}
    </button>
  );
}
