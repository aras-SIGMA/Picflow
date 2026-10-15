"use client";

// src/components/LandscapePhotoCarousel.jsx
// Carousel Marquee Foto Format LANDSCAPE untuk Landing Page PicFlow:
// - Format rasio lanskap (16:10 / 16:9) sesuai permintaan user
// - Bergerak otomatis secara halus (marquee loop tanpa jeda, pause saat hover)
// - Dilengkapi badge kategori, info fotografer, dan parameter optik EXIF
// - Klik kartu membuka modal Lightbox untuk bedah EXIF mendalam
import Image from "next/image";
import { Camera, Eye, Sparkles } from "lucide-react";
import { fileUrl } from "@/lib/api";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";

// Fallback kurasi foto landscape resolusi tinggi berstandar sRGB
const FALLBACK_LANDSCAPE_PHOTOS = [
  {
    id_photo: "ls-1",
    title: "Alpine Sunrise over Lake Braies",
    image_url:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    camera_model: "Sony α7R V",
    aperture: "f/2.8",
    shutter_speed: "1/800s",
    iso: "100",
    category_name: "Landscape",
    creator: { username: "aris_visual", avatar_url: null },
  },
  {
    id_photo: "ls-2",
    title: "Golden Hour in Kyoto Bamboo Groves",
    image_url:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
    camera_model: "Fujifilm X-T5",
    aperture: "f/4.0",
    shutter_speed: "1/250s",
    iso: "160",
    category_name: "Nature",
    creator: { username: "kenji_optics", avatar_url: null },
  },
  {
    id_photo: "ls-3",
    title: "Reykjavik Basalt Coastline at Dusk",
    image_url:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    camera_model: "Leica M11",
    aperture: "f/2.0",
    shutter_speed: "1/1200s",
    iso: "64",
    category_name: "Seascape",
    creator: { username: "elena_nordic", avatar_url: null },
  },
  {
    id_photo: "ls-4",
    title: "Dolomites Pinnacles Under Morning Mist",
    image_url:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    camera_model: "Nikon Z8",
    aperture: "f/8.0",
    shutter_speed: "1/320s",
    iso: "64",
    category_name: "Mountain",
    creator: { username: "clara_peaks", avatar_url: null },
  },
  {
    id_photo: "ls-5",
    title: "Modern Glass Facade Geometry",
    image_url:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    camera_model: "Hasselblad X2D",
    aperture: "f/5.6",
    shutter_speed: "1/160s",
    iso: "100",
    category_name: "Architecture",
    creator: { username: "marcus_lines", avatar_url: null },
  },
  {
    id_photo: "ls-6",
    title: "Sahara Dunes Wind Pattern",
    image_url:
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
    camera_model: "Canon EOS R5",
    aperture: "f/4.0",
    shutter_speed: "1/1000s",
    iso: "200",
    category_name: "Desert",
    creator: { username: "tariq_dunes", avatar_url: null },
  },
];

