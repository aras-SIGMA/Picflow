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
  primary: "bg-white text-black hover:bg-white/85 border border-transparent",
  ghost: "border border-white/15 text-ink hover:bg-white/5 hover:border-white/30",
  danger: "border border-[var(--danger)]/40 text-danger hover:bg-[var(--danger)]/10",
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

  return (
    <Tag
      ref={ref}
      {...(href ? { href } : { type, disabled: disabled || loading })}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading && <ApertureLoader size={16} light={variant !== "primary"} />}
      {children}
    </Tag>
  );
}
