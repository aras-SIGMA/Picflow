"use client";

// src/components/ui/Modal.jsx
// Modal dasar: backdrop blur, ESC/klik luar menutup, focus trap sederhana,
// kunci scroll body, dan kembalikan fokus ke elemen pembuka saat ditutup.
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { EASE } from "./motion";

export default function Modal({ open, onClose, children, labelledBy, wide = false }) {
  const panelRef = useRef(null);
  // Ref agar efek tidak re-run tiap render (onClose biasanya inline arrow).
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;

    function onKey(e) {
      if (e.key === "Escape") onCloseRef.current?.();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      // Kembalikan fokus ke pemicu modal (a11y).
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, [open]);

  // Focus trap: Tab berputar di dalam panel.
  function trapFocus(e) {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
          onKeyDown={trapFocus}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.4, ease: EASE }}
            className={`relative w-full ${wide ? "max-w-4xl" : "max-w-md"} rounded-[var(--radius-md)] border border-line bg-[var(--bg-elevated)] p-6 outline-none`}
          >
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="absolute right-4 top-4 rounded-full border border-line p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-ink"
            >
              <X size={16} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
