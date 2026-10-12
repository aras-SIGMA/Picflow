"use client";

// src/app/page.js
// ALUR UTAMA PICFLOW:
// 1. Splash Screen sinematik aperture sRGB saat membuka aplikasi
// 2. Jika user SUDAH login -> diarahkan langsung ke Dashboard User (/home)
// 3. Jika user BELUM login -> masuk ke HOME GUEST:
//    - Pengunjung hanya bisa melihat dan mengeksplorasi postingan foto + EXIF
//    - Disediakan opsi Login & Register di Navbar dan Hero
//    - Begitu login, diarahkan ke /home dengan fitur kreator penuh
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Compass,
  ImagePlus,
  RefreshCcw,
  Search,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { fileUrl, getToken, listPhotos, listCategories } from "@/lib/api";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer";
import PhotoCard from "@/components/PhotoCard";
import MasonryGrid from "@/components/MasonryGrid";
import Lightbox from "@/components/Lightbox";
import Button from "@/components/ui/Button";
import PillBadge from "@/components/ui/PillBadge";
import Skeleton from "@/components/ui/Skeleton";
import SplashScreen from "@/components/SplashScreen";
import {
  PageTransition,
  Reveal,
  RevealGroup,
  SpotlightCard,
  WordReveal,
} from "@/components/ui/Motion";
import { EASE, fadeUp } from "@/components/ui/motion";

