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

export default function Field({ label, error, hint, children }) {
  const autoId = useId();
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(
    () => Boolean(children?.props?.value || children?.props?.defaultValue),
  );

  const child = Array.isArray(children) ? children[0] : children;
  const childId = child.props.id || autoId;
  const active = focused || hasValue;

  const enhancedChild = cloneElement(child, {
    id: childId,
    placeholder: "",
    className: `h-full w-full bg-transparent px-4 pt-4 pb-2 text-sm text-ink focus:outline-none ${child.props.className || ""}`,
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
        className={`relative flex h-[52px] items-center rounded-[var(--radius-sm)] border bg-[var(--bg-elevated)] transition-colors duration-300 ${
          error
            ? "border-[var(--danger)]/60"
            : active
              ? "border-accent"
              : "border-line focus-within:border-accent"
        }`}
      >
        <label
          htmlFor={childId}
          className={`pointer-events-none absolute z-10 transition-all duration-300 ${
            active
              ? "left-3 top-1 text-[11px] leading-none text-accent"
              : "left-4 top-1/2 -translate-y-1/2 text-sm text-muted"
          }`}
        >
          {label}
        </label>
        {enhancedChild}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}
