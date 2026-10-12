"use client";

// src/components/AuthCollage.jsx
// Panel Visual Auth (Kanan):
// Diadaptasi dari referensi desain visual Fluid Organic Canvas:
// - Latar belakang gelombang kurva organik mengalir (Fluid Wave SVG)
// - Gradien spektrum sRGB penuh (#EF4444 -> #F97316 -> #10B981 -> #3B82F6)
// - Pola tekstur dot-matrix (halftone dots)
// - Floating Photo Orbits: lingkaran karya foto & kreator dengan border ring putih,
//   bayangan depth dinamis, dan animasi mengambang halus (gentle floating)
// - Kartu kutipan kurasi & gear badge kamera ikonik
import Image from "next/image";
import { motion } from "framer-motion";
import { Camera, Sparkles, Award } from "lucide-react";

const ORBITS = [
  {
    src: "/auth-collage/01.png",
    name: "Aris Nugraha",
    gear: "Sony A7 IV · 35mm f/1.4",
    size: "w-24 h-24 lg:w-28 lg:h-28",
    pos: "top-[12%] left-[10%]",
    delay: 0,
    duration: 5.5,
    tag: "Street",
    tagColor: "bg-red-500",
  },
  {
    src: "/auth-collage/02.png",
    name: "Dina Pratiwi",
    gear: "Fujifilm X-T5 · 56mm f/1.2",
    size: "w-28 h-28 lg:w-36 lg:h-36",
    pos: "top-[32%] right-[12%]",
    delay: 0.6,
    duration: 6.2,
    tag: "Portrait",
    tagColor: "bg-pink-500",
  },
  {
    src: "/auth-collage/03.png",
    name: "Bayu Wicaksono",
    gear: "Leica M11 · 50mm Summilux",
    size: "w-20 h-20 lg:w-24 lg:h-24",
    pos: "top-[16%] right-[32%]",
    delay: 1.2,
    duration: 5.0,
    tag: "Analog Tone",
    tagColor: "bg-emerald-500",
  },
  {
    src: "/auth-collage/04.png",
    name: "Clara S.",
    gear: "Canon EOS R5 · 70-200mm",
    size: "w-22 h-22 lg:w-28 lg:h-28",
    pos: "bottom-[26%] left-[16%]",
    delay: 0.3,
    duration: 6.8,
    tag: "Landscape",
    tagColor: "bg-sky-500",
  },
  {
    src: "/auth-collage/05.png",
    name: "Rian Hendra",
    gear: "Nikon Z8 · 24-70mm f/2.8",
    size: "w-20 h-20 lg:w-24 lg:h-24",
    pos: "bottom-[14%] right-[22%]",
    delay: 1.5,
    duration: 5.8,
    tag: "Architecture",
    tagColor: "bg-amber-500",
  },
];

export default function AuthCollage() {
  return (
    <aside className="relative hidden h-dvh overflow-hidden bg-slate-950 lg:block">
      {/* Background Ambience */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      />

      {/* SVG Fluid Organic Wave Shape dengan Gradien sRGB */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          className="absolute -left-10 -top-20 h-[125%] w-[125%] opacity-90 scale-x-[-1]"
        >
          <defs>
            {/* Gradien sRGB Spektrum Penuh */}
            <linearGradient id="fluidSrgbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="30%" stopColor="#F97316" />
              <stop offset="70%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>

            {/* Pattern Dot Matrix (Halftone) */}
            <pattern
              id="dotMatrixPattern"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="3" cy="3" r="1.5" fill="#FFFFFF" fillOpacity="0.22" />
            </pattern>
          </defs>

          {/* Organic Fluid Curve 1 (Back glow) */}
          <path
            d="M 320 0 C 480 180 240 380 420 560 C 600 740 450 920 620 1000 L 1000 1000 L 1000 0 Z"
            fill="url(#fluidSrgbGradient)"
            opacity="0.85"
          />

          {/* Dot Matrix Texture Overlay di atas kurva */}
          <path
            d="M 320 0 C 480 180 240 380 420 560 C 600 740 450 920 620 1000 L 1000 1000 L 1000 0 Z"
            fill="url(#dotMatrixPattern)"
          />

          {/* Organic Fluid Curve 2 (Front Accent Wave) */}
          <path
            d="M 460 0 C 580 220 380 420 540 640 C 680 820 620 940 760 1000 L 1000 1000 L 1000 0 Z"
            fill="#EF4444"
            opacity="0.25"
          />
        </svg>
      </div>

      {/* Radial soft lighting effect */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/4 h-[500px] w-[500px] rounded-full bg-orange-500/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-blue-600/25 blur-[100px]"
      />

      {/* Floating Photo Orbits (Lingkaran Foto & Fotografer) */}
      <div className="relative z-10 h-full w-full">
        {ORBITS.map((item, idx) => (
          <motion.div
            key={item.name}
            className={`absolute ${item.pos} flex flex-col items-center`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -10, 0],
            }}
            transition={{
              opacity: { duration: 0.6, delay: idx * 0.15 },
              scale: { duration: 0.6, delay: idx * 0.15 },
              y: {
                duration: item.duration,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: item.delay,
              },
            }}
          >
            {/* Lingkaran Foto dengan White Ring & Soft Depth Shadow */}
            <div
              className={`group relative ${item.size} overflow-hidden rounded-full border-4 border-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-105`}
            >
              <Image
                src={item.src}
                alt={item.name}
                fill
                sizes="(min-width: 1024px) 150px, 100px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                priority={idx < 2}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>

            {/* Badge Kategori Mini */}
            <span
              className={`-mt-2.5 z-20 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-md ${item.tagColor}`}
            >
              {item.tag}
            </span>

            {/* Micro Tooltip Info Kreator saat Hover */}
            <div className="mt-1.5 flex flex-col items-center text-center">
              <span className="text-xs font-bold text-white drop-shadow-md">
                {item.name}
              </span>
              <span className="font-mono text-[9px] text-slate-300 drop-shadow">
                {item.gear}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating Card: Testimoni & Standar sRGB */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="absolute bottom-8 left-8 z-20 max-w-sm rounded-2xl border border-white/20 bg-slate-900/80 p-4.5 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
              <Award size={15} />
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-300">
              sRGB Calibrated Vault
            </span>
          </div>
          <span className="flex items-center gap-1">
            <i className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
            <i className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
            <i className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
          </span>
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-slate-200">
          &ldquo;Color rendering precision and transparent EXIF discussions make PicFlow
          the authentic sanctuary for our photographic craft.&rdquo;
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-slate-400">
          <span>Curated Photography Community</span>
          <span className="font-mono text-emerald-400">12,400+ Works</span>
        </div>
      </motion.div>
    </aside>
  );
}
