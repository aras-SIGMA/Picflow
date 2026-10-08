// src/components/ui/PillBadge.jsx
// Badge pill kecil dengan dot indikator (hijau default) seperti referensi.
export default function PillBadge({
  children,
  dotColor = "bg-[var(--success)]",
  className = "",
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-line bg-[var(--bg-elevated)] px-3.5 py-1.5 text-xs font-medium text-muted ${className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {children}
    </span>
  );
}
