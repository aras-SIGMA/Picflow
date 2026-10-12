"use client";

// src/app/(auth)/layout.jsx
// Shell halaman autentikasi PicFlow (Warm Cream Editorial #FEFAF3):
// - Kanvas bernuansa hangat #FEFAF3 yang elegan dan nyaman di mata
// - Sisi KIRI: Panel form login / register
// - Sisi KANAN: Panel artboard preview foto potret pengguna yang bergeser ke kanan otomatis (1 jalur)
// - Window chrome desktop minimalis bergaya macOS
import { Lock, RotateCw } from "lucide-react";
import PhotoMarqueeSlider from "@/components/PhotoMarqueeSlider";

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-dvh w-full bg-[#FEFAF3] text-stone-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Kontainer Desktop Window #FEFAF3 */}
      <div className="relative z-10 flex min-h-dvh flex-col p-2 sm:p-4 lg:p-6">
        <main className="relative flex min-h-[calc(100dvh-16px)] sm:min-h-[calc(100dvh-32px)] lg:min-h-[calc(100dvh-48px)] flex-1 flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E8DEC9] bg-[#FEFAF3]">
          {/* ============ MAC OS CHROME BAR ============ */}
          <header className="flex h-11 shrink-0 items-center justify-between border-b border-[#E8DEC9] bg-[#FEFAF3] px-4">
            {/* Window Traffic Lights */}
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-[#FF5F56] transition-opacity hover:opacity-80" />
              <span className="h-3 w-3 rounded-full bg-[#FFBD2E] transition-opacity hover:opacity-80" />
              <span className="h-3 w-3 rounded-full bg-[#27C93F] transition-opacity hover:opacity-80" />
            </div>

            {/* Address Bar Capsule */}
            <div className="flex max-w-[280px] flex-1 items-center justify-center sm:max-w-[340px]">
              <div className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#DFD3BE] bg-[#FEFAF3] px-3 py-1 text-[11px] text-stone-600">
                <Lock size={11} className="text-blue-600" />
                <span className="font-mono font-medium text-stone-800">picflow.studio</span>
                <span className="text-stone-400">/auth</span>
              </div>
            </div>

            {/* Window Action Minimalist */}
            <div className="flex items-center gap-2 text-stone-400">
              <button
                type="button"
                aria-label="Refresh window"
                className="rounded-md p-1 hover:text-stone-600 transition-colors"
                onClick={() => {
                  if (typeof window !== "undefined") window.location.reload();
                }}
              >
                <RotateCw size={12} />
              </button>
            </div>
          </header>

          {/* ============ SPLIT CONTENT: FORM KIRI | FOTO KANAN ============ */}
          <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* SISI KIRI (DESKTOP): FORM LOGIN / REGISTER */}
            <div className="relative z-10 flex flex-col justify-center overflow-y-auto bg-[#FEFAF3] px-6 py-8 sm:px-10 md:px-12 lg:col-span-5 lg:py-12 border-r border-[#E8DEC9]">
              <div className="relative mx-auto w-full max-w-[420px]">
                {children}
              </div>
            </div>

            {/* SISI KANAN (DESKTOP): ARTBOARD DENGAN FOTO PORTRAIT SLIDING KE KANAN */}
            <div className="relative hidden lg:col-span-7 lg:block overflow-hidden bg-[#FEFAF3]">
              <PhotoMarqueeSlider />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
