"use client";

// src/components/AuthCollage.jsx
// Panel kolase kanan di halaman Login/Register.
// - Wrapper: sticky, h-dvh, overflow-hidden, isolation → semua anak
//   absolut (kolom, overlay, kartu kutipan) TERKURUNG di dalam panel.
// - 2 kolom marquee vertikal berlawanan arah; tiap kolom = wadah clip
//   (h-full overflow-hidden) yang membungkus TUMPUKAN konten berisi
//   salinan yang diduplikasi 2x → translate -50% loop mulus tanpa jeda.
// - Foto statis lokal (tidak fetch API — halaman auth belum login).
// - Animasi hanya transform, pause saat hover, mati saat reduced-motion.
import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Aperture } from "lucide-react";

// TODO: foto asli ditaruh di public/auth-collage/ dengan nama & rasio ini
// (placeholder gradient sudah digenerate — ganti file-nya saja):
//   01.png (3:4)   02.png (1:1)   03.png (4:5)
//   04.png (3:4)   05.png (1:1)   06.png (4:5)
//   07.png (3:4)   08.png (1:1)   09.png (4:5)
const COLLAGE = [
  { src: "/auth-collage/01.png", ratio: "aspect-[3/4]" },
  { src: "/auth-collage/02.png", ratio: "aspect-square" },
  { src: "/auth-collage/03.png", ratio: "aspect-[4/5]" },
  { src: "/auth-collage/04.png", ratio: "aspect-[3/4]" },
  { src: "/auth-collage/05.png", ratio: "aspect-square" },
  { src: "/auth-collage/06.png", ratio: "aspect-[4/5]" },
  { src: "/auth-collage/07.png", ratio: "aspect-[3/4]" },
  { src: "/auth-collage/08.png", ratio: "aspect-square" },
  { src: "/auth-collage/09.png", ratio: "aspect-[4/5]" },
];

const QUOTES = {
  "/login": {
    text: "Koleksiku akhirnya punya rumah yang tenang.",
    role: "Fotografer independen",
  },
  "/register": {
    text: "Ribuan frame, satu tempat. Kembalikan fokusmu ke yang terbaik.",
    role: "Tim PicFlow",
  },
};

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Fallback artistik bila file foto tidak ada: gradient token + grain + ikon.
function FallbackArt() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(120% 90% at 25% 15%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%), linear-gradient(150deg, var(--surface), var(--bg-elevated))",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: NOISE }}
      />
      <Aperture
        size={28}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/15"
      />
    </div>
  );
}

function Tile({ item, priority }) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative w-full shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-line bg-[var(--bg-elevated)] ${item.ratio}`}
    >
      {failed ? (
        <FallbackArt />
      ) : (
        <Image
          src={item.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, 100vw"
          className="object-cover"
          priority={priority}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function Column({ items, direction, priorityFirst }) {
  // Salinan diduplikasi 2x → loop translateY(-50%) mulus.
  const doubled = [...items, ...items];

  return (
    <div className="h-full overflow-hidden">
      {/* pb-4 = gap-4 → tinggi tumpukan tepat 2x satu salinan,
          sehingga translate -50% berakhir pas di posisi awal (loop mulus) */}
      <div
        className={`flex flex-col gap-4 pb-4 ${direction === "up" ? "marquee-up" : "marquee-down"}`}
      >
        {doubled.map((item, i) => (
          <Tile
            key={`${item.src}-${i}`}
            item={item}
            priority={Boolean(priorityFirst) && i === 0}
          />
        ))}
      </div>
    </div>
  );
}

export default function AuthCollage() {
  const pathname = usePathname();
  const quote = QUOTES[pathname] || QUOTES["/login"];

  return (
    <aside className="marquee-paused sticky top-0 isolate hidden h-dvh overflow-hidden border-l border-line lg:block">
      {/* Kolom marquee (dekoratif) */}
      <div aria-hidden="true" className="absolute inset-0 grid grid-cols-2 gap-4 p-4">
        <Column items={COLLAGE.slice(0, 5)} direction="up" priorityFirst />
        <Column items={COLLAGE.slice(4, 9)} direction="down" />
      </div>

      {/* Overlay gradient: tepi kiri (menyatu dengan panel form) + dari bawah */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/35 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent"
      />

      {/* Kartu kutipan — DI DALAM panel kolase */}
      <figure className="absolute bottom-9 left-9 z-20 max-w-[360px] rounded-[var(--radius-md)] border border-line bg-[var(--surface)]/70 p-5 backdrop-blur-md">
        <Aperture size={18} className="text-accent" />
        <blockquote className="mt-3 text-sm leading-relaxed text-ink">
          &ldquo;{quote.text}&rdquo;
        </blockquote>
        <figcaption className="mt-3 text-xs text-faint">{quote.role}</figcaption>
      </figure>
    </aside>
  );
}
