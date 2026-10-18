"use client";

// src/components/CommentSection.jsx
// Feed komentar diskusi teknis karya fotografi:
// - Desain bersih sesuai spesifikasi .md/DESIGN/design.md (Light Mode Editorial)
// - Deduplikasi ketat (optimistic UI + realtime sync + deduplication guard)
// - Akses hapus komentar eksklusif untuk pemilik komentar/foto
import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import {
  getPhotoComments,
  addPhotoComment,
  deletePhotoComment,
} from "@/lib/api";
import { usePhotoRealtime } from "@/lib/realtime";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import ApertureLoader from "@/components/ui/ApertureLoader";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function createTempId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `temp-${crypto.randomUUID()}`
    : `temp-${Date.now()}`;
}

export default function CommentSection({
  photoId,
  initialCount = 0,
  onCountChange,
  className = "",
  embedded = false,
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [prevPhotoId, setPrevPhotoId] = useState(photoId);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const submittingRef = useRef(false);
  const listRef = useRef(null);

  if (photoId !== prevPhotoId) {
    setPrevPhotoId(photoId);
    setLoading(true);
  }

  // Muat daftar komentar saat pertama kali komponen dirender
  useEffect(() => {
    if (!photoId) return;
    let active = true;

    getPhotoComments(photoId)
      .then((res) => {
        if (active) {
          const fetched = res.data || [];
          setComments(fetched);
          onCountChange?.(fetched.length);
        }
      })
      .catch((err) => {
        if (active) console.error("Failed to load comments:", err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [photoId, onCountChange]);

  // Dengarkan siaran real-time komentar baru & penghapusan komentar
  usePhotoRealtime(photoId, {
    onCommentAdded: (payload) => {
      if (!payload?.comment) return;
      const newComment = payload.comment;

      setComments((prev) => {
        // 1. Sudah ada berdasarkan id_comment yang sama? Jangan tambah duplikat
        if (prev.some((c) => String(c.id_comment) === String(newComment.id_comment))) {
          return prev;
        }

        // 2. Ada komentar pending/optimistic yang cocok (konten & user sama)?
        // Gantikan item pending tersebut alih-alih menambahkan baris baru
        const pendingIdx = prev.findIndex(
          (c) =>
            c.pending &&
            c.content === newComment.content &&
            String(c.id_user || c.user?.id_user) ===
              String(newComment.id_user || newComment.user?.id_user)
        );

        if (pendingIdx !== -1) {
          const next = [...prev];
          next[pendingIdx] = {
            ...newComment,
            is_owner: Boolean(
              user?.id_user &&
                (newComment.id_user === user.id_user ||
                  newComment.user?.id_user === user.id_user)
            ),
          };
          return next;
        }

        // 3. Komentar baru dari user lain
        const updated = [
          ...prev,
          {
            ...newComment,
            is_owner: Boolean(
              user?.id_user &&
                (newComment.id_user === user.id_user ||
                  newComment.user?.id_user === user.id_user)
            ),
          },
        ];
        onCountChange?.(payload.comments_count ?? updated.length);
        return updated;
      });
    },

    onCommentDeleted: (payload) => {
      if (!payload?.comment_id) return;
      setComments((prev) => {
        const updated = prev.filter(
          (c) => String(c.id_comment) !== String(payload.comment_id)
        );
        onCountChange?.(payload.comments_count ?? updated.length);
        return updated;
      });
    },
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (submittingRef.current) return;

    const text = content.trim();
    if (!text) return;

    submittingRef.current = true;
    setSubmitting(true);

    const tempId = createTempId();
    const optimisticComment = {
      id_comment: tempId,
      id_photo: photoId,
      id_user: user?.id_user,
      content: text,
      created_at: new Date().toISOString(),
      user: {
        id_user: user?.id_user,
        username: user?.username || "You",
        avatar_url: user?.profile_picture_url || user?.avatar_url,
      },
      is_owner: true,
      pending: true,
    };

    setContent("");
    setComments((prev) => [...prev, optimisticComment]);

    try {
      const res = await addPhotoComment(photoId, text);
      if (res?.data?.comment) {
        const saved = res.data.comment;
        setComments((prev) => {
          // Jika SSE realtime sudah menggantikan tempId lebih cepat
          const alreadyExists = prev.some(
            (c) => String(c.id_comment) === String(saved.id_comment)
          );
          if (alreadyExists) {
            return prev.filter((c) => c.id_comment !== tempId);
          }
          return prev.map((c) =>
            c.id_comment === tempId ? { ...saved, is_owner: true } : c
          );
        });
        onCountChange?.(res.data.comments_count);
      }
    } catch (err) {
      setComments((prev) => prev.filter((c) => c.id_comment !== tempId));
      setContent(text);
      toast.error(err.message || "Failed to post comment.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId) {
    if (!commentId) return;
    const prevComments = [...comments];
    setComments((prev) => prev.filter((c) => c.id_comment !== commentId));

    try {
      const res = await deletePhotoComment(photoId, commentId);
      if (res?.data?.comments_count != null) {
        onCountChange?.(res.data.comments_count);
      }
      toast.success("Comment deleted.");
    } catch (err) {
      setComments(prevComments);
      toast.error(err.message || "Failed to delete comment.");
    }
  }

  // Deduplikasi tampilan unik berdasarkan id_comment
  const displayComments = useMemo(() => {
    const seen = new Set();
    return comments.filter((c) => {
      if (!c?.id_comment || seen.has(c.id_comment)) return false;
      seen.add(c.id_comment);
      return true;
    });
  }, [comments]);

  const containerClass = embedded
    ? "flex flex-col"
    : `flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-card ${className}`;

  return (
    <div className={containerClass}>
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
            Comments &amp; Technical Discussion
          </h3>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          {displayComments.length}
        </span>
      </div>

      {/* List Komentar */}
      <div
        ref={listRef}
        className={`my-3.5 flex flex-col gap-2.5 ${embedded ? "" : "max-h-72 overflow-y-auto pr-1"}`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <ApertureLoader size={22} />
          </div>
        ) : displayComments.length === 0 ? (
          <p className="py-6 text-center text-xs text-stone-400 italic">
            No discussions yet. Be the first to share feedback or ask a technical question!
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {displayComments.map((c) => {
              const authorName = c.user?.username || "Photographer";
              const authorAvatar = c.user?.avatar_url;
              const isOwner = Boolean(
                c.is_owner ||
                  (user?.id_user &&
                    (c.id_user === user.id_user || c.user?.id_user === user.id_user))
              );
              const isAdmin = user?.role === "admin";
              const canDelete = isOwner || isAdmin;

              return (
                <motion.div
                  key={c.id_comment}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="group relative flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3 transition-colors hover:bg-gray-100/60"
                >
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-stone-900 text-xs font-bold text-white shadow-2xs">
                    {authorAvatar ? (
                      <Image
                        src={authorAvatar}
                        alt={authorName}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      authorName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate text-xs font-bold text-stone-900">
                          {authorName}
                        </span>
                        <span className="text-[10px] text-stone-400">·</span>
                        <span className="text-[10px] text-stone-400">
                          {formatRelativeTime(c.created_at)}
                        </span>
                        {c.pending && (
                          <span className="text-[10px] font-medium text-amber-600">
                            (posting...)
                          </span>
                        )}
                      </div>

                      {canDelete && !c.pending && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id_comment)}
                          aria-label={isOwner ? "Delete comment" : "Delete comment as admin"}
                          title={isOwner ? "Delete comment" : "Moderate: delete as admin"}
                          className={`p-0.5 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 ${
                            isOwner
                              ? "text-stone-400 hover:text-red-600"
                              : "text-blue-500 hover:text-red-600"
                          }`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <p className="mt-1 break-words text-xs leading-relaxed text-stone-700">
                      {c.content}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Form Input Komentar (User) atau Ajakan Masuk (Guest) */}
      {user ? (
        <form onSubmit={handleSubmit} className="mt-2 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-stone-900 text-[11px] font-bold text-white shadow-2xs">
              {user.profile_picture_url || user.avatar_url ? (
                <Image
                  src={user.profile_picture_url || user.avatar_url}
                  alt={user.username || "Me"}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : (
                (user.username || "U").charAt(0).toUpperCase()
              )}
            </div>

            <div className="relative flex flex-1 items-center">
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write feedback or technical question..."
                maxLength={1000}
                disabled={submitting}
                className="w-full rounded-full border border-gray-200 bg-white py-2 pl-4 pr-11 text-xs text-stone-900 placeholder:text-gray-400 shadow-2xs transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
              />
              <button
                type="submit"
                disabled={!content.trim() || submitting}
                aria-label="Send comment"
                className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs transition-all hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50/60 p-3 text-center text-xs text-stone-600">
          <Link href="/login" className="font-bold text-blue-600 hover:underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/register" className="font-bold text-blue-600 hover:underline">
            Register
          </Link>{" "}
          to join the technical discussion.
        </div>
      )}
    </div>
  );
}