export default function RootGuestHomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [showSplash, setShowSplash] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState(null);
  const [peek, setPeek] = useState(null);

  // ====== 1. SPLASH SCREEN & AUTH ROUTING ======
  useEffect(() => {
    // Jalankan splash screen ~5 detik
    const timer = setTimeout(() => {
      if (getToken()) {
        router.replace("/home");
      } else {
        setShowSplash(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  // ====== 2. LOAD DATA UNTUK HOME GUEST ======
  useEffect(() => {
    if (authLoading) return;
    if (getToken()) {
      router.replace("/home");
      return;
    }

    let active = true;
    async function loadGuestData() {
      setFetching(true);
      setError("");
      try {
        const [pRes, cRes] = await Promise.all([
          listPhotos({ feed: "explore" }),
          listCategories(),
        ]);
        if (active) {
          setPhotos(pRes.data || []);
          setCategories(cRes.data || []);
        }
      } catch (err) {
        if (active) setError(err.message || "Gagal memuat karya foto.");
      } finally {
        if (active) setFetching(false);
      }
    }

    loadGuestData();
    return () => {
      active = false;
    };
  }, [authLoading, router]);

  // Kategori dengan thumbnail foto pertama
  const categoryCards = useMemo(() => {
    return categories.map((cat) => {
      const match = photos.find((p) => String(p.id_category) === String(cat.id_category));
      const count = photos.filter((p) => String(p.id_category) === String(cat.id_category)).length;
      return {
        ...cat,
        cover: match?.image_url || null,
        count,
      };
    });
  }, [categories, photos]);

  // Foto yang difilter
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return photos.filter((p) => {
      const matchCategory = filter === "all" || String(p.id_category) === filter;
      const matchSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [photos, filter, search]);

  async function retry() {
    setError("");
    setFetching(true);
    try {
      const [pRes, cRes] = await Promise.all([
        listPhotos({ feed: "explore" }),
        listCategories(),
      ]);
      setPhotos(pRes.data || []);
      setCategories(cRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }

  return (
    <>
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      {/* Konten Home Guest (Tampil saat splash selesai) */}
      <div className="flex min-h-screen flex-col bg-[#FEFAF3] text-stone-900 selection:bg-blue-600 selection:text-white">
        <Navbar />

        <main className="flex flex-1 flex-col">
          {fetching ? (
            <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-5 h-14 w-3/4 max-w-xl" />
              <Skeleton className="mt-3 h-14 w-1/2 max-w-sm" />
              <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
                {[320, 224, 272, 192, 288, 240, 336, 208].map((h, i) => (
                  <Skeleton key={i} className="mb-4 break-inside-avoid" style={{ height: h }} />
                ))}
              </div>
            </div>
          ) : (
            <PageTransition>
              {/* ============ HERO GUEST ============ */}
              <section className="relative overflow-hidden">
                <div aria-hidden="true" className="hero-glow" />
                <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-16 sm:pt-24">
                  <PillBadge dotColor="bg-blue-600">
                    Koleksi Publik Terkurasi · Standar sRGB
                  </PillBadge>
                  <WordReveal
                    as="h1"
                    text="Your best shots, kept beautifully."
                    accentWord="beautifully"
                    className="display-1 mt-6 max-w-3xl"
                  />
                  <Reveal delay={0.25}>
                    <p className="mt-5 max-w-lg text-sm leading-relaxed text-stone-600 sm:text-base">
                      Jelajahi galeri karya fotografi resolusi tinggi dengan parameter optik EXIF terbuka dan kalibrasi spektrum sRGB. Masuk atau daftar untuk mengelola vault pribadimu.
                    </p>
                  </Reveal>
                  <Reveal delay={0.35}>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      <Button href="/register" size="lg" className="shadow-sm">
                        Buat Akun Fotografer
                        <ArrowRight size={15} />
                      </Button>
                      <Button href="/login" variant="outline" size="lg">
                        Masuk ke Vault
                      </Button>
                      <Button href="#galeri" variant="ghost" size="lg">
                        Jelajahi Galeri
                      </Button>
                    </div>
                  </Reveal>
                </div>
              </section>

              {/* ============ KUTIPAN KURATOR ============ */}
              <section className="mx-auto w-full max-w-6xl px-4 py-10">
                <Reveal>
                  <blockquote className="max-w-2xl border-l-2 border-blue-600/40 pl-4">
                    <p className="text-base leading-relaxed text-stone-700 italic sm:text-lg">
                      &ldquo;Fotografi adalah cara memilih apa yang layak diingat. PicFlow menjaga pilihan itu tetap rapi dan terkalibrasi.&rdquo;
                    </p>
                    <footer className="mt-2 text-xs font-semibold text-stone-500">
                      Tim PicFlow — Standar Kalibrasi sRGB
                    </footer>
                  </blockquote>
                </Reveal>
              </section>

              {/* ============ BARIS KATEGORI ============ */}
              {categoryCards.length > 0 && (
                <section className="mx-auto w-full max-w-6xl px-4 pb-6">
                  <RevealGroup className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {categoryCards.map((c) => (
                      <motion.div key={c.id_category} variants={fadeUp}>
                        <SpotlightCard className="w-36 shrink-0 rounded-[var(--radius-md)]">
                          <button
                            type="button"
                            onClick={() => {
                              setFilter(String(c.id_category));
                              document
                                .getElementById("galeri")
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="block w-full text-left"
                          >
                            <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-md)] border border-[#E8DEC9] bg-[#F5EFE6]">
                              {c.cover ? (
                                <Image
                                  src={fileUrl(c.cover)}
                                  loader={
                                    isCloudinaryUrl(fileUrl(c.cover))
                                      ? cloudinaryLoader
                                      : undefined
                                  }
                                  alt={`Kategori ${c.name}`}
                                  fill
                                  sizes="144px"
                                  className="object-cover transition-transform duration-700 group-hover/spot:scale-105"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Camera size={22} className="text-stone-400" />
                                </div>
                              )}
                            </div>
                            <p className="mt-2 truncate text-xs font-semibold text-stone-900">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-stone-500">{c.count} foto</p>
                          </button>
                        </SpotlightCard>
                      </motion.div>
                    ))}
                  </RevealGroup>
                </section>
              )}

              {/* ============ GALERI MASONRY GUEST ============ */}
              <section id="galeri" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8">
                {error ? (
                  <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50/50 py-16 text-center">
                    <p className="text-sm text-red-600">{error}</p>
                    <Button variant="ghost" onClick={retry}>
                      <RefreshCcw size={14} />
                      Coba lagi
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Header baris filter + search */}
                    <Reveal>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full max-w-xs">
                          <Search
                            size={15}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                          />
                          <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari foto..."
                            aria-label="Cari foto"
                            className="w-full rounded-full border border-[#DCD0BE] bg-[#FEFAF3] py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[{ id_category: "all", name: "Semua" }, ...categories].map((c) => {
                            const active = String(c.id_category) === filter;
                            return (
                              <button
                                key={c.id_category}
                                type="button"
                                onClick={() => setFilter(String(c.id_category))}
                                aria-pressed={active}
                                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                                  active
                                    ? "border-blue-600 bg-blue-600 text-white font-semibold shadow-xs"
                                    : "border-[#DCD0BE] bg-[#FEFAF3] text-stone-700 hover:border-stone-400 hover:bg-white"
                                }`}
                              >
                                {c.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </Reveal>

                    <p className="mt-6 text-xs text-stone-500">
                      {shown.length} foto publik ·{" "}
                      {filter === "all"
                        ? "semua kategori"
                        : categories.find((c) => String(c.id_category) === filter)?.name}
                    </p>

                    {/* Empty state */}
                    {shown.length === 0 ? (
                      <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-[#DCD0BE] bg-[#F5EFE6]/50 py-20 text-center">
                        <div className="rounded-full border border-[#DCD0BE] bg-[#FEFAF3] p-4 text-stone-500">
                          <ImagePlus size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">
                            {photos.length === 0
                              ? "Belum ada foto terpublikasi"
                              : "Tidak ada foto yang cocok"}
                          </p>
                          <p className="mt-1 text-sm text-stone-600">
                            {photos.length === 0
                              ? "Koleksi foto sedang disiapkan oleh para kurator."
                              : "Coba kata kunci atau kategori lain."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <MasonryGrid className="mt-6">
                        {shown.map((p) => (
                          <PhotoCard
                            key={p.id_photo}
                            photo={p}
                            layoutId="guest-photo"
                            onOpen={setSelected}
                            onPeek={setPeek}
                            showActions={false}
                          />
                        ))}
                      </MasonryGrid>
                    )}
                  </>
                )}
              </section>

              {/* ============ FLOATING INFO CARD ============ */}
              <AnimatePresence>
                {peek && !selected && shown.length > 0 && (
                  <motion.aside
                    key="peek"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="fixed bottom-20 right-6 z-30 hidden w-64 rounded-2xl border border-[#DCD0BE] bg-[#FEFAF3] p-4 shadow-lg lg:block"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
                      Sedang dilihat
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-stone-900">
                      {peek.title}
                    </p>
                    <p className="truncate text-xs text-stone-600">
                      {peek.category_name || `#${peek.id_category}`}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(peek);
                        setPeek(null);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 underline underline-offset-2 transition-opacity hover:opacity-80"
                    >
                      Buka detail &amp; EXIF
                      <ArrowRight size={12} />
                    </button>
                  </motion.aside>
                )}
              </AnimatePresence>

              {/* ============ STICKY BOTTOM GUEST BANNER ============ */}
              <div className="fixed bottom-4 inset-x-4 z-30 mx-auto max-w-4xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl sm:rounded-full border border-[#DCD0BE] bg-[#FEFAF3]/95 px-5 py-3 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-3 text-xs text-stone-700">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#DCD0BE] bg-[#F5EFE6] text-stone-500 shadow-2xs">
                      <User size={15} />
                    </div>
                    <span>
                      <strong className="text-stone-900 font-semibold">Mode Tamu:</strong> Masuk atau buat akun untuk menyimpan karya pribadimu dan memberikan kritik konstruktif.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/login"
                      className="rounded-full border border-[#DCD0BE] px-4 py-1.5 text-xs font-semibold text-stone-800 transition-colors hover:border-stone-400 hover:bg-white"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 shadow-xs"
                    >
                      Daftar Gratis
                    </Link>
                  </div>
                </div>
              </div>

              {/* ============ LIGHTBOX ============ */}
              <AnimatePresence>
                {selected && (
                  <Lightbox
                    photo={photos.find((p) => p.id_photo === selected.id_photo) || selected}
                    layoutId="guest-photo"
                    onClose={() => setSelected(null)}
                  />
                )}
              </AnimatePresence>
            </PageTransition>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
