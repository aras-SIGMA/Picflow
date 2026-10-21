"use client";

// src/components/RGBHistogram.jsx
// Visual Histogram Fotografi Profesional:
// - Analisis kanal warna Red, Green, Blue, dan Luma (ITU-R BT.709)
// - Sampling ultra-cepat lewat offscreen canvas 160px
// - Kurva SVG dinamis dengan kompresi akar kuadrat (square root scaling standar Lightroom)
// - Mode tampilan: RGB Combined, Luminance, Red, Green, Blue
// - Indikator Shadow / Highlight Clipping & rata-rata exposure
// - Interaksi hover scrubber untuk inspeksi nilai tonal (0 - 255)

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, Eye, Gauge, Sparkles } from "lucide-react";
import { fileUrl } from "@/lib/api";

const VIEW_WIDTH = 256;
const VIEW_HEIGHT = 100;

function getZoneName(value) {
  if (value < 32) return "Deep Blacks";
  if (value < 64) return "Shadows";
  if (value < 128) return "Mid-Darks";
  if (value < 192) return "Mid-Lights";
  if (value < 224) return "Highlights";
  return "Specular Whites";
}

function buildSvgPath(bins, height = VIEW_HEIGHT) {
  if (!bins || bins.length === 0) return { fill: "", stroke: "" };

  const points = [];
  for (let i = 0; i < VIEW_WIDTH; i++) {
    const val = bins[i] || 0;
    const y = Math.max(2, height - val * (height - 4));
    points.push(`${i},${y.toFixed(1)}`);
  }

  const stroke = `M ${points.join(" L ")}`;
  const fill = `M 0,${height} L ${points.join(" L ")} L ${VIEW_WIDTH - 1},${height} Z`;

  return { fill, stroke };
}

