"use client";

// src/components/ui/Select.jsx
// Combobox custom bergaya pill: tombol pemicu + panel beranimasi.
// Aksesibel: aria-expanded/listbox/option, ESC & klik luar menutup.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { EASE } from "./motion";

export default function Select({
  value,
  onChange,
  options = [],
  placeholder = "Pilih...",
  label,
  error,
  id,
  required,
  variant = "default",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));
  const isLight = variant === "light";

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${
          isLight
            ? error
              ? "border-red-400 bg-red-50/50"
              : open
                ? "border-blue-600 ring-2 ring-blue-500/10 bg-white"
                : "border-[#DCD0BE] bg-white hover:border-stone-400 shadow-2xs"
            : error
              ? "border-[var(--danger)]/60 bg-[var(--bg-elevated)]"
              : open
                ? "border-accent bg-[var(--bg-elevated)]"
                : "border-line bg-[var(--bg-elevated)]"
        }`}
      >
        <span
          className={
            selected
              ? isLight
                ? "text-stone-900 font-medium"
                : "text-ink"
              : isLight
                ? "text-stone-400"
                : "text-muted"
          }
        >
          {selected ? selected.label : `${placeholder}${required ? " *" : ""}`}
        </span>
        <ChevronDown
          size={16}
          className={`${isLight ? "text-stone-400" : "text-muted"} transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE }}
            className={`absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border p-1 shadow-xl ${
              isLight
                ? "border-[#E8DEC9] bg-white text-stone-900"
                : "border-line bg-[var(--surface)] shadow-overlay"
            }`}
          >
            {options.length === 0 && (
              <li className={`px-3 py-2 text-sm ${isLight ? "text-stone-400" : "text-faint"}`}>
                Tidak ada opsi
              </li>
            )}
            {options.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={String(o.value) === String(value)}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                    String(o.value) === String(value)
                      ? isLight
                        ? "bg-blue-50 font-bold text-blue-700"
                        : "bg-accent/15 text-ink"
                      : isLight
                        ? "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                        : "text-muted hover:bg-white/5 hover:text-ink"
                  }`}
                >
                  <span>{o.label}</span>
                  {String(o.value) === String(value) && (
                    <Check size={14} className={isLight ? "text-blue-600" : "text-accent"} />
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
