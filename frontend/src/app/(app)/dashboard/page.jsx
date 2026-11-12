"use client";

// src/app/(app)/dashboard/page.jsx
// Dashboard performa kreator (tema terang, shell gaya app-dashboard):
// - Baris KPI + sparkline dari timeline
// - Grafik insight (7d / 30d / 90d) via AccountInsightChart
// - Rincian engagement periode berjalan
// - Evaluasi 4 pilar kritik + top performing shots

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Camera,
  ExternalLink,
  Heart,
  ImageOff,
  MessageSquare,
  Star,
} from "lucide-react";
import { fileUrl, getToken, getUserDashboard } from "@/lib/api";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";
import { useAuth } from "@/context/AuthContext";
import AccountInsightChart from "@/components/AccountInsightChart";
import DashboardKpi from "@/components/ui/DashboardKpi";
import Skeleton from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/Motion";

const PILLAR_LABELS = [
  { key: "composition", label: "Composition & Framing", color: "#2563EB" },
  { key: "lighting", label: "Lighting & Range", color: "#D97706" },
  { key: "color", label: "Color & Tone", color: "#16A34A" },
  { key: "concept", label: "Concept & Narrative", color: "#7C3AED" },
];

const ENGAGEMENT = [
  { key: "likes", label: "Likes", color: "#D62B2B" },
  { key: "comments", label: "Comments", color: "#D97706" },
  { key: "critiques", label: "Critiques", color: "#7C3AED" },
  { key: "followers", label: "New followers", color: "#16A34A" },
];

