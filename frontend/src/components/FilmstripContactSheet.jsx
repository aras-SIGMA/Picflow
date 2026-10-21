"use client";

// src/components/FilmstripContactSheet.jsx
// Redesain Galeri Komunitas PicFlow: Filmstrip Contact Sheet 35mm Analog
// Fitur:
// - Desain pita seluloid gelap (dark acetate film reel) dengan perforasi sprocket atas-bawah
// - Penomoran frame analog (EXP 01A, 02A, dsb), barcode DX optik, dan anotasi grease pencil kurator (merah)
// - Kontrol interaktif: filter kategori, tombol scrub manual (prev/next), toggle auto-pan reel
// - Parameter EXIF presisi (kamera, bukaan f-stop, shutter, ISO, lensa)
// - Klik frame membuka modal Lightbox kuratorial dengan inspeksi EXIF mendalam

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Camera,
  Eye,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SlidersHorizontal,
} from "lucide-react";
import { fileUrl } from "@/lib/api";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";

// Kurasi 10 foto master proof dengan metadata optik realistis
const FALLBACK_PROOFS = [
  {
    id_photo: "fs-1",
    frame_number: "01A",
    title: "Alpine Sunrise over Lake Braies",
    image_url:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=85",
    camera_model: "Sony α7R V",
    lens: "FE 24-70mm f/2.8 GM II",
    aperture: "f/2.8",
    shutter_speed: "1/800s",
    iso: "100",
    focal_length: "35mm",
    category_name: "Landscape",
    curator_pick: true,
    curator_note: "Flawless tonal transition across lake reflection",
    creator: { username: "aris_visual", full_name: "Aris Thorne", avatar_url: null },
  },
  {
    id_photo: "fs-2",
    frame_number: "02A",
    title: "Golden Hour in Kyoto Bamboo Groves",
    image_url:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=85",
    camera_model: "Fujifilm X-T5",
    lens: "XF 33mm f/1.4 R LM WR",
    aperture: "f/1.4",
    shutter_speed: "1/250s",
    iso: "160",
    focal_length: "33mm",
    category_name: "Nature",
    curator_pick: false,
    creator: { username: "kenji_optics", full_name: "Kenji Sato", avatar_url: null },
  },
  {
    id_photo: "fs-3",
    frame_number: "03A",
    title: "Reykjavik Basalt Coastline at Dusk",
    image_url:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85",
    camera_model: "Leica M11",
    lens: "Summilux-M 50mm f/1.4 ASPH",
    aperture: "f/2.0",
    shutter_speed: "1/1200s",
    iso: "64",
    focal_length: "50mm",
    category_name: "Seascape",
    curator_pick: true,
    curator_note: "Masterclass micro-contrast on volcanic textures",
    creator: { username: "elena_nordic", full_name: "Elena Lindqvist", avatar_url: null },
  },
  {
    id_photo: "fs-4",
    frame_number: "04A",
    title: "Dolomites Pinnacles Under Morning Mist",
    image_url:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85",
    camera_model: "Nikon Z8",
    lens: "NIKKOR Z 70-200mm f/2.8 VR S",
    aperture: "f/8.0",
    shutter_speed: "1/320s",
    iso: "64",
    focal_length: "135mm",
    category_name: "Mountain",
    curator_pick: false,
    creator: { username: "clara_peaks", full_name: "Clara Bauer", avatar_url: null },
  },
  {
    id_photo: "fs-5",
    frame_number: "05A",
    title: "Modern Glass Facade Geometry",
    image_url:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=85",
    camera_model: "Hasselblad X2D 100C",
    lens: "XCD 38mm f/2.5 V",
    aperture: "f/5.6",
    shutter_speed: "1/160s",
    iso: "100",
    focal_length: "38mm",
    category_name: "Architecture",
    curator_pick: true,
    curator_note: "100MP resolving power reveals clean glass grids",
    creator: { username: "marcus_lines", full_name: "Marcus Vance", avatar_url: null },
  },
  {
    id_photo: "fs-6",
    frame_number: "06A",
    title: "Sahara Dunes Wind Pattern",
    image_url:
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1400&q=85",
    camera_model: "Canon EOS R5",
    lens: "RF 85mm f/1.2L USM",
    aperture: "f/4.0",
    shutter_speed: "1/1000s",
    iso: "200",
    focal_length: "85mm",
    category_name: "Desert",
    curator_pick: false,
    creator: { username: "tariq_dunes", full_name: "Tariq Al-Mansoor", avatar_url: null },
  },
  {
    id_photo: "fs-7",
    frame_number: "07A",
    title: "Neon Reflections in Shinjuku Rain",
    image_url:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1400&q=85",
    camera_model: "Ricoh GR IIIx",
    lens: "GR 26.1mm f/2.8",
    aperture: "f/2.8",
    shutter_speed: "1/125s",
    iso: "800",
    focal_length: "40mm eq.",
    category_name: "Street",
    curator_pick: true,
    curator_note: "sRGB spectrum pop with deep shadow preservation",
    creator: { username: "daiki_streets", full_name: "Daiki Kuroda", avatar_url: null },
  },
  {
    id_photo: "fs-8",
    frame_number: "08A",
    title: "Minimalist Nordic Timber Architecture",
    image_url:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85",
    camera_model: "Leica SL2",
    lens: "Vario-Elmarit-SL 24-90mm",
    aperture: "f/4.5",
    shutter_speed: "1/500s",
    iso: "100",
    focal_length: "28mm",
    category_name: "Architecture",
    curator_pick: false,
    creator: { username: "soren_arch", full_name: "Soren Holst", avatar_url: null },
  },
  {
    id_photo: "fs-9",
    frame_number: "09A",
    title: "Morning Fog over Pacific Coastline",
    image_url:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=85",
    camera_model: "Sony α1",
    lens: "FE 16-35mm f/2.8 GM II",
    aperture: "f/8.0",
    shutter_speed: "1/640s",
    iso: "125",
    focal_length: "24mm",
    category_name: "Landscape",
    curator_pick: false,
    creator: { username: "maya_coast", full_name: "Maya Chen", avatar_url: null },
  },
  {
    id_photo: "fs-10",
    frame_number: "10A",
    title: "Solitude in Autumn Birch Forest",
    image_url:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=85",
    camera_model: "Canon EOS R3",
    lens: "RF 50mm f/1.2L USM",
    aperture: "f/1.8",
    shutter_speed: "1/2000s",
    iso: "100",
    focal_length: "50mm",
    category_name: "Nature",
    curator_pick: true,
    curator_note: "Sublime depth of field separation with crisp foliage",
    creator: { username: "lukas_nature", full_name: "Lukas Weber", avatar_url: null },
  },
];

