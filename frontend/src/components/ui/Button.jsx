"use client";

// src/components/ui/Button.jsx
// Tombol pill: primary (solid), ghost (outline), danger. State loading
// memakai ApertureLoader agar bertema kamera. Magnetic ringan (maks 8px)
// opsional dan dimatikan pada prefers-reduced-motion.
import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import ApertureLoader from "./ApertureLoader";
import { prefersReducedMotion } from "./motion";

const VARIANTS = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm border border-transparent",
  accent: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm border border-transparent",
  dark: "bg-stone-900 text-white hover:bg-stone-800 border border-transparent",
  ghost: "border border-[#DECDB8] text-stone-800 hover:bg-[#F5EFE6] hover:border-stone-400",
  outline: "border border-[#DECDB8] text-stone-800 hover:bg-[#F5EFE6] hover:border-stone-400",
  danger: "border border-red-300 text-red-600 hover:bg-red-50",
};

const SIZES = {
  sm: "px-4 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  magnetic = false,
  className = "",
  disabled,
  type = "button",
  href,
  ...rest
}) {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 200, damping: 18 });
  const sy = useSpring(my, { stiffness: 200, damping: 18 });

  // Geser maksimal ~8px ke arah kursor (mati saat reduced motion).
  function onMove(e) {
    if (!magnetic || prefersReducedMotion()) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(Math.max(-8, Math.min(8, (e.clientX - r.left - r.width / 2) * 0.12)));
    my.set(Math.max(-8, Math.min(8, (e.clientY - r.top - r.height / 2) * 0.12)));
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  const Tag = href ? motion.a : motion.button;
  const { style: customStyle, ...otherRest } = rest;

  return (
    <Tag
      ref={ref}
      {...(href ? { href } : { type, disabled: disabled || loading })}
      style={{ x: sx, y: sy, ...customStyle }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...otherRest}
    >
      {loading && <ApertureLoader size={16} light={variant !== "primary"} />}
      {children}
    </Tag>
  );
}