function deltaPercent(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export default function DashboardPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();

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
  const pillars = data?.critique_pillars || { total_reviews: 0 };
  const topPhotos = data?.top_photos || [];
  const recentCritiques = data?.recent_critiques || [];
  const profile = data?.profile;
  const timeline = useMemo(() => data?.timeline || [], [data]);

  // Semua angka turunan di bawah hanya berasal dari timeline periode aktif.
  const series = useMemo(() => {
    const sum = (key) => timeline.reduce((acc, d) => acc + (d[key] || 0), 0);
    return {
      likes: sum("likes"),
      comments: sum("comments"),
      critiques: sum("critiques"),
      followers: sum("followers"),
      engagement: sum("total_engagement"),
      posts: sum("posts"),
    };
  }, [timeline]);

  const engagementBreakdown = useMemo(
    () =>
      ENGAGEMENT.map((m) => ({ ...m, value: series[m.key] })).sort(
        (a, b) => b.value - a.value
      ),
    [series]
  );
  const breakdownTotal = engagementBreakdown.reduce((s, m) => s + m.value, 0);
  const breakdownMax = Math.max(...engagementBreakdown.map((m) => m.value), 1);

  // Parse tanggal timeline untuk menghitung split periode berjalan vs sebelumnya.
  const { currentEngagement, previousEngagement } = useMemo(() => {
    const half = Math.floor(timeline.length / 2);
    const sumOf = (rows) =>
      rows.reduce((acc, d) => acc + (d.total_engagement || 0), 0);
    return {
      currentEngagement: sumOf(timeline.slice(half)),
      previousEngagement: sumOf(timeline.slice(0, half)),
    };
  }, [timeline]);
  const engagementDelta = deltaPercent(
    currentEngagement,
    previousEngagement
  );
  const engagementUp = engagementDelta >= 0;

  if (loading && !data) {
    return (
      <PageTransition>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10">
          <Skeleton className="h-9 w-56 rounded-xl" />
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <Skeleton className="h-28 rounded-[16px]" />
            <Skeleton className="h-28 rounded-[16px]" />
            <Skeleton className="h-28 rounded-[16px]" />
            <Skeleton className="h-28 rounded-[16px]" />
          </div>
          <Skeleton className="h-80 w-full rounded-[16px]" />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-[16px]" />
            <Skeleton className="h-72 rounded-[16px]" />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 pb-20 pt-6 sm:gap-5 sm:px-4 sm:pt-8">
        {/* Header */}
        <section className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <Link
              href="/account"
              className="mb-2 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[color:var(--pf-text-muted)] transition-colors hover:text-ink"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              <span>Creator Vault</span>
            </Link>
            <h1 className="text-[24px] font-bold leading-none tracking-[-0.02em] text-ink sm:text-[28px]">
              Creator{" "}
              <span className="accent-serif font-normal">performance</span>
            </h1>
            <p className="mt-2 text-[12.5px] text-[color:var(--pf-text-muted)]">
              {period === "7d"
                ? "7 hari terakhir"
                : period === "90d"
                  ? "90 hari terakhir"
                  : "30 hari terakhir"}{" "}
              · engagement, kritik, dan karya terbaik
            </p>
          </div>

          {profile && (
            <div className="flex items-center gap-2.5 rounded-[14px] border border-[color:var(--pf-border)] bg-[var(--pf-surface)] p-2 pr-3.5 shadow-[var(--pf-shadow-soft)]">
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[11px] font-semibold text-[#FFFDF6]">
                {profile.profile_picture_url || profile.avatar_url ? (
                  <Image
                    src={profile.profile_picture_url || profile.avatar_url}
                    alt={profile.username || "Avatar"}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (profile.username || "U").charAt(0).toUpperCase()
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-semibold leading-tight text-ink">
                  {profile.full_name || `@${profile.username}`}
                </p>
                <p className="truncate text-[11px] leading-tight text-[color:var(--pf-text-muted)]">
                  @{profile.username}
                </p>
              </div>
            </div>
          )}
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-[14px] border border-[color:var(--pf-danger)]/30 bg-[var(--pf-danger-soft)] p-3.5 text-[12px] font-medium text-[color:var(--pf-danger)]"
          >
            {error}
          </div>
        )}

        {/* KPI row */}
        <section
          aria-label="Metrik utama"
          className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4"
        >
          <DashboardKpi
            id="posts"
            label="Published"
            value={summary.total_posts}
            note={`${series.posts} diunggah periode ini`}
            spark={timeline.map((d) => d.posts || 0)}
            color="#2563EB"
          />
          <DashboardKpi
            id="likes"
            label="Likes received"
            value={summary.total_likes}
            note={`${series.likes} like periode ini`}
            spark={timeline.map((d) => d.likes || 0)}
            color="#D62B2B"
          />
          <DashboardKpi
            id="audience"
            label="Followers"
            value={summary.followers_count}
            note={`Following ${summary.following_count} · +${series.followers} baru`}
            spark={timeline.map((d) => d.followers || 0)}
            color="#16A34A"
          />
          <DashboardKpi
            id="critiques"
            label="Critiques"
            value={summary.total_critiques}
            note={`${series.comments} komentar diterima`}
            spark={timeline.map((d) => d.critiques || 0)}
            color="#7C3AED"
          />
        </section>

        {/* Chart + engagement breakdown */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
          <AccountInsightChart
            timeline={timeline}
            period={period}
            onPeriodChange={setPeriod}
          />

          <section
            aria-label="Rincian engagement"
            className="flex min-w-0 flex-col rounded-[16px] border border-[color:var(--pf-border)] bg-[var(--pf-surface)] p-4 shadow-[var(--pf-shadow-surface)]"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-[13.5px] font-semibold text-ink">
                Engagement breakdown
              </h2>
              <span className="font-mono text-[11.5px] tabular-nums text-[color:var(--pf-text-muted)]">
                {breakdownTotal}
              </span>
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-[12px]">
              <span
                className={`inline-flex items-center gap-0.5 rounded-[6px] px-1.5 py-[2px] font-mono text-[11px] font-medium tabular-nums ${
                  engagementUp
                    ? "bg-[var(--pf-success-soft)] text-[color:var(--pf-success)]"
                    : "bg-[var(--pf-danger-soft)] text-[color:var(--pf-danger)]"
                }`}
              >
                {engagementUp ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {engagementUp ? "+" : "−"}
                {Math.abs(engagementDelta).toFixed(1)}%
              </span>
              <span className="text-[color:var(--pf-text-soft)]">
                paruh kedua periode
              </span>
            </p>

            <ul className="mt-4 flex flex-1 flex-col justify-between gap-3.5">
              {engagementBreakdown.map((m, i) => (
                <li key={m.key}>
                  <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                    <span className="truncate text-[color:var(--pf-text-medium)]">
                      {m.label}
                    </span>
                    <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-ink">
                      {m.value}
                      <span className="ml-1.5 inline-block w-[3.2ch] text-right text-[color:var(--pf-text-soft)]">
                        {breakdownTotal
                          ? Math.round((m.value / breakdownTotal) * 100)
                          : 0}
                        %
                      </span>
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--pf-surface-active)]"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(m.value / breakdownMax) * 100}%`,
                        background: m.color,
                        opacity: 1 - i * 0.12,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Pillars + top shots */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <section
            aria-label="Empat pilar kritik"
            className="flex flex-col rounded-[16px] border border-[color:var(--pf-border)] bg-[var(--pf-surface)] shadow-[var(--pf-shadow-surface)]"
          >
            <div className="flex items-start justify-between gap-3 px-4 pt-4">
              <div className="min-w-0">
                <h2 className="text-[13.5px] font-semibold text-ink">
                  4-Pillar Quality Index
                </h2>
                <p className="mt-1 text-[12px] text-[color:var(--pf-text-muted)]">
                  {pillars.total_reviews || 0} penilaian dari komunitas
                </p>
              </div>
              <div className="flex shrink-0 items-baseline gap-1 rounded-[10px] border border-[color:var(--pf-border-strong)] bg-[var(--pf-surface-active)] px-2.5 py-1">
                <Star
                  size={11}
                  className="self-center text-[#D97706]"
                  fill="#D97706"
                  aria-hidden="true"
                />
                <span className="font-mono text-[14px] font-semibold tabular-nums text-ink">
                  {summary.overall_critique_score > 0
                    ? summary.overall_critique_score.toFixed(1)
                    : "—"}
                </span>
                <span className="text-[10px] text-[color:var(--pf-text-soft)]">
                  /5
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3.5 px-4">
              {PILLAR_LABELS.map((p) => {
                const score = pillars[p.key] || 0;
                return (
                  <div key={p.key}>
                    <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                      <span className="truncate text-[color:var(--pf-text-medium)]">
                        {p.label}
                      </span>
                      <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-ink">
                        {score > 0 ? score.toFixed(1) : "—"}
                      </span>
                    </div>
                    <div
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--pf-surface-active)]"
                    >
                      <div
                        className="h-full rounded-full transition-[width] duration-700 ease-out"
                        style={{
                          width: `${Math.min(100, (score / 5) * 100)}%`,
                          background: p.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {recentCritiques.length > 0 && (
              <div className="mt-4 border-t border-[color:var(--pf-border)] px-4 py-3.5">
                <h3 className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[color:var(--pf-text-soft)]">
                  Feedback terbaru
                </h3>
                <ul className="mt-2 space-y-2">
                  {recentCritiques.map((c) => (
                    <li
                      key={c.id_critique}
                      className="rounded-[11px] border border-[color:var(--pf-border)] bg-[var(--pf-panel)] p-2.5"
                    >
                      <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
                        <span className="truncate font-medium text-ink">
                          @{c.reviewer?.username || "Photographer"}
                        </span>
                        <span className="shrink-0 font-mono tabular-nums text-[color:var(--pf-text-muted)]">
                          {c.overall_score} / 5.0
                        </span>
                      </div>
                      {c.strengths && (
                        <p className="mt-1 line-clamp-1 text-[11.5px] text-[color:var(--pf-text-muted)]">
                          <span className="font-medium text-[color:var(--pf-success)]">
                            Strength:
                          </span>{" "}
                          {c.strengths}
                        </p>
                      )}
                      {c.improvements && (
                        <p className="mt-0.5 line-clamp-1 text-[11.5px] text-[color:var(--pf-text-soft)]">
                          <span className="font-medium text-[#B45309]">Area:</span>{" "}
                          {c.improvements}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section
            aria-label="Karya terbaik"
            className="flex flex-col rounded-[16px] border border-[color:var(--pf-border)] bg-[var(--pf-surface)] shadow-[var(--pf-shadow-surface)]"
          >
            <div className="px-4 pt-4">
              <h2 className="text-[13.5px] font-semibold text-ink">
                Top performing works
              </h2>
              <p className="mt-1 text-[12px] text-[color:var(--pf-text-muted)]">
                Foto dengan engagement tertinggi
              </p>
            </div>

            {topPhotos.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-14 text-center">
                <ImageOff size={26} className="mb-2 text-[color:var(--pf-text-soft)]" />
                <p className="text-[12.5px] font-medium text-ink">
                  Belum ada foto terbit
                </p>
                <Link
                  href="/addphoto"
                  className="mt-3 inline-flex h-8 items-center rounded-full bg-ink px-3.5 text-[12px] font-medium text-[#FFFDF6] transition-opacity hover:opacity-90"
                >
                  Upload karya pertama
                </Link>
              </div>
            ) : (
              <ul className="mt-3 grid flex-1 grid-cols-2 gap-2.5 p-4 pt-0">
                {topPhotos.map((photo, idx) => {
                  const src = fileUrl(photo.image_url);
                  return (
                    <li key={photo.id_photo}>
                      <Link
                        href={`/photos/${photo.id_photo}`}
                        className="group flex h-full flex-col overflow-hidden rounded-[12px] border border-[color:var(--pf-border)] bg-[var(--pf-panel)] transition-colors hover:border-[color:var(--pf-border-strong)]"
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--pf-surface-active)]">
                          {src && (
                            <Image
                              src={src}
                              loader={
                                isCloudinaryUrl(src) ? cloudinaryLoader : undefined
                              }
                              alt={photo.title || "Photo"}
                              fill
                              sizes="(max-width: 640px) 50vw, 25vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          )}
                          <span className="absolute left-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-black/60 font-mono text-[10px] font-semibold text-white backdrop-blur-xs">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="p-2.5">
                          <p className="truncate text-[12px] font-medium text-ink">
                            {photo.title || "Untitled"}
                          </p>
                          <div className="mt-1 flex items-center justify-between font-mono text-[10.5px] text-[color:var(--pf-text-muted)]">
                            <span className="flex items-center gap-1">
                              <Heart
                                size={10}
                                className="text-[#D62B2B]"
                                fill="#D62B2B"
                                aria-hidden="true"
                              />
                              {photo.likes_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare size={10} aria-hidden="true" />
                              {photo.comments_count}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex items-center justify-between border-t border-[color:var(--pf-border)] px-4 py-2.5 text-[11.5px] text-[color:var(--pf-text-soft)]">
              <span className="inline-flex items-center gap-1.5">
                <Camera size={12} aria-hidden="true" />
                {topPhotos.length} dari {summary.total_posts} karya
              </span>
              <Link
                href="/account"
                className="inline-flex items-center gap-1 font-medium text-[color:var(--pf-accent-ink)] hover:underline"
              >
                <span>Vault lengkap</span>
                <ExternalLink size={11} aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
