"use client";

// src/components/PhotoCard.jsx
// Kartu foto masonry: rasio bervariasi agar masonry terasa nyata, hover
// zoom 1.04 + overlay gradient dari bawah + caption slide-up. Klik membuka
// lightbox dengan shared layout animation (layoutId). Aksi edit/hapus hanya
// tampil bila halaman pemanggil menyediakan handler (tidak ditambah paksa).
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ImageOff, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { fileUrl } from "@/lib/api";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";
import { EASE } from "@/components/ui/motion";
import LikeButton from "./LikeButton";

// Rasio thumbnail bervariasi per foto supaya susunan masonry bervariasi
// (murni presentasi; gambar tetap object-cover tanpa distorsi).
const ASPECTS = ["aspect-[3/4]", "aspect-[4/5]", "aspect-square", "aspect-[4/3]"];

export default function PhotoCard({
  photo,
  onDelete,
  onOpen,
  onPeek,
  layoutId,
  showActions = false,
}) {
  const src = photo.medium_url || fileUrl(photo.image_url);
  const aspect = ASPECTS[Math.abs(Number(photo.id_photo) || 0) % ASPECTS.length];

  const creatorName = photo.creator?.username || null;
  const creatorAvatar = photo.creator?.avatar_url || null;

  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: EASE }}
      className="group mb-4 break-inside-avoid overflow-hidden rounded-[var(--radius-md)] border border-line bg-[var(--bg-elevated)]"
      onMouseEnter={() => onPeek?.(photo)}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpen?.(photo)}
          className="relative block w-full cursor-zoom-in text-left"
          aria-label={`Lihat detail ${photo.title}`}
        >
          <motion.div
            layoutId={layoutId ? `${layoutId}-${photo.id_photo}` : undefined}
            className={`relative w-full overflow-hidden bg-[var(--surface)] ${aspect}`}
          >
            {src ? (
              <Image
                src={src}
                loader={isCloudinaryUrl(src) ? cloudinaryLoader : undefined}
                alt={photo.title || "Foto"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageOff size={22} className="text-faint" />
              </div>
            )}
          </motion.div>

          {/* Overlay gradient + caption slide-up saat hover */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="translate-y-2 transition-transform duration-500 ease-out group-hover:translate-y-0">
              {creatorName && (
                <div className="mb-1.5 flex items-center gap-1.5">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold text-white">
                    {creatorAvatar ? (
                      <Image
                        src={creatorAvatar}
                        alt={creatorName}
                        width={16}
                        height={16}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      creatorName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-white/90">
                    @{creatorName}
                  </span>
                </div>
              )}
              <p className="truncate text-sm font-semibold text-white">{photo.title}</p>
              <p className="text-xs text-white/60">
                {photo.category_name || `#${photo.id_category}`}
              </p>
            </div>
          </div>
        </button>

        {/* Floating LikeButton di pojok kanan atas saat hover/focus */}
        <div className="absolute right-3 top-3 z-10 opacity-90 transition-opacity group-hover:opacity-100">
          <LikeButton
            photoId={photo.id_photo}
            initialLiked={photo.is_liked}
            initialCount={photo.likes_count}
            size="sm"
            className="shadow-md backdrop-blur-md"
          />
        </div>
      </div>

      {/* Footer kartu: interaksi sosial & tindakan pemilik */}
      <figcaption className="flex items-center justify-between gap-2 px-3.5 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink">{photo.title}</p>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-faint">
            {creatorName && <span>@{creatorName}</span>}
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={11} />
              {photo.comments_count || 0}
            </span>
          </div>
        </div>

        {showActions ? (
          <div className="flex shrink-0 gap-1.5">
            <Link
              href={`/addphoto?id=${photo.id_photo}`}
              aria-label={`Edit ${photo.title}`}
              className="rounded-full border border-line p-1.5 text-muted transition-colors hover:border-white/30 hover:text-ink"
            >
              <Pencil size={12} />
            </Link>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(photo)}
                aria-label={`Hapus ${photo.title}`}
                className="rounded-full border border-line p-1.5 text-muted transition-colors hover:border-[var(--danger)]/50 hover:text-[var(--danger)]"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ) : null}
      </figcaption>
    </motion.figure>
  );
}
