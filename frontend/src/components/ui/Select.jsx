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
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));

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
        className={`flex w-full items-center justify-between rounded-[var(--radius-sm)] border bg-[var(--bg-elevated)] px-4 py-3 text-left text-sm transition-colors ${
          error ? "border-[var(--danger)]/60" : open ? "border-accent" : "border-line"
        }`}
      >
        <span className={selected ? "text-ink" : "text-muted"}>
          {selected ? selected.label : `${placeholder}${required ? " *" : ""}`}
        </span>
        <ChevronDown
          size={16}
          className={`text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
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
            className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-[var(--radius-sm)] border border-line bg-[var(--surface)] p-1 shadow-xl shadow-black/40"
          >
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-faint">Tidak ada opsi</li>
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
                      ? "bg-accent/15 text-ink"
                      : "text-muted hover:bg-white/5 hover:text-ink"
                  }`}
                >
                  {o.label}
                  {String(o.value) === String(value) && (
                    <Check size={14} className="text-accent" />
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
