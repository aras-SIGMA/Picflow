"use client";

// src/components/ui/Motion.jsx
// Helper animasi reusable: Reveal & RevealGroup (scroll reveal, once),
// WordReveal (headline per kata via mask slide-up), SpotlightCard (glow
// mengikuti kursor), CountUp (angka naik saat masuk viewport), dan
// PageTransition (fade + translateY). Semua hanya menganimasikan
// transform/opacity dan menghormati prefers-reduced-motion.
import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { DUR, EASE, fadeUp, stagger } from "./motion";

// Scroll reveal tunggal (once: true).
export function Reveal({ children, delay = 0, className = "", y = 24 }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: DUR.base, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scroll reveal berkelompok: anak langsung di-stagger.
export function RevealGroup({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delayChildren: delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const revealItem = fadeUp;

// Headline reveal per kata (mask slide-up, stagger 70ms).
export function WordReveal({ text, as: Tag = "h1", className = "", accentWord }) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  return (
    <Tag className={className}>
      {words.map((word, i) => {
        const isAccent =
          Boolean(accentWord) && word.toLowerCase() === accentWord.toLowerCase();
        const content = isAccent ? <em className="accent-serif">{word}</em> : word;

        if (reduced) {
          return (
            <span key={`${word}-${i}`} className="mr-[0.25em] last:mr-0">
              {content}
            </span>
          );
        }

        return (
          <span key={`${word}-${i}`} className="mask-line mr-[0.25em] last:mr-0">
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: DUR.slow, ease: EASE, delay: i * 0.07 }}
            >
              {content}
            </motion.span>
          </span>
        );
      })}
    </Tag>
  );
}

// Kartu dengan spotlight glow radial yang mengikuti kursor.
export function SpotlightCard({ children, className = "" }) {
  const ref = useRef(null);

  function onMove(e) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`group/spot relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(280px circle at var(--mx, 50%) var(--my, 50%), rgba(124,108,255,0.14), transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}

// Angka count-up saat masuk viewport (reduced-motion: langsung final).
export function CountUp({ value, duration = 1.2, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduced]);

  // Reduced-motion: langsung tampilkan nilai akhir tanpa animasi.
  return (
    <span ref={ref} className={className}>
      {reduced ? value : display}
    </span>
  );
}

// Pembungkus transisi halaman: fade + sedikit translateY.
export function PageTransition({ children }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -8 }}
      transition={{ duration: DUR.base, ease: EASE }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
