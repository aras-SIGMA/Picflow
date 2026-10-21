"use client";

// src/components/ExifMetadataPanel.jsx
// Panel metadata teknis EXIF kamera: Camera, Lens, Focal Length, Aperture,
// Shutter Speed, ISO, dan Timestamp pemotretan.
// Konsisten dengan standar desain .md/DESIGN/design.md
import { useState } from "react";
import {
  Activity,
  Aperture,
  Camera,
  Clock,
  Disc,
  Focus,
  Gauge,
  Timer,
} from "lucide-react";
import RGBHistogram from "./RGBHistogram";

export default function ExifMetadataPanel({
  photo,
  className = "",
  initialShowHistogram = true,
}) {
  const [showHistogram, setShowHistogram] = useState(initialShowHistogram);

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
    ? new Date(photo.taken_at).toLocaleDateString("en-US", {
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
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-card ${className}`}
    >
      <div className="mb-3.5 flex items-center justify-between border-b border-gray-100 pb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
          EXIF Camera Metadata
        </span>
        <button
          type="button"
          onClick={() => setShowHistogram((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all ${
            showHistogram
              ? "bg-stone-900 text-white shadow-xs"
              : "border border-gray-200 bg-gray-50 text-stone-600 hover:bg-gray-100"
          }`}
        >
          <Activity size={10} className={showHistogram ? "text-blue-400" : "text-stone-400"} />
          <span>{showHistogram ? "Hide Histogram" : "RGB Histogram"}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        {/* Camera */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
            <Camera size={12} className="shrink-0 text-blue-600" />
            <span>Camera</span>
          </div>
          <p className="mt-1 truncate text-xs font-bold text-stone-900" title={cameraName}>
            {cameraName}
          </p>
        </div>

        {/* Lens */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
            <Disc size={12} className="shrink-0 text-blue-600" />
            <span>Lens</span>
          </div>
          <p className="mt-1 truncate text-xs font-bold text-stone-900" title={lensName}>
            {lensName}
          </p>
        </div>

        {/* Focal Length */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
            <Focus size={12} className="shrink-0 text-blue-600" />
            <span>Focal</span>
          </div>
          <p className="mt-1 truncate text-xs font-bold text-stone-900">
            {focalLength}
          </p>
        </div>

        {/* Aperture */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
            <Aperture size={12} className="shrink-0 text-blue-600" />
            <span>Aperture</span>
          </div>
          <p className="mt-1 truncate text-xs font-bold text-stone-900">
            {aperture}
          </p>
        </div>

        {/* Shutter Speed */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
            <Timer size={12} className="shrink-0 text-blue-600" />
            <span>Shutter</span>
          </div>
          <p className="mt-1 truncate text-xs font-bold text-stone-900">
            {shutterSpeed}
          </p>
        </div>

        {/* ISO */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
            <Gauge size={12} className="shrink-0 text-blue-600" />
            <span>ISO</span>
          </div>
          <p className="mt-1 truncate text-xs font-bold text-stone-900">
            {isoValue}
          </p>
        </div>
      </div>

      {/* Timestamp */}
      <div className="mt-3.5 flex items-center justify-between border-t border-gray-100 pt-2.5 text-[11px]">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="shrink-0 text-stone-400" />
          <span className="text-stone-400">Captured:</span>
          <span className="font-semibold text-stone-700">{takenAtValue}</span>
        </div>
        <span className="text-[10px] font-medium text-stone-400">
          {hasAnyExif ? "EXIF Extracted" : "Manual / No EXIF"}
        </span>
      </div>

      {/* RGB Tonal Histogram Visualizer */}
      {showHistogram && (
        <div className="mt-4 border-t border-gray-100 pt-3.5">
          <RGBHistogram photo={photo} />
        </div>
      )}
    </div>
  );
}
