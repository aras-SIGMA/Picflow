"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  Aperture,
  ArrowRight,
  Camera,
  Compass,
  Copy,
  ExternalLink,
  ImagePlus,
  Layers,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Search,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { fileUrl, getToken, listPhotos, listCategories, deletePhoto } from "@/lib/api";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";
import { subscribeRealtime } from "@/lib/realtime";
import { useAuth } from "@/context/AuthContext";
import Lightbox from "@/components/Lightbox";
import LikeButton from "@/components/LikeButton";
import FollowButton from "@/components/FollowButton";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/Motion";

function formatRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [feedTab, setFeedTab] = useState("explore");
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activeMenuPhotoId, setActiveMenuPhotoId] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!getToken()) {
      router.replace("/");
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
        if (err.status === 401) router.replace("/");
        else setError(err.message);
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [loading, router, feedTab]);

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
      } else if (event === "comment:added" || event === "comment:deleted") {
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

  useEffect(() => {
    function handleClickOutside() {
      setActiveMenuPhotoId(null);
    }
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  async function handleDeleteConfirmed() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deletePhoto(pendingDelete.id_photo);
      setPhotos((prev) => prev.filter((p) => p.id_photo !== pendingDelete.id_photo));
      toast.success(`"${pendingDelete.title}" deleted.`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function handleShare(photo) {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/photos/${photo.id_photo}`
      : "";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Photo link copied to clipboard.");
    } else {
      toast.info(`Link: ${url}`);
    }
  }

  const categoryStats = useMemo(() => {
    const map = {};
    photos.forEach((p) => {
      const id = String(p.id_category);
      map[id] = (map[id] || 0) + 1;
    });
    return map;
  }, [photos]);

  const communityCreators = useMemo(() => {
    const seen = new Set();
    const list = [];
    photos.forEach((p) => {
      if (p.creator && !seen.has(p.creator.id_user)) {
        seen.add(p.creator.id_user);
        list.push({
          id_user: p.creator.id_user,
          username: p.creator.username,
          avatar_url: p.creator.avatar_url,
          sample_title: p.title,
          is_self: Boolean(user?.id_user && String(user.id_user) === String(p.creator.id_user)),
        });
      }
    });
    return list;
  }, [photos, user]);

  const critiqueQueue = useMemo(() => {
    return photos
      .filter((p) => p.creator?.id_user !== user?.id_user)
      .slice(0, 3);
  }, [photos, user]);

  const shownPhotos = useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = photos.filter((p) => {
      const matchCat =
        selectedCategory === "all" || String(p.id_category) === selectedCategory;
      const matchSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.creator?.username?.toLowerCase().includes(q) ||
        p.camera_make?.toLowerCase().includes(q) ||
        p.camera_model?.toLowerCase().includes(q) ||
        p.lens?.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });

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
  }, [photos, selectedCategory, search, sortBy]);

  if (loading || fetching) {
    return (
      <PageTransition>
        <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
          <div className="hidden w-60 shrink-0 lg:block space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="flex-1 space-y-6">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-96 w-full rounded-2xl" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          </div>
          <div className="hidden w-72 shrink-0 xl:block space-y-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="flex items-start gap-6">
          {/* ======================================================== */}
          {/* LEFT COLUMN: Profil, Navigasi Feed & Kategori Fotografi   */}
          {/* ======================================================== */}
          <aside className="sticky top-20 hidden w-60 shrink-0 self-start lg:block">
            <div className="space-y-4">
              {/* Profil Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-stone-900 text-sm font-bold text-white shadow-xs">
                    {user?.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.username || "Avatar"}
                        width={44}
                        height={44}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (user?.username || "P").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-stone-900">
                      {user?.username || "Photographer"}
                    </p>
                    <p className="truncate text-xs text-stone-500">
                      {user?.email || "PicFlow Member"}
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-stone-600">
                  <span>My Vault</span>
                  <Link
                    href="/account"
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View Account
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>

              {/* Feed Mode Navigation */}
              <nav aria-label="Main Feed Navigation" className="rounded-2xl border border-gray-200 bg-white p-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.03)]">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFeedTab("explore");
                      setSelectedCategory("all");
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      feedTab === "explore" && selectedCategory === "all"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-stone-700 hover:bg-gray-50 hover:text-stone-900"
                    }`}
                  >
                    <Compass size={16} />
                    <span>Explore Community</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedTab("following")}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      feedTab === "following"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-stone-700 hover:bg-gray-50 hover:text-stone-900"
                    }`}
                  >
                    <Users size={16} />
                    <span>Following Feed</span>
                  </button>

                  <Link
                    href="/addphoto"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-gray-50 hover:text-stone-900 transition-colors"
                  >
                    <ImagePlus size={16} className="text-blue-600" />
                    <span>Upload New Shot</span>
                  </Link>

                  <Link
                    href="/account"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-gray-50 hover:text-stone-900 transition-colors"
                  >
                    <Camera size={16} />
                    <span>My Portfolios</span>
                  </Link>
                </div>
              </nav>

              {/* Photography Categories (Reference: "Groups") */}
              <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between px-2 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Genres & Categories
                  </span>
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">
                    {categories.length}
                  </span>
                </div>

                <div className="mt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all ${
                      selectedCategory === "all"
                        ? "bg-stone-900 text-white font-semibold shadow-xs"
                        : "text-stone-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Layers size={13} className={selectedCategory === "all" ? "text-blue-400" : "text-stone-400"} />
                      All Genres
                    </span>
                    <span className="text-[11px] opacity-75">{photos.length}</span>
                  </button>

                  {categories.map((c) => {
                    const count = categoryStats[String(c.id_category)] || 0;
                    const isSelected = selectedCategory === String(c.id_category);
                    return (
                      <button
                        key={c.id_category}
                        type="button"
                        onClick={() => setSelectedCategory(String(c.id_category))}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white font-semibold shadow-xs"
                            : "text-stone-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        <span className={`text-[10px] tabular-nums ${isSelected ? "text-blue-100" : "text-stone-400"}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* ======================================================== */}
          {/* CENTER COLUMN: Top Quick Action, Feed Controls & Cards    */}
          {/* ======================================================== */}
          <main className="min-w-0 flex-1 max-w-2xl mx-auto w-full space-y-5">
            {/* "Share a Shot" Card (Reference: Prompt Bar) */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-stone-900 text-xs font-bold text-white shadow-xs">
                  {user?.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.username || "Me"}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (user?.username || "U").charAt(0).toUpperCase()
                  )}
                </div>

                <Link
                  href="/addphoto"
                  className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-xs font-medium text-gray-500 transition-colors hover:border-gray-300 hover:bg-white hover:text-gray-700"
                >
                  Share a new photograph or request community critique...
                </Link>
              </div>

              <div className="mt-3.5 pt-3 border-t border-gray-200 flex items-center justify-between gap-2">
                <Link
                  href="/addphoto"
                  className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-gray-50 transition-colors"
                >
                  <Camera size={15} className="text-blue-600" />
                  <span>Upload Photo</span>
                </Link>

                <Link
                  href="/addphoto"
                  className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-gray-50 transition-colors"
                >
                  <Aperture size={15} className="text-emerald-600" />
                  <span>EXIF Details</span>
                </Link>

                <Link
                  href="/addphoto"
                  className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-gray-50 transition-colors"
                >
                  <Star size={15} className="text-amber-600" />
                  <span>Request Critique</span>
                </Link>
              </div>
            </section>

            {/* Card Search Bar & Sort Filter */}
            <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.03)] flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              {/* Search Capsule */}
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search shots, gear, creators..."
                  className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-8 text-xs text-gray-500 placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 focus:outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <span className="text-[11px] font-semibold text-gray-400">Sort by:</span>
                <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSortBy("latest")}
                    className={`rounded-full px-2.5 py-1 text-[11px] transition-all ${
                      sortBy === "latest"
                        ? "bg-stone-900 text-white shadow-xs"
                        : "text-gray-600 hover:text-stone-900"
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
                        : "text-gray-600 hover:text-stone-900"
                    }`}
                  >
                    Popular
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("discussed")}
                    className={`rounded-full px-2.5 py-1 text-[11px] transition-all ${
                      sortBy === "discussed"
                        ? "bg-stone-900 text-white shadow-xs"
                        : "text-gray-600 hover:text-stone-900"
                    }`}
                  >
                    Discussed
                  </button>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => listPhotos({ feed: feedTab }).then((r) => setPhotos(r.data || []))}
                  className="font-bold underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {shownPhotos.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-stone-500 shadow-sm">
                  <Camera size={22} />
                </div>
                <p className="mt-3 text-sm font-bold text-stone-900">
                  {feedTab === "following"
                    ? "No works from following yet"
                    : "No photographs found"}
                </p>
                <p className="mt-1 max-w-sm text-xs text-stone-600">
                  {feedTab === "following"
                    ? "Follow more creators to curate your personal photography stream."
                    : "Try adjusting keywords or selecting a different genre."}
                </p>
                <Link
                  href="/addphoto"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                >
                  <ImagePlus size={14} />
                  Add First Photograph
                </Link>
              </div>
            )}

            {/* Feed Cards List (Reference Post Structure) */}
            <div className="space-y-6">
              {shownPhotos.map((photo) => {
                const isOwner = Boolean(user?.id_user && photo.id_user === user.id_user);
                const isMenuOpen = activeMenuPhotoId === photo.id_photo;
                const photoSrc = photo.medium_url || fileUrl(photo.image_url);

                return (
                  <article
                    key={photo.id_photo}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_24px_50px_rgba(0,0,0,0.12),0_6px_16px_rgba(0,0,0,0.04)]"
                  >
                    {/* Header Post */}
                    <div className="flex items-center justify-between p-4 pb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-stone-900 text-xs font-bold text-white shadow-xs">
                          {photo.creator?.avatar_url ? (
                            <Image
                              src={photo.creator.avatar_url}
                              alt={photo.creator.username || "Creator"}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (photo.creator?.username || "A").charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Metainfo */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-xs font-bold text-stone-900">
                              {photo.creator?.username || "Anonymous Artist"}
                            </span>
                            <span className="text-[10px] text-gray-400">·</span>
                            <span className="text-[11px] text-gray-500">
                              {formatRelativeTime(photo.created_at)}
                            </span>
                          </div>

                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                            {photo.category_name && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                                {photo.category_name}
                              </span>
                            )}
                            {photo.camera_model && (
                              <span className="truncate text-[10px] text-gray-500">
                                {photo.camera_make ? `${photo.camera_make} ` : ""}
                                {photo.camera_model}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Menu 3-Dots */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuPhotoId(isMenuOpen ? null : photo.id_photo);
                          }}
                          aria-label="Photo options"
                          className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-stone-900"
                        >
                          <MoreHorizontal size={17} />
                        </button>

                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPhoto(photo);
                                setActiveMenuPhotoId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-stone-700 hover:bg-gray-50"
                            >
                              <ExternalLink size={13} />
                              Open in Lightbox
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleShare(photo);
                                setActiveMenuPhotoId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-stone-700 hover:bg-gray-50"
                            >
                              <Copy size={13} />
                              Copy Link
                            </button>
                            {isOwner && (
                              <>
                                <div className="my-1 border-t border-gray-200" />
                                <Link
                                  href={`/addphoto?id=${photo.id_photo}`}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-stone-700 hover:bg-gray-50"
                                >
                                  <Pencil size={13} />
                                  Edit Details
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingDelete(photo);
                                    setActiveMenuPhotoId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={13} />
                                  Delete Photo
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Judul, Deskripsi & Metadata EXIF */}
                    <div className="px-4 pb-3">
                      <h2 className="text-sm font-bold text-stone-900">
                        {photo.title}
                      </h2>
                      {photo.description && (
                        <p className="mt-1 text-xs leading-relaxed text-stone-700">
                          {photo.description}
                        </p>
                      )}

                      {(photo.focal_length || photo.aperture || photo.shutter_speed || photo.iso) && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {photo.focal_length && (
                            <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                              {photo.focal_length}
                            </span>
                          )}
                          {photo.aperture && (
                            <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                              {photo.aperture}
                            </span>
                          )}
                          {photo.shutter_speed && (
                            <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                              {photo.shutter_speed}
                            </span>
                          )}
                          {photo.iso && (
                            <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                              ISO {photo.iso}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Frame Foto */}
                    <div className="px-4 pb-3">
                      <div
                        onClick={() => setSelectedPhoto(photo)}
                        className="group/img relative cursor-zoom-in overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
                      >
                        <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full">
                          {photoSrc ? (
                            <Image
                              src={photoSrc}
                              loader={isCloudinaryUrl(photoSrc) ? cloudinaryLoader : undefined}
                              alt={photo.title || "Photo"}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 680px, 640px"
                              className="object-cover transition-transform duration-700 group-hover/img:scale-[1.02]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-stone-400">
                              No image available
                            </div>
                          )}
                        </div>

                        <div className="pointer-events-none absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover/img:opacity-100">
                          <span className="text-[11px] font-semibold text-white">
                            Click to open full inspection & critiques
                          </span>
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                            HD
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Aksi Postingan (Likes, Comments, Critique, Share) */}
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <LikeButton
                          photoId={photo.id_photo}
                          initialLiked={photo.is_liked}
                          initialCount={photo.likes_count}
                          size="sm"
                          variant="white"
                        />

                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(photo)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600"
                        >
                          <MessageSquare size={14} className="text-gray-400" />
                          <span className="tabular-nums font-semibold">
                            {photo.comments_count || 0}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(photo)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                        >
                          <Star size={13} className="text-amber-600 fill-amber-500" />
                          <span>Critique</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleShare(photo)}
                        aria-label="Share photo"
                        className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-stone-900 transition-colors"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </main>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Critique Queue & Komunitas Fotografer       */}
          {/* ======================================================== */}
          <aside className="sticky top-20 hidden w-72 shrink-0 self-start xl:block">
            <div className="space-y-4">
              {/* Card 1: Critique Requests (Reference: "Friends Requests (03)") */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold text-stone-900">
                    Peer Critique Requests
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {critiqueQueue.length} Pending
                  </span>
                </div>

                <div className="mt-3 space-y-3">
                  {critiqueQueue.map((photo) => (
                    <div key={photo.id_photo} className="flex items-center gap-2.5">
                      <div
                        onClick={() => setSelectedPhoto(photo)}
                        className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
                      >
                        {photo.thumbnail_url || photo.image_url ? (
                          <Image
                            src={photo.thumbnail_url || photo.image_url}
                            loader={isCloudinaryUrl(photo.thumbnail_url || photo.image_url) ? cloudinaryLoader : undefined}
                            alt={photo.title}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-stone-900">
                          {photo.title}
                        </p>
                        <p className="truncate text-[11px] text-stone-500">
                          by @{photo.creator?.username || "creator"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(photo)}
                        className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                      >
                        Review
                      </button>
                    </div>
                  ))}

                  {critiqueQueue.length === 0 && (
                    <p className="py-2 text-center text-xs text-stone-500">
                      All shots reviewed! Submit yours.
                    </p>
                  )}
                </div>
              </div>

              {/* Card 2: Community Creators (Reference: "Friends" List) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold text-stone-900">
                    Featured Creators
                  </span>
                  <span className="text-[10px] text-stone-500 font-semibold">
                    {communityCreators.length} Active
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {communityCreators.slice(0, 6).map((creator) => (
                    <div
                      key={creator.id_user}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-stone-900 text-xs font-bold text-white shadow-xs">
                          {creator.avatar_url ? (
                            <Image
                              src={creator.avatar_url}
                              alt={creator.username}
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            creator.username.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-stone-900">
                            {creator.username}
                          </p>
                          <p className="truncate text-[10px] text-stone-500">
                            {creator.is_self ? "You" : "Photographer"}
                          </p>
                        </div>
                      </div>

                      {!creator.is_self && (
                        <FollowButton
                          creatorId={creator.id_user}
                          size="sm"
                          className="text-[11px] px-2.5 py-0.5"
                        />
                      )}
                    </div>
                  ))}

                  {communityCreators.length === 0 && (
                    <p className="py-2 text-center text-xs text-stone-500">
                      No creators active yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Card 3: PicFlow 4 Pilar Etika Kritik */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 text-xs text-stone-600 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.03)]">
                <p className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" />
                  PicFlow Critique Ethos
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-stone-600">
                  Reviews are evaluated on 4 professional pillars: Composition, Lighting, Color Harmony, and Concept.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Lightbox Modal (Semua Fitur EXIF & Kritik Tetap Lengkap) */}
      <AnimatePresence>
        {selectedPhoto && (
          <Lightbox
            photo={photos.find((p) => p.id_photo === selectedPhoto.id_photo) || selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        labelledBy="delete-title"
      >
        <h2 id="delete-title" className="display-2 text-lg!">
          Delete this photograph?
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          &ldquo;{pendingDelete?.title}&rdquo; will be permanently deleted along with its files.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDeleteConfirmed}>
            Delete
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
