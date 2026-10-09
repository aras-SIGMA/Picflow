"use client";

// src/components/LikeButton.jsx
// Tombol like dengan Optimistic UI update (<= 50ms), animasi spring framer-motion,
// dan sinkronisasi real-time via usePhotoRealtime.
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { togglePhotoLike } from "@/lib/api";
import { usePhotoRealtime } from "@/lib/realtime";
import { useToast } from "@/components/ui/Toast";

export default function LikeButton({
  photoId,
  initialLiked = false,
  initialCount = 0,
  size = "md",
  showCount = true,
  className = "",
  onLikeChange,
}) {
  const [liked, setLiked] = useState(Boolean(initialLiked));
  const [count, setCount] = useState(Number(initialCount) || 0);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setLiked(Boolean(initialLiked));
  }, [initialLiked]);

  useEffect(() => {
    setCount(Number(initialCount) || 0);
  }, [initialCount]);

  // Dengarkan siaran real-time like dari pengguna lain
  usePhotoRealtime(photoId, {
    onLike: (payload) => {
      setCount(payload.likes_count);
    },
  });

  async function handleClick(e) {
    e.stopPropagation();
    e.preventDefault();
    if (loading || !photoId) return;

    // 1. Optimistic UI update dalam < 50ms
    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setLiked(nextLiked);
    setCount(nextCount);
    onLikeChange?.(nextLiked, nextCount);

    setLoading(true);
    try {
      const res = await togglePhotoLike(photoId);
      if (res?.data) {
        setLiked(res.data.is_liked);
        setCount(res.data.likes_count);
        onLikeChange?.(res.data.is_liked, res.data.likes_count);
      }
    } catch (err) {
      // Rollback jika request gagal
      setLiked(prevLiked);
      setCount(prevCount);
      onLikeChange?.(prevLiked, prevCount);
      toast.error(err.message || "Gagal menyukai foto.");
    } finally {
      setLoading(false);
    }
  }

  const iconSizes = {
    sm: 14,
    md: 17,
    lg: 20,
  };

  const iconSize = iconSizes[size] || 17;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={liked ? "Batalkan suka" : "Sukai foto"}
      aria-pressed={liked}
      className={`group/like inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
        liked
          ? "border-red-500/30 bg-red-500/10 text-red-400"
          : "border-line bg-[var(--surface)] text-muted hover:border-white/30 hover:text-ink"
      } border ${className}`}
    >
      <motion.span
        key={String(liked)}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 1.3 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="flex items-center justify-center"
      >
        <Heart
          size={iconSize}
          className={`transition-colors ${
            liked
              ? "fill-red-500 text-red-500"
              : "text-muted group-hover/like:text-red-400"
          }`}
        />
      </motion.span>

      {showCount && (
        <span className="tabular-nums font-semibold tracking-tight">
          {count}
        </span>
      )}
    </button>
  );
}