export default function RGBHistogram({ photo, imageUrl, className = "" }) {
  const [activeChannel, setActiveChannel] = useState("rgb"); // "rgb" | "luma" | "r" | "g" | "b"
  const [hoverIndex, setHoverIndex] = useState(null);

  const containerRef = useRef(null);

  const resolvedSrc = useMemo(() => {
    if (imageUrl) return fileUrl(imageUrl);
    if (!photo) return "";
    const raw = photo.thumbnail_url || photo.medium_url || photo.image_url;
    return fileUrl(raw);
  }, [photo, imageUrl]);

  const [prevSrc, setPrevSrc] = useState(resolvedSrc);
  const [histogramData, setHistogramData] = useState(null);
  const [status, setStatus] = useState(() => (resolvedSrc ? "loading" : "idle"));

  if (resolvedSrc !== prevSrc) {
    setPrevSrc(resolvedSrc);
    setStatus(resolvedSrc ? "loading" : "idle");
    setHistogramData(null);
  }

  useEffect(() => {
    if (!resolvedSrc) return;

    let isMounted = true;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = resolvedSrc;

    img.onload = () => {
      if (!isMounted) return;
      try {
        const sampleWidth = 160;
        const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
        const sampleHeight = Math.max(1, Math.round(sampleWidth / aspect));

        const canvas = document.createElement("canvas");
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Canvas context unavailable");

        ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
        const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
        const data = imgData.data;

        const rBins = new Float32Array(256);
        const gBins = new Float32Array(256);
        const bBins = new Float32Array(256);
        const lBins = new Float32Array(256);

        let totalPixels = 0;
        let totalLuma = 0;
        let shadowClipped = 0;
        let highlightClipped = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 16) continue;

          // Standar Luma ITU-R BT.709
          const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

          rBins[r]++;
          gBins[g]++;
          bBins[b]++;
          lBins[luma]++;

          totalLuma += luma;
          totalPixels++;

          if (luma <= 1) shadowClipped++;
          if (luma >= 254) highlightClipped++;
        }

        if (totalPixels === 0) throw new Error("Empty pixels");

        // Skala akar kuadrat (square root) untuk meregangkan dynamic range & meredam spike background
        let maxCount = 0;
        for (let i = 0; i < 256; i++) {
          rBins[i] = Math.sqrt(rBins[i]);
          gBins[i] = Math.sqrt(gBins[i]);
          bBins[i] = Math.sqrt(bBins[i]);
          lBins[i] = Math.sqrt(lBins[i]);

          if (rBins[i] > maxCount) maxCount = rBins[i];
          if (gBins[i] > maxCount) maxCount = gBins[i];
          if (bBins[i] > maxCount) maxCount = bBins[i];
          if (lBins[i] > maxCount) maxCount = lBins[i];
        }

        const norm = maxCount > 0 ? maxCount : 1;
        for (let i = 0; i < 256; i++) {
          rBins[i] /= norm;
          gBins[i] /= norm;
          bBins[i] /= norm;
          lBins[i] /= norm;
        }

        setHistogramData({
          r: Array.from(rBins),
          g: Array.from(gBins),
          b: Array.from(bBins),
          l: Array.from(lBins),
          avgLuma: Math.round(totalLuma / totalPixels),
          shadowClippedPct: ((shadowClipped / totalPixels) * 100).toFixed(1),
          highlightClippedPct: ((highlightClipped / totalPixels) * 100).toFixed(1),
          totalPixels,
        });
        setStatus("success");
      } catch (err) {
        if (!isMounted) return;
        setStatus("error");
      }
    };

    img.onerror = () => {
      if (!isMounted) return;
      setStatus("error");
    };

    return () => {
      isMounted = false;
    };
  }, [resolvedSrc]);

  // Kalkulasi path SVG per kanal
  const paths = useMemo(() => {
    if (!histogramData) return null;
    return {
      r: buildSvgPath(histogramData.r),
      g: buildSvgPath(histogramData.g),
      b: buildSvgPath(histogramData.b),
      l: buildSvgPath(histogramData.l),
    };
  }, [histogramData]);

  // Mouse handler untuk interactive scrubber
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(255, Math.round((x / rect.width) * 255)));
    setHoverIndex(clampedX);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoveredValues = useMemo(() => {
    if (hoverIndex == null || !histogramData) return null;
    return {
      index: hoverIndex,
      zone: getZoneName(hoverIndex),
      rVal: Math.round((histogramData.r[hoverIndex] || 0) * 100),
      gVal: Math.round((histogramData.g[hoverIndex] || 0) * 100),
      bVal: Math.round((histogramData.b[hoverIndex] || 0) * 100),
      lVal: Math.round((histogramData.l[hoverIndex] || 0) * 100),
    };
  }, [hoverIndex, histogramData]);

  return (
    <div
      className={`rounded-2xl border border-gray-200/90 bg-[#FAF8F5] p-4 text-stone-900 shadow-2xs ${className}`}
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <Gauge size={12} className="text-blue-600" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
            RGB Tonal Histogram
          </span>
        </div>

        {/* Channel Switcher */}
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-[11px] font-semibold shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveChannel("rgb")}
            className={`rounded-md px-2 py-0.5 transition-all ${
              activeChannel === "rgb"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-500 hover:text-stone-900 hover:bg-gray-50"
            }`}
          >
            RGB
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel("luma")}
            className={`rounded-md px-2 py-0.5 transition-all ${
              activeChannel === "luma"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-500 hover:text-stone-900 hover:bg-gray-50"
            }`}
          >
            Luma
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel("r")}
            className={`rounded-md px-2 py-0.5 transition-all ${
              activeChannel === "r"
                ? "bg-red-600 text-white shadow-xs"
                : "text-red-600 hover:bg-red-50"
            }`}
          >
            R
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel("g")}
            className={`rounded-md px-2 py-0.5 transition-all ${
              activeChannel === "g"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            G
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel("b")}
            className={`rounded-md px-2 py-0.5 transition-all ${
              activeChannel === "b"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-blue-600 hover:bg-blue-50"
            }`}
          >
            B
          </button>
        </div>
      </div>

      {/* Main Graph Stage */}
      <div className="relative mt-3">
        {status === "loading" ? (
          <div className="flex h-32 w-full items-center justify-center rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span className="h-2 w-2 animate-ping rounded-full bg-blue-500" />
              <span>Analyzing color channels...</span>
            </div>
          </div>
        ) : status === "error" || !histogramData ? (
          <div className="flex h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center">
            <AlertCircle size={20} className="text-stone-400 mb-1" />
            <p className="text-xs text-stone-600 font-medium">Histogram unavailable</p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              Cross-origin security or invalid image asset.
            </p>
          </div>
        ) : (
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative h-32 w-full cursor-crosshair overflow-hidden rounded-xl border border-gray-200/90 bg-white p-1 select-none shadow-inner"
          >
            {/* Background Grid Lines (25%, 50%, 75% Tonal Range) */}
            <div className="pointer-events-none absolute inset-0 flex justify-between px-1">
              <div className="h-full w-px border-r border-dashed border-gray-200" />
              <div className="h-full w-px border-r border-dashed border-gray-200" />
              <div className="h-full w-px border-r border-dashed border-gray-200" />
              <div className="h-full w-px border-r border-dashed border-gray-200" />
            </div>

            {/* SVG Visual Curves */}
            <svg
              viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
              preserveAspectRatio="none"
              className="h-full w-full overflow-visible"
            >
              <defs>
                <linearGradient id="grad-red" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="grad-green" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="grad-blue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="grad-luma" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#475569" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.03" />
                </linearGradient>
              </defs>

              {/* RGB Overlaid (Multiply blend mode simulates transparent color ink overlay on paper) */}
              {activeChannel === "rgb" && (
                <g style={{ mixBlendMode: "multiply" }}>
                  {paths?.r && (
                    <path
                      d={paths.r.fill}
                      fill="url(#grad-red)"
                      stroke="#DC2626"
                      strokeWidth="1.3"
                    />
                  )}
                  {paths?.g && (
                    <path
                      d={paths.g.fill}
                      fill="url(#grad-green)"
                      stroke="#059669"
                      strokeWidth="1.3"
                    />
                  )}
                  {paths?.b && (
                    <path
                      d={paths.b.fill}
                      fill="url(#grad-blue)"
                      stroke="#2563EB"
                      strokeWidth="1.3"
                    />
                  )}
                </g>
              )}

              {/* Luma Only */}
              {activeChannel === "luma" && paths?.l && (
                <path
                  d={paths.l.fill}
                  fill="url(#grad-luma)"
                  stroke="#334155"
                  strokeWidth="1.5"
                />
              )}

              {/* Red Only */}
              {activeChannel === "r" && paths?.r && (
                <path
                  d={paths.r.fill}
                  fill="url(#grad-red)"
                  stroke="#DC2626"
                  strokeWidth="1.5"
                />
              )}

              {/* Green Only */}
              {activeChannel === "g" && paths?.g && (
                <path
                  d={paths.g.fill}
                  fill="url(#grad-green)"
                  stroke="#059669"
                  strokeWidth="1.5"
                />
              )}

              {/* Blue Only */}
              {activeChannel === "b" && paths?.b && (
                <path
                  d={paths.b.fill}
                  fill="url(#grad-blue)"
                  stroke="#2563EB"
                  strokeWidth="1.5"
                />
              )}

              {/* Hover Cursor Line */}
              {hoverIndex != null && (
                <line
                  x1={hoverIndex}
                  y1={0}
                  x2={hoverIndex}
                  y2={VIEW_HEIGHT}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.8"
                />
              )}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredValues && (
              <div
                className="pointer-events-none absolute top-2 rounded-lg border border-gray-200 bg-white/95 px-2.5 py-1 text-[10px] shadow-md backdrop-blur-xs"
                style={{
                  left: hoverIndex > 140 ? "auto" : `${(hoverIndex / 255) * 85 + 5}%`,
                  right: hoverIndex > 140 ? `${100 - (hoverIndex / 255) * 100}%` : "auto",
                }}
              >
                <div className="flex items-center gap-2 font-bold text-stone-900">
                  <span>{hoveredValues.index}</span>
                  <span className="text-stone-500 font-normal">({hoveredValues.zone})</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[9px] font-mono">
                  {activeChannel === "rgb" ? (
                    <>
                      <span className="text-red-600 font-semibold">R:{hoveredValues.rVal}%</span>
                      <span className="text-emerald-700 font-semibold">G:{hoveredValues.gVal}%</span>
                      <span className="text-blue-600 font-semibold">B:{hoveredValues.bVal}%</span>
                    </>
                  ) : activeChannel === "luma" ? (
                    <span className="text-stone-800 font-semibold">Luma: {hoveredValues.lVal}%</span>
                  ) : activeChannel === "r" ? (
                    <span className="text-red-600 font-semibold">Red: {hoveredValues.rVal}%</span>
                  ) : activeChannel === "g" ? (
                    <span className="text-emerald-700 font-semibold">Green: {hoveredValues.gVal}%</span>
                  ) : (
                    <span className="text-blue-600 font-semibold">Blue: {hoveredValues.bVal}%</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tonal Range Gradient Bar (0 = Black, 255 = White) */}
        <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full border border-gray-300 shadow-2xs">
          <div className="h-full w-full bg-gradient-to-r from-black via-stone-400 to-white" />
        </div>

        {/* Zone Labels */}
        <div className="mt-1 flex justify-between text-[9px] font-semibold text-stone-400">
          <span>0 (Blacks)</span>
          <span>Shadows</span>
          <span>Midtones</span>
          <span>Highlights</span>
          <span>255 (Whites)</span>
        </div>
      </div>

      {/* Exposure Metrics & Clipping Warnings */}
      {histogramData && (
        <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-gray-200/80 pt-3 text-[11px]">
          {/* Mean Brightness */}
          <div className="rounded-xl bg-white p-2 border border-gray-200 shadow-2xs">
            <span className="text-[10px] font-medium text-stone-400">Avg Luminance</span>
            <p className="mt-0.5 font-mono text-xs font-bold text-stone-800">
              {histogramData.avgLuma} / 255
            </p>
          </div>

          {/* Shadow Clipping Warning */}
          <div
            className={`rounded-xl p-2 border shadow-2xs ${
              Number(histogramData.shadowClippedPct) > 1.0
                ? "bg-blue-50 border-blue-200 text-blue-900"
                : "bg-white border-gray-200 text-stone-700"
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] font-medium text-stone-400">
              {Number(histogramData.shadowClippedPct) > 1.0 && (
                <AlertTriangle size={10} className="text-blue-600 shrink-0" />
              )}
              <span className={Number(histogramData.shadowClippedPct) > 1.0 ? "text-blue-700" : ""}>
                Shadow Clip
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs font-bold">
              {histogramData.shadowClippedPct}%
            </p>
          </div>

          {/* Highlight Clipping Warning */}
          <div
            className={`rounded-xl p-2 border shadow-2xs ${
              Number(histogramData.highlightClippedPct) > 1.0
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-white border-gray-200 text-stone-700"
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] font-medium text-stone-400">
              {Number(histogramData.highlightClippedPct) > 1.0 && (
                <AlertTriangle size={10} className="text-red-600 shrink-0" />
              )}
              <span className={Number(histogramData.highlightClippedPct) > 1.0 ? "text-red-700" : ""}>
                Highlight Clip
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs font-bold">
              {histogramData.highlightClippedPct}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
