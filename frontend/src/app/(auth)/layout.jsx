// src/app/(auth)/layout.jsx
// Shell halaman auth: TANPA Navbar/Footer global.
// Grid 2 kolom di desktop — kiri panel form (solid, z-10, scroll sendiri
// bila konten panjang), kanan panel kolase (sticky, overflow-hidden,
// isolation). Di bawah lg: satu kolom, kolase disembunyikan.
import AuthCollage from "@/components/AuthCollage";

export default function AuthLayout({ children }) {
  return (
    <main className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      {/* ============ KIRI: PANEL FORM ============ */}
      <div className="relative z-10 flex min-h-dvh justify-center overflow-y-auto bg-[var(--bg)] px-5 py-12 lg:h-dvh">
        {/* Glow radial hanya di mobile (desktop panel tetap solid) */}
        <div aria-hidden="true" className="hero-glow lg:hidden" />

        {/* my-auto: terpusat vertikal, tetap bisa scroll dari atas
            bila konten melebihi viewport (Register). */}
        <div className="relative my-auto w-full max-w-[420px]">{children}</div>
      </div>

      {/* ============ KANAN: PANEL KOLASE ============ */}
      <AuthCollage />
    </main>
  );
}
