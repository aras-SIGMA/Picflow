"use client";

// src/components/ui/Dropzone.jsx
// Area drag-and-drop & preview foto studio:
// - Desain viewfinder kamera dengan bracket sudut (corner reticles)
// - Drag-over responsif dengan aksen biru PicFlow
// - Preview resolusi tinggi dengan proteksi rasio aspek (object-contain di panggung hitam elegan)
// - Floating control pills (Ganti, Hapus, info format/ukuran)

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, RefreshCcw, Trash2, UploadCloud } from "lucide-react";
import { EASE } from "./motion";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/tiff"];
const MAX_SIZE = 25 * 1024 * 1024;

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function Dropzone({
  file,
  onFileChange,
  previewUrl,
  oldImage,
  label = "Drag & drop your photograph here",
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function validate(selected) {
    if (!selected) return null;
    const isTiff =
      selected.type === "image/tiff" ||
      selected.name.toLowerCase().endsWith(".tif") ||
      selected.name.toLowerCase().endsWith(".tiff");
    if (!ALLOWED.includes(selected.type) && !isTiff) {
      return "Please choose a JPG, PNG, WEBP, GIF, or TIFF image.";
    }
    if (selected.size > MAX_SIZE) return "Image size exceeds 25MB limit.";
    return null;
  }

  function accept(selected) {
    const err = validate(selected);
    if (err) {
      onFileChange(null, err);
      return;
    }
    onFileChange(selected, null);
  }

  function onInputChange(e) {
    accept(e.target.files?.[0] || null);
    e.target.value = "";
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    accept(e.dataTransfer.files?.[0] || null);
  }

  const showPreview = previewUrl || oldImage;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept={[...ALLOWED, ".tif", ".tiff"].join(",")}
        className="hidden"
        onChange={onInputChange}
      />

      <AnimatePresence mode="wait">
        {showPreview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-black shadow-card"
          >
            {/* Viewfinder Preview Stage */}
            <div className="relative flex min-h-[300px] max-h-[460px] w-full items-center justify-center overflow-hidden bg-radial from-stone-900 to-black p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl || oldImage}
                alt="Selected photo preview"
                className="max-h-[440px] w-full rounded-xl object-contain"
              />

              {/* Viewfinder Corner Framing Marks */}
              <div className="pointer-events-none absolute inset-4 border border-white/10">
                <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-white/60" />
                <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-white/60" />
                <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-white/60" />
                <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-white/60" />
              </div>

              {/* Top Floating Badge */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md shadow-xs">
                <Camera size={12} className="text-blue-400" />
                <span>Live Preview</span>
              </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">
                  {file ? file.name : "Loaded Master File"}
                </p>
                <p className="text-[10px] text-white/60">
                  {file ? formatSize(file.size) : "Ready for publish"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  title="Change image"
                  aria-label="Replace image"
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/30"
                >
                  <RefreshCcw size={12} />
                  <span>Change</span>
                </button>
                <button
                  type="button"
                  onClick={() => onFileChange(null, null)}
                  title="Remove image"
                  aria-label="Remove image"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/30 bg-red-600/30 text-red-200 backdrop-blur-md transition-all hover:bg-red-600/60 hover:text-white"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="dropzone"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            aria-label="Choose or drop image"
            className={`group relative flex w-full flex-col items-center justify-center gap-3.5 rounded-3xl border-2 border-dashed px-6 py-16 text-center transition-colors duration-200 bg-transparent ${
              dragOver
                ? "border-blue-600 ring-4 ring-blue-500/10"
                : "border-[#DCD0BE] hover:border-blue-600"
            }`}
          >
            {/* Camera Viewfinder Corner Accents */}
            <div className="pointer-events-none absolute inset-3 border border-stone-300/40 rounded-2xl transition-colors group-hover:border-blue-500/30">
              <div className="absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2 border-stone-400 group-hover:border-blue-600" />
              <div className="absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 border-stone-400 group-hover:border-blue-600" />
              <div className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-stone-400 group-hover:border-blue-600" />
              <div className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-stone-400 group-hover:border-blue-600" />
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-[#E8DEC9] text-stone-700 shadow-sm transition-transform group-hover:scale-105 group-hover:text-blue-600">
              <UploadCloud size={28} />
            </div>

            <div className="space-y-1">
              <span className="block text-sm font-bold text-stone-900 group-hover:text-blue-600 transition-colors">
                {label}
              </span>
              <span className="block text-xs text-stone-500">
                Click to browse or drag &amp; drop from your files
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold text-stone-600 shadow-2xs">
              <span>RAW / TIFF / JPG / PNG / WEBP</span>
              <span className="text-stone-300">·</span>
              <span>Max 25MB</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
