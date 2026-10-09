"use client";

// src/app/(app)/photos/[id]/page.jsx
// Halaman detail foto publik/privat: tampilan karya resolusi tinggi,
// breadcrumbs, aksi bagikan link / edit foto, dan panel teknis EXIF kamera.
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Copy,
  Pencil,
  RefreshCcw,
  Tag,
} from "lucide-react";
import { fileUrl, getPhoto, getToken } from "@/lib/api";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";
import ExifMetadataPanel from "@/components/ExifMetadataPanel";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";
import FollowButton from "@/components/FollowButton";
import ApertureLoader from "@/components/ui/ApertureLoader";
import Button from "@/components/ui/Button";
import PillBadge from "@/components/ui/PillBadge";
import { PageTransition, Reveal } from "@/components/ui/Motion";
import { useToast } from "@/components/ui/Toast";

export default function PhotoDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    if (!id) return;

    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getPhoto(id);
        if (active) setPhoto(res.data);
      } catch (err) {
        if (err.status === 401) router.replace("/login");
        else if (active) setError(err.message || "Gagal memuat detail foto.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id, router]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link foto disalin ke clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin link.");
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-24">
          <div className="flex flex-col items-center gap-4">
            <ApertureLoader size={32} />
            <p className="text-sm text-muted">Memuat karya...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !photo) {
    return (
      <PageTransition>
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <p className="text-sm text-danger" role="alert">
            {error || "Foto tidak ditemukan."}
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant="ghost" onClick={() => router.push("/home")}>
              <ArrowLeft size={14} />
              Kembali ke Galeri
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setLoading(true);
                getPhoto(id)
                  .then((res) => setPhoto(res.data))
                  .catch((e) => setError(e.message))
                  .finally(() => setLoading(false));
              }}
            >
              <RefreshCcw size={14} />
              Coba lagi
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const src = photo.high_res_url || fileUrl(photo.image_url);

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-10">
        {/* Navigation & Header Actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={14} />
            Kembali ke feed
          </Link>

          <div className="flex items-center gap-2">
            <LikeButton
              photoId={photo.id_photo}
              initialLiked={photo.is_liked}
              initialCount={photo.likes_count}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs"
            >
              {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              {copied ? "Tersalin" : "Salin link"}
            </Button>
            {photo.is_owner && (
              <Button
                href={`/addphoto?id=${photo.id_photo}`}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Pencil size={13} />
                Edit karya
              </Button>
            )}
          </div>
        </div>

        {/* High-Resolution Showcase Stage */}
        <Reveal>
          <div className="group relative flex max-h-[75vh] w-full items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-line bg-black/50 p-2 sm:p-4">
            {src ? (
              <Image
                src={src}
                loader={isCloudinaryUrl(src) ? cloudinaryLoader : undefined}
                alt={photo.title || "Karya fotografi"}
                width={2048}
                height={1536}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 2048px"
                className="h-auto max-h-[70vh] w-auto max-w-full rounded-[var(--radius-md)] object-contain shadow-2xl"
                priority
              />
            ) : (
              <p className="py-24 text-sm text-faint">Gambar tidak tersedia.</p>
            )}
          </div>
        </Reveal>

        {/* Information & EXIF Technical Panel Grid */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2">
            {/* Creator Bar */}
            {photo.creator?.username && (
              <div className="mb-4 flex items-center justify-between rounded-[var(--radius-md)] border border-line bg-[var(--surface)] p-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line bg-[var(--bg-elevated)] text-xs font-bold text-ink">
                    {photo.creator.avatar_url ? (
                      <Image
                        src={photo.creator.avatar_url}
                        alt={photo.creator.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      photo.creator.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">
                      @{photo.creator.username}
                    </p>
                    <p className="text-[11px] text-faint">Kreator Foto</p>
                  </div>
                </div>
                <FollowButton
                  creatorId={photo.creator.id_user || photo.id_user}
                />
              </div>
            )}

            <PillBadge>
              {photo.category_name || `#${photo.id_category}`}
            </PillBadge>
            <h1 className="display-1 mt-3 text-2xl! sm:text-3xl!">
              {photo.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Tag size={13} className="text-accent" />
                {photo.category_name || `#${photo.id_category}`}
              </span>
              {photo.created_at && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-accent2" />
                  {new Date(photo.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>

            {photo.description ? (
              <div className="mt-5 rounded-[var(--radius-sm)] border border-line bg-[var(--bg-elevated)] p-4 text-sm leading-relaxed text-muted">
                {photo.description}
              </div>
            ) : (
              <p className="mt-4 text-xs italic text-faint">
                Tidak ada deskripsi untuk karya ini.
              </p>
            )}

            {/* EXIF Panel */}
            <div className="mt-6">
              <ExifMetadataPanel photo={photo} />
            </div>

            {/* Komentar & Diskusi */}
            <div className="mt-6">
              <CommentSection
                photoId={photo.id_photo}
                initialCount={photo.comments_count}
              />
            </div>
          </div>

          {/* Sidebar / Quick Summary Card */}
          <div>
            <div className="rounded-[var(--radius-md)] border border-line bg-[var(--bg-elevated)] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-faint">
                Ringkasan File
              </h3>
              <dl className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-line/50 pb-2">
                  <dt className="text-muted">Resolusi Asli</dt>
                  <dd className="font-medium text-ink">
                    {photo.width && photo.height
                      ? `${photo.width} × ${photo.height} px`
                      : "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-line/50 pb-2">
                  <dt className="text-muted">Format Pengiriman</dt>
                  <dd className="font-medium text-accent">
                    WebP / AVIF (Auto)
                  </dd>
                </div>
                <div className="flex justify-between border-b border-line/50 pb-2">
                  <dt className="text-muted">Breakpoints</dt>
                  <dd className="font-medium text-ink">
                    400 / 1080 / 2048px
                  </dd>
                </div>
                <div className="flex justify-between pt-1">
                  <dt className="text-muted">Proteksi GPS</dt>
                  <dd className="font-medium text-success">
                    Stripped (Aman)
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
