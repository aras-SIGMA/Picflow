"use client";

// src/components/AccountInsightChart.jsx
// Visualisasi grafik kurva insight performa akun fotografer:
// - Pilihan rentang waktu: 7 Days (7d), 30 Days (30d), dan 90 Days (90d)
// - Pilihan metrik: Total Engagement, Likes, New Followers, Critiques, Comments
// - Kurva SVG dinamis dengan area gradient fill dan grid horizontal
// - Interaksi hover scrubber untuk inspeksi detail data per tanggal

import { useMemo, useRef, useState } from "react";
import {
  Activity,
  Heart,
  MessageSquare,
  Sparkles,
  TrendingUp,
  UserPlus,
} from "lucide-react";

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 180;
const PADDING = { top: 20, right: 20, bottom: 30, left: 20 };

const METRIC_CONFIG = {
  total_engagement: {
    label: "Total Engagement",
    color: "#2563EB",
    gradientId: "grad-engagement",
    fillColor: "#2563EB",
    icon: Activity,
  },
  likes: {
    label: "Likes Received",
    color: "#DC2626",
    gradientId: "grad-likes",
    fillColor: "#DC2626",
    icon: Heart,
  },
  followers: {
    label: "New Followers",
    color: "#059669",
    gradientId: "grad-followers",
    fillColor: "#059669",
    icon: UserPlus,
  },
  critiques: {
    label: "Critiques Received",
    color: "#7C3AED",
    gradientId: "grad-critiques",
    fillColor: "#7C3AED",
    icon: Sparkles,
  },
  comments: {
    label: "Comments",
    color: "#D97706",
    gradientId: "grad-comments",
    fillColor: "#D97706",
    icon: MessageSquare,
  },
};

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export default function AccountInsightChart({
  timeline = [],
  period = "30d",
  onPeriodChange,
  className = "",
}) {
  const [activeMetric, setActiveMetric] = useState("total_engagement");
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  const metricConfig = METRIC_CONFIG[activeMetric] || METRIC_CONFIG.total_engagement;
  const MetricIcon = metricConfig.icon;

  // Siapkan data point untuk grafik
  const chartData = useMemo(() => {
    if (!timeline || timeline.length === 0) return [];
    return timeline.map((item) => ({
      ...item,
      value: item[activeMetric] ?? 0,
      formattedDate: formatDateLabel(item.date),
    }));
  }, [timeline, activeMetric]);

  // Hitung nilai maksimum dan skala
  const { maxVal, totalMetricSum, avgDaily } = useMemo(() => {
    if (chartData.length === 0) {
      return { maxVal: 5, totalMetricSum: 0, avgDaily: 0 };
    }
    const sum = chartData.reduce((acc, d) => acc + d.value, 0);
    const max = Math.max(...chartData.map((d) => d.value), 4);
    const avg = +(sum / chartData.length).toFixed(1);
    return {
      maxVal: Math.ceil(max * 1.15),
      totalMetricSum: sum,
      avgDaily: avg,
    };
  }, [chartData]);

  // Hitung path kurva SVG
  const { pathD, areaD, points } = useMemo(() => {
    const len = chartData.length;
    if (len === 0) return { pathD: "", areaD: "", points: [] };

    const graphWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
    const graphHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom;

    const computedPoints = chartData.map((item, index) => {
      const x = PADDING.left + (index / (len - 1 || 1)) * graphWidth;
      const y = PADDING.top + graphHeight - (item.value / (maxVal || 1)) * graphHeight;
      return { x: +x.toFixed(1), y: +y.toFixed(1), ...item };
    });

    if (computedPoints.length === 1) {
      const p = computedPoints[0];
      return {
        pathD: `M ${p.x - 20},${p.y} L ${p.x + 20},${p.y}`,
        areaD: `M ${p.x - 20},${VIEW_HEIGHT - PADDING.bottom} L ${p.x - 20},${p.y} L ${p.x + 20},${p.y} L ${p.x + 20},${VIEW_HEIGHT - PADDING.bottom} Z`,
        points: computedPoints,
      };
    }

    // Bangun kurva halus (Catmull-Rom atau cubic bezier approximation)
    let d = `M ${computedPoints[0].x},${computedPoints[0].y}`;
    for (let i = 0; i < computedPoints.length - 1; i++) {
      const curr = computedPoints[i];
      const next = computedPoints[i + 1];
      const mx = (curr.x + next.x) / 2;
      d += ` C ${mx},${curr.y} ${mx},${next.y} ${next.x},${next.y}`;
    }

    const baselineY = VIEW_HEIGHT - PADDING.bottom;
    const area = `${d} L ${computedPoints[computedPoints.length - 1].x},${baselineY} L ${computedPoints[0].x},${baselineY} Z`;

    return { pathD: d, areaD: area, points: computedPoints };
  }, [chartData, maxVal]);

  // Handler interaksi mouse move
  const handleMouseMove = (e) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const targetIdx = Math.round(ratio * (points.length - 1));
    setHoverIndex(targetIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div
      className={`rounded-2xl border border-gray-200/90 bg-[#FAF8F5] p-5 shadow-2xs ${className}`}
    >
      {/* Header: Title & Time Period Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: metricConfig.color }}
            >
              <TrendingUp size={13} />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-stone-900">
              Account Activity &amp; Growth Insights
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            Real-time engagement breakdown over selected time window
          </p>
        </div>

        {/* Time Period Selector Tabs */}
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5 text-xs font-semibold shadow-2xs">
          <button
            type="button"
            onClick={() => onPeriodChange?.("7d")}
            className={`rounded-lg px-2.5 py-1 text-[11px] transition-all ${
              period === "7d"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange?.("30d")}
            className={`rounded-lg px-2.5 py-1 text-[11px] transition-all ${
              period === "30d"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            30 Days
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange?.("90d")}
            className={`rounded-lg px-2.5 py-1 text-[11px] transition-all ${
              period === "90d" || period === "all"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Metric Selector Pills & Current Totals */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(METRIC_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = activeMetric === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveMetric(key);
                  setHoverIndex(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-white font-semibold text-stone-900 shadow-xs border border-gray-300 ring-2 ring-stone-900/5"
                    : "border border-gray-200 bg-white/70 text-stone-600 hover:bg-white hover:text-stone-900"
                }`}
              >
                <Icon
                  size={12}
                  style={{ color: isSelected ? config.color : "#78716C" }}
                />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick summary for current metric */}
        <div className="flex items-center gap-4 text-xs font-medium text-stone-500">
          <div>
            <span>Total in window: </span>
            <strong className="font-mono font-bold text-stone-900">
              {totalMetricSum}
            </strong>
          </div>
          <div>
            <span>Daily avg: </span>
            <strong className="font-mono font-bold text-stone-900">
              {avgDaily}
            </strong>
          </div>
        </div>
      </div>

      {/* Main SVG Chart Canvas */}
      <div className="relative mt-4">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative h-44 w-full cursor-crosshair overflow-hidden rounded-xl border border-gray-200/90 bg-white select-none shadow-2xs"
        >
          {/* Subtle Grid Lines (0%, 50%, 100%) */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-5 px-3">
            <div className="w-full border-b border-dashed border-gray-100" />
            <div className="w-full border-b border-dashed border-gray-100" />
            <div className="w-full border-b border-gray-200/80" />
          </div>

          <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient
                id={metricConfig.gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={metricConfig.fillColor}
                  stopOpacity="0.28"
                />
                <stop
                  offset="100%"
                  stopColor={metricConfig.fillColor}
                  stopOpacity="0.0"
                />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            {areaD && (
              <path d={areaD} fill={`url(#${metricConfig.gradientId})`} />
            )}

            {/* Stroke Curve */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={metricConfig.color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Dots (for 7-day mode) */}
            {period === "7d" &&
              points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill="#FFFFFF"
                  stroke={metricConfig.color}
                  strokeWidth="2"
                />
              ))}

            {/* Vertical Scrubber Cursor Line */}
            {hoveredPoint && (
              <>
                <line
                  x1={hoveredPoint.x}
                  y1={PADDING.top}
                  x2={hoveredPoint.x}
                  y2={VIEW_HEIGHT - PADDING.bottom}
                  stroke={metricConfig.color}
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="5"
                  fill={metricConfig.color}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className="shadow-sm"
                />
              </>
            )}
          </svg>

          {/* Interactive Tooltip Overlay */}
          {hoveredPoint && (
            <div
              className="pointer-events-none absolute top-3 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-xs transition-transform"
              style={{
                left:
                  hoverIndex > points.length / 2
                    ? "auto"
                    : `${(hoveredPoint.x / VIEW_WIDTH) * 90 + 5}%`,
                right:
                  hoverIndex > points.length / 2
                    ? `${100 - (hoveredPoint.x / VIEW_WIDTH) * 100 + 2}%`
                    : "auto",
              }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-1 font-semibold text-stone-900">
                <span>{hoveredPoint.formattedDate}</span>
                <span
                  className="rounded-full px-2 py-0.2 text-[10px] font-bold text-white"
                  style={{ backgroundColor: metricConfig.color }}
                >
                  +{hoveredPoint.value}
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-stone-500 font-mono">
                <div>
                  Likes: <span className="font-bold text-stone-800">{hoveredPoint.likes}</span>
                </div>
                <div>
                  Follows: <span className="font-bold text-stone-800">{hoveredPoint.followers}</span>
                </div>
                <div>
                  Critiques: <span className="font-bold text-stone-800">{hoveredPoint.critiques}</span>
                </div>
                <div>
                  Comments: <span className="font-bold text-stone-800">{hoveredPoint.comments}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Date Axis Labels */}
        <div className="mt-2 flex justify-between text-[10px] font-semibold text-stone-400 px-1">
          <span>{chartData[0]?.formattedDate || "Start"}</span>
          {chartData.length > 2 && (
            <span>
              {chartData[Math.floor(chartData.length / 2)]?.formattedDate}
            </span>
          )}
          <span>
            {chartData[chartData.length - 1]?.formattedDate || "Today"}
          </span>
        </div>
      </div>
    </div>
  );
}
