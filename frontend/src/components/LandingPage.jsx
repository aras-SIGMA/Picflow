"use client";

// src/components/LandingPage.jsx
// Halaman depan / Landing Page PicFlow yang memadukan:
// 1. Struktur tata letak referensi (Hero grid + 4 floating avatars, Social proof,
//    Bento features 3 kartu, Dark showcase format ecosystem, Editorial quote, Stats, CTA banner)
// 2. Token visual resmi PicFlow (.md/DESIGN/design.md):
//    - Kanvas Warm Cream #FEFAF3 & border #E8DEC9 / #DCD0BE
//    - Spektrum sRGB (#EF4444, #10B981, #3B82F6, #475569)
//    - Tombol & kapsul pill rounded-full
//    - Tipografi editorial tegas & JetBrains Mono untuk metadata
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Aperture,
  ArrowRight,
  Camera,
  FileImage,
  Layers,
  Quote,
  Sparkles,
} from "lucide-react";

export default function LandingPage({ children }) {
  // State interaktif pada kartu Bento
  const [activeHistogram, setActiveHistogram] = useState(2);
  const [togglePillars, setTogglePillars] = useState({
    komposisi: true,
    cahaya: true,
    warna: true,
    konsep: true,
  });

  return (
    <div className="flex flex-col bg-[#FEFAF3] text-stone-900 selection:bg-blue-600 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Referensi: Gridlines + Dual CTA + 4 Floating Orbits)    */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden border-b border-[#E8DEC9] pt-12 pb-20 sm:pt-20 sm:pb-32">
        {/* Latar Gridlines halus sesuai inspirasi referensi */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, #E8DEC9 1px, transparent 1px), linear-gradient(to bottom, #E8DEC9 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* Ambient radial glow di pusat hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[640px] rounded-full bg-blue-500/5 blur-[120px]"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {/* 4 Floating Circular Cards / Creator Orbits (Meniru 4 Avatar dengan Panah di Referensi) */}
          {/* --- Orbit 1: Kiri Atas (Sony α7 IV - Red Accent) --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75, x: -30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex absolute -left-2 top-8 z-20 items-center gap-3"
          >
            <div className="group relative flex items-center gap-2.5 rounded-full border border-[#DCD0BE] bg-[#FEFAF3]/90 px-3 py-1.5 shadow-md backdrop-blur-md">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600 ring-2 ring-[#EF4444]">
                <Camera size={14} />
              </span>
              <div className="text-left text-[11px] leading-tight">
                <p className="font-bold text-stone-900">Nadia S.</p>
                <p className="font-mono text-[10px] text-stone-500">Sony α7 IV · 35mm</p>
              </div>
            </div>
            {/* Panah vektor halus mengarah ke teks utama */}
            <svg
              className="h-6 w-10 text-stone-400 rotate-12"
              fill="none"
              viewBox="0 0 40 24"
              stroke="currentColor"
            >
              <path
                d="M4 20 C 15 20, 25 15, 34 6"
                strokeWidth="1.75"
                strokeDasharray="3 3"
                strokeLinecap="round"
              />
              <path
                d="M28 5 L 35 6 L 33 13"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          {/* --- Orbit 2: Kanan Atas (Leica M11 - Green Accent) --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex absolute -right-2 top-8 z-20 items-center gap-3"
          >
            {/* Panah vektor mengarah ke teks */}
            <svg
              className="h-6 w-10 text-stone-400 -rotate-12"
              fill="none"
              viewBox="0 0 40 24"
              stroke="currentColor"
            >
              <path
                d="M36 20 C 25 20, 15 15, 6 6"
                strokeWidth="1.75"
                strokeDasharray="3 3"
                strokeLinecap="round"
              />
              <path
                d="M12 5 L 5 6 L 7 13"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="group relative flex items-center gap-2.5 rounded-full border border-[#DCD0BE] bg-[#FEFAF3]/90 px-3 py-1.5 shadow-md backdrop-blur-md">
              <div className="text-right text-[11px] leading-tight">
                <p className="font-bold text-stone-900">Bima Arya</p>
                <p className="font-mono text-[10px] text-stone-500">Leica M11 · 50mm f/0.95</p>
              </div>
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-2 ring-[#10B981]">
                <Aperture size={14} />
              </span>
            </div>
          </motion.div>

          {/* --- Orbit 3: Kiri Bawah (Fujifilm X-T5 - Blue Accent) --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex absolute left-8 bottom-4 z-20 items-center gap-3"
          >
            <div className="group relative flex items-center gap-2.5 rounded-full border border-[#DCD0BE] bg-[#FEFAF3]/90 px-3 py-1.5 shadow-md backdrop-blur-md">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 ring-2 ring-[#3B82F6]">
                <Sparkles size={14} />
              </span>
              <div className="text-left text-[11px] leading-tight">
                <p className="font-bold text-stone-900">Farah L.</p>
                <p className="font-mono text-[10px] text-stone-500">Fuji X-T5 · Sim Classic</p>
              </div>
            </div>
            <svg
              className="h-6 w-10 text-stone-400 -rotate-45"
              fill="none"
              viewBox="0 0 40 24"
              stroke="currentColor"
            >
              <path
                d="M4 14 C 15 14, 25 10, 34 4"
                strokeWidth="1.75"
                strokeDasharray="3 3"
                strokeLinecap="round"
              />
              <path
                d="M26 3 L 35 4 L 32 11"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          {/* --- Orbit 4: Kanan Bawah (Canon EOS R5 - Slate Accent) --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex absolute right-12 bottom-4 z-20 items-center gap-3"
          >
            <svg
              className="h-6 w-10 text-stone-400 rotate-45"
              fill="none"
              viewBox="0 0 40 24"
              stroke="currentColor"
            >
              <path
                d="M36 14 C 25 14, 15 10, 6 4"
                strokeWidth="1.75"
                strokeDasharray="3 3"
                strokeLinecap="round"
              />
              <path
                d="M14 3 L 5 4 L 8 11"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="group relative flex items-center gap-2.5 rounded-full border border-[#DCD0BE] bg-[#FEFAF3]/90 px-3 py-1.5 shadow-md backdrop-blur-md">
              <div className="text-right text-[11px] leading-tight">
                <p className="font-bold text-stone-900">Dimas K.</p>
                <p className="font-mono text-[10px] text-stone-500">Canon R5 · 85mm f/1.2</p>
              </div>
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-500/10 text-slate-700 ring-2 ring-[#475569]">
                <Layers size={14} />
              </span>
            </div>
          </motion.div>

          {/* Konten Sentral Hero */}
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            {/* Pill Badge Atas */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-[#DCD0BE] bg-[#F5EFE6] px-4 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs"
            >
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
              COMMUNITY &amp; sRGB OPTICAL STANDARD
            </motion.div>

            {/* Headline Display (Sesuai Referensi: Kata Kunci digarisbawahi tebal) */}
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl"
              style={{ lineHeight: 1.12 }}
            >
              One platform to{" "}
              <span className="relative inline-block text-stone-900">
                <span className="relative z-10">showcase works</span>
                <span
                  aria-hidden="true"
                  className="absolute bottom-1.5 left-0 -z-0 h-3 w-full rounded-xs bg-[#10B981]/25"
                />
              </span>
              ,{" "}
              <span className="relative inline-block text-stone-900">
                <span className="relative z-10">analyze EXIF</span>
                <span
                  aria-hidden="true"
                  className="absolute bottom-1.5 left-0 -z-0 h-3 w-full rounded-xs bg-[#3B82F6]/25"
                />
              </span>
              , and elevate photography.
            </motion.h1>

            {/* Sub-headline / Deskripsi */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg"
            >
              PicFlow preserves color integrity without aggressive compression, extracts
              optical camera metadata instantly, and empowers constructive professional discourse.
            </motion.p>

            {/* Dual CTA Buttons (Pill buttons sesuai referensi) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3.5"
            >
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#10B981] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#059669] hover:shadow-lg active:scale-95"
              >
                Get Started Free
                <ArrowRight size={16} />
              </Link>
              <Link
                href="#galeri"
                className="inline-flex items-center gap-2 rounded-full border border-[#DCD0BE] bg-[#FEFAF3] px-6 py-3 text-sm font-semibold text-stone-800 transition-all hover:bg-white hover:border-stone-400 active:scale-95 shadow-2xs"
              >
                Explore Gallery
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SOCIAL PROOF / BRAND CAMERA ECOSYSTEM BAR                              */}
      {/* ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="border-b border-[#E8DEC9] bg-[#F5EFE6]/60 py-6 sm:py-8"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-stone-500">
              Captured with professional instruments:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm font-bold tracking-widest text-stone-400 uppercase">
              <span className="transition-colors hover:text-stone-800 cursor-default">SONY α</span>
              <span className="transition-colors hover:text-stone-800 cursor-default">CANON EOS</span>
              <span className="transition-colors hover:text-stone-800 cursor-default">NIKON Z</span>
              <span className="transition-colors hover:text-stone-800 cursor-default">FUJIFILM</span>
              <span className="transition-colors hover:text-stone-800 cursor-default">LEICA</span>
              <span className="transition-colors hover:text-stone-800 cursor-default">HASSELBLAD</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* 3. BENTO GRID FITUR (3 Kartu Sesuai Referensi Visual)                      */}
      {/* ========================================================================= */}
      <section id="fitur" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Header Seksi Fitur */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#DCD0BE] bg-[#F5EFE6] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              ✦ CRAFTED TECHNOLOGY
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Advanced tools for every stage of your photographic craft
            </h2>
            <p className="mt-3 text-sm text-stone-600 sm:text-base">
              A synthesis of automatic metadata analysis, high-precision color calibration, and
              seamless community engagement.
            </p>
          </motion.div>

          {/* Grid Bento: 1 Kartu Lebar Atas, 2 Kartu Berdampingan Bawah */}
          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* --- KARTU BENTO 1: Dynamic Dashboard (EXIF & Gamut Analyzer) --- */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2 rounded-3xl border border-[#DCD0BE] bg-[#F5EFE6]/40 p-6 sm:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8"
            >
              {/* Kolom Teks Kiri */}
              <div className="max-w-md">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#10B981]">
                  Feature 01 · EXIF Inspector
                </span>
                <h3 className="mt-2 text-2xl font-extrabold text-stone-900">
                  Dynamic EXIF Analytics Dashboard
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  Instantly parse Shutter Speed, Aperture, ISO, Focal Length, and sRGB gamut
                  spectrum curves on every upload. No tedious manual entry.
                </p>
                <div className="mt-6">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-stone-800"
                  >
                    Explore Dashboard
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Mockup Visual Kanan (Meniru Bar Chart Grafis di Referensi) */}
              <div className="w-full max-w-md rounded-2xl border border-[#DCD0BE] bg-[#FEFAF3] p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E8DEC9] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-900">
                      Aperture Distribution (f-stop)
                    </span>
                  </div>
                  <div className="flex -space-x-1.5">
                    <span className="h-5 w-5 rounded-full bg-red-400 text-[10px] font-bold text-white flex items-center justify-center">
                      R
                    </span>
                    <span className="h-5 w-5 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center">
                      G
                    </span>
                    <span className="h-5 w-5 rounded-full bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center">
                      B
                    </span>
                  </div>
                </div>

                {/* Bar Chart Visual Histogram */}
                <div className="mt-6 flex h-36 items-end justify-between gap-2 px-2">
                  {[
                    { label: "f/1.4", h: "45%", count: "142" },
                    { label: "f/2.0", h: "60%", count: "210" },
                    { label: "f/2.8", h: "92%", count: "389", active: true },
                    { label: "f/4.0", h: "35%", count: "115" },
                    { label: "f/5.6", h: "70%", count: "250" },
                    { label: "f/8.0", h: "50%", count: "180" },
                    { label: "f/11", h: "20%", count: "65" },
                  ].map((bar, i) => (
                    <div
                      key={bar.label}
                      onClick={() => setActiveHistogram(i)}
                      className="group flex flex-1 cursor-pointer flex-col items-center gap-1.5"
                    >
                      <span className="text-[10px] font-mono text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {bar.count}
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          activeHistogram === i
                            ? "bg-[#10B981] shadow-xs"
                            : "bg-[#E8DEC9] group-hover:bg-[#DCD0BE]"
                        }`}
                        style={{ height: bar.h }}
                      />
                      <span
                        className={`font-mono text-[10px] ${
                          activeHistogram === i
                            ? "font-bold text-[#10B981]"
                            : "text-stone-500"
                        }`}
                      >
                        {bar.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-[#F5EFE6] px-3 py-2 text-[11px] text-stone-600">
                  <span>Selected Gamut:</span>
                  <span className="font-mono font-bold text-stone-900">
                    99.8% sRGB Color Space
                  </span>
                </div>
              </div>
            </motion.div>

            {/* --- KARTU BENTO 2: Smart Notification / 4 Pilar Kritik Konstruktif --- */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-3xl border border-[#DCD0BE] bg-[#F5EFE6]/40 p-6 sm:p-8 shadow-xs flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Feature 02 · Constructive Critique
                </span>
                <h3 className="mt-2 text-xl font-extrabold text-stone-900">
                  4-Pillar Constructive Critique
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  Structured technical evaluation across Composition, Lighting, Color, and Concept —
                  free from generic spam.
                </p>
              </div>

              {/* Mockup Toggle List (Meniru UI Notification Toggles di Referensi) */}
              <div className="mt-6 rounded-2xl border border-[#DCD0BE] bg-[#FEFAF3] p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8DEC9] pb-2 text-xs font-bold text-stone-800">
                  <span>Evaluation Metrics</span>
                  <span className="text-stone-400 font-mono text-[10px]">STATUS</span>
                </div>

                {[
                  {
                    id: "komposisi",
                    name: "Composition & Framing",
                    score: "4.9 / 5.0",
                    color: "bg-purple-600",
                  },
                  {
                    id: "cahaya",
                    name: "Lighting & Dynamic Range",
                    score: "4.8 / 5.0",
                    color: "bg-amber-600",
                  },
                  {
                    id: "warna",
                    name: "Tonal & sRGB Calibration",
                    score: "5.0 / 5.0",
                    color: "bg-[#10B981]",
                  },
                  {
                    id: "konsep",
                    name: "Concept & Narrative",
                    score: "4.7 / 5.0",
                    color: "bg-blue-600",
                  },
                ].map((item) => {
                  const active = togglePillars[item.id];
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${item.color}`} />
                        <span className="font-medium text-stone-800">{item.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setTogglePillars((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          active ? "bg-[#10B981]" : "bg-stone-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            active ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* --- KARTU BENTO 3: Task Management / Aktivitas Komunitas Real-time --- */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-3xl border border-[#DCD0BE] bg-[#F5EFE6]/40 p-6 sm:p-8 shadow-xs flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-red-600">
                  Feature 03 · Latency &lt;250ms
                </span>
                <h3 className="mt-2 text-xl font-extrabold text-stone-900">
                  Zero-Lag Real-Time Sync
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  Gear discussions, inspirational bookmarks, and live community feedback delivered
                  via cloud synchronization.
                </p>
              </div>

              {/* Mockup Feed Aktivitas (Meniru UI Task Management di Referensi) */}
              <div className="mt-6 rounded-2xl border border-[#DCD0BE] bg-[#FEFAF3] p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8DEC9] pb-2 text-xs font-bold text-stone-800">
                  <span>Recent Activity</span>
                  <span className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">
                    LIVE SYNC
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 text-xs">
                    <div className="h-6 w-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      AS
                    </div>
                    <div className="flex-1">
                      <p className="text-stone-800 font-medium leading-tight">
                        <strong>Ari Sanders</strong> critiqued <em>&apos;Bromo Fog&apos;</em>
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5 font-mono">
                        &quot;Dynamic range at f/8 is exceptionally clean!&quot;
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">1m ago</span>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <div className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      JC
                    </div>
                    <div className="flex-1">
                      <p className="text-stone-800 font-medium leading-tight">
                        <strong>Jane Cooper</strong> liked <em>&apos;Pasar Baru Street&apos;</em>
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5 font-mono">
                        Leica M11 · 35mm Summicron
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">4m ago</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. EKOSISTEM SENSOR & FORMAT (Warm Cream + Gradasi Spektrum Blur & Wave)  */}
      {/* ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-20 sm:pb-28"
      >
        <div className="relative overflow-hidden rounded-3xl border border-[#DCD0BE] bg-[#F5EFE6]/70 px-6 py-14 sm:px-12 sm:py-20 text-center shadow-xs">
          {/* Efek 3 warna dasar gradasi blur halus (Merah #EF4444, Hijau #10B981, Biru #3B82F6) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -left-12 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-[#EF4444]/15 blur-[100px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/4 -right-16 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-[#10B981]/15 blur-[100px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 left-1/3 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-[#3B82F6]/18 blur-[100px]"
          />

          {/* Kurva gelombang spektrum organik di latar belakang */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
            viewBox="0 0 1000 600"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M-100,200 C200,100 400,350 700,220 C900,130 1100,260 1200,200 L1200,700 L-100,700 Z"
              fill="url(#fluid-spectrum)"
            />
            <defs>
              <linearGradient id="fluid-spectrum" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#10B981" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.14" />
              </linearGradient>
            </defs>
          </svg>

          <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-[#DCD0BE] bg-[#FEFAF3] px-3.5 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-stone-700 shadow-2xs">
            <span className="flex items-center gap-1" aria-hidden="true">
              <i className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
            </span>
            SENSOR &amp; FORMAT ECOSYSTEM
          </span>

          <h2 className="relative z-10 mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-stone-900">
            Never compromise quality. Preserve pure resolution.
          </h2>

          <p className="relative z-10 mx-auto mt-4 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">
            Native preservation for uncompressed RAW files from leading camera manufacturers,
            non-destructively delivered via adaptive WebP &amp; AVIF.
          </p>

          {/* Grid Rounded Pill Tiles Format Kamera (Warm Cream Elevated) */}
          <div className="relative z-10 mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
            {[
              { code: "SONY ARW", type: "RAW", color: "text-[#EF4444] bg-[#EF4444]/10" },
              { code: "CANON CR3", type: "RAW", color: "text-[#EF4444] bg-[#EF4444]/10" },
              { code: "NIKON NEF", type: "RAW", color: "text-[#EF4444] bg-[#EF4444]/10" },
              { code: "FUJI RAF", type: "RAW", color: "text-[#10B981] bg-[#10B981]/10" },
              { code: "LEICA DNG", type: "RAW", color: "text-[#10B981] bg-[#10B981]/10" },
              { code: "HASSELBLAD 3FR", type: "RAW", color: "text-[#10B981] bg-[#10B981]/10" },
              { code: "AVIF ULTRA", type: "Delivery", color: "text-blue-600 bg-blue-500/10" },
              { code: "WEBP 2.0", type: "Delivery", color: "text-blue-600 bg-blue-500/10" },
              { code: "TIFF 16-BIT", type: "Archive", color: "text-stone-700 bg-stone-200" },
              { code: "PROPHOTO RGB", type: "Gamut", color: "text-purple-600 bg-purple-500/10" },
              { code: "sRGB 24-BIT", type: "Standard", color: "text-emerald-600 bg-emerald-500/10" },
              { code: "APPLE PRORAW", type: "Mobile", color: "text-stone-800 bg-stone-200" },
            ].map((fmt) => (
              <div
                key={fmt.code}
                className="flex items-center gap-2.5 rounded-2xl border border-[#DCD0BE] bg-[#FEFAF3]/90 px-4 py-2.5 shadow-2xs hover:bg-white hover:border-stone-400 hover:shadow-xs transition-all cursor-default backdrop-blur-sm"
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${fmt.color} font-mono text-[11px] font-bold`}
                >
                  <FileImage size={15} />
                </div>
                <div className="text-left leading-none">
                  <p className="font-mono text-xs font-bold text-stone-900">{fmt.code}</p>
                  <p className="font-mono text-[9px] text-stone-500 mt-1 uppercase font-semibold">
                    {fmt.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* 5. EDITORIAL QUOTE (Kutipan Kurator Sesuai Referensi Visual)               */}
      {/* ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="border-t border-[#E8DEC9] bg-[#F5EFE6]/40 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#10B981]/15 text-[#10B981]">
            <Quote size={24} />
          </div>

          <blockquote className="mt-6 text-xl font-bold leading-relaxed text-stone-900 sm:text-2xl sm:leading-relaxed">
            &ldquo;PicFlow preserves sRGB color fidelity and optical sharpness routinely destroyed
            by conventional platforms. It is the authentic sanctuary for photographers who
            respect every pixel.&rdquo;
          </blockquote>

          <div className="mt-8 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">
                RP
              </span>
              <span className="font-bold text-stone-900 text-sm">Raditya Pratama</span>
            </div>
            <p className="text-xs text-stone-500 font-mono">
              Lead Curator · Light &amp; Shade Photography Guild
            </p>
          </div>
        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* 6. STATISTIK TIGA KOLOM (Sesuai Referensi Visual)                          */}
      {/* ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="border-t border-b border-[#E8DEC9] bg-[#FEFAF3] py-14 sm:py-20"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
            <div className="border-b border-[#E8DEC9] pb-6 sm:border-b-0 sm:border-r sm:pb-0">
              <p className="text-4xl font-extrabold tracking-tight text-[#EF4444] sm:text-5xl">
                24-bit
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                Calibrated sRGB Gamut
              </p>
            </div>
            <div className="border-b border-[#E8DEC9] pb-6 sm:border-b-0 sm:border-r sm:pb-0">
              <p className="text-4xl font-extrabold tracking-tight text-[#10B981] sm:text-5xl">
                15MB+
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                RAW Resolution Retained
              </p>
            </div>
            <div>
              <p className="text-4xl font-extrabold tracking-tight text-blue-600 sm:text-5xl">
                &lt;250ms
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                Real-Time Interaction Latency
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* 7. KONTEN GALERI & EKSPLORASI (Anak Komponen dari Page)                   */}
      {/* ========================================================================= */}
      {children}

      {/* ========================================================================= */}
      {/* 8. BOTTOM CALL-TO-ACTION BANNER (Warm Cream + Gradasi Spektrum Mesh & Wave)*/}
      {/* ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-16 pb-24 sm:pt-20 sm:pb-32"
      >
        <div className="relative overflow-hidden rounded-3xl border border-[#DCD0BE] bg-[#F5EFE6]/70 px-6 py-14 sm:px-12 sm:py-20 text-center shadow-xs">
          {/* Efek 3 warna dasar gradasi blur halus (Merah #EF4444, Hijau #10B981, Biru #3B82F6) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -left-12 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-[#EF4444]/15 blur-[100px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/4 -right-16 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-[#10B981]/15 blur-[100px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 left-1/3 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-[#3B82F6]/18 blur-[100px]"
          />

          {/* Kurva gelombang spektrum organik di latar belakang */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
            viewBox="0 0 1000 600"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M-100,200 C200,100 400,350 700,220 C900,130 1100,260 1200,200 L1200,700 L-100,700 Z"
              fill="url(#fluid-spectrum-cta)"
            />
            <defs>
              <linearGradient id="fluid-spectrum-cta" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#10B981" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.14" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#DCD0BE] bg-[#FEFAF3] px-3.5 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-stone-700 shadow-2xs">
              <span className="flex items-center gap-1" aria-hidden="true">
                <i className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                <i className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                <i className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
              </span>
              JOIN PICFLOW COMMUNITY
            </span>

            <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl lg:text-4xl" style={{ lineHeight: 1.2 }}>
              Elevate your photography to the highest visual standard
            </h3>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">
              Join now to experience compression-free showcase, true sRGB color calibration,
              and optical camera EXIF inspection.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/login"
                className="rounded-full border border-[#DCD0BE] bg-[#FEFAF3] px-6 py-2.5 text-xs sm:text-sm font-semibold text-stone-800 transition-all hover:bg-white hover:border-stone-400 active:scale-95 shadow-2xs"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95"
              >
                Get Started Free
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
