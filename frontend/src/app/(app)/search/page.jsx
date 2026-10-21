"use client";

// src/app/(app)/search/page.jsx
// Halaman Pencarian & Eksplorasi PicFlow:
// - Hero search input dengan sinkronisasi query string URL (?q=...)
// - Multi-dimensi: Foto, Fotografer/Kreator, dan Camera Gear / EXIF
// - Tab filter: All, Photos, Photographers
// - Filter sekunder: Genre/Kategori, Brand Kamera, dan Pengurutan (Latest, Popular, Discussed)
// - Integrasi MasonryGrid + PhotoCard + Lightbox + follow kreator

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Aperture,
  Camera,
  Compass,
  Filter,
  ImageOff,
  Layers,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { getToken, listCategories, listPhotos } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PhotoCard from "@/components/PhotoCard";
import MasonryGrid from "@/components/MasonryGrid";
import Lightbox from "@/components/Lightbox";
import FollowButton from "@/components/FollowButton";
import Skeleton from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/Motion";

const GEAR_BRANDS = [
  "Sony",
  "Canon",
  "Fujifilm",
  "Nikon",
  "Leica",
  "Hasselblad",
  "Panasonic",
  "Other",
];

const TRENDING_SUGGESTIONS = [
  "Sony A7IV",
  "Fujifilm",
  "35mm",
  "Street",
  "Landscape",
  "Canon EOS R5",
  "Leica",
  "Portrait",
  "50mm",
  "Golden Hour",
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialGear = searchParams.get("gear") || "all";

  const [query, setQuery] = useState(initialQuery);
  const [prevQuery, setPrevQuery] = useState(initialQuery);
  if (initialQuery !== prevQuery) {
    setPrevQuery(initialQuery);
    setQuery(initialQuery);
  }

  const [activeTab, setActiveTab] = useState("all"); // "all" | "photos" | "photographers"

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [prevCategory, setPrevCategory] = useState(initialCategory);
  if (initialCategory !== prevCategory) {
    setPrevCategory(initialCategory);
    setSelectedCategory(initialCategory);
  }

  const [selectedGear, setSelectedGear] = useState(initialGear);
  const [prevGear, setPrevGear] = useState(initialGear);
  if (initialGear !== prevGear) {
    setPrevGear(initialGear);
    setSelectedGear(initialGear);
  }

  const [sortBy, setSortBy] = useState("latest"); // "latest" | "popular" | "discussed"

  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Update URL search params tanpa hard reload
  const updateUrlParams = useCallback(
    (newQuery, newCat, newGear) => {
      const params = new URLSearchParams();
      if (newQuery) params.set("q", newQuery);
      if (newCat && newCat !== "all") params.set("category", newCat);
      if (newGear && newGear !== "all") params.set("gear", newGear);

      const qs = params.toString();
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [photosRes, categoriesRes] = await Promise.all([
          listPhotos({ feed: "explore" }),
          listCategories(),
        ]);
        setPhotos(photosRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch (err) {
        if (err.status === 401) router.replace("/login");
        else setError(err.message || "Failed to load photos");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authLoading, router]);

  // Ekstraksi fotografer unik dari data karya foto
  const allCreators = useMemo(() => {
    const map = new Map();
    photos.forEach((p) => {
      if (p.creator?.id && !map.has(p.creator.id)) {
        map.set(p.creator.id, {
          id: p.creator.id,
          username: p.creator.username,
          full_name: p.creator.full_name,
          avatar_url: p.creator.avatar_url,
          photoCount: 1,
          latestPhoto: p,
        });
      } else if (p.creator?.id) {
        map.get(p.creator.id).photoCount += 1;
      }
    });
    return Array.from(map.values());
  }, [photos]);

  // Filter foto berdasarkan query, genre/kategori, dan gear
  const filteredPhotos = useMemo(() => {
    const q = query.trim().toLowerCase();

    let result = photos.filter((p) => {
      // 1. Kategori
      const matchCat =
        selectedCategory === "all" || String(p.id_category) === selectedCategory;

      // 2. Gear
      const matchGear =
        selectedGear === "all"
          ? true
          : selectedGear === "Other"
            ? !p.camera_make && !p.camera_model
            : Boolean(
                p.camera_make?.toLowerCase().includes(selectedGear.toLowerCase()) ||
                p.camera_model?.toLowerCase().includes(selectedGear.toLowerCase()) ||
                p.lens?.toLowerCase().includes(selectedGear.toLowerCase())
              );

      // 3. Query teks multi-field
      const matchQuery =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.creator?.username?.toLowerCase().includes(q) ||
        p.creator?.full_name?.toLowerCase().includes(q) ||
        p.camera_make?.toLowerCase().includes(q) ||
        p.camera_model?.toLowerCase().includes(q) ||
        p.lens?.toLowerCase().includes(q) ||
        p.category_name?.toLowerCase().includes(q);

      return matchCat && matchGear && matchQuery;
    });

    // Urutan
    if (sortBy === "popular") {
      result = [...result].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (sortBy === "discussed") {
      result = [...result].sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
    } else {
      result = [...result].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
    }

    return result;
  }, [photos, query, selectedCategory, selectedGear, sortBy]);

  // Filter fotografer/kreator berdasarkan query
  const filteredCreators = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCreators;
    return allCreators.filter(
      (c) =>
        c.username?.toLowerCase().includes(q) ||
        c.full_name?.toLowerCase().includes(q)
    );
  }, [allCreators, query]);

  const handleQueryChange = (val) => {
    setQuery(val);
    updateUrlParams(val, selectedCategory, selectedGear);
  };

  const handleClearQuery = () => {
    setQuery("");
    updateUrlParams("", selectedCategory, selectedGear);
  };

  const handleSuggestionClick = (tag) => {
    setQuery(tag);
    updateUrlParams(tag, selectedCategory, selectedGear);
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    updateUrlParams(query, catId, selectedGear);
  };

  const handleGearChange = (gear) => {
    setSelectedGear(gear);
    updateUrlParams(query, selectedCategory, gear);
  };

  const handleResetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSelectedGear("all");
    setSortBy("latest");
    updateUrlParams("", "all", "all");
  };

  const hasActiveFilters =
    query.trim() !== "" || selectedCategory !== "all" || selectedGear !== "all";

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-8">
        {/* ======================================================== */}
        {/* HERO SEARCH HEADER                                      */}
        {/* ======================================================== */}
        <section className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 shadow-xs mb-3">
            <Compass size={13} className="text-blue-600" />
            <span>Search & Discover</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Explore Visual Art & Photography
          </h1>
          <p className="mt-2 text-sm text-stone-500 max-w-lg mx-auto">
            Discover curated shots, optical equipment, camera gear, and inspiring photographers in PicFlow.
          </p>

          {/* Search Bar Input */}
          <div className="relative mx-auto mt-6 max-w-2xl">
            <div className="relative flex items-center">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 text-stone-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search shots by title, camera, lens, category, or photographer..."
                className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-11 pr-11 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClearQuery}
                  className="absolute right-3.5 rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                  aria-label="Clear query"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Trending Suggestions */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-stone-400 mr-1 text-[11px]">
                <Sparkles size={11} className="text-amber-500" />
                Trending:
              </span>
              {TRENDING_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSuggestionClick(tag)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                    query.toLowerCase() === tag.toLowerCase()
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                      : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* TABS & CONTROLS SECTION                                  */}
        {/* ======================================================== */}
        <section className="mb-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-4">
            {/* Main Category Tabs: All / Photos / Photographers */}
            <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  activeTab === "all"
                    ? "bg-stone-900 text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                All Results ({filteredPhotos.length + (query ? filteredCreators.length : 0)})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("photos")}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  activeTab === "photos"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Photographs ({filteredPhotos.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("photographers")}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  activeTab === "photographers"
                    ? "bg-stone-900 text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Photographers ({filteredCreators.length})
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
              <span className="text-[11px] font-semibold text-stone-400">Sort:</span>
              <div className="inline-flex rounded-full border border-stone-200 bg-white p-0.5 font-semibold">
                <button
                  type="button"
                  onClick={() => setSortBy("latest")}
                  className={`rounded-full px-2.5 py-1 text-[11px] transition-all ${
                    sortBy === "latest"
                      ? "bg-stone-900 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Latest
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("popular")}
                  className={`rounded-full px-2.5 py-1 text-[11px] transition-all ${
                    sortBy === "popular"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Most Liked
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("discussed")}
                  className={`rounded-full px-2.5 py-1 text-[11px] transition-all ${
                    sortBy === "discussed"
                      ? "bg-stone-900 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Discussed
                </button>
              </div>
            </div>
          </div>

          {/* Sub-Filters: Genre & Camera Gear Chips */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {/* Category selector */}
              <button
                type="button"
                onClick={() => handleCategoryChange("all")}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedCategory === "all"
                    ? "bg-stone-900 text-white shadow-xs"
                    : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                <Layers size={12} />
                <span>All Genres</span>
              </button>
              {categories.map((c) => {
                const isSelected = selectedCategory === String(c.id_category);
                return (
                  <button
                    key={c.id_category}
                    type="button"
                    onClick={() => handleCategoryChange(isSelected ? "all" : String(c.id_category))}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            {/* Gear Brand Dropdown / Quick filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-stone-400">Gear:</span>
              <select
                value={selectedGear}
                onChange={(e) => handleGearChange(e.target.value)}
                className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-700 shadow-xs focus:border-blue-600 focus:outline-none"
              >
                <option value="all">All Camera Systems</option>
                {GEAR_BRANDS.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Pill Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[11px] font-semibold text-stone-400">Filtered by:</span>
              {query && (
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-[11px] font-medium text-stone-700">
                  Query: &ldquo;{query}&rdquo;
                  <button
                    type="button"
                    onClick={handleClearQuery}
                    className="hover:text-stone-900"
                    aria-label="Remove query"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                  Genre: {categories.find((c) => String(c.id_category) === selectedCategory)?.name || selectedCategory}
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("all")}
                    className="hover:text-blue-900"
                    aria-label="Remove category"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              {selectedGear !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                  Gear: {selectedGear}
                  <button
                    type="button"
                    onClick={() => handleGearChange("all")}
                    className="hover:text-blue-900"
                    aria-label="Remove gear"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-stone-900 underline ml-1"
              >
                <RotateCcw size={11} />
                Reset all
              </button>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* RESULTS SECTION                                          */}
        {/* ======================================================== */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            <p className="font-semibold">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Photographers Section (Shown on "all" or "photographers") */}
            {(activeTab === "all" || activeTab === "photographers") && filteredCreators.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <Users size={16} className="text-blue-600" />
                    <span>Matching Photographers ({filteredCreators.length})</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCreators.map((creator) => (
                    <div
                      key={creator.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm transition-all hover:shadow-card"
                    >
                      <Link
                        href={`/account/${creator.id}`}
                        className="flex items-center gap-3 min-w-0 text-left group"
                      >
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-stone-900 text-xs font-bold text-white shadow-xs transition-transform group-hover:scale-105">
                          {creator.avatar_url ? (
                            <Image
                              src={creator.avatar_url}
                              alt={creator.username || "Creator"}
                              width={44}
                              height={44}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              {(creator.username || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-stone-900 group-hover:text-blue-600 transition-colors">
                            @{creator.username}
                          </p>
                          <p className="truncate text-[11px] text-stone-500">
                            {creator.full_name || "PicFlow Creator"}
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold text-stone-400">
                            {creator.photoCount} {creator.photoCount === 1 ? "shot" : "shots"} published
                          </p>
                        </div>
                      </Link>

                      {user?.id_user !== creator.id && (
                        <div className="shrink-0">
                          <FollowButton targetUserId={creator.id} size="sm" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Photos Section (Shown on "all" or "photos") */}
            {(activeTab === "all" || activeTab === "photos") && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <Camera size={16} className="text-blue-600" />
                    <span>Photographs ({filteredPhotos.length})</span>
                  </div>
                </div>

                {filteredPhotos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 py-16 text-center">
                    <ImageOff size={32} className="text-stone-400" />
                    <p className="mt-3 text-sm font-semibold text-stone-800">
                      No photographs match your search criteria.
                    </p>
                    <p className="mt-1 text-xs text-stone-500 max-w-sm">
                      Try adjusting your keywords, selecting a different camera gear brand, or clearing filters.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <MasonryGrid>
                    {filteredPhotos.map((photo) => (
                      <PhotoCard
                        key={photo.id_photo}
                        photo={photo}
                        layoutId="search-photo"
                        onOpen={setSelectedPhoto}
                      />
                    ))}
                  </MasonryGrid>
                )}
              </section>
            )}

            {/* Empty Overall Search State */}
            {activeTab === "photographers" && filteredCreators.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 py-16 text-center">
                <Users size={32} className="text-stone-400" />
                <p className="mt-3 text-sm font-semibold text-stone-800">
                  No photographers found matching &ldquo;{query}&rdquo;
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Check the spelling or try searching for a different handle.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Lightbox Modal saat foto diklik */}
        <AnimatePresence>
          {selectedPhoto && (
            <Lightbox
              photo={
                photos.find((p) => p.id_photo === selectedPhoto.id_photo) ||
                selectedPhoto
              }
              layoutId="search-photo"
              onClose={() => setSelectedPhoto(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-12">
          <Skeleton className="mx-auto h-12 w-64 rounded-full mb-6" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
