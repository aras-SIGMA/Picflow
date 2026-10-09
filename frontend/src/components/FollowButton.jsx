"use client";

// src/components/FollowButton.jsx
// Tombol Follow / Unfollow kreator dengan Optimistic UI update.
import { useState, useEffect } from "react";
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
  const [following, setFollowing] = useState(
    initialFollowing !== null ? Boolean(initialFollowing) : false
  );
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);

  // Jangan render tombol follow jika kreator adalah diri sendiri
  const isSelf = user?.id_user && String(user.id_user) === String(creatorId);

  useEffect(() => {
    if (initialFollowing !== null) {
      setFollowing(Boolean(initialFollowing));
      return;
    }

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
    if (loading) return;

    // Optimistic UI toggle
    const prev = following;
    const next = !prev;
    setFollowing(next);
    onFollowChange?.(next);

    setLoading(true);
    try {
      const res = await toggleFollowUser(creatorId);
      if (res?.data?.is_following != null) {
        setFollowing(res.data.is_following);
        onFollowChange?.(res.data.is_following);
      }
      toast.success(next ? "Mengikuti kreator." : "Batal mengikuti kreator.");
    } catch (err) {
      setFollowing(prev);
      onFollowChange?.(prev);
      toast.error(err.message || "Gagal memperbarui status follow.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={following ? "Batal ikuti kreator" : "Ikuti kreator"}
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
            <span>Berhenti</span>
          </>
        ) : (
          <>
            <UserCheck size={12} />
            <span>Mengikuti</span>
          </>
        )
      ) : (
        <>
          <UserPlus size={12} />
          <span>Ikuti</span>
        </>
      )}
    </button>
  );
}
