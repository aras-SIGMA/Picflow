"use client";

// src/components/SplashScreen.jsx
// Splash Screen sinematik pembuka PicFlow:
// - Kanvas warm cream #FEFAF3
// - Animasi aperture lensa 4 blade sRGB yang membuka secara presisi
// - Wordmark "PicFlow" dengan micro dots kalibrasi R-G-B
// - Transisi keluar mulus (fade out & scale up)
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Logo from "@/components/ui/Logo";

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);

  // Jalankan pengisian progress bar secara mulus & linear selama ~4.8 detik (sinkron dengan durasi 5s)
  useEffect(() => {
    const startTime = performance.now();
    const totalDuration = 4800; // 4.8 detik

    let frameId;
    function updateProgress(now) {
      const elapsed = now - startTime;
      const pct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setProgress(pct);
      if (pct < 100) {
        frameId = requestAnimationFrame(updateProgress);
      }
    }

    frameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        // Callback opsional
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FEFAF3] text-stone-900 select-none overflow-hidden"
    >
      {/* Glow radial halus di latar belakang */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-blue-500/8 blur-[120px]"
      />

      {/* Kontainer Animasi Logo */}
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center"
      >
        {/* Shutter Blade Animation Ring */}
        <div className="relative flex items-center justify-center">
          {/* Cincin luar pulse berkelanjutan */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0.1 }}
            animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.15, 0.45, 0.15] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
            className="absolute -inset-5 rounded-full border border-blue-600/30"
          />

          {/* Logo Utama Aperture */}
          <Logo variant="mark" size={76} />
        </div>

        {/* Wordmark PicFlow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
          className="mt-6 flex flex-col items-center"
        >
          <div className="flex items-baseline text-2xl font-extrabold tracking-tight">
            <span className="text-stone-900">Pic</span>
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #EF4444 0%, #F97316 35%, #10B981 70%, #3B82F6 100%)",
              }}
            >
              Flow
            </span>
          </div>

          {/* Micro dots R-G-B & Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="mt-2.5 flex items-center gap-2"
          >
            <span className="flex items-center gap-1" aria-hidden="true">
              <i className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              sRGB Standard &amp; Craft
            </span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Indikator progress bar gradasi halus spektrum PicFlow (Tersinkronisasi 5 Detik) */}
      <div className="absolute bottom-16 flex flex-col items-center gap-2">
        <div className="relative h-2.5 w-56 sm:w-64 overflow-hidden rounded-full border border-[#E8DEC9] bg-[#EFE7D8]/80 shadow-inner">
          <div
            className="h-full rounded-full transition-[width] duration-75 ease-linear shadow-xs"
            style={{
              width: `${progress}%`,
              backgroundImage:
                "linear-gradient(90deg, #475569 0%, #64748B 12%, #EF4444 32%, #F97316 48%, #10B981 70%, #38BDF8 86%, #3B82F6 100%)",
            }}
          />
        </div>
        <div className="flex w-56 sm:w-64 items-center justify-between font-mono text-[11px] text-stone-500">
          <span>Loading sRGB calibration...</span>
          <span className="font-semibold text-stone-700">{progress}%</span>
        </div>
      </div>
    </motion.div>
  );
}
