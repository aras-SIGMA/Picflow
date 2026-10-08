// src/components/ui/motion.js
// Satu sumber konstanta animasi (ease & durasi) sesuai spesifikasi:
// durasi 0.4–0.8s, easing cubic-bezier(0.22, 1, 0.36, 1).
export const EASE = [0.22, 1, 0.36, 1];
export const DUR = { fast: 0.4, base: 0.55, slow: 0.8 };

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

// Cek preferensi reduced-motion (hanya dipanggil di client).
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
