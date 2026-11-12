// Cek cepat: parse & default value filter feed.
// Jalankan: node --test frontend/src/lib/feedFilters.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import {
  readFeedFilters,
  feedFilterCount,
  computeAvailableGears,
  computeGearStats,
} from "./feedFilters.js";

test("default filter saat query kosong", () => {
  assert.deepEqual(readFeedFilters(new URLSearchParams("")), {
    feedTab: "explore",
    selectedCategory: "all",
    selectedGear: "all",
    sortBy: "latest",
  });
});

test("nilai tidak dikenal jatuh ke default", () => {
  const f = readFeedFilters(new URLSearchParams("feed=hack&sort=nope"));
  assert.equal(f.feedTab, "explore");
  assert.equal(f.sortBy, "latest");
});

test("query valid terbaca", () => {
  const f = readFeedFilters(
    new URLSearchParams("feed=following&genre=3&gear=Sony&sort=popular")
  );
  assert.equal(f.feedTab, "following");
  assert.equal(f.selectedCategory, "3");
  assert.equal(f.selectedGear, "Sony");
  assert.equal(f.sortBy, "popular");
});

test("jumlah filter aktif", () => {
  assert.equal(
    feedFilterCount({ feedTab: "explore", selectedCategory: "all", selectedGear: "all" }),
    0
  );
  assert.equal(
    feedFilterCount({ feedTab: "following", selectedCategory: "3", selectedGear: "Sony" }),
    3
  );
});

test("gear stats menghitung brand dan other", () => {
  const photos = [
    { camera_make: "sony", camera_model: "A7 IV" },
    { camera_make: "Canon", camera_model: "R5" },
    { camera_make: null, camera_model: null },
  ];
  const gears = computeAvailableGears(photos);
  const stats = computeGearStats(photos, gears);
  assert.equal(stats.all, 3);
  assert.equal(stats.other, 1);
  assert.equal(stats.Sony, 1);
  assert.equal(stats.Canon, 1);
});
