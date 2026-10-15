"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, Loader2, ArrowRight } from "lucide-react";
import {
  getPhotoComments,
  addPhotoComment,
  deletePhotoComment,
} from "@/lib/api";
import { usePhotoRealtime } from "@/lib/realtime";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InlineCommentSection({
  photoId,
  onCountChange,
  autoFocus = true,
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [prevPhotoId, setPrevPhotoId] = useState(photoId);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const inputRef = useRef(null);

  if (photoId !== prevPhotoId) {
    setPrevPhotoId(photoId);
    setLoading(true);
  }

  useEffect(() => {
    let active = true;

    getPhotoComments(photoId)
      .then((res) => {
        if (active) {
          const list = res.data || [];
          setComments(list);
          onCountChange?.(list.length);
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

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  usePhotoRealtime(photoId, {
    onCommentAdded: (payload) => {
      setComments((prev) => {
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
        avatar_url: user?.profile_picture_url || user?.avatar_url,
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
      setComments((prev) => prev.filter((c) => c.id_comment !== tempId));
      onCountChange?.(comments.length);
      setContent(text);
      toast.error(err.message || "Failed to post comment.");
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
      toast.success("Comment deleted.");
    } catch (err) {
      setComments(prevComments);
      onCountChange?.(prevComments.length);
      toast.error(err.message || "Failed to delete comment.");
    }
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50/60 p-4 transition-colors">
      {/* Input Form Twitter Style */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-stone-900 text-[11px] font-bold text-white shadow-xs">
            {user.profile_picture_url || user.avatar_url ? (
              <Image
                src={user.profile_picture_url || user.avatar_url}
                alt={user.username || "Avatar"}
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
              ref={inputRef}
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Post a thoughtful comment or reply..."
              maxLength={1000}
              disabled={submitting}
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-4 pr-11 text-xs text-stone-800 placeholder:text-gray-400 shadow-2xs transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
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
        </form>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center text-xs text-stone-600">
          <Link href="/login" className="font-bold text-blue-600 hover:underline">
            Sign in
          </Link>{" "}
          to join the discussion and critique.
        </div>
      )}

      {/* List Comments */}
      <div className="mt-3.5 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center py-4 text-xs text-stone-400">
            <Loader2 size={16} className="animate-spin text-blue-600 mr-2" />
            <span>Loading discussion...</span>
          </div>
        ) : comments.length === 0 ? (
          <p className="py-2 text-center text-xs text-stone-400 italic">
            No comments yet. Start the conversation!
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((c) => {
              const authorName = c.user?.username || "Creator";
              const authorAvatar = c.user?.avatar_url;
              const isOwner = Boolean(
                c.is_owner || (user?.id_user && c.id_user === user.id_user)
              );

              return (
                <motion.div
                  key={c.id_comment}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="group flex items-start gap-2.5 rounded-xl bg-white p-2.5 border border-gray-100 shadow-2xs"
                >
                  <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-stone-800 text-[10px] font-bold text-white">
                    {authorAvatar ? (
                      <Image
                        src={authorAvatar}
                        alt={authorName}
                        fill
                        sizes="28px"
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
                        <span className="text-[10px] text-gray-400">·</span>
                        <span className="text-[10px] text-gray-400">
                          {formatRelativeTime(c.created_at)}
                        </span>
                        {c.pending && (
                          <span className="text-[10px] text-amber-500 font-medium">
                            (posting...)
                          </span>
                        )}
                      </div>

                      {isOwner && !c.pending && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id_comment)}
                          aria-label="Delete comment"
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-0.5"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    <p className="mt-0.5 break-words text-xs text-stone-700 leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Link to Dedicated Page */}
      {comments.length > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-gray-200/60 pt-2 text-[11px] text-stone-500">
          <span>{comments.length} discussion {comments.length === 1 ? "entry" : "entries"}</span>
          <Link
            href={`/photos/${photoId}`}
            className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
          >
            <span>Full discussion & technical inspection</span>
            <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  );
}
