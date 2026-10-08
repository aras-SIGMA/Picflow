"use client";

// src/components/ui/ApertureLoader.jsx
// Loader bertema kamera: cincin aperture yang blade-nya membuka-menutup
// sambil berputar. Dipakai untuk loading global dan state tombol submit.
import { motion, useReducedMotion } from "framer-motion";

export default function ApertureLoader({ size = 24, light = false }) {
  const reduced = useReducedMotion();
  const stroke = light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.75)";
  const dim = light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)";

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={reduced ? undefined : { rotate: 360 }}
      transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={dim} strokeWidth="2" />
      {/* Enam blade aperture: panjang garis berdenyut (buka-tutup) */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <motion.line
          key={deg}
          x1="12"
          y1="12"
          x2="12"
          y2="4.5"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${deg} 12 12)`}
          style={{ transformOrigin: "12px 12px" }}
          animate={reduced ? undefined : { scaleY: [1, 0.35, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </motion.svg>
  );
}
