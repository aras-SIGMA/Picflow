"use client";

// src/components/ui/Field.jsx
// Wrapper input dengan floating label:
// - Tinggi seragam (52px) di semua halaman.
// - Label MELAYANG DI DALAM kotak (tidak pernah keluar dari border):
//   idle = label di tengah seperti placeholder, aktif = label mengecil
//   ke pojok kiri-atas, dan input selalu punya ruang teks di bawahnya
//   (pt-4) supaya teks & label tidak bertabrakan.
// - Padding input dikelola Field agar konsisten; halaman cukup mengirim
//   tambahan khusus (mis. pr-12 untuk toggle password).
// - Pesan error/hint tampil inline di bawah.
import { cloneElement, useId, useState } from "react";

export default function Field({
  label,
  error,
  hint,
  variant = "default", // "default" (dark canvas) | "light" (clean high-key canvas)
  children,
}) {
  const autoId = useId();
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(
    () => Boolean(children?.props?.value || children?.props?.defaultValue),
  );

  const child = Array.isArray(children) ? children[0] : children;
  const childId = child.props.id || autoId;
  const active = focused || hasValue;
  const isLight = variant === "light";

  const enhancedChild = cloneElement(child, {
    id: childId,
    placeholder: "",
    className: `h-full w-full bg-transparent px-4 pt-4 pb-2 text-sm focus:outline-none ${
      isLight ? "text-slate-900 placeholder:text-slate-400" : "text-ink"
    } ${child.props.className || ""}`,
    onFocus: (e) => {
      setFocused(true);
      child.props.onFocus?.(e);
    },
    onBlur: (e) => {
      setFocused(false);
      setHasValue(Boolean(e.target.value));
      child.props.onBlur?.(e);
    },
    onChange: (e) => {
      setHasValue(Boolean(e.target.value));
      child.props.onChange?.(e);
    },
  });

  return (
    <div>
      <div
        className={`relative flex h-[54px] items-center rounded-2xl border transition-all duration-200 ${
          isLight
            ? error
              ? "border-red-400 bg-red-50/20 ring-3 ring-red-400/10"
              : active
                ? "border-blue-600 bg-white ring-4 ring-blue-500/10 shadow-sm"
                : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
            : error
              ? "border-[var(--danger)]/60 bg-[var(--bg-elevated)]"
              : active
                ? "border-accent bg-[var(--bg-elevated)]"
                : "border-line bg-[var(--bg-elevated)] focus-within:border-accent"
        }`}
      >
        <label
          htmlFor={childId}
          className={`pointer-events-none absolute z-10 transition-all duration-200 ${
            active
              ? isLight
                ? "left-4 top-1.5 text-[11px] font-semibold text-blue-600 leading-none"
                : "left-3 top-1 text-[11px] leading-none text-accent"
              : isLight
                ? "left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400"
                : "left-4 top-1/2 -translate-y-1/2 text-sm text-muted"
          }`}
        >
          {label}
        </label>
        {enhancedChild}
      </div>
      {error ? (
        <p className={`mt-1.5 text-xs ${isLight ? "text-red-500 font-medium" : "text-danger"}`}>
          {error}
        </p>
      ) : hint ? (
        <p className={`mt-1.5 text-xs ${isLight ? "text-slate-400" : "text-faint"}`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