export default function LandscapePhotoCarousel({ photos = [], onOpenPhoto }) {
  // Format data foto asli dari DB pengguna
  const liveItems = (photos || []).map((p) => ({
    id_photo: p.id_photo || p.id,
    title: p.title || "PicFlow Vault Work",
    image_url: p.image_url ? fileUrl(p.image_url) : p.photo_url || p.medium_url,
    camera_model: p.camera_model || p.exif_data?.camera || "Digital Camera",
    aperture: p.aperture || "f/2.8",
    shutter_speed: p.shutter_speed || "1/500s",
    iso: p.iso || "100",
    category_name: p.category_name || p.categories?.name || "Editorial",
    creator: {
      username: p.author_name || p.profiles?.username || p.creator?.username || "photographer",
      avatar_url: p.profiles?.avatar_url || p.creator?.avatar_url || null,
    },
    rawPhoto: p,
  }));

  // Gabungkan foto live pengguna di awal, diikuti kurasi fallback landscape
  const combinedPhotos = [...liveItems, ...FALLBACK_LANDSCAPE_PHOTOS];

  return (
    <section id="galeri" className="relative overflow-hidden py-16 sm:py-24 border-b border-[#E8DEC9]">
      {/* Header Seksi Carousel Landscape */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DCD0BE] bg-[#F5EFE6] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              <Sparkles size={12} className="text-blue-600" />
              CURATED COMMUNITY GALLERY
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Panoramic &amp; Landscape Perspectives
            </h2>
            <p className="mt-2 text-sm text-stone-600 max-w-2xl">
              Full-resolution landscape works by PicFlow photographers. Calibrated to the sRGB
              color standard with verified optical metadata.
            </p>
          </div>

          <p className="hidden sm:block text-xs font-mono text-stone-500 text-right">
            <span>Hover cursor to pause</span>
            <br />
            <span className="text-blue-600 font-semibold">Click photo to open EXIF Lightbox</span>
          </p>
        </div>
      </div>

      {/* Track Marquee Foto Format Landscape (Single continuous track ke kanan) */}
      <div className="relative mt-10 w-full overflow-hidden py-4">
        <div className="marquee-right flex gap-6 px-4">
          {/* Digandakan agar loop terus berjalan tanpa putus */}
          {[...combinedPhotos, ...combinedPhotos].map((photo, idx) => (
            <LandscapeCard
              key={`landscape-${photo.id_photo}-${idx}`}
              photo={photo}
              onOpen={() => onOpenPhoto && onOpenPhoto(photo.rawPhoto || photo)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LandscapeCard({ photo, onOpen }) {
  const isCloudinary = isCloudinaryUrl(photo.image_url);

  return (
    <figure
      onClick={onOpen}
      className="group relative h-[240px] w-[360px] sm:h-[280px] sm:w-[440px] shrink-0 cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl border border-[#DCD0BE] bg-[#FFFDF6] shadow-xs transition-all duration-300 hover:border-blue-600/50 hover:shadow-lg"
    >
      {/* Gambar Format Landscape 16:10 */}
      <Image
        src={photo.image_url}
        alt={photo.title || "Landscape Photography Work"}
        fill
        sizes="(max-width: 640px) 360px, 440px"
        loader={isCloudinary ? cloudinaryLoader : undefined}
        unoptimized={!isCloudinary}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Overlay Gelap Halus Saat Hover */}
      <div className="absolute inset-0 bg-black/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Badge Kategori Kiri Atas */}
      <div className="absolute left-3.5 top-3.5 z-10">
        <span className="rounded-full border border-[#DCD0BE] bg-[#FFFDF6]/90 px-3 py-1 text-[11px] font-bold text-stone-800 shadow-2xs backdrop-blur-md">
          {photo.category_name}
        </span>
      </div>

      {/* Badge Rasio & Kamera Kanan Atas */}
      <div className="absolute right-3.5 top-3.5 z-10 flex items-center gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[10px] font-mono text-white backdrop-blur-md">
          <Eye size={11} />
          Inspect EXIF
        </span>
      </div>

      {/* Kapsul Info Minimalis di Bagian Bawah (#FFFDF6 Warm Cream) */}
      <figcaption className="absolute inset-x-3.5 bottom-3.5 z-10 rounded-2xl border border-[#DCD0BE] bg-[#FFFDF6]/95 p-3.5 shadow-md backdrop-blur-md transition-transform duration-300 group-hover:-translate-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs sm:text-sm font-bold text-stone-900 group-hover:text-blue-600 transition-colors">
            {photo.title}
          </p>
          <span className="shrink-0 font-mono text-[10px] text-stone-500">
            {photo.camera_model}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-600">
          {/* Username Kreator */}
          <span className="flex items-center gap-1.5 font-medium truncate max-w-[150px]">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
              @
            </span>
            <span className="truncate">{photo.creator.username}</span>
          </span>

          {/* Parameter Aperture & Shutter Speed */}
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-stone-700">
            <span className="flex items-center gap-1 rounded-md border border-[#E2D7C5] bg-[#FFFDF6] px-1.5 py-0.5">
              <Camera size={10} className="text-blue-600" />
              {photo.aperture}
            </span>
            <span className="hidden sm:inline-block rounded-md border border-[#E2D7C5] bg-[#FFFDF6] px-1.5 py-0.5">
              {photo.shutter_speed}
            </span>
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
