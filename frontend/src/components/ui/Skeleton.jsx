// src/components/ui/Skeleton.jsx
// Placeholder shimmer untuk state loading (bentuk diatur via className/style).
export default function Skeleton({ className = "", style }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton rounded-[var(--radius-sm)] ${className}`}
      style={style}
    />
  );
}
