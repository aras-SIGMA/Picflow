"use client";

// src/components/ui/Footer.jsx
// Footer komprehensif berstandar industri untuk PicFlow:
// - Kanvas Warm Cream #FFFDF6 & border #E8DEC9 / #DCD0BE
// - Multi-kolom navigasi (Eksplorasi, Ekosistem Optik, Standar Sains, Privasi & Legal)
// - Buletin kurasi sRGB dengan kapsul input modern
// - Indikator status sistem sRGB real-time
// - Ikon media sosial komunitas fotografer
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Camera } from "lucide-react";
import Logo from "@/components/ui/Logo";
import GradientWaves from "@/components/ui/GradientWaves";

export default function Footer({ withCommunityCta = false }) {
  return (
    <footer
      className={`relative overflow-hidden border-t border-[#E8DEC9] bg-[#FFFDF6] text-stone-800 transition-colors ${
        withCommunityCta
          ? "min-h-screen lg:h-screen flex flex-col justify-between"
          : ""
      }`}
    >
      {/* ========================================================================= */}
      {/* ANIMASI GRADIENT WAVE MENYATU DI SELURUH FOOTER (React Bits OGL - sRGB)   */}
      {/* ========================================================================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden select-none opacity-58"
      >
        <GradientWaves
          horizonColor="#EF4444"
          waveColor="#10B981"
          crestColor="#3B82F6"
          speed={0.35}
          amplitude={2.7}
          waveScale={0.55}
          waveRatio={0.9}
          swell={32}
          turbulence={18}
          tilt={1.12}
          zoom={1.0}
          height={5.2}
          fogDepth={16}
          detail="medium"
          brightness={1.15}
          opacity={0.95}
          mouseInteraction={true}
          parallaxStrength={0.45}
          grain={true}
          grainIntensity={0.03}
        />
        {/* Soft fade-out di atas kanvas agar gelombang menyatu mulus ke landing page */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, #FFFDF6 0%, rgba(254, 250, 243, 0.3) 18%, transparent 55%)",
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. PICFLOW COMMUNITY CALL-TO-ACTION (Satu Window Frame dengan Footer)      */}
      {/* ========================================================================= */}
      {withCommunityCta && (
        <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center px-4 sm:px-6 pt-12 sm:pt-16 pb-6 sm:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
            className="mx-auto flex max-w-3xl flex-col items-center text-center"
          >
            {/* Badge 3 Titik RGB Spektrum */}
            <span className="inline-flex items-center gap-2 rounded-full border border-[#DCD0BE] bg-[#FFFDF6]/90 px-4 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-stone-700 shadow-2xs backdrop-blur-xs">
              <span className="flex items-center gap-1.5" aria-hidden="true">
                <i className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                <i className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                <i className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
              </span>
              JOIN PICFLOW COMMUNITY
            </span>

            <h3
              className="mt-4 sm:mt-5 text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900"
              style={{ lineHeight: 1.15 }}
            >
              Elevate your photography to the highest visual standard
            </h3>

            <p className="mt-3 sm:mt-4 max-w-xl text-xs sm:text-sm leading-relaxed text-stone-600 sm:text-base">
              Join now to experience compression-free showcase, true sRGB color calibration,
              and optical camera EXIF inspection.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/login"
                className="rounded-full border border-[#DCD0BE] bg-[#FFFDF6] px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-stone-800 transition-all hover:bg-white hover:border-stone-400 active:scale-95 shadow-2xs"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95"
              >
                Get Started Free
                <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FOOTER NAVIGATION & COPYRIGHT (Anchored di Bagian Bawah Window)         */}
      {/* ========================================================================= */}
      <div
        className={`relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 ${
          withCommunityCta
            ? "border-t border-[#E8DEC9]/70 pt-8 sm:pt-10 pb-8 sm:pb-10"
            : "pt-16 pb-12"
        }`}
      >
        {/* ========================================================================= */}
        {/* MULTI-COLUMN NAVIGATION (Standar Industri & Platform Kreatif)             */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-12 lg:gap-10 pb-12">
          {/* Kolom 1 & 2: Identitas Brand, Deskripsi, & Status Sistem (Lebar 4 Kolom di Desktop) */}
          <div className="col-span-2 lg:col-span-4 flex flex-col justify-between">
            <div>
              <Link href="/" className="inline-flex items-center">
                <Logo variant="lockup" size={32} showTagline={true} inverted={false} />
              </Link>
              <p className="mt-4 text-xs leading-relaxed text-stone-600 max-w-sm">
                PicFlow is a social platform and high-resolution curated photography gallery.
                Dedicated to preserving sRGB color spectrum fidelity, transparent camera EXIF
                parameters, and constructive photographer critique.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {/* Tautan Media Sosial Komunitas */}
              <div className="flex items-center gap-2 pt-1 text-stone-600">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram PicFlow"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCD0BE] bg-[#FFFDF6] hover:border-stone-400 hover:text-stone-900 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X / Twitter PicFlow"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCD0BE] bg-[#FFFDF6] hover:border-stone-400 hover:text-stone-900 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub PicFlow"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCD0BE] bg-[#FFFDF6] hover:border-stone-400 hover:text-stone-900 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                    <path d="M9 18c-4.51 2-5-2-7-2"/>
                  </svg>
                </a>
                <a
                  href="https://unsplash.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Unsplash PicFlow Network"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCD0BE] bg-[#FFFDF6] hover:border-stone-400 hover:text-stone-900 transition-colors"
                >
                  <Camera size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Kolom 3: Eksplorasi & Platform (2 Kolom di Desktop) */}
          <div className="col-span-1 lg:col-span-2">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">
              Explore
            </p>
            <ul className="mt-3.5 space-y-2 text-xs text-stone-600">
              <li>
                <Link href="/home" className="hover:text-blue-600 transition-colors">
                  Community Feed
                </Link>
              </li>
              <li>
                <Link href="/#galeri" className="hover:text-blue-600 transition-colors">
                  Landscape Gallery
                </Link>
              </li>
              <li>
                <Link href="/addphoto" className="hover:text-blue-600 transition-colors">
                  Upload RAW Work
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-blue-600 transition-colors">
                  Portfolio Vault
                </Link>
              </li>
              <li>
                <Link href="/#fitur" className="hover:text-blue-600 transition-colors">
                  EXIF Inspector
                </Link>
              </li>
              <li>
                <Link href="/#fitur" className="hover:text-blue-600 transition-colors">
                  4-Pillar Critique
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Ekosistem Kamera & Lensa (2 Kolom di Desktop) */}
          <div className="col-span-1 lg:col-span-2">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">
              Optical Ecosystem
            </p>
            <ul className="mt-3.5 space-y-2 text-xs text-stone-600">
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Sony Alpha (ARW)
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Canon EOS R (CR3)
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Fujifilm X &amp; GFX (RAF)
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Leica M &amp; SL (DNG)
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Nikon Z Mirrorless (NEF)
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Hasselblad (3FR)
                </span>
              </li>
            </ul>
          </div>

          {/* Kolom 5: Standar Sains & Warna (2 Kolom di Desktop) */}
          <div className="col-span-1 lg:col-span-2">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">
              Standards &amp; Science
            </p>
            <ul className="mt-3.5 space-y-2 text-xs text-stone-600">
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  24-bit sRGB Calibration
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Cloudinary CDN Storage
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  EXIF Metadata Engine
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Adaptive AVIF &amp; WebP
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Real-Time Architecture
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Curatorial Guidelines
                </span>
              </li>
            </ul>
          </div>

          {/* Kolom 6: Privasi & Legalitas (2 Kolom di Desktop) */}
          <div className="col-span-1 lg:col-span-2">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">
              Privacy &amp; Legal
            </p>
            <ul className="mt-3.5 space-y-2 text-xs text-stone-600">
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Automatic GPS Stripping
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Creator Copyright
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Community Help Center
                </span>
              </li>
              <li>
                <span className="hover:text-blue-600 transition-colors cursor-default">
                  Contact PicFlow Team
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. BOTTOM SUB-FOOTER (Hak Cipta, Micro Dots sRGB, & Tautan Cepat)        */}
        {/* ========================================================================= */}
        <div className="border-t border-[#E8DEC9] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} PicFlow. Crafted with sRGB precision for the global
            photography community.
          </p>

          <div className="flex items-center gap-4">
            {/* Kalibrasi Tiga Titik R-G-B */}
            <div
              className="flex items-center gap-1.5 rounded-full border border-[#DCD0BE] bg-[#FFFDF6] px-2.5 py-1 text-[10px] font-mono font-semibold text-stone-600"
              title="Calibrated to IEC 61966-2-1 Standard sRGB Gamut"
            >
              <span className="flex items-center gap-1" aria-hidden="true">
                <i className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                <i className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                <i className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
              </span>
              <span>sRGB Calibrated</span>
            </div>

            <div className="flex items-center gap-3 text-stone-500">
              <span className="hover:text-stone-800 transition-colors cursor-default">Privacy</span>
              <span>·</span>
              <span className="hover:text-stone-800 transition-colors cursor-default">Terms</span>
              <span>·</span>
              <span className="hover:text-stone-800 transition-colors cursor-default">Security</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
