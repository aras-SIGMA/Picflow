// src/components/ui/DashboardKpi.jsx
// Kartu metrik dashboard: label, nilai besar, catatan, dan sparkline mini
// dari seri timeline yang sudah ada (tidak mengarang data periode lain).

const W = 76;
const H = 30;

// Monotone cubic: kurva tidak pernah melewati titik data.
function smoothPath(pts) {
  if (pts.length < 2) return "";
  const n = pts.length;
  const dx = [];
  const slope = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    slope.push((pts[i + 1][1] - pts[i][1]) / (dx[i] || 1));
  }
  const m = [slope[0]];
  for (let i = 1; i < n - 1; i += 1) {
    m.push(
      slope[i - 1] * slope[i] <= 0
        ? 0
        : (3 * (dx[i - 1] + dx[i])) /
            ((2 * dx[i] + dx[i - 1]) / slope[i - 1] +
              (dx[i] + 2 * dx[i - 1]) / slope[i])
    );
  }
  m.push(slope[n - 2]);

  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n - 1; i += 1) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = dx[i] / 3;
    d += ` C ${(x0 + h).toFixed(2)} ${(y0 + m[i] * h).toFixed(2)}, ${(
      x1 - h
    ).toFixed(2)} ${(y1 - m[i + 1] * h).toFixed(2)}, ${x1.toFixed(2)} ${y1.toFixed(
      2
    )}`;
  }
  return d;
}

function Sparkline({ values = [], color, id }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * (W - 4) + 2,
    H - 3 - ((v - min) / (max - min || 1)) * (H - 6),
  ]);
  const d = smoothPath(pts);
  const last = pts[pts.length - 1];
  const gid = `spark-${id}`;

  return (
    <svg
      aria-hidden="true"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="hidden shrink-0 overflow-visible sm:block"
    >
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.16" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${last[0]} ${H} L ${pts[0][0]} ${H} Z`} fill={`url(#${gid})`} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.75" fill={color} />
    </svg>
  );
}

export default function DashboardKpi({
  id,
  label,
  value,
  note,
  spark = [],
  color = "var(--pf-text-soft)",
}) {
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-[16px] border border-[color:var(--pf-border)] bg-[var(--pf-surface)] p-3.5 shadow-[var(--pf-shadow-surface)] sm:p-4">
      <h3 className="text-[12.5px] font-medium text-[color:var(--pf-text-muted)]">
        {label}
      </h3>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-[21px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-ink sm:text-[26px]">
            {value}
          </p>
          {note && (
            <p className="mt-2.5 truncate text-[11.5px] text-[color:var(--pf-text-soft)]">
              {note}
            </p>
          )}
        </div>
        <Sparkline values={spark} color={color} id={id} />
      </div>
    </article>
  );
}
