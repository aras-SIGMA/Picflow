// lib/exif.js
// Helper ekstraksi metadata teknis EXIF kamera/lensa dari gambar via exifr.

import exifr from "exifr";

export async function extractExif(filePath) {
  try {
    const data = await exifr.parse(filePath, {
      pick: [
        "Make",
        "Model",
        "LensModel",
        "FocalLength",
        "FNumber",
        "ExposureTime",
        "ISO",
        "DateTimeOriginal",
      ],
    });
    if (!data) return {};

    const focal =
      data.FocalLength != null ? `${Math.round(data.FocalLength)}mm` : null;
    const aperture =
      data.FNumber != null ? `f/${Number(data.FNumber)}` : null;

    let shutter = null;
    if (data.ExposureTime != null) {
      shutter =
        data.ExposureTime < 1
          ? `1/${Math.round(1 / data.ExposureTime)}s`
          : `${data.ExposureTime}s`;
    }

    let takenAt = null;
    if (data.DateTimeOriginal) {
      const d = new Date(data.DateTimeOriginal);
      if (!Number.isNaN(d.getTime())) {
        takenAt = d.toISOString();
      }
    }

    return {
      camera_make: data.Make ? String(data.Make).trim() : null,
      camera_model: data.Model ? String(data.Model).trim() : null,
      lens: data.LensModel ? String(data.LensModel).trim() : null,
      focal_length: focal,
      aperture,
      shutter_speed: shutter,
      iso: typeof data.ISO === "number" ? data.ISO : null,
      taken_at: takenAt,
    };
  } catch {
    return {};
  }
}