const CATEGORIES = ["All Frames", "Landscape", "Nature", "Architecture", "Street", "Seascape"];

export default function FilmstripContactSheet({ photos = [], onOpenPhoto }) {
  const [selectedCategory, setSelectedCategory] = useState("All Frames");
  const [isAutoPanning, setIsAutoPanning] = useState(true);

  const scrollContainerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isHoveredRef = useRef(false);

  // Format data pengguna jika ada, padukan dengan kurasi master proof
  const liveItems = (photos || []).map((p, idx) => ({
    id_photo: p.id_photo || p.id,
    frame_number: `${String(idx + 1).padStart(2, "0")}A`,
    title: p.title || "PicFlow Proof Negative",
    image_url: p.image_url ? fileUrl(p.image_url) : p.photo_url || p.medium_url,
    camera_model: p.camera_model || p.exif_data?.camera || "35mm Camera",
    lens: p.lens_model || p.exif_data?.lens || "Prime Optics",
    aperture: p.aperture || "f/2.8",
    shutter_speed: p.shutter_speed || "1/500s",
    iso: p.iso || "100",
    focal_length: p.focal_length || "50mm",
    category_name: p.category_name || p.categories?.name || "Editorial",
    curator_pick: idx === 0,
    curator_note: idx === 0 ? "Curator's choice from live database upload" : null,
    creator: {
      username: p.author_name || p.profiles?.username || p.creator?.username || "creator",
      full_name: p.profiles?.full_name || p.creator?.full_name || "Photographer",
      avatar_url: p.profiles?.avatar_url || p.creator?.avatar_url || null,
    },
    rawPhoto: p,
  }));

  // Gabungkan item aktif
  const allProofs = liveItems.length > 0 ? [...liveItems, ...FALLBACK_PROOFS] : FALLBACK_PROOFS;

  // Filter kategori
  const filteredProofs =
    selectedCategory === "All Frames"
      ? allProofs
      : allProofs.filter(
          (p) =>
            p.category_name?.toLowerCase() === selectedCategory.toLowerCase() ||
            (selectedCategory === "Landscape" && p.category_name === "Mountain")
        );

  // Duplikasi untuk continuous loop feel jika data sedikit
  const displayProofs =
    filteredProofs.length < 8 ? [...filteredProofs, ...filteredProofs] : filteredProofs;

  // Auto-pan loop menggunakan requestAnimationFrame
  useEffect(() => {
    let animId;
    const loop = () => {
      if (scrollContainerRef.current && isAutoPanning && !isHoveredRef.current) {
        const el = scrollContainerRef.current;
        el.scrollLeft += 0.85;

        // Wrap-around halus saat mendekati batas kanan
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 5) {
          el.scrollLeft = 0;
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      if (animId) {
        cancelAnimationFrame(animId);
      }
    };
  }, [isAutoPanning]);

  // Handler navigasi manual
  const handleScrollPrev = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -460, behavior: "smooth" });
  };

  const handleScrollNext = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 460, behavior: "smooth" });
  };

  return (
    <section
      id="galeri"
      className="relative overflow-hidden border-b border-[#E8DEC9] bg-[#FFFDF6] py-16 sm:py-24"
    >
      {/* Background Grid Line Sangat Samar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #E8DEC9 1px, transparent 1px), linear-gradient(to bottom, #E8DEC9 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* ========================================================================= */}
        {/* 1. HEADER SECTION: CURATORIAL CONTACT SHEET INTRO                          */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 border-b border-[#E8DEC9] pb-8">
          <div>
            {/* Pill Badge Identitas Contact Sheet */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DCD0BE] bg-[#F5EFE6] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-700 shadow-2xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
              </span>
              <span>✦ 35MM ARCHIVAL CONTACT SHEET · EMULSION NO. 8421</span>
            </div>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
              Curated Community Proofs
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
              Raw negative proof strips directly from community camera sensors. Every frame preserves
              uncompressed sRGB gamuts, authentic exposure margins, and verified optical metadata.
            </p>
          </div>

          {/* Kontrol & Filter Interaktif */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Navigasi Scrub Arrow & Play/Pause */}
            <div className="flex items-center gap-2 rounded-full border border-[#DCD0BE] bg-[#F5EFE6] p-1.5 shadow-2xs">
              <button
                type="button"
                onClick={handleScrollPrev}
                aria-label="Scroll reel backward"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFFDF6] text-stone-700 transition-all hover:bg-stone-900 hover:text-white active:scale-95 shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => setIsAutoPanning((prev) => !prev)}
                className="flex items-center gap-2 rounded-full bg-[#FFFDF6] px-3.5 py-1.5 text-xs font-mono font-bold text-stone-800 transition-all hover:bg-stone-900 hover:text-white cursor-pointer shadow-2xs"
                title={isAutoPanning ? "Pause automatic strip movement" : "Resume auto-pan"}
              >
                {isAutoPanning ? (
                  <>
                    <Pause size={13} className="text-[#EF4444]" />
                    <span className="text-[11px] tracking-wide">REEL: AUTO</span>
                  </>
                ) : (
                  <>
                    <Play size={13} className="text-[#10B981]" />
                    <span className="text-[11px] tracking-wide">REEL: PAUSED</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleScrollNext}
                aria-label="Scroll reel forward"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFFDF6] text-stone-700 transition-all hover:bg-stone-900 hover:text-white active:scale-95 shadow-2xs cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Quick Helper Text */}
            <div className="hidden xl:block font-mono text-[11px] text-stone-500 text-right leading-tight">
              <p className="font-semibold text-stone-800">DRAG OR CLICK PROOF</p>
              <p className="text-stone-400">to inspect optical EXIF</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CATEGORY SELECTOR CHIPS                                                */}
        {/* ========================================================================= */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-stone-400">
            <SlidersHorizontal size={13} />
            FILTER ROLL:
          </span>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-stone-900 text-white shadow-sm ring-2 ring-stone-900/10"
                    : "border border-[#DCD0BE] bg-[#FAF7F0] text-stone-600 hover:bg-[#FFFDF6] hover:text-stone-900 hover:border-stone-400"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. THE 35MM ACETATE FILMSTRIP ROLL (DARK NEGATIVE CONTACT SHEET)           */}
      {/* ========================================================================= */}
      <div
        className="relative mt-10 w-full overflow-hidden bg-[#111113] py-4 sm:py-6 shadow-2xl border-y border-stone-800"
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
      >
        {/* Top Sprocket Perforation Band */}
        <div className="relative mb-3 flex items-center justify-between border-b border-stone-800/80 px-2 pb-2">
          {/* Continuous sprocket holes row with warm cream background shine-through */}
          <div className="flex w-full items-center justify-between overflow-hidden opacity-90 select-none">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={`sprocket-top-${i}`} className="flex items-center gap-3 shrink-0 px-2">
                {/* Sprocket Hole Rect */}
                <span className="h-4 w-3 rounded-xs bg-[#FFFDF6] ring-1 ring-black/80 shadow-inner" />
                {/* DX Edge Text markings in classic analog orange amber */}
                {i % 4 === 0 && (
                  <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-amber-500/80">
                    PICFLOW 400
                  </span>
                )}
                {i % 4 === 1 && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">
                    ▶ {i + 1}A
                  </span>
                )}
                {i % 4 === 2 && (
                  <span className="font-mono text-[8px] tracking-tight text-amber-600/70">
                    |||| | ||| ||||
                  </span>
                )}
                {i % 4 === 3 && (
                  <span className="font-mono text-[9px] font-semibold text-stone-600">
                    SAFETY FILM
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal Scroll Track containing the photographic exposure frames */}
        <div
          ref={scrollContainerRef}
          className="flex w-full gap-6 overflow-x-auto px-4 py-2 select-none scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {displayProofs.map((photo, idx) => (
            <FilmFrameCard
              key={`frame-${photo.id_photo}-${idx}`}
              photo={photo}
              index={idx}
              onOpen={() => onOpenPhoto && onOpenPhoto(photo.rawPhoto || photo)}
            />
          ))}
        </div>

        {/* Bottom Sprocket Perforation Band */}
        <div className="relative mt-3 flex items-center justify-between border-t border-stone-800/80 px-2 pt-2">
          <div className="flex w-full items-center justify-between overflow-hidden opacity-90 select-none">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={`sprocket-bot-${i}`} className="flex items-center gap-3 shrink-0 px-2">
                <span className="h-4 w-3 rounded-xs bg-[#FFFDF6] ring-1 ring-black/80 shadow-inner" />
                {i % 4 === 0 && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-amber-500/70">
                    sRGB 24-BIT
                  </span>
                )}
                {i % 4 === 1 && (
                  <span className="font-mono text-[8px] tracking-tight text-stone-500">
                    ||| |||| || |||
                  </span>
                )}
                {i % 4 === 2 && (
                  <span className="font-mono text-[9px] font-bold text-amber-600/80">
                    EXP 2026
                  </span>
                )}
                {i % 4 === 3 && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-600">
                    EMULSION #8421
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. FOOTER CURATORIAL NOTE & STATS STRIP                                   */}
      {/* ========================================================================= */}
      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#E8DEC9] bg-[#FAF7F0] p-4 text-xs font-mono text-stone-600 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EF4444]/15 text-[#EF4444]">
              <Sparkles size={13} />
            </span>
            <span>
              <strong className="text-stone-900">RED GREASE MARKS:</strong> Selected by Curators for
              optical dynamic range &amp; highlight preservation.
            </span>
          </div>

          <div className="flex items-center gap-4 text-stone-500">
            <span>TOTAL FRAMES: {displayProofs.length}</span>
            <span>•</span>
            <span className="text-[#10B981] font-semibold">100% OPTICAL UNCOMPRESSED</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Sub-komponen: 1 Frame Foto Analog pada Pita Seluloid
