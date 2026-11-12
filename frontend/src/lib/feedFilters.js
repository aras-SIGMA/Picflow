// src/lib/feedFilters.js
// State filter feed home dipindah ke query string /home supaya halaman filter
// mobile bisa berupa route terpisah: /home?feed=following&genre=3&gear=Sony

export const POPULAR_BRANDS = [
  "Sony",
  "Canon",
  "Fujifilm",
  "Nikon",
  "Leica",
  "Hasselblad",
  "Panasonic",
];

export function readFeedFilters(params) {
  return {
    feedTab: params.get("feed") === "following" ? "following" : "explore",
    selectedCategory: params.get("genre") || "all",
    selectedGear: params.get("gear") || "all",
    sortBy: ["popular", "discussed"].includes(params.get("sort"))
      ? params.get("sort")
      : "latest",
  };
}

export function feedFilterCount({ selectedCategory, selectedGear, feedTab }) {
  return (
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedGear !== "all" ? 1 : 0) +
    (feedTab === "following" ? 1 : 0)
  );
}

// Serialisasi filter ke query string. Nilai default tidak ditulis.
export function buildFeedQuery({
  feedTab,
  selectedCategory,
  selectedGear,
  sortBy,
}) {
  const params = new URLSearchParams();
  const assign = (key, value, fallback) => {
    if (value && value !== fallback) params.set(key, value);
  };
  assign("feed", feedTab, "explore");
  assign("genre", selectedCategory, "all");
  assign("gear", selectedGear, "all");
  assign("sort", sortBy, "latest");
  return params.toString();
}

export function feedHref(filters) {
  const qs = buildFeedQuery(filters);
  return qs ? `/home?${qs}` : "/home";
}

// Halaman filter butuh query yang sama supaya pilihan aktif ikut terbawa.
export function filtersHref(filters) {
  const qs = buildFeedQuery(filters);
  return qs ? `/home/filters?${qs}` : "/home/filters";
}

// Daftar brand dari data foto + brand populer sebagai fallback.
export function computeAvailableGears(photos) {
  const brandSet = new Set(POPULAR_BRANDS);
  photos.forEach((p) => {
    const trimmed = (p.camera_make || "").trim();
    if (trimmed) {
      brandSet.add(trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
    }
  });
  return Array.from(brandSet);
}

// Jumlah foto per brand, plus `all` dan `other` (tanpa info kamera).
export function computeGearStats(photos, availableGears) {
  const map = { all: photos.length, other: 0 };
  photos.forEach((p) => {
    const make = (p.camera_make || "").toLowerCase();
    const model = (p.camera_model || "").toLowerCase();
    let matched = false;

    availableGears.forEach((brand) => {
      const b = brand.toLowerCase();
      if (make.includes(b) || model.includes(b)) {
        map[brand] = (map[brand] || 0) + 1;
        matched = true;
      }
    });

    if (!matched && !p.camera_make && !p.camera_model) {
      map.other = (map.other || 0) + 1;
    }
  });
  return map;
}
