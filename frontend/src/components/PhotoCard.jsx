"use client";

// src/components/PhotoCard.jsx
// Kartu foto masonry: rasio bervariasi agar masonry terasa nyata, hover
// zoom 1.04 + overlay gradient dari bawah + caption slide-up. Klik membuka
// lightbox dengan shared layout animation (layoutId). Aksi edit/hapus hanya
// tampil bila halaman pemanggil menyediakan handler (tidak ditambah paksa).
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ImageOff, Pencil, Trash2 } from "lucide-react";
import { fileUrl } from "@/lib/api";
import { EASE } from "@/components/ui/motion";

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
  const src = fileUrl(photo.image_url);
  const aspect = ASPECTS[Math.abs(Number(photo.id_photo) || 0) % ASPECTS.length];

  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: EASE }}
      className="group mb-4 break-inside-avoid overflow-hidden rounded-[var(--radius-md)] border border-line bg-[var(--bg-elevated)]"
      onMouseEnter={() => onPeek?.(photo)}
    >
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
              alt={photo.title || "Foto"}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageOff size={22} className="text-faint" />
            </div>
          )}
        </motion.div>

        {/* Overlay gradient + caption slide-up saat hover */}
        <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="translate-y-3 p-4 transition-transform duration-500 ease-out group-hover:translate-y-0">
            <p className="text-sm font-semibold text-white">{photo.title}</p>
            <p className="text-xs text-white/60">
              {photo.category_name || `#${photo.id_category}`}
            </p>
          </div>
        </div>
      </button>

      {showActions && (
        <figcaption className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{photo.title}</p>
            <p className="text-xs text-faint">
              {photo.category_name || `#${photo.id_category}`}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Link
              href={`/addphoto?id=${photo.id_photo}`}
              aria-label={`Edit ${photo.title}`}
              className="rounded-full border border-line p-2 text-muted transition-colors hover:border-white/30 hover:text-ink"
            >
              <Pencil size={13} />
            </Link>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(photo)}
                aria-label={`Hapus ${photo.title}`}
                className="rounded-full border border-line p-2 text-muted transition-colors hover:border-[var(--danger)]/50 hover:text-[var(--danger)]"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </figcaption>
      )}
    </motion.figure>
  );
}
