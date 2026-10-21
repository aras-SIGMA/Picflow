"use client";

// src/app/(app)/dashboard/page.jsx
// Halaman Creator Analytics & Performance Dashboard:
// - Metrik utama: Total Posts, Likes Received, Audience (Followers/Following), Total Reviews
// - Grafik timeline interaktif: Insight aktivitas dalam rentang 7d, 30d, 90d
// - Evaluasi 4 Pilar Kritik Fotografi (Komposisi, Pencahayaan, Warna, Konsep)
// - Galeri 4 karya foto dengan performa interaksi tertinggi (Top Performing Shots)

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ExternalLink,
  Heart,
  ImageOff,
  Layers,
  MessageSquare,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { fileUrl, getToken, getUserDashboard } from "@/lib/api";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";
import { useAuth } from "@/context/AuthContext";
import AccountInsightChart from "@/components/AccountInsightChart";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/Motion";

const PILLAR_LABELS = [
  { key: "composition", label: "Composition & Framing", desc: "Rule of thirds, balance, lead lines" },
  { key: "lighting", label: "Lighting & Dynamic Range", desc: "Highlights, shadows, exposure latitude" },
  { key: "color", label: "Color Harmony & Tone", desc: "Palette balance, saturation, B&W gradation" },
  { key: "concept", label: "Concept & Narrative", desc: "Visual storytelling, idea execution" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const res = await getUserDashboard({ period });
        setData(res.data);
      } catch (err) {
        if (err.status === 401) {
          router.replace("/login");
        } else {
          setError(err.message || "Failed to load dashboard data");
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [authLoading, router, period]);

  const summary = data?.summary || {
    total_posts: 0,
    total_likes: 0,
    total_comments: 0,
    followers_count: 0,
    following_count: 0,
    total_critiques: 0,
    overall_critique_score: 0,
  };

  const pillars = data?.critique_pillars || {
    composition: 0,
    lighting: 0,
    color: 0,
    concept: 0,
    total_reviews: 0,
  };

  const topPhotos = data?.top_photos || [];
  const recentCritiques = data?.recent_critiques || [];
  const profile = data?.profile;

  if (loading && !data) {
    return (
      <PageTransition>
        <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-10 space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-20 pt-8 space-y-8">
        {/* ======================================================== */}
        {/* TOP BAR & CREATOR HEADER                                 */}
        {/* ======================================================== */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/80 pb-6">
          <div>
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors mb-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Creator Vault</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
              Creator Performance &amp; Analytics
            </h1>
            <p className="mt-1 text-xs text-stone-500 max-w-lg">
              Track your audience reach, community appreciation, critique evaluation, and top-tier shots.
            </p>
          </div>

          {/* Quick Creator Badge */}
          {profile && (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200/90 bg-[#FAF8F5] p-2.5 pr-4 shadow-2xs self-start sm:self-auto">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-stone-900 text-xs font-bold text-white shadow-xs">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.username || "Avatar"}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (profile.username || "U").charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-stone-900">
                  {profile.full_name || `@${profile.username}`}
                </p>
                <p className="text-[11px] font-semibold text-blue-600">
                  @{profile.username}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Error Banner */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4 PRIMARY METRIC CARDS                                   */}
        {/* ======================================================== */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Total Posts */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-card transition-all hover:shadow-card-hover">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Total Published
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Camera size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-stone-900">
                {summary.total_posts}
              </span>
              <span className="text-xs text-stone-500 font-medium">photos</span>
            </div>
            <p className="mt-1 text-[11px] text-stone-400">
              Active shots stored in your vault
            </p>
          </div>

          {/* 2. Total Likes Received */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-card transition-all hover:shadow-card-hover">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Likes Received
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Heart size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-stone-900">
                {summary.total_likes}
              </span>
              <span className="text-xs text-stone-500 font-medium">appreciations</span>
            </div>
            <p className="mt-1 text-[11px] text-stone-400">
              Across all published photographs
            </p>
          </div>

          {/* 3. Audience (Followers & Following) */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-card transition-all hover:shadow-card-hover">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Audience Network
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-stone-900">
                {summary.followers_count}
              </span>
              <span className="text-xs text-stone-500 font-medium">followers</span>
            </div>
            <p className="mt-1 text-[11px] text-stone-400">
              Following {summary.following_count} other photographers
            </p>
          </div>

          {/* 4. Total Community Feedback */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-card transition-all hover:shadow-card-hover">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Community Feedback
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Sparkles size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-stone-900">
                {summary.total_critiques}
              </span>
              <span className="text-xs text-stone-500 font-medium">critiques</span>
            </div>
            <p className="mt-1 text-[11px] text-stone-400">
              Plus {summary.total_comments} discussion comments
            </p>
          </div>
        </section>

        {/* ======================================================== */}
        {/* INTERACTIVE TIMELINE CHART                               */}
        {/* ======================================================== */}
        <section>
          <AccountInsightChart
            timeline={data?.timeline || []}
            period={period}
            onPeriodChange={(newPeriod) => setPeriod(newPeriod)}
          />
        </section>

        {/* ======================================================== */}
        {/* TECHNICAL 4-PILLAR CRITIQUE EVALUATION & TOP SHOTS       */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Section: 4-Pillar Quality Index HUD */}
          <section className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Star size={13} className="fill-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      4-Pillar Quality Index
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Structured peer assessment on professional photography standards
                    </p>
                  </div>
                </div>

                {/* Overall Score Badge */}
                <div className="flex items-baseline gap-1 rounded-xl bg-amber-50 px-3 py-1 text-amber-800 border border-amber-200/80">
                  <span className="font-mono text-base font-extrabold">
                    {summary.overall_critique_score > 0
                      ? summary.overall_critique_score.toFixed(1)
                      : "—"}
                  </span>
                  <span className="text-[10px] text-amber-600 font-semibold">/ 5.0</span>
                </div>
              </div>

              {/* Pillars Progress Bars */}
              <div className="mt-5 space-y-4">
                {PILLAR_LABELS.map((p) => {
                  const score = pillars[p.key] || 0;
                  const pct = Math.min(100, Math.round((score / 5.0) * 100));

                  return (
                    <div key={p.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-800">{p.label}</span>
                        <span className="font-mono font-bold text-stone-900">
                          {score > 0 ? `${score.toFixed(1)} / 5.0` : "No ratings"}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              p.key === "composition"
                                ? "#2563EB"
                                : p.key === "lighting"
                                  ? "#D97706"
                                  : p.key === "color"
                                    ? "#059669"
                                    : "#7C3AED",
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-stone-400">{p.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Critique Reviews Snippet */}
            {recentCritiques.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Recent Constructive Feedback
                </span>
                <div className="mt-2.5 space-y-2">
                  {recentCritiques.map((c) => (
                    <div
                      key={c.id_critique}
                      className="rounded-xl border border-gray-100 bg-[#FAF8F5] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-stone-800">
                          @{c.reviewer?.username || "Photographer"}
                        </span>
                        <span className="font-mono font-bold text-blue-600">
                          Score: {c.overall_score} / 5.0
                        </span>
                      </div>
                      {c.strengths && (
                        <p className="mt-1 line-clamp-1 text-stone-600">
                          <strong className="text-emerald-700 font-semibold">Strength:</strong> {c.strengths}
                        </p>
                      )}
                      {c.improvements && (
                        <p className="mt-0.5 line-clamp-1 text-stone-500">
                          <strong className="text-amber-700 font-semibold">Area:</strong> {c.improvements}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Section: Top Performing Photographs */}
          <section className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <Heart size={13} className="fill-red-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      Top Performing Works
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Your photographs with the highest engagement and community acclaim
                    </p>
                  </div>
                </div>
              </div>

              {topPhotos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-stone-400">
                  <ImageOff size={28} className="mb-2 text-stone-300" />
                  <p className="text-xs font-semibold text-stone-600">
                    No photographs published yet
                  </p>
                  <Link
                    href="/addphoto"
                    className="mt-3 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                  >
                    Upload First Work
                  </Link>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
                  {topPhotos.map((photo, idx) => {
                    const src = fileUrl(photo.image_url);
                    return (
                      <Link
                        key={photo.id_photo}
                        href={`/photos/${photo.id_photo}`}
                        className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-[#FAF8F5] transition-all hover:border-blue-400 hover:shadow-sm"
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                          {src && (
                            <Image
                              src={src}
                              loader={isCloudinaryUrl(src) ? cloudinaryLoader : undefined}
                              alt={photo.title || "Photo"}
                              fill
                              sizes="(max-width: 640px) 50vw, 25vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          )}
                          <div className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white backdrop-blur-xs">
                            #{idx + 1}
                          </div>
                        </div>

                        <div className="p-2.5">
                          <p className="truncate text-xs font-bold text-stone-900 group-hover:text-blue-600">
                            {photo.title || "Untitled"}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                            <span className="flex items-center gap-1 text-red-600 font-semibold">
                              <Heart size={10} className="fill-red-500" />
                              {photo.likes_count}
                            </span>
                            <span className="flex items-center gap-1 text-stone-600">
                              <MessageSquare size={10} />
                              {photo.comments_count}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Vault Shortcut */}
            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
              <span className="text-stone-400 text-[11px]">
                Showing top {topPhotos.length} of {summary.total_posts} portfolio shots
              </span>
              <Link
                href="/account"
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
              >
                <span>View Full Vault</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