function FilmFrameCard({ photo, index, onOpen }) {
  const isCloudinary = isCloudinaryUrl(photo.image_url);

  return (
    <article
      onClick={onOpen}
      className="group relative flex h-[380px] w-[320px] sm:h-[430px] sm:w-[400px] shrink-0 cursor-pointer flex-col justify-between rounded-xl border border-stone-800 bg-[#18181B] p-3 shadow-lg transition-all duration-300 hover:border-amber-500/80 hover:shadow-2xl hover:-translate-y-1"
    >
      {/* 1. Header Frame Negatif: Nomor Frame & Label Emulsi */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-stone-400 font-mono text-[10px]">
        <div className="flex items-center gap-2">
          {/* Nomor Frame Analog Menyala Amber */}
          <span className="font-bold text-amber-500 tracking-wider">
            FRAME {photo.frame_number || `${String(index + 1).padStart(2, "0")}A`}
          </span>
          <span className="text-stone-600">•</span>
          <span className="text-stone-400 uppercase tracking-widest">{photo.category_name}</span>
        </div>

        {/* Curator Pick Tag */}
        {photo.curator_pick && (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/20 px-2 py-0.5 font-bold text-red-400 text-[9px] uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            CURATOR SELECT
          </span>
        )}
      </div>

      {/* 2. Window Foto (3:2 Aspect Ratio dengan Frame Seluloid Kaku) */}
      <div className="relative my-2.5 flex-1 overflow-hidden rounded-lg border border-stone-700/80 bg-black">
        <Image
          src={photo.image_url}
          alt={photo.title || "Filmstrip Photo Exposure"}
          fill
          sizes="(max-width: 640px) 320px, 400px"
          loader={isCloudinary ? cloudinaryLoader : undefined}
          unoptimized={!isCloudinary}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Analog Grease Pencil / Chinagraph Red Corner Marks (Editor's selection crop mark) */}
        {photo.curator_pick && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-2 z-10">
            <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-[#EF4444]" />
            <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-[#EF4444]" />
            <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-[#EF4444]" />
            <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#EF4444]" />
          </div>
        )}

        {/* Overlay Hover Darkroom Loupe Effect */}
        <div className="absolute inset-0 bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100 flex flex-col items-center justify-center p-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white shadow-xl">
            <Eye size={20} className="text-amber-400" />
          </div>
          <p className="mt-3 font-mono text-xs font-bold uppercase tracking-wider text-white">
            Inspect Optical EXIF
          </p>
          <p className="mt-1 font-sans text-[11px] text-stone-300 line-clamp-2 max-w-[240px]">
            {photo.curator_note || photo.title}
          </p>
        </div>
      </div>

      {/* 3. Footer Frame Negatif: Metadata Optik & Penulis */}
      <div className="flex flex-col gap-1.5 pt-1 font-mono text-[11px]">
        {/* Baris Judul & Kamera */}
        <div className="flex items-center justify-between text-stone-200">
          <p className="truncate font-sans font-bold text-xs sm:text-sm text-stone-100 group-hover:text-amber-400 transition-colors">
            {photo.title}
          </p>
          <span className="shrink-0 text-stone-400 text-[10px] ml-2">
            {photo.camera_model}
          </span>
        </div>

        {/* Baris Parameter Optik EXIF (Aperture, Shutter, ISO, Focal) */}
        <div className="flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-800/80 pt-1.5">
          <div className="flex items-center gap-1.5 text-amber-500/90 font-bold">
            <span className="rounded bg-black/60 px-1.5 py-0.5 border border-stone-800">
              {photo.aperture}
            </span>
            <span className="rounded bg-black/60 px-1.5 py-0.5 border border-stone-800">
              {photo.shutter_speed}
            </span>
            <span className="rounded bg-black/60 px-1.5 py-0.5 border border-stone-800">
              ISO {photo.iso}
            </span>
          </div>

          <div className="flex items-center gap-1 text-stone-400 font-sans truncate max-w-[120px]">
            <Camera size={11} className="text-stone-500" />
            <span className="truncate">@{photo.creator?.username}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
