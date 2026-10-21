"use client";

// src/app/(app)/addphoto/page.jsx
// Halaman Unggah & Kurasi Karya Fotografi (Studio Publishing Room):
// - Layout 2 kolom profesional (Grid 12: 7 kolom visual/hardware + 5 kolom kuratorial)
// - Viewfinder dropzone dengan framing bracket dan preview rasio aspek asli
// - Live EXIF metadata panel terintegrasi lengkap dengan visual histogram RGB
// - Form kuratorial: Title, Genre/Category, Story behind the shot, dan etos kritik komunitas

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Aperture,
  ArrowLeft,
  Camera,
  Check,
  Disc,
  Focus,
  Gauge,
  ImagePlus,
  Layers,
  Sparkles,
  Star,
  Timer,
  UploadCloud,
} from "lucide-react";
import {
  getToken,
  listCategories,
  getPhoto,
  createPhoto,
  updatePhoto,
  fileUrl,
} from "@/lib/api";
import { parseClientExif } from "@/lib/exif";
import Dropzone from "@/components/ui/Dropzone";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import PillBadge from "@/components/ui/PillBadge";
import ApertureLoader from "@/components/ui/ApertureLoader";
import ExifMetadataPanel from "@/components/ExifMetadataPanel";
import { useToast } from "@/components/ui/Toast";
import { EASE } from "@/components/ui/motion";
import { PageTransition } from "@/components/ui/Motion";

const DESC_MAX = 300;

function AddPhotoForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const editId = params.get("id");

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [idCategory, setIdCategory] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const previewUrlRef = useRef("");
  const [oldImage, setOldImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const [clientExif, setClientExif] = useState(null);
  const [parsingExif, setParsingExif] = useState(false);

  // LOAD: categories + isi form jika mode edit
  useEffect(() => {
    let active = true;

    async function load() {
      if (!getToken()) {
        router.replace("/login");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [categoryResponse, photoResponse] = await Promise.all([
          listCategories(),
          editId ? getPhoto(editId) : Promise.resolve(null),
        ]);

        if (!active) return;
        setCategories(categoryResponse.data || []);
        if (photoResponse) {
          setTitle(photoResponse.data.title);
          setIdCategory(String(photoResponse.data.id_category));
          setDescription(photoResponse.data.description || "");
          setOldImage(fileUrl(photoResponse.data.image_url));

          const p = photoResponse.data;
          if (
            p.camera_make ||
            p.camera_model ||
            p.lens ||
            p.aperture ||
            p.shutter_speed ||
            p.iso
          ) {
            setClientExif({
              camera_make: p.camera_make,
              camera_model: p.camera_model,
              lens: p.lens,
              focal_length: p.focal_length,
              aperture: p.aperture,
              shutter_speed: p.shutter_speed,
              iso: p.iso,
              taken_at: p.taken_at,
            });
          }
        }
      } catch (err) {
        if (err.status === 401) router.replace("/login");
        else if (active) setError(err.errors?.join(", ") || err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [editId, router]);

  // Bersihkan object URL saat unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function clearPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setPreviewUrl("");
  }

  // Handler file change dari Dropzone
  function handleFileChange(selectedFile, validationError) {
    setError(validationError || "");
    if (validationError) return;
    clearPreview();
    if (!selectedFile) {
      setFile(null);
      setClientExif(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setFile(selectedFile);

    setParsingExif(true);
    parseClientExif(selectedFile)
      .then((parsed) => setClientExif(parsed))
      .catch(() => setClientExif(null))
      .finally(() => setParsingExif(false));
  }

  const titleInvalid = submitted && !title.trim();
  const categoryInvalid = submitted && !idCategory;
  const imageInvalid = submitted && !editId && !file;
  const canSubmit =
    Boolean(title.trim()) && Boolean(idCategory) && Boolean(editId || file);

  // SAVE: kirim FormData
  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitted(true);
    if (!title.trim() || !idCategory || (!editId && !file)) return;

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("id_category", idCategory);
      if (description) fd.append("description", description);
      if (file) fd.append("image", file);
      if (editId) await updatePhoto(editId, fd);
      else await createPhoto(fd);

      toast.success(editId ? "Photograph updated successfully." : "Photograph published successfully.");
      setFlash(true);
      setTimeout(() => router.push("/home"), 1000);
    } catch (err) {
      setError(err.errors?.join(", ") || err.message);
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-24">
          <div className="flex flex-col items-center gap-4">
            <ApertureLoader size={30} />
            <p className="text-sm text-stone-500">Preparing photography studio...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  const activeImage = previewUrl || oldImage;

  return (
    <PageTransition>
      {/* Shutter flash animation saat sukses unggah */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.95, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-white"
          >
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4, ease: EASE }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-900 text-white shadow-2xl"
            >
              <Check size={28} />
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8 space-y-6">
        {/* Navigation Breadcrumb & Page Header */}
        <div className="space-y-3 border-b border-gray-200/80 pb-5">
          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Feed</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <PillBadge>{editId ? "Curatorial Edit Mode" : "Publishing Room"}</PillBadge>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400">
              <Camera size={12} className="text-blue-600" />
              <span>Full Sensor EXIF Preservation</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
            {editId ? "Refine Your Photograph" : "Publish a New Photograph"}
          </h1>
          <p className="text-xs text-stone-500 max-w-2xl">
            Upload uncompressed visual works, automatically extract camera &amp; lens parameters, and invite constructive community critiques.
          </p>
        </div>

        {/* ======================================================== */}
        {/* MAIN WORKSPACE GRID                                      */}
        {/* ======================================================== */}
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ---------------- KOLOM KIRI: DROPZONE & EXIF ---------------- */}
          <div className="space-y-5 lg:col-span-7">
            {/* Viewfinder Dropzone Stage */}
            <div className="rounded-3xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Camera size={13} />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    Photograph Asset &amp; Framing
                  </h2>
                </div>

                {parsingExif ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600">
                    <span className="h-2 w-2 animate-ping rounded-full bg-blue-500" />
                    Reading EXIF tags...
                  </span>
                ) : clientExif ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <Sparkles size={12} />
                    EXIF Linked
                  </span>
                ) : null}
              </div>

              <Dropzone
                file={file}
                onFileChange={handleFileChange}
                previewUrl={previewUrl}
                oldImage={oldImage}
                label={editId ? "Replace image asset (optional)" : "Drag & drop your photograph here"}
              />

              {imageInvalid && (
                <p className="text-xs font-medium text-red-600" role="alert">
                  Image file is required to publish.
                </p>
              )}
            </div>

            {/* Live EXIF Camera Specs & Histogram Panel */}
            {activeImage ? (
              <div className="space-y-3">
                <ExifMetadataPanel
                  photo={{
                    ...clientExif,
                    image_url: activeImage,
                  }}
                  initialShowHistogram={true}
                  className="shadow-card"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FAF8F5]/80 p-5 text-center shadow-2xs">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-400 border border-gray-200 mb-2.5">
                  <Aperture size={18} className="text-stone-400" />
                </div>
                <p className="text-xs font-bold text-stone-700">
                  Camera Specs &amp; RGB Histogram Ready
                </p>
                <p className="mt-1 text-[11px] text-stone-400 max-w-sm mx-auto">
                  Select a photo above to automatically inspect camera body, lens, focal length, aperture, shutter speed, ISO, and tonal histogram.
                </p>
              </div>
            )}
          </div>

          {/* ---------------- KOLOM KANAN: FORM KURATORIAL ---------------- */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-gray-200/90 bg-white p-6 sm:p-7 shadow-card space-y-5 lg:sticky lg:top-20">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Layers size={13} />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Curatorial Details
                </h2>
              </div>

              {/* Title Field */}
              <div>
                <label htmlFor="photo-title" className="block text-xs font-bold text-stone-800">
                  Photograph Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="photo-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Solitude at Golden Hour, Tokyo Fog"
                  className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/15 ${
                    titleInvalid
                      ? "border-red-400 bg-red-50/40 focus:border-red-500"
                      : "border-[#DCD0BE] bg-white focus:border-blue-600"
                  }`}
                />
                {titleInvalid && (
                  <p className="mt-1 text-[11px] font-medium text-red-600">
                    Title is required.
                  </p>
                )}
              </div>

              {/* Category Select */}
              <div>
                <label htmlFor="photo-category" className="block text-xs font-bold text-stone-800 mb-1.5">
                  Genre &amp; Category <span className="text-red-500">*</span>
                </label>
                <Select
                  id="photo-category"
                  label="Category"
                  variant="light"
                  value={idCategory}
                  onChange={(v) => setIdCategory(v)}
                  placeholder="Select genre (e.g. Street, Portrait, Landscape)"
                  required
                  error={categoryInvalid ? "Please select a category." : null}
                  options={categories.map((c) => ({
                    value: String(c.id_category),
                    label: c.name,
                  }))}
                />
              </div>

              {/* Description Field */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="photo-desc" className="block text-xs font-bold text-stone-800">
                    Artist Narrative &amp; Story <span className="text-[11px] font-normal text-stone-400">(optional)</span>
                  </label>
                  <span className={`text-[10px] font-mono ${description.length >= DESC_MAX ? "text-red-600 font-bold" : "text-stone-400"}`}>
                    {description.length}/{DESC_MAX}
                  </span>
                </div>
                <textarea
                  id="photo-desc"
                  rows={4}
                  maxLength={DESC_MAX}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your creative intention, location, lighting setup, or artistic thoughts..."
                  className="mt-1.5 w-full resize-none rounded-xl border border-[#DCD0BE] bg-white p-3 text-xs leading-relaxed text-stone-900 placeholder:text-stone-400 shadow-2xs transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              {/* Critique Community Invitation Box */}
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs text-amber-900 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
                  <Star size={13} className="fill-amber-500 text-amber-600" />
                  <span>Peer Critique Invitation</span>
                </div>
                <p className="text-[11px] text-amber-800/90">
                  By publishing, you invite fellow photographers to evaluate this shot on 4 pillars: Composition, Lighting, Color Harmony, and Concept.
                </p>
              </div>

              {/* Server Error Alert */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600" role="alert">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
                <Button
                  type="submit"
                  size="md"
                  loading={busy}
                  disabled={!canSubmit && submitted}
                  className="flex-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-xs flex items-center justify-center gap-2"
                >
                  <ImagePlus size={15} />
                  <span>{busy ? "Publishing..." : editId ? "Save Changes" : "Publish Photograph"}</span>
                </Button>
                <button
                  type="button"
                  onClick={() => router.push("/home")}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}

export default function AddPhotoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
          <ApertureLoader size={30} />
          <p className="text-sm text-stone-500">Preparing photography studio...</p>
        </div>
      }
    >
      <AddPhotoForm />
    </Suspense>
  );
}
