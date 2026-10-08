"use client";

// src/components/Lightbox.jsx
// Detail foto dengan shared layout animation (layoutId sama dengan
// PhotoCard). Tutup via ESC, klik backdrop, atau tombol X; fokus masuk ke
// panel dan dikembalikan ke pemicu saat ditutup. Menampilkan floating
// info card bergaya referensi: kategori, tanggal, deskripsi, dan link
// beraksen ungu ke halaman edit.
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ExternalLink,
  Pencil,
  Tag,
  X,
} from "lucide-react";
import { fileUrl } from "@/lib/api";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";
import { EASE } from "@/components/ui/motion";
import ExifMetadataPanel from "./ExifMetadataPanel";

export default function Lightbox({ photo, layoutId, onClose }) {
  const panelRef = useRef(null);
  // Ref agar efek tidak re-run tiap render (onClose biasanya inline arrow).
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

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

        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/40">
          <motion.div
            layoutId={layoutId ? `${layoutId}-${photo.id_photo}` : undefined}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative flex max-h-[50vh] min-h-0 w-full items-center justify-center"
          >
            {src ? (
              <Image
                src={src}
                loader={isCloudinaryUrl(src) ? cloudinaryLoader : undefined}
                alt={photo.title || "Foto"}
                width={2048}
                height={1536}
                sizes="(max-width: 1024px) 100vw, 2048px"
                className="h-auto max-h-[50vh] w-auto max-w-full object-contain"
                priority
              />
            ) : (
              <p className="text-sm text-faint">Gambar tidak tersedia.</p>
            )}
          </motion.div>
        </div>

        {/* Floating info card & EXIF Technical Panel */}
        <div className="max-h-[42vh] overflow-y-auto border-t border-line p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
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

            <div className="flex items-center gap-3">
              <Link
                href={`/photos/${photo.id_photo}`}
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
              >
                <ExternalLink size={13} />
                Detail penuh
              </Link>
              <Link
                href={`/addphoto?id=${photo.id_photo}`}
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-accent transition-opacity hover:opacity-80"
              >
                <Pencil size={13} />
                Edit foto
              </Link>
            </div>
          </div>

          <ExifMetadataPanel photo={photo} className="mt-4" />
        </div>
      </motion.div>
    </motion.div>
  );
}
