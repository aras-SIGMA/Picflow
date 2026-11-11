"use client";

// src/app/(auth)/layout.jsx
// Shell Otentikasi PicFlow:
// - Kanvas Latar: Tema Terang Warm Cream #FFFDF6 dengan Animasi Aurora Spektrum sRGB
// - Top Utility Bar: Navigasi floating di kiri atas & Logo aplikasi resmi di kanan atas (Mode Terang)
// - Card Container: Menampung kartu form bertema warna utama PicFlow
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/ui/Logo";
import AuroraBackground from "@/components/ui/AuroraBackground";

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FFFDF6] text-stone-900 antialiased selection:bg-[#2563EB] selection:text-white flex flex-col justify-center items-center px-4 py-8 sm:p-6 sm:py-12">
      {/* ========================================================================= */}
      {/* 1. ANIMASI AURORA SPEKTRUM sRGB PADA KANVAS TERANG WARM CREAM #FFFDF6      */}
      {/* ========================================================================= */}
      <AuroraBackground showGrid={true} />

      {/* ========================================================================= */}
      {/* 2. TOP UTILITY BAR (Navigasi Kiri & Logo Kanan Adaptif)                   */}
      {/* ========================================================================= */}
      <header className="relative z-30 mb-4 sm:mb-6 flex w-full max-w-[420px] items-center justify-between px-1">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#E8DEC9] bg-[#FFFDF6]/95 sm:bg-[#FFFDF6]/90 px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium text-stone-700 shadow-xs sm:backdrop-blur-md transition-all duration-200 hover:border-[#DCD0BE] hover:bg-white hover:text-stone-950 hover:shadow-sm"
        >
          <ArrowLeft
            size={14}
            className="transition-transform duration-200 group-hover:-translate-x-1 text-stone-500 group-hover:text-stone-900"
          />
          <span className="hidden sm:inline">Back to PicFlow</span>
          <span className="inline sm:hidden">Back</span>
        </Link>

        <Link
          href="/"
          aria-label="Kembali ke beranda PicFlow"
          className="group inline-flex items-center transition-transform duration-200 hover:scale-105 drop-shadow-xs"
        >
          <Logo variant="lockup" size={30} showTagline={false} inverted={false} />
        </Link>
      </header>

      {/* ========================================================================= */}
      {/* 3. CENTRAL CARD CONTAINER (Max-width 420px)                               */}
      {/* ========================================================================= */}
      <div className="relative z-20 w-full max-w-[420px]">
        {children}
      </div>
    </div>
  );
}
