"use client";

// src/app/(app)/photos/[id]/page.jsx
// Halaman detail & kritik foto profesional (workspace portofolio):
// - Hero stage cinematic dengan foto high-res + overlay EXIF chips
// - Kolom utama: kartu kreator, deskripsi, kritik & diskusi
// - Sidebar sticky: panel EXIF teknis lengkap + file summary delivery
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Copy,
  Eye,
  Gauge,
  MessageSquare,
  Pencil,
  RefreshCcw,
  Share2,
  Sparkles,
  Star,
  Tag,
  Timer,
  Trash2,
} from "lucide-react";
import { fileUrl, getPhoto, getToken, deletePhoto } from "@/lib/api";
import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary";
import ExifMetadataPanel from "@/components/ExifMetadataPanel";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";
import CritiqueSection from "@/components/CritiqueSection";
import FollowButton from "@/components/FollowButton";
import ApertureLoader from "@/components/ui/ApertureLoader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { PageTransition, Reveal } from "@/components/ui/Motion";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";

const SHADOW_FLOAT = "shadow-card";

export default function PhotoDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const tabParam = searchParams?.get("tab");
  const [tabOverride, setTabOverride] = useState(null);
  const socialTab = tabOverride ?? (tabParam === "comments" ? "comments" : "critique");

  async function handleDeletePhoto() {
    if (!photo) return;
    setDeleting(true);
    try {
      await deletePhoto(photo.id_photo);
      toast.success("Photo deleted successfully.");
      router.push("/home");
    } catch (err) {
      toast.error(err.message || "Failed to delete photo.");
      setDeleting(false);
    }
  }

  useEffect(() => {
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
        else if (active) setError(err.message || "Failed to load photo details.");
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
      toast.success("Photo link copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-24">
          <div className="flex flex-col items-center gap-4">
            <ApertureLoader size={32} />
            <p className="text-sm text-muted">Loading photograph...</p>
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
            {error || "Photo not found."}
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant="ghost" onClick={() => router.push("/home")}>
              <ArrowLeft size={14} />
              Back to Gallery
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
              Try again
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const src = photo.high_res_url || fileUrl(photo.image_url);
  const exifChips = [
    photo.focal_length,
    photo.aperture,
    photo.shutter_speed,
    photo.iso != null ? `ISO ${photo.iso}` : null,
  ].filter(Boolean);

  return (
    <PageTransition>
      <div className="w-full flex-1 pb-24">
        {/* Top bar navigasi & aksi */}
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-6">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition-all hover:bg-gray-50"
          >
            <ArrowLeft size={14} />
            Back to feed
          </Link>

          <div className="flex items-center gap-2">
            <LikeButton
              photoId={photo.id_photo}
              initialLiked={photo.is_liked}
              initialCount={photo.likes_count}
              variant="white"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              aria-label="Copy link"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                copied
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-white text-stone-700 hover:bg-gray-50"
              }`}
            >
              {copied ? <Check size={13} /> : <Share2 size={13} />}
              {copied ? "Copied" : "Share"}
            </button>
            {photo.is_owner && (
              <Link
                href={`/addphoto?id=${photo.id_photo}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition-all hover:bg-gray-50"
              >
                <Pencil size={13} />
                Edit
              </Link>
            )}
            {(photo.is_owner || user?.role === "admin") && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title={photo.is_owner ? "Delete photo" : "Moderate: delete as admin"}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${
                  photo.is_owner
                    ? "border-gray-200 bg-white text-stone-700 hover:bg-red-50 hover:text-red-600"
                    : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                }`}
              >
                <Trash2 size={13} />
                {photo.is_owner ? "Delete" : "Moderate"}
              </button>
            )}
          </div>
        </div>

        {/* Preview foto utama: floating shadow tanpa background */}
        <div className="mx-auto w-full max-w-5xl px-4 py-4">
          <Reveal>
            <div className="flex min-h-[40vh] max-h-[75vh] items-center justify-center">
              {src ? (
                <Image
                  src={src}
                  loader={isCloudinaryUrl(src) ? cloudinaryLoader : undefined}
                  alt={photo.title || "Photographic work"}
                  width={2048}
                  height={1536}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 2048px"
                  className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-preview"
                  priority
                />
              ) : (
                <p className="py-24 text-sm text-stone-400">Image unavailable.</p>
              )}
            </div>
          </Reveal>
        </div>

        {/* EXIF chips di bawah preview foto */}
        {(exifChips.length > 0 || photo.camera_make || photo.camera_model) && (
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-2 px-4 pb-4">
            {(photo.camera_make || photo.camera_model) && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 font-mono text-[11px] font-semibold text-stone-700 shadow-sm">
                <Eye size={11} className="text-blue-600" />
                {[photo.camera_make, photo.camera_model].filter(Boolean).join(" ")}
              </span>
            )}
            {exifChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 font-mono text-[11px] font-semibold text-stone-700 shadow-sm"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* ============================================================ */}
        {/* WORKSPACE: Info karya + kritik/diskusi + sidebar teknis       */}
        {/* ============================================================ */}
        <div className="mx-auto w-full max-w-6xl px-4 pt-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* ---------------- KOLOM UTAMA ---------------- */}
            <main className="space-y-6 lg:col-span-2">
              {/* Kartu informasi karya */}
              <article className={`rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 ${SHADOW_FLOAT}`}>
                {/* Bar kreator */}
                {photo.creator?.username && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <Link
                      href={`/account/${photo.creator.id_user || photo.id_user}`}
                      className="flex items-center gap-3"
                    >
                      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-stone-900 text-xs font-bold text-white shadow-xs">
                        {photo.creator.avatar_url ? (
                          <Image
                            src={photo.creator.avatar_url}
                            alt={photo.creator.username}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          photo.creator.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">
                          @{photo.creator.username}
                        </p>
                        <p className="text-[11px] text-stone-500">Photographer</p>
                      </div>
                    </Link>
                    <FollowButton
                      creatorId={photo.creator.id_user || photo.id_user}
                    />
                  </div>
                )}

                {/* Judul, kategori & tanggal */}
                <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
                  {photo.title}
                </h1>

                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 font-medium text-stone-600">
                    <Tag size={12} className="text-blue-600" />
                    {photo.category_name || `#${photo.id_category}`}
                  </span>
                  {photo.created_at && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} />
                      {new Date(photo.created_at).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {/* Deskripsi karya */}
                {photo.description ? (
                  <p className="mt-4 text-sm leading-relaxed text-stone-600">
                    {photo.description}
                  </p>
                ) : (
                  <p className="mt-4 text-xs italic text-stone-400">
                    No description provided for this work.
                  </p>
                )}
              </article>

              {/* Kartu tab Kritik & Diskusi */}
              <section className={`overflow-hidden rounded-2xl border border-gray-200 bg-white ${SHADOW_FLOAT}`}>
                <div className="flex gap-1 border-b border-gray-100 bg-gray-50/60 px-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setTabOverride("critique")}
                    className={`inline-flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                      socialTab === "critique"
                        ? "border-blue-600 text-blue-700"
                        : "border-transparent text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <Sparkles size={13} />
                    Constructive Critique
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabOverride("comments")}
                    className={`inline-flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                      socialTab === "comments"
                        ? "border-blue-600 text-blue-700"
                        : "border-transparent text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <MessageSquare size={13} />
                    Discussion ({photo.comments_count || 0})
                  </button>
                </div>

                <div className="p-4 sm:p-5">
                  {socialTab === "critique" ? (
                    <CritiqueSection
                      photoId={photo.id_photo}
                      photoOwnerId={photo.creator?.id_user || photo.id_user}
                      embedded
                    />
                  ) : (
                    <CommentSection
                      photoId={photo.id_photo}
                      initialCount={photo.comments_count}
                      onCountChange={(cnt) =>
                        setPhoto((p) => (p ? { ...p, comments_count: cnt } : p))
                      }
                      embedded
                    />
                  )}
                </div>
              </section>
            </main>

            {/* ---------------- SIDEBAR TEKNIS ---------------- */}
            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <ExifMetadataPanel photo={photo} className="bg-white" />

              {/* Ringkasan file delivery */}
              <div className={`rounded-2xl border border-gray-200 bg-white p-5 ${SHADOW_FLOAT}`}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  File Summary
                </h3>
                <dl className="mt-4 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <dt className="text-stone-500">Native Resolution</dt>
                    <dd className="font-semibold text-stone-900">
                      {photo.width && photo.height
                        ? `${photo.width} × ${photo.height} px`
                        : "N/A"}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <dt className="text-stone-500">Delivery Format</dt>
                    <dd className="font-semibold text-blue-600">WebP / AVIF (Auto)</dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <dt className="text-stone-500">Breakpoints</dt>
                    <dd className="font-semibold text-stone-900">400 / 1080 / 2048px</dd>
                  </div>
                  <div className="flex justify-between pt-1">
                    <dt className="text-stone-500">GPS Privacy</dt>
                    <dd className="font-semibold text-emerald-600">Stripped (Secure)</dd>
                  </div>
                </dl>
              </div>

              {/* Catatan kritik etos komunitas */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <Star size={13} className="fill-amber-500 text-amber-600" />
                  Critique Ethos
                </div>
                <p className="mt-1.5">
                  Reviews are evaluated on 4 professional pillars: Composition,
                  Lighting, Color &amp; Tone, and Concept — scored 1-5 by fellow
                  photographers.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => (deleting ? null : setConfirmDelete(false))}
        labelledBy="delete-photo-detail-title"
      >
        <div className="p-6">
          <h2
            id="delete-photo-detail-title"
            className="text-lg font-bold tracking-tight text-ink"
          >
            {photo?.is_owner ? "Delete this photo?" : "Moderate: delete this photo?"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {photo?.is_owner
              ? "This action is permanent. The image asset and all its likes, comments, and critiques will be removed."
              : "As an admin, you are about to permanently remove another user's work along with all its engagement data."}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeletePhoto} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete permanently"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
