"use client";

// src/components/AccountInsightChart.jsx
// Grafik insight performa akun (7d / 30d / 90d):
// - Pilihan metrik: Total Engagement, Likes, New Followers, Critiques, Comments
// - Kurva SVG + area gradient, grid horizontal, scrubber hover
// - Tampilan memakai token --pf-* dari globals.css (tema terang)

import { useMemo, useRef, useState } from "react";
import {
  Activity,
  Heart,
  MessageSquare,
  Sparkles,
  UserPlus,
} from "lucide-react";

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 180;
const PADDING = { top: 20, right: 20, bottom: 30, left: 20 };

const METRIC_CONFIG = {
  total_engagement: {
    label: "Engagement",
    color: "#2563EB",
    gradientId: "grad-engagement",
    icon: Activity,
  },
  likes: {
    label: "Likes",
    color: "#D62B2B",
    gradientId: "grad-likes",
    icon: Heart,
  },
  followers: {
    label: "Followers",
    color: "#16A34A",
    gradientId: "grad-followers",
    icon: UserPlus,
  },
  critiques: {
    label: "Critiques",
    color: "#7C3AED",
    gradientId: "grad-critiques",
    icon: Sparkles,
  },
  comments: {
    label: "Comments",
    color: "#D97706",
    gradientId: "grad-comments",
    icon: MessageSquare,
  },
};

