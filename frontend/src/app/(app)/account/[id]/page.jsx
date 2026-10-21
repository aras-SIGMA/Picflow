"use client";

// src/app/(app)/account/[id]/page.jsx
// Halaman Profil Publik Fotografer / Portofolio Showcase:
// - Header profil kreator: Avatar beraksen RGB ring, Full Name, @username, Bio
// - Statistik: Total Photos, Followers, Following, Total Likes Received
// - Interaksi sosial: Tombol Follow / Unfollow interaktif (atau shortcut Edit Profile jika profil sendiri)
// - Galeri Portofolio: MasonryGrid dengan PhotoCard + Lightbox shared layout

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Copy,
  Heart,
  ImageOff,
  Pencil,
  Share2,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { getPublicProfile } from "@/lib/api";
import { buildCloudinaryUrl } from "@/lib/cloudinary";
import { useAuth } from "@/context/AuthContext";
import PhotoCard from "@/components/PhotoCard";
import MasonryGrid from "@/components/MasonryGrid";
import Lightbox from "@/components/Lightbox";
import FollowButton from "@/components/FollowButton";
import Button from "@/components/ui/Button";
import PillBadge from "@/components/ui/PillBadge";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { PageTransition, Reveal } from "@/components/ui/Motion";

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [prevId, setPrevId] = useState(id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [copied, setCopied] = useState(false);

  if (id !== prevId) {
    setPrevId(id);
    setLoading(true);
    setError("");
    setData(null);
  }

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    getPublicProfile(id)
      .then((res) => {
        if (!isMounted) return;
        setData(res.data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load photographer profile");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const profile = data?.profile;
  const stats = data?.stats || {
    photos_count: 0,
    followers_count: 0,
    following_count: 0,
    total_likes: 0,
  };
  const photos = data?.photos || [];
  const isSelf = data?.is_self || Boolean(user?.id_user && profile?.id_user === user.id_user);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Profile link copied to clipboard.");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="mb-4 h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !profile) {
    return (
      <PageTransition>
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-3 border border-red-200">
            <Camera size={22} />
          </div>
          <h1 className="text-lg font-bold text-stone-900">Photographer Not Found</h1>
          <p className="mt-1 text-xs text-stone-500 max-w-sm">
            {error || "The creator profile you are looking for does not exist or has been removed."}
          </p>
          <Link
            href="/search"
            className="mt-5 rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-stone-800"
          >
            Explore Other Photographers
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* HERO CREATOR HEADER                                      */}
        {/* ======================================================== */}
        <Reveal>
          <section className="relative overflow-hidden rounded-3xl border border-gray-200/90 bg-[#FAF8F5] p-6 sm:p-8 shadow-card">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              {/* Creator Info Stage */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0">
                {/* Avatar with RGB Prism Border Ring */}
                <div className="relative shrink-0">
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full p-[2.5px] bg-gradient-to-tr from-[#D62B2B] via-[#16A34A] to-[#2563EB] shadow-card">
                    <div className="relative h-full w-full rounded-full bg-white p-[2px] overflow-hidden">
                      {profile.profile_picture_url ? (
                        <Image
                          src={buildCloudinaryUrl(profile.profile_picture_url, {
                            width: 256,
                            crop: "fill",
                          })}
                          alt={profile.username || "Photographer"}
                          fill
                          sizes="96px"
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#F5EFE6] text-2xl sm:text-3xl font-extrabold text-stone-800">
                          {profile.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Identity & Bio */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <PillBadge>Photographer</PillBadge>
                    {profile.role === "admin" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                        <ShieldCheck size={11} />
                        Admin Curator
                      </span>
                    )}
                  </div>

                  <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
                    {profile.full_name || profile.username}
                  </h1>
                  <p className="mt-0.5 text-xs font-semibold text-blue-600">
                    @{profile.username}
                  </p>

                  {profile.bio && (
                    <p className="mt-3 text-xs leading-relaxed text-stone-600 max-w-xl">
                      {profile.bio}
                    </p>
                  )}

                  {profile.created_at && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-400">
                      <CalendarDays size={12} />
                      <span>
                        Member since{" "}
                        {new Date(profile.created_at).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons: Follow, Share, or Edit (if self) */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                {isSelf ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs transition-all hover:bg-blue-100"
                    >
                      <TrendingUp size={13} />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/account"
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs transition-all hover:bg-stone-50"
                    >
                      <Pencil size={13} />
                      <span>Edit Profile</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <FollowButton
                      targetUserId={profile.id_user}
                      size="md"
                    />
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs transition-all hover:bg-gray-50"
                      title="Share Profile"
                      aria-label="Share Profile"
                    >
                      {copied ? <UserCheck size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                      <span>{copied ? "Copied" : "Share"}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-gray-200/80 pt-6">
              <div className="rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Published Shots
                </span>
                <p className="mt-1 font-mono text-xl font-bold text-stone-900">
                  {stats.photos_count}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Followers
                </span>
                <p className="mt-1 font-mono text-xl font-bold text-stone-900">
                  {stats.followers_count}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Following
                </span>
                <p className="mt-1 font-mono text-xl font-bold text-stone-900">
                  {stats.following_count}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Total Likes
                </span>
                <p className="mt-1 font-mono text-xl font-bold text-red-600 flex items-center gap-1.5">
                  <Heart size={14} className="fill-red-500" />
                  {stats.total_likes}
                </p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ======================================================== */}
        {/* GALLERY PORTFOLIO SECTION                                */}
        {/* ======================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-blue-600" />
              <h2 className="text-base font-bold text-stone-900">
                Portfolio Showcase ({photos.length})
              </h2>
            </div>
            <span className="text-xs text-stone-400">
              Curated original photographs
            </span>
          </div>

          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 py-16 text-center">
              <ImageOff size={32} className="text-stone-300 mb-2" />
              <p className="text-sm font-semibold text-stone-700">
                No photographs published yet
              </p>
              <p className="mt-1 text-xs text-stone-400 max-w-xs">
                This creator hasn&apos;t shared any work to PicFlow yet. Check back soon!
              </p>
            </div>
          ) : (
            <MasonryGrid>
              {photos.map((photo) => (
                <PhotoCard
                  key={photo.id_photo}
                  photo={photo}
                  layoutId="creator-profile-photo"
                  onOpen={setSelectedPhoto}
                />
              ))}
            </MasonryGrid>
          )}
        </section>

        {/* ======================================================== */}
        {/* LIGHTBOX MODAL                                           */}
        {/* ======================================================== */}
        <AnimatePresence>
          {selectedPhoto && (
            <Lightbox
              photo={
                photos.find((p) => p.id_photo === selectedPhoto.id_photo) ||
                selectedPhoto
              }
              layoutId="creator-profile-photo"
              onClose={() => setSelectedPhoto(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
