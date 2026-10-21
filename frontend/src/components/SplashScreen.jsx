"use client";

// src/components/SplashScreen.jsx
// Splash Screen sinematik pembuka PicFlow:
// - Kanvas warm cream #FFFDF6
// - Animasi 3 batang histogram RGB prism (Merah #D62B2B, Hijau #16A34A, Biru #2563EB)
// - Wordmark "Pic" + "F"(Red) + "l"(Green) + "ow"(Blue) & subtext "PHOTOGRAPHY"
// - Transisi keluar mulus (fade out & scale up)
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFFDF6] text-stone-900 select-none overflow-hidden"
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
        {/* Histogram RGB Prism Animated Mark */}
        <div className="relative flex items-center justify-center">
          {/* Cincin luar pulse berkelanjutan */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0.1 }}
            animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
            className="absolute -inset-7 rounded-3xl border border-blue-600/20"
          />

          <svg
            width="68"
            height="76"
            viewBox="0 0 54 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="PicFlow Logo"
          >
            {/* Red Bar */}
            <motion.rect
              x="0"
              y="0"
              width="14"
              height="60"
              rx="7"
              fill="#D62B2B"
              initial={{ scaleY: 0.2, originY: 1, opacity: 0 }}
              animate={{ scaleY: [0.2, 1, 0.9, 1], opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            />
            {/* Green Bar */}
            <motion.rect
              x="20"
              y="10"
              width="14"
              height="50"
              rx="7"
              fill="#16A34A"
              initial={{ scaleY: 0.2, originY: 1, opacity: 0 }}
              animate={{ scaleY: [0.2, 1, 0.92, 1], opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            />
            {/* Blue Bar */}
            <motion.rect
              x="40"
              y="4"
              width="14"
              height="56"
              rx="7"
              fill="#2563EB"
              initial={{ scaleY: 0.2, originY: 1, opacity: 0 }}
              animate={{ scaleY: [0.2, 1, 0.95, 1], opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            />
          </svg>
        </div>

        {/* Wordmark PicFlow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
          className="mt-6 flex flex-col items-center"
        >
          <div className="flex items-baseline text-2xl font-extrabold tracking-tight">
            <span className="text-[#111318]">Pic</span>
            <span style={{ color: "#D62B2B" }}>F</span>
            <span style={{ color: "#16A34A" }}>l</span>
            <span style={{ color: "#2563EB" }}>ow</span>
          </div>

          {/* Subtext PHOTOGRAPHY & Tri-color Dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-2.5 flex items-center gap-2"
          >
            <span className="flex items-center gap-1" aria-hidden="true">
              <i className="h-1.5 w-1.5 rounded-full bg-[#D62B2B]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[3.5px] text-[#888888]">
              PHOTOGRAPHY
            </span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Indikator progress bar gradasi halus spektrum PicFlow */}
      <div className="absolute bottom-16 flex flex-col items-center gap-2">
        <div className="relative h-2.5 w-56 sm:w-64 overflow-hidden rounded-full border border-[#E8DEC9] bg-[#EFE7D8]/80 shadow-inner">
          <div
            className="h-full rounded-full transition-[width] duration-75 ease-linear shadow-xs"
            style={{
              width: `${progress}%`,
              backgroundImage:
                "linear-gradient(90deg, #D62B2B 0%, #16A34A 50%, #2563EB 100%)",
            }}
          />
        </div>
        <div className="flex w-56 sm:w-64 items-center justify-between font-mono text-[11px] text-stone-500">
          <span>Calibrating RGB channels...</span>
          <span className="font-semibold text-stone-700">{progress}%</span>
        </div>
      </div>
    </motion.div>
  );
}
