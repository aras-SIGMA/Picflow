// src/lib/cloudinary.js
// Utilitas transformasi gambar Cloudinary adaptif multi-resolusi.
// Mendukung f_auto, q_auto serta 3 breakpoint PRD:
// - Thumbnail (400px)
// - Medium/Grid (1080px)
// - High-Res/Lightbox (2048px+)

export const PHOTO_BREAKPOINTS = {
  THUMBNAIL: 400,
  MEDIUM: 1080,
  HIGH_RES: 2048,
};

export function isCloudinaryUrl(url) {
  return typeof url === "string" && url.includes("res.cloudinary.com");
}

export function buildCloudinaryUrl(url, options = {}) {
  if (!url || typeof url !== "string") return "";
  if (!isCloudinaryUrl(url)) return url;

  const {
    width,
    quality = "auto",
    format = "auto",
    crop = "limit",
  } = options;

  const transforms = [`f_${format}`, `q_${quality}`];
  if (width) {
    transforms.push(`w_${width}`, `c_${crop}`);
  }
  const transformString = transforms.join(",");

  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return url;

  const prefix = url.slice(0, uploadIndex + "/upload/".length);
  let suffix = url.slice(uploadIndex + "/upload/".length);

  // Bersihkan segment transformasi sebelumnya jika sudah ada
  const firstSlash = suffix.indexOf("/");
  if (firstSlash !== -1) {
    const firstSegment = suffix.slice(0, firstSlash);
    if (/^[a-z]_[a-z0-9_-]+(,[a-z]_[a-z0-9_-]+)*$/i.test(firstSegment)) {
      suffix = suffix.slice(firstSlash + 1);
    }
  }

  return `${prefix}${transformString}/${suffix}`;
}

export function getThumbnailUrl(url) {
  return buildCloudinaryUrl(url, { width: PHOTO_BREAKPOINTS.THUMBNAIL });
}

export function getMediumUrl(url) {
  return buildCloudinaryUrl(url, { width: PHOTO_BREAKPOINTS.MEDIUM });
}

export function getHighResUrl(url) {
  return buildCloudinaryUrl(url, { width: PHOTO_BREAKPOINTS.HIGH_RES });
}

export function getCloudinarySrcSet(
  url,
  widths = [
    PHOTO_BREAKPOINTS.THUMBNAIL,
    PHOTO_BREAKPOINTS.MEDIUM,
    PHOTO_BREAKPOINTS.HIGH_RES,
  ]
) {
  if (!url || !isCloudinaryUrl(url)) return undefined;
  return widths
    .map((w) => `${buildCloudinaryUrl(url, { width: w })} ${w}w`)
    .join(", ");
}

// Next.js custom loader bila dipakai pada komponen <Image loader={cloudinaryLoader} />
export function cloudinaryLoader({ src, width, quality }) {
  if (!isCloudinaryUrl(src)) return src;
  return buildCloudinaryUrl(src, { width, quality: quality || "auto" });
}
