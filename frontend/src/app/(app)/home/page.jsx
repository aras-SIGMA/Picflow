"use client";

// src/app/home/page.jsx
// HOME: hero editorial + kutipan + baris kategori (thumbnail) + galeri
// masonry + lightbox + floating info card.
// Logika TIDAK berubah: proteksi token, listPhotos + listCategories,
// filter kategori, deletePhoto. Tambahan murni UI: search, skeleton,
// empty/error state, dan konfirmasi hapus via modal custom.
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { ArrowRight, Camera, Compass, ImagePlus, RefreshCcw, Search, Users } from "lucide-react";
import { fileUrl, getToken, listPhotos, listCategories, deletePhoto } from "@/lib/api";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";
import { subscribeRealtime } from "@/lib/realtime";
import { useAuth } from "@/context/AuthContext";
import PhotoCard from "@/components/PhotoCard";
import MasonryGrid from "@/components/MasonryGrid";
import Lightbox from "@/components/Lightbox";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import PillBadge from "@/components/ui/PillBadge";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  PageTransition,
  Reveal,
  RevealGroup,
  SpotlightCard,
  WordReveal,
} from "@/components/ui/Motion";
import { EASE, fadeUp } from "@/components/ui/motion";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const reduced = useReducedMotion();

  const [feedTab, setFeedTab] = useState("explore"); // "explore" | "following"
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState(null);
  const [peek, setPeek] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Parallax tipis glow hero mengikuti kursor (transform saja, mati saat
  // prefers-reduced-motion).
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);
  const gx = useSpring(glowX, { stiffness: 50, damping: 20 });
  const gy = useSpring(glowY, { stiffness: 50, damping: 20 });

  function onHeroMove(e) {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    glowX.set(((e.clientX - r.left) / r.width - 0.5) * 40);
    glowY.set(((e.clientY - r.top) / r.height - 0.5) * 24);
  }

  // LOAD: ambil feed foto sesuai tab (explore / following) + categories
  useEffect(() => {
    if (loading) return;
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    async function load() {
      setFetching(true);
      setError("");
      try {
        const [pRes, cRes] = await Promise.all([
          listPhotos({ feed: feedTab }),
          listCategories(),
        ]);
        setPhotos(pRes.data || []);
        setCategories(cRes.data || []);
      } catch (err) {
        if (err.status === 401) router.replace("/login");
        else setError(err.message);
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [loading, router, feedTab]);

  // Real-time synchronization event listener
  useEffect(() => {
    const unsubscribe = subscribeRealtime(({ event, payload }) => {
      if (event === "photo:liked") {
        setPhotos((prev) =>
          prev.map((p) =>
            String(p.id_photo) === String(payload.photo_id)
              ? {
                  ...p,
                  likes_count: payload.likes_count,
                  ...(payload.user_id === user?.id_user
                    ? { is_liked: payload.is_liked }
                    : {}),
                }
              : p
          )
        );
      } else if (event === "comment:added") {
        setPhotos((prev) =>
          prev.map((p) =>
            String(p.id_photo) === String(payload.photo_id)
              ? { ...p, comments_count: payload.comments_count }
              : p
          )
        );
      } else if (event === "comment:deleted") {
        setPhotos((prev) =>
          prev.map((p) =>
            String(p.id_photo) === String(payload.photo_id)
              ? { ...p, comments_count: payload.comments_count }
              : p
          )
        );
      } else if (event === "creator:followed" && feedTab === "following") {
        listPhotos({ feed: "following" }).then((res) => {
          setPhotos(res.data || []);
        });
      }
    });

    return unsubscribe;
  }, [feedTab, user?.id_user]);

  // DELETE: hapus foto lalu buang dari state (logika lama, modal custom).
  async function handleDeleteConfirmed() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deletePhoto(pendingDelete.id_photo);
      setPhotos((prev) => prev.filter((p) => p.id_photo !== pendingDelete.id_photo));
      toast.success(`"${pendingDelete.title}" dihapus.`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // Thumbnail kategori = foto terbaru di kategori itu (dihitung dari data
  // yang sudah ada — tidak ada endpoint baru yang dikarang).
  const categoryCards = useMemo(
    () =>
      categories.map((c) => {
        const inCategory = photos.filter(
          (p) => String(p.id_category) === String(c.id_category),
        );
        return { ...c, count: inCategory.length, cover: inCategory[0]?.image_url || null };
      }),
    [categories, photos],
  );

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
        listPhotos({ feed: feedTab }),
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

  // ====== SKELETON LOADING (bentuk masonry) ======
  if (loading || fetching) {
    return (
      <PageTransition>
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
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden" onMouseMove={onHeroMove}>
        <motion.div aria-hidden="true" className="hero-glow" style={{ x: gx, y: gy }} />
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-20 sm:pt-28">
          <PillBadge>Your private vault</PillBadge>
          <WordReveal
            as="h1"
            text="Your best shots, kept beautifully."
            accentWord="beautifully"
            className="display-1 mt-6 max-w-3xl"
          />
          <Reveal delay={0.35}>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
              Simpan, rapikan, dan pamerkan karya fotografimu di satu tempat yang tenang
              dan privat.
            </p>
          </Reveal>
          <Reveal delay={0.45}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/addphoto" magnetic>
                <ImagePlus size={16} />
                Add Photo
              </Button>
              <Button href="#galeri" variant="ghost">
                Browse
                <ArrowRight size={16} />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ KUTIPAN ============ */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14">
        <Reveal>
          <blockquote className="max-w-2xl">
            <span
              aria-hidden="true"
              className="block text-3xl leading-none text-[var(--accent-2)]"
            >
              &ldquo;
            </span>
            <p className="mt-2 text-lg leading-relaxed text-muted sm:text-xl">
              Fotografi adalah cara memilih apa yang layak diingat. PicFlow menjaga
              pilihan itu tetap rapi.
            </p>
            <footer className="mt-4 text-xs text-faint">
              Tim PicFlow — Catatan sang kurator
            </footer>
          </blockquote>
        </Reveal>
      </section>

      {/* ============ KATEGORI (kartu thumbnail + caption) ============ */}
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
                    <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-md)] border border-line bg-[var(--bg-elevated)]">
                      {c.cover ? (
                        <Image
                          src={fileUrl(c.cover)}
                          loader={isCloudinaryUrl(fileUrl(c.cover)) ? cloudinaryLoader : undefined}
                          alt={`Kategori ${c.name}`}
                          fill
                          sizes="144px"
                          className="object-cover transition-transform duration-700 group-hover/spot:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Camera size={22} className="text-faint" />
                        </div>
                      )}
                    </div>
                    <p className="mt-2 truncate text-xs font-medium text-ink">{c.name}</p>
                    <p className="text-[11px] text-faint">{c.count} foto</p>
                  </button>
                </SpotlightCard>
              </motion.div>
            ))}
          </RevealGroup>
        </section>
      )}

      {/* ============ GALERI ============ */}
      <section id="galeri" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8">
        {error ? (
          <div className="flex flex-col items-center gap-4 rounded-[var(--radius-md)] border border-line py-16 text-center">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="ghost" onClick={retry}>
              <RefreshCcw size={14} />
              Coba lagi
            </Button>
          </div>
        ) : (
          <>
            {/* Feed Switcher (Explore vs Following) */}
            <Reveal>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-center gap-2 rounded-full border border-line bg-[var(--surface)] p-1">
                  <button
                    type="button"
                    onClick={() => setFeedTab("explore")}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      feedTab === "explore"
                        ? "bg-white text-black shadow-sm"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <Compass size={14} />
                    Explore Komunitas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedTab("following")}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      feedTab === "following"
                        ? "bg-white text-black shadow-sm"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <Users size={14} />
                    Following
                  </button>
                </div>
                <span className="text-xs text-faint">
                  {feedTab === "explore"
                    ? "Feed publik semua karya fotografer"
                    : "Feed karya dari kreator yang kamu ikuti"}
                </span>
              </div>
            </Reveal>

            {/* Search + filter chips */}
            <Reveal>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-xs">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari foto..."
                    aria-label="Cari foto"
                    className="w-full rounded-full border border-line bg-[var(--bg-elevated)] py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none"
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
                        className={`rounded-full border px-4 py-1.5 text-xs transition-colors duration-300 ${
                          active
                            ? "border-accent bg-accent/15 text-ink"
                            : "border-line text-muted hover:border-white/30 hover:text-ink"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Reveal>

            <p className="mt-6 text-xs text-faint">
              {shown.length} foto ·{" "}
              {filter === "all"
                ? "semua kategori"
                : categories.find((c) => String(c.id_category) === filter)?.name}
            </p>

            {/* Empty state ilustratif */}
            {shown.length === 0 ? (
              feedTab === "following" ? (
                <div className="mt-8 flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-white/10 py-20 text-center">
                  <div className="rounded-full border border-line p-4">
                    <Users size={24} className="text-faint" />
                  </div>
                  <div>
                    <p className="font-medium text-ink">Belum ada karya di tab Following</p>
                    <p className="mt-1 max-w-md text-sm text-muted">
                      Kamu belum mengikuti kreator manapun atau mereka belum mengunggah karya baru. Jelajahi Explore untuk menemukan kreator inspiratif!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedTab("explore")}
                    className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/85"
                  >
                    <Compass size={15} />
                    Jelajahi Explore
                  </button>
                </div>
              ) : (
                <div className="mt-8 flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-white/10 py-20 text-center">
                  <div className="rounded-full border border-line p-4">
                    <ImagePlus size={24} className="text-faint" />
                  </div>
                  <div>
                    <p className="font-medium text-ink">
                      {photos.length === 0
                        ? "Belum ada foto"
                        : "Tidak ada foto yang cocok"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {photos.length === 0
                        ? "Upload karya pertamamu untuk mengisi vault ini."
                        : "Coba kata kunci atau kategori lain."}
                    </p>
                  </div>
                  <Link
                    href="/addphoto"
                    className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/85"
                  >
                    <ImagePlus size={15} />
                    Tambah Foto
                  </Link>
                </div>
              )
            ) : (
              <MasonryGrid className="mt-6">
                {shown.map((p) => (
                  <PhotoCard
                    key={p.id_photo}
                    photo={p}
                    layoutId="home-photo"
                    onOpen={setSelected}
                    onPeek={setPeek}
                    onDelete={setPendingDelete}
                    showActions={p.is_owner}
                  />
                ))}
              </MasonryGrid>
            )}
          </>
        )}
      </section>

      {/* ============ FLOATING INFO CARD (bergaya referensi) ============ */}
      <AnimatePresence>
        {peek && !selected && shown.length > 0 && (
          <motion.aside
            key="peek"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed bottom-6 right-6 z-30 hidden w-60 rounded-[var(--radius-md)] border border-black/5 bg-ink p-4 shadow-xl shadow-black/40 lg:block"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-canvas/50">
              Sedang dibuka
            </p>
            <p className="mt-1.5 truncate text-sm font-semibold text-canvas">
              {peek.title}
            </p>
            <p className="truncate text-xs text-canvas/60">
              {peek.category_name || `#${peek.id_category}`}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelected(peek);
                setPeek(null);
              }}
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-deep)] underline underline-offset-2 transition-opacity hover:opacity-75"
            >
              Buka detail
              <ArrowRight size={12} />
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ============ LIGHTBOX & MODAL HAPUS ============ */}
      <AnimatePresence>
        {selected && (
          <Lightbox
            photo={photos.find((p) => p.id_photo === selected.id_photo) || selected}
            layoutId="home-photo"
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        labelledBy="delete-title"
      >
        <h2 id="delete-title" className="display-2 text-lg!">
          Hapus foto ini?
        </h2>
        <p className="mt-2 text-sm text-muted">
          &ldquo;{pendingDelete?.title}&rdquo; akan dihapus permanen beserta filenya.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>
            Batal
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDeleteConfirmed}>
            Hapus
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
