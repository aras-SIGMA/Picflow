"use client";

// src/components/ui/Dropzone.jsx
// Area drag-and-drop: border dashed, glow ungu saat drag-over, klik untuk
// memilih file, preview langsung (rounded) dengan tombol ganti/hapus,
// tampilkan nama file + ukuran. Validasi tipe & ukuran inline (bukan alert).
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, RefreshCcw, Trash2 } from "lucide-react";
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
  label = "Tarik & lepas gambarmu di sini",
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
      return "Gunakan gambar JPG, PNG, WEBP, GIF, atau TIFF.";
    }
    if (selected.size > MAX_SIZE) return "Ukuran gambar maksimal 25MB.";
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
    <div>
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
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="group relative overflow-hidden rounded-[var(--radius-md)] border border-line"
          >
            {/* Preview lokal/belum diunggah memakai img biasa (blob URL). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl || oldImage}
              alt="Preview gambar terpilih"
              className="max-h-80 w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="min-w-0 truncate text-xs text-white/80">
                {file ? `${file.name} · ${formatSize(file.size)}` : "Gambar tersimpan"}
              </p>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  aria-label="Ganti gambar"
                  className="rounded-full border border-white/20 bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                >
                  <RefreshCcw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onFileChange(null, null)}
                  aria-label="Hapus gambar"
                  className="rounded-full border border-white/20 bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                >
                  <Trash2 size={14} />
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
            aria-label="Pilih atau jatuhkan gambar"
            className={`flex w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-dashed px-6 py-14 text-center transition-all duration-300 ${
              dragOver
                ? "border-accent bg-accent/10 shadow-[0_0_60px_-12px_rgba(124,108,255,0.5)]"
                : "border-white/15 bg-[var(--bg-elevated)] hover:border-white/30"
            }`}
          >
            <ImagePlus size={28} className={dragOver ? "text-accent" : "text-faint"} />
            <span className="text-sm text-ink">{label}</span>
            <span className="text-xs text-faint">JPG, PNG, WEBP, atau TIFF · maks 25MB</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
