"use client";

// src/app/page.js
// ALUR UTAMA PICFLOW:
// 1. Splash Screen sinematik aperture sRGB (5 detik) saat membuka aplikasi
// 2. Jika user SUDAH login -> diarahkan langsung ke Dashboard User (/home)
// 3. Jika user BELUM login -> masuk ke LANDING PAGE GUEST:
//    - Hero Gridlines + 4 Floating Creator Orbits & Dual CTA
//    - Brand Camera Ecosystem Social Proof
//    - Bento Grid Fitur 3 Kartu (EXIF Inspector, 4-Pilar Kritik, Real-time Sync)
//    - Dark Showcase Container (Sensor & Format RAW ecosystem)
//    - Editorial Curator Quote
//    - 3-Column Statistics
//    - Preview Carousel Marquee Foto Format Landscape (Pengganti galeri lama)
//    - Bottom Call-to-Action Banner
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { getToken, listPhotos } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer";
import Lightbox from "@/components/Lightbox";
import Skeleton from "@/components/ui/Skeleton";
import SplashScreen from "@/components/SplashScreen";
import LandingPage from "@/components/LandingPage";
import LandscapePhotoCarousel from "@/components/LandscapePhotoCarousel";
import { PageTransition } from "@/components/ui/Motion";

export default function RootGuestHomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [showSplash, setShowSplash] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState(null);

  // ====== 1. SPLASH SCREEN & AUTH ROUTING ======
  useEffect(() => {
    // Jika sudah login, langsung ke /home tanpa splash
    if (getToken()) {
      router.replace("/home");
      return;
    }

    // Hanya tampilkan splash 1x per sesi browser
    if (sessionStorage.getItem("picflow_splash_seen")) return;
    sessionStorage.setItem("picflow_splash_seen", "1");

    const show = setTimeout(() => setShowSplash(true), 0);
    const hide = setTimeout(() => setShowSplash(false), 5000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [router]);

  useEffect(() => {
    // Kunci scroll saat splash screen berjalan
    if (showSplash) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showSplash]);

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
      try {
        const pRes = await listPhotos({ feed: "explore" });
        if (active) {
          setPhotos(pRes.data || []);
        }
      } catch {
        // Fallback di LandscapePhotoCarousel tetap menjamin tampilan sempurna
      } finally {
        if (active) setFetching(false);
      }
    }

    loadGuestData();
    return () => {
      active = false;
    };
  }, [authLoading, router]);

  return (
    <>
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      {/* Konten Landing Page Guest */}
      <div className="flex min-h-screen flex-col bg-[#FFFDF6] text-stone-900 selection:bg-blue-600 selection:text-white">
        <Navbar />

        <main className="flex flex-1 flex-col">
          {fetching || showSplash ? (
            <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-5 h-14 w-3/4 max-w-xl" />
              <Skeleton className="mt-3 h-14 w-1/2 max-w-sm" />
              <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[260, 260, 260, 260, 260, 260].map((h, i) => (
                  <Skeleton key={i} className="rounded-3xl" style={{ height: h }} />
                ))}
              </div>
            </div>
          ) : (
            <PageTransition key="guest-landing-main">
              <LandingPage>
                {/* Preview Carousel Marquee Foto Format Landscape */}
                <LandscapePhotoCarousel
                  photos={photos}
                  onOpenPhoto={setSelected}
                />
              </LandingPage>

              {/* Lightbox Modal Saat Foto Diklik */}
              <AnimatePresence>
                {selected && (
                  <Lightbox
                    photo={
                      photos.find(
                        (p) => (p.id_photo || p.id) === (selected.id_photo || selected.id)
                      ) || selected
                    }
                    layoutId="guest-photo"
                    onClose={() => setSelected(null)}
                  />
                )}
              </AnimatePresence>
            </PageTransition>
          )}
        </main>

        <Footer withCommunityCta={true} />
      </div>
    </>
  );
}
