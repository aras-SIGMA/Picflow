"use client";

// src/components/CommentSection.jsx
// Feed komentar real-time dengan Optimistic UI dan broadcast sinkronisasi
// interaksi via usePhotoRealtime.
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import {
  getPhotoComments,
  addPhotoComment,
  deletePhotoComment,
} from "@/lib/api";
import { usePhotoRealtime } from "@/lib/realtime";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import ApertureLoader from "@/components/ui/ApertureLoader";
import Button from "@/components/ui/Button";

export default function CommentSection({
  photoId,
  initialCount = 0,
  onCountChange,
  className = "",
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const listRef = useRef(null);

  // Muat daftar komentar saat pertama kali komponen dirender
  useEffect(() => {
    if (!photoId) return;
    let active = true;

    setLoading(true);
    getPhotoComments(photoId)
      .then((res) => {
        if (active) {
          setComments(res.data || []);
          onCountChange?.(res.data?.length ?? 0);
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
      setComments((prev) => {
        // Cegah duplikasi jika sudah ditambahkan via optimistic UI
        if (prev.some((c) => String(c.id_comment) === String(payload.comment?.id_comment))) {
          return prev;
        }
        const updated = [...prev, payload.comment];
        onCountChange?.(payload.comments_count ?? updated.length);
        return updated;
      });
    },
    onCommentDeleted: (payload) => {
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
    const text = content.trim();
    if (!text || submitting) return;

    // Optimistic comment item
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id_comment: tempId,
      id_photo: photoId,
      id_user: user?.id_user,
      content: text,
      created_at: new Date().toISOString(),
      user: {
        id_user: user?.id_user,
        username: user?.username || "You",
        avatar_url: user?.profile_picture_url,
      },
      is_owner: true,
      pending: true,
    };

    setContent("");
    setComments((prev) => [...prev, optimisticComment]);
    onCountChange?.(comments.length + 1);

    setSubmitting(true);
    try {
      const res = await addPhotoComment(photoId, text);
      if (res?.data?.comment) {
        setComments((prev) =>
          prev.map((c) => (c.id_comment === tempId ? res.data.comment : c))
        );
        onCountChange?.(res.data.comments_count);
      }
    } catch (err) {
      // Revert jika gagal
      setComments((prev) => prev.filter((c) => c.id_comment !== tempId));
      onCountChange?.(comments.length);
      setContent(text);
      toast.error(err.message || "Gagal mengirim komentar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId) {
    if (!commentId) return;
    const prevComments = [...comments];
    setComments((prev) => prev.filter((c) => c.id_comment !== commentId));
    onCountChange?.(Math.max(0, comments.length - 1));

    try {
      const res = await deletePhotoComment(photoId, commentId);
      if (res?.data?.comments_count != null) {
        onCountChange?.(res.data.comments_count);
      }
      toast.success("Komentar dihapus.");
    } catch (err) {
      setComments(prevComments);
      onCountChange?.(prevComments.length);
      toast.error(err.message || "Gagal menghapus komentar.");
    }
  }

  return (
    <div className={`flex flex-col rounded-[var(--radius-md)] border border-line bg-[var(--surface)] p-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-line/60 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={15} className="text-accent" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
            Komentar & Diskusi Teknis
          </h3>
        </div>
        <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-medium text-muted">
          {comments.length}
        </span>
      </div>

      {/* List Komentar */}
      <div
        ref={listRef}
        className="my-3 flex max-h-64 flex-col gap-3 overflow-y-auto pr-1"
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <ApertureLoader size={22} />
          </div>
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-xs text-faint">
            Belum ada diskusi. Jadilah yang pertama memberikan apresiasi atau pertanyaan teknis!
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((c) => {
              const authorName = c.user?.username || "Fotografer";
              const authorAvatar = c.user?.avatar_url;
              const dateStr = c.created_at
                ? new Date(c.created_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <motion.div
                  key={c.id_comment}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="group relative flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-transparent p-1.5 transition-colors hover:border-line/40 hover:bg-[var(--bg-elevated)]/40"
                >
                  <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-[var(--bg-elevated)] text-[10px] font-bold text-ink">
                    {authorAvatar ? (
                      <Image
                        src={authorAvatar}
                        alt={authorName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      authorName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-ink">
                        {authorName}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-faint">{dateStr}</span>
                        {c.is_owner && !c.pending && (
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id_comment)}
                            aria-label="Hapus komentar"
                            className="text-faint opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-0.5 break-words text-xs text-muted">
                      {c.content}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Form Input Komentar */}
      <form onSubmit={handleSubmit} className="mt-auto border-t border-line/60 pt-3">
        <div className="flex items-center gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tulis tanggapan atau pertanyaan teknis..."
            maxLength={1000}
            className="flex-1 rounded-full border border-line bg-[var(--bg-elevated)] px-3.5 py-2 text-xs text-ink placeholder:text-faint focus:border-accent focus:outline-none"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || submitting}
            className="rounded-full px-3 py-2 text-xs"
          >
            <Send size={13} />
          </Button>
        </div>
      </form>
    </div>
  );
}