const PERIODS = [
  { id: "7d", label: "7D", long: "7 hari terakhir" },
  { id: "30d", label: "30D", long: "30 hari terakhir" },
  { id: "90d", label: "90D", long: "90 hari terakhir" },
];

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const d = new Date(
    Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  );
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
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

  const metricConfig =
    METRIC_CONFIG[activeMetric] || METRIC_CONFIG.total_engagement;

  const chartData = useMemo(
    () =>
      timeline.map((item) => ({
        ...item,
        value: item[activeMetric] ?? 0,
        formattedDate: formatDateLabel(item.date),
      })),
    [timeline, activeMetric]
  );

  const { maxVal, totalMetricSum, avgDaily } = useMemo(() => {
    if (chartData.length === 0)
      return { maxVal: 5, totalMetricSum: 0, avgDaily: 0 };
    const sum = chartData.reduce((acc, d) => acc + d.value, 0);
    const max = Math.max(...chartData.map((d) => d.value), 4);
    return {
      maxVal: Math.ceil(max * 1.15),
      totalMetricSum: sum,
      avgDaily: +(sum / chartData.length).toFixed(1),
    };
  }, [chartData]);

  const { pathD, areaD, points } = useMemo(() => {
    const len = chartData.length;
    if (len === 0) return { pathD: "", areaD: "", points: [] };

    const graphWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
    const graphHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom;

    const computedPoints = chartData.map((item, index) => {
      const x = PADDING.left + (index / (len - 1 || 1)) * graphWidth;
      const y =
        PADDING.top + graphHeight - (item.value / (maxVal || 1)) * graphHeight;
      return { x: +x.toFixed(1), y: +y.toFixed(1), ...item };
    });

    if (computedPoints.length === 1) {
      const p = computedPoints[0];
      const base = VIEW_HEIGHT - PADDING.bottom;
      return {
        pathD: `M ${p.x - 20},${p.y} L ${p.x + 20},${p.y}`,
        areaD: `M ${p.x - 20},${base} L ${p.x - 20},${p.y} L ${p.x + 20},${p.y} L ${p.x + 20},${base} Z`,
        points: computedPoints,
      };
    }

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

  const handleMouseMove = (e) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverIndex(Math.round(ratio * (points.length - 1)));
  };

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <section
      aria-label="Account activity and growth"
      className={`rounded-[16px] border border-[color:var(--pf-border)] bg-[var(--pf-surface)] p-4 shadow-[var(--pf-shadow-surface)] ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[13.5px] font-semibold text-ink">
            Account Activity &amp; Growth
          </h2>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[12.5px] text-[color:var(--pf-text-muted)]">
            <span className="text-[19px] font-semibold tabular-nums tracking-[-0.025em] text-ink">
              {totalMetricSum}
            </span>
            <span className="tabular-nums">
              {metricConfig.label.toLowerCase()} · avg {avgDaily}/hari
            </span>
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Rentang waktu"
          className="inline-grid grid-cols-3 rounded-[11px] border border-[color:var(--pf-border)] bg-[var(--pf-surface-active)]/60 p-[3px] shadow-[var(--pf-shadow-inset)]"
        >
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={period === p.id}
              aria-label={p.long}
              onClick={() => onPeriodChange?.(p.id)}
              className={`h-7 min-w-[46px] cursor-pointer rounded-[8px] font-mono text-[11.5px] font-medium tabular-nums transition-colors ${
                period === p.id
                  ? "bg-[var(--pf-surface)] text-ink shadow-[var(--pf-shadow-soft),0_0_0_1px_var(--pf-border)]"
                  : "text-[color:var(--pf-text-muted)] hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
        {Object.entries(METRIC_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const isSelected = activeMetric === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                setActiveMetric(key);
                setHoverIndex(null);
              }}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                isSelected
                  ? "border-[color:var(--pf-border-strong)] bg-[var(--pf-surface-active)] font-medium text-ink"
                  : "border-transparent text-[color:var(--pf-text-muted)] hover:bg-[var(--pf-surface-hover)] hover:text-ink"
              }`}
            >
              <Icon size={12} style={{ color: config.color }} aria-hidden="true" />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      <div className="relative mt-3">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          className="relative h-44 w-full cursor-crosshair select-none overflow-hidden rounded-[12px] border border-[color:var(--pf-border)] bg-[var(--pf-field)]"
        >
          <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
            aria-hidden="true"
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
                  stopColor={metricConfig.color}
                  stopOpacity="0.22"
                />
                <stop
                  offset="100%"
                  stopColor={metricConfig.color}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75].map((t) => (
              <line
                key={t}
                x1={PADDING.left}
                x2={VIEW_WIDTH - PADDING.right}
                y1={PADDING.top + t * (VIEW_HEIGHT - PADDING.top - PADDING.bottom)}
                y2={PADDING.top + t * (VIEW_HEIGHT - PADDING.top - PADDING.bottom)}
                stroke="var(--pf-border)"
                strokeDasharray="2 4"
              />
            ))}

            {areaD && (
              <path d={areaD} fill={`url(#${metricConfig.gradientId})`} />
            )}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={metricConfig.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {period === "7d" &&
              points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill="var(--pf-surface)"
                  stroke={metricConfig.color}
                  strokeWidth="2"
                />
              ))}

            {hoveredPoint && (
              <>
                <line
                  x1={hoveredPoint.x}
                  y1={PADDING.top}
                  x2={hoveredPoint.x}
                  y2={VIEW_HEIGHT - PADDING.bottom}
                  stroke="var(--pf-border-strong)"
                />
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="4.5"
                  fill={metricConfig.color}
                  stroke="var(--pf-surface)"
                  strokeWidth="2.5"
                />
              </>
            )}
          </svg>

          {hoveredPoint && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-3 rounded-[12px] border border-[color:var(--pf-border)] bg-[var(--pf-surface)]/95 px-2.5 py-2 text-[11.5px] shadow-[var(--pf-shadow-surface)] backdrop-blur-xs"
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
              <div className="flex items-center justify-between gap-3 border-b border-[color:var(--pf-border)] pb-1 font-medium text-ink">
                <span>{hoveredPoint.formattedDate}</span>
                <span
                  className="rounded-full px-1.5 font-mono text-[10px] font-semibold text-white"
                  style={{ backgroundColor: metricConfig.color }}
                >
                  +{hoveredPoint.value}
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[10px] text-[color:var(--pf-text-muted)]">
                <div>
                  Likes:{" "}
                  <span className="font-semibold text-ink">
                    {hoveredPoint.likes}
                  </span>
                </div>
                <div>
                  Follows:{" "}
                  <span className="font-semibold text-ink">
                    {hoveredPoint.followers}
                  </span>
                </div>
                <div>
                  Critiques:{" "}
                  <span className="font-semibold text-ink">
                    {hoveredPoint.critiques}
                  </span>
                </div>
                <div>
                  Comments:{" "}
                  <span className="font-semibold text-ink">
                    {hoveredPoint.comments}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-2 flex justify-between px-1 font-mono text-[10px] text-[color:var(--pf-text-soft)]">
          <span>{chartData[0]?.formattedDate || "Start"}</span>
          {chartData.length > 2 && (
            <span>
              {chartData[Math.floor(chartData.length / 2)]?.formattedDate}
            </span>
          )}
          <span>{chartData[chartData.length - 1]?.formattedDate || "Today"}</span>
        </div>
      </div>
    </section>
  );
}
