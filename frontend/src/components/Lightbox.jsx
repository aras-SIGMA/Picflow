"use client";

// src/components/Lightbox.jsx
// Detail foto dengan shared layout animation (layoutId sama dengan
// PhotoCard). Tutup via ESC, klik backdrop, atau tombol X; fokus masuk ke
// panel dan dikembalikan ke pemicu saat ditutup. Menampilkan floating
// info card bergaya referensi: kategori, tanggal, deskripsi, dan link
// beraksen ungu ke halaman edit.
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Camera,
  ExternalLink,
  MessageSquare,
  Pencil,
  Tag,
  X,
} from "lucide-react";
import { fileUrl } from "@/lib/api";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";
import { EASE } from "@/components/ui/motion";
import ExifMetadataPanel from "./ExifMetadataPanel";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";
import FollowButton from "./FollowButton";

export default function Lightbox({ photo, layoutId, onClose }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const [activeTab, setActiveTab] = useState("exif"); // "exif" | "comments"
  const [commentsCount, setCommentsCount] = useState(photo?.comments_count || 0);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!photo) return;
    setCommentsCount(photo.comments_count || 0);
  }, [photo]);

  useEffect(() => {
    if (!photo) return;
    const opener = document.activeElement;

    function onKey(e) {
      if (e.key === "Escape") onCloseRef.current?.();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, [photo]);

  if (!photo) return null;
  const src = photo.high_res_url || fileUrl(photo.image_url);

  const creatorName = photo.creator?.username || null;
  const creatorId = photo.creator?.id_user || photo.id_user;
  const creatorAvatar = photo.creator?.avatar_url || null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Detail foto ${photo.title}`}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-[var(--bg-elevated)] outline-none"
      >
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        >
          <X size={16} />
        </button>

        {/* Stage Gambar Utama */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/40">
          <motion.div
            layoutId={layoutId ? `${layoutId}-${photo.id_photo}` : undefined}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative flex max-h-[48vh] min-h-0 w-full items-center justify-center"
          >
            {src ? (
              <Image
                src={src}
                loader={isCloudinaryUrl(src) ? cloudinaryLoader : undefined}
                alt={photo.title || "Foto"}
                width={2048}
                height={1536}
                sizes="(max-width: 1024px) 100vw, 2048px"
                className="h-auto max-h-[48vh] w-auto max-w-full object-contain"
                priority
              />
            ) : (
              <p className="text-sm text-faint">Gambar tidak tersedia.</p>
            )}
          </motion.div>
        </div>

        {/* Floating info card, Social Actions & Panels */}
        <div className="max-h-[44vh] overflow-y-auto border-t border-line p-5">
          {/* Header Bar: Creator, Title, Actions */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Creator info + Follow Button */}
              {creatorName && (
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-[var(--surface)] text-[10px] font-bold text-ink">
                    {creatorAvatar ? (
                      <Image
                        src={creatorAvatar}
                        alt={creatorName}
                        width={24}
                        height={24}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      creatorName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-xs font-semibold text-ink">
                    @{creatorName}
                  </span>
                  <FollowButton creatorId={creatorId} size="sm" />
                </div>
              )}

              <h2 className="display-2 text-xl!">{photo.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Tag size={12} className="text-accent" />
                  {photo.category_name || `#${photo.id_category}`}
                </span>
                {photo.created_at && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={12} className="text-accent2" />
                    {new Date(photo.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
              {photo.description && (
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                  {photo.description}
                </p>
              )}
            </div>

            {/* Social & Nav Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <LikeButton
                photoId={photo.id_photo}
                initialLiked={photo.is_liked}
                initialCount={photo.likes_count}
              />
              <Link
                href={`/photos/${photo.id_photo}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
              >
                <ExternalLink size={13} />
                Detail
              </Link>
              {photo.is_owner && (
                <Link
                  href={`/addphoto?id=${photo.id_photo}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-accent transition-opacity hover:opacity-80"
                >
                  <Pencil size={13} />
                  Edit
                </Link>
              )}
            </div>
          </div>

          {/* Tab Selector: EXIF Parameter vs Diskusi Komentar */}
          <div className="mt-5 flex gap-2 border-b border-line/60 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("exif")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                activeTab === "exif"
                  ? "bg-accent/20 text-accent font-semibold"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Camera size={13} />
              EXIF Parameter
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("comments")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                activeTab === "comments"
                  ? "bg-accent/20 text-accent font-semibold"
                  : "text-muted hover:text-ink"
              }`}
            >
              <MessageSquare size={13} />
              Diskusi & Komentar ({commentsCount})
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            <AnimatePresence mode="wait">
              {activeTab === "exif" ? (
                <motion.div
                  key="tab-exif"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <ExifMetadataPanel photo={photo} />
                </motion.div>
              ) : (
                <motion.div
                  key="tab-comments"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <CommentSection
                    photoId={photo.id_photo}
                    initialCount={commentsCount}
                    onCountChange={setCommentsCount}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
