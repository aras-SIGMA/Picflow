"use client";

// src/components/ExifMetadataPanel.jsx
// Panel metadata teknis EXIF kamera: Camera, Lens, Focal Length, Aperture,
// Shutter Speed, ISO, dan Timestamp pemotretan.
import {
  Aperture,
  Camera,
  Clock,
  Disc,
  Focus,
  Gauge,
  Timer,
} from "lucide-react";

export default function ExifMetadataPanel({ photo, className = "" }) {
  if (!photo) return null;

  const cameraParts = [photo.camera_make, photo.camera_model]
    .filter(Boolean)
    .join(" ");
  const cameraName = cameraParts.trim() || "N/A";
  const lensName = photo.lens?.trim() || "N/A";
  const focalLength = photo.focal_length?.trim() || "N/A";
  const aperture = photo.aperture?.trim() || "N/A";
  const shutterSpeed = photo.shutter_speed?.trim() || "N/A";
  const isoValue = photo.iso != null ? `ISO ${photo.iso}` : "N/A";
  const takenAtValue = photo.taken_at
    ? new Date(photo.taken_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  const hasAnyExif = Boolean(
    photo.camera_make ||
      photo.camera_model ||
      photo.lens ||
      photo.focal_length ||
      photo.aperture ||
      photo.shutter_speed ||
      photo.iso ||
      photo.taken_at
  );

  return (
    <div
      className={`rounded-[var(--radius-sm)] border border-line bg-[var(--surface)] p-4 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between border-b border-line/60 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">
          EXIF Camera Metadata
        </span>
        <span className="text-[10px] text-muted">
          {hasAnyExif ? "Automatic Extraction" : "No camera tags found (N/A)"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* Camera */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-faint">
            <Camera size={12} className="shrink-0 text-accent" />
            <span>Camera</span>
          </div>
          <p className="mt-1 truncate text-xs font-medium text-ink" title={cameraName}>
            {cameraName}
          </p>
        </div>

        {/* Lens */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-faint">
            <Disc size={12} className="shrink-0 text-accent" />
            <span>Lens</span>
          </div>
          <p className="mt-1 truncate text-xs font-medium text-ink" title={lensName}>
            {lensName}
          </p>
        </div>

        {/* Focal Length */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-faint">
            <Focus size={12} className="shrink-0 text-accent" />
            <span>Focal</span>
          </div>
          <p className="mt-1 truncate text-xs font-medium text-ink">
            {focalLength}
          </p>
        </div>

        {/* Aperture */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-faint">
            <Aperture size={12} className="shrink-0 text-accent" />
            <span>Aperture</span>
          </div>
          <p className="mt-1 truncate text-xs font-medium text-ink">
            {aperture}
          </p>
        </div>

        {/* Shutter Speed */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-faint">
            <Timer size={12} className="shrink-0 text-accent" />
            <span>Shutter</span>
          </div>
          <p className="mt-1 truncate text-xs font-medium text-ink">
            {shutterSpeed}
          </p>
        </div>

        {/* ISO */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-faint">
            <Gauge size={12} className="shrink-0 text-accent" />
            <span>ISO</span>
          </div>
          <p className="mt-1 truncate text-xs font-medium text-ink">
            {isoValue}
          </p>
        </div>
      </div>

      {/* Timestamp */}
      <div className="mt-3 flex items-center gap-1.5 border-t border-line/50 pt-2.5 text-[11px]">
        <Clock size={12} className="shrink-0 text-accent2" />
        <span className="text-faint">Shot taken:</span>
        <span className="font-medium text-ink">{takenAtValue}</span>
      </div>
    </div>
  );
}
