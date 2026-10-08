// src/lib/exif.js
// Ekstraksi EXIF pada sisi client sebelum upload (sesuai spesifikasi PRD).
// Mengekstrak parameter kamera dari objek File mentah tanpa membocorkan GPS.
import exifr from "exifr/dist/lite.esm.mjs";

export async function parseClientExif(file) {
  if (!file) return null;

  try {
    const data = await exifr.parse(file, {
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
      // Proteksi GPS: tidak membaca tag GPS sensitif
      gps: false,
    });

    if (!data) return null;

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

    const cameraMake = data.Make ? String(data.Make).trim() : null;
    const cameraModel = data.Model ? String(data.Model).trim() : null;
    const lens = data.LensModel ? String(data.LensModel).trim() : null;
    const iso = typeof data.ISO === "number" ? data.ISO : null;

    const hasAny = Boolean(
      cameraMake ||
        cameraModel ||
        lens ||
        focal ||
        aperture ||
        shutter ||
        iso ||
        takenAt
    );

    if (!hasAny) return null;

    return {
      camera_make: cameraMake,
      camera_model: cameraModel,
      lens,
      focal_length: focal,
      aperture,
      shutter_speed: shutter,
      iso,
      taken_at: takenAt,
    };
  } catch {
    return null;
  }
}
