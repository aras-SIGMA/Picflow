"use client";

// src/app/(app)/home/filters/page.jsx
// Halaman filter feed versi mobile-first. Dipisah dari /home supaya feed
// bersih; pilihan langsung ditulis ke query string /home.
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Aperture,
  ArrowLeft,
  Camera,
  Check,
  Compass,
  Layers,
  Users,
} from "lucide-react";
import { getToken, listCategories, listPhotos } from "@/lib/api";
import {
  readFeedFilters,
  feedHref,
  filtersHref,
  computeAvailableGears,
  computeGearStats,
} from "@/lib/feedFilters";
import Skeleton from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/Motion";

const SORT_OPTIONS = [
  { key: "latest", label: "Latest", hint: "Newest uploads first" },
  { key: "popular", label: "Popular", hint: "Most liked shots" },
  { key: "discussed", label: "Discussed", hint: "Most critiqued shots" },
];

export default function FeedFiltersPage() {
  return (
    <Suspense fallback={<div className="p-4" />}>
      <FeedFilters />
    </Suspense>
  );
}

function FeedFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const feedKey = searchParams.toString();

  const current = useMemo(
    () => readFeedFilters(new URLSearchParams(feedKey)),
    [feedKey]
  );

  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [pRes, cRes] = await Promise.all([
          listPhotos({ feed: current.feedTab }),
          listCategories(),
        ]);
        if (!active) return;
        setPhotos(pRes.data || []);
        setCategories(cRes.data || []);
      } catch (err) {
        if (active) setError(err.message || "Failed to load filter options");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [current.feedTab, router]);

  // Tetap di halaman ini supaya bisa pilih beberapa filter sekaligus.
  function apply(next) {
    router.replace(filtersHref({ ...current, ...next }), { scroll: false });
  }

  const backHref = feedHref(current);

  const availableGears = useMemo(() => computeAvailableGears(photos), [photos]);
  const gearStats = useMemo(
    () => computeGearStats(photos, availableGears),
    [photos, availableGears]
  );
  const categoryStats = useMemo(() => {
    const map = {};
    photos.forEach((p) => {
      const id = String(p.id_category);
      map[id] = (map[id] || 0) + 1;
    });
    return map;
  }, [photos]);

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-xl px-3 py-4 sm:px-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            aria-label="Back to feed"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-stone-700 shadow-2xs transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold tracking-tight text-stone-900">
              Feed Filters
            </h1>
            <p className="text-[11px] text-stone-500">
              Pilih genre, gear, dan urutan tampilan feed.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-52 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {/* Feed source */}
            <Section title="Feed">
              <div className="grid grid-cols-2 gap-2">
                <OptionButton
                  active={current.feedTab === "explore"}
                  onClick={() => apply({ feedTab: "explore" })}
                  icon={Compass}
                  label="Explore"
                  hint="Semua komunitas"
                />
                <OptionButton
                  active={current.feedTab === "following"}
                  onClick={() => apply({ feedTab: "following" })}
                  icon={Users}
                  label="Following"
                  hint="Kreator yang kamu ikuti"
                />
              </div>
            </Section>

            {/* Sort */}
            <Section title="Urutkan">
              <div className="grid grid-cols-3 gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <OptionButton
                    key={opt.key}
                    active={current.sortBy === opt.key}
                    onClick={() => apply({ sortBy: opt.key })}
                    label={opt.label}
                    hint={opt.hint}
                    compact
                  />
                ))}
              </div>
            </Section>

            {/* Genre */}
            <Section title="Genre" count={categories.length}>
              <div className="space-y-1">
                <RowButton
                  active={current.selectedCategory === "all"}
                  onClick={() => apply({ selectedCategory: "all" })}
                  icon={Layers}
                  label="Semua Genre"
                  count={photos.length}
                />
                {categories.map((c) => (
                  <RowButton
                    key={c.id_category}
                    active={current.selectedCategory === String(c.id_category)}
                    onClick={() =>
                      apply({ selectedCategory: String(c.id_category) })
                    }
                    label={c.name}
                    count={categoryStats[String(c.id_category)] || 0}
                  />
                ))}
              </div>
            </Section>

            {/* Gear */}
            <Section title="Kamera & Gear" count={availableGears.length}>
              <div className="space-y-1">
                <RowButton
                  active={current.selectedGear === "all"}
                  onClick={() => apply({ selectedGear: "all" })}
                  icon={Aperture}
                  label="Semua Gear"
                  count={photos.length}
                />
                {availableGears.map((brand) => (
                  <RowButton
                    key={brand}
                    active={
                      current.selectedGear.toLowerCase() === brand.toLowerCase()
                    }
                    onClick={() =>
                      apply({
                        selectedGear:
                          current.selectedGear.toLowerCase() ===
                          brand.toLowerCase()
                            ? "all"
                            : brand,
                      })
                    }
                    label={brand}
                    count={gearStats[brand] || 0}
                  />
                ))}
                {gearStats.other > 0 && (
                  <RowButton
                    active={current.selectedGear === "other"}
                    onClick={() =>
                      apply({
                        selectedGear:
                          current.selectedGear === "other" ? "all" : "other",
                      })
                    }
                    icon={Camera}
                    label="Tanpa info kamera"
                    count={gearStats.other}
                  />
                )}
              </div>
            </Section>

            {/* Actions */}
            <div className="sticky bottom-3 flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  apply({ selectedCategory: "all", selectedGear: "all" })
                }
                className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-card transition-colors hover:bg-gray-50"
              >
                Reset filter
              </button>
              <Link
                href={backHref}
                className="flex-1 rounded-full bg-blue-600 px-4 py-2.5 text-center text-xs font-semibold text-white shadow-card transition-colors hover:bg-blue-700"
              >
                Lihat feed
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function Section({ title, count, children }) {
  return (
    <section className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-card">
      <div className="flex items-center justify-between px-1.5 pb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
          {title}
        </span>
        {typeof count === "number" && (
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function RowButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-colors ${
        active
          ? "bg-blue-600 font-semibold text-white shadow-xs"
          : "text-stone-700 hover:bg-gray-50"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        {Icon ? (
          <Icon
            size={14}
            className={active ? "text-blue-100" : "text-stone-400"}
          />
        ) : (
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              active ? "bg-white" : "bg-stone-300"
            }`}
          />
        )}
        <span className="truncate">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <span
          className={`text-[10px] tabular-nums ${
            active ? "text-blue-100" : "text-stone-400"
          }`}
        >
          {count}
        </span>
        {active && <Check size={13} />}
      </span>
    </button>
  );
}

function OptionButton({ active, onClick, icon: Icon, label, hint, compact }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2 text-left transition-all ${
        active
          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs"
          : "border-gray-200 bg-white text-stone-700 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <span className="flex items-center gap-1.5 text-xs font-semibold">
        {Icon && <Icon size={14} className={active ? "text-blue-600" : "text-stone-400"} />}
        {label}
      </span>
      {!compact && hint && (
        <span className="text-[10px] leading-tight text-stone-500">{hint}</span>
      )}
    </button>
  );
}
