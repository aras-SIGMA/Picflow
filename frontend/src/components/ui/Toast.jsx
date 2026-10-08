"use client";

// src/components/ui/Toast.jsx
// Sistem toast global via context: <ToastProvider> di root layout,
// halaman memanggil useToast().success("...") / .error("...") / .info("...").
// Masuk-keluar beranimasi; aria-live agar screen reader mendengar.
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { EASE } from "./motion";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};
const COLORS = {
  success: "text-[var(--success)]",
  error: "text-[var(--danger)]",
  info: "text-accent2",
};

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((message, type = "info") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const api = useMemo(
    () => ({
      success: (m) => push(m, "success"),
      error: (m) => push(m, "error"),
      info: (m) => push(m, "info"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-[110] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || Info;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="pointer-events-auto flex w-full items-center gap-3 rounded-full border border-line bg-[var(--surface)]/95 px-4 py-3 shadow-xl shadow-black/40 backdrop-blur"
              >
                <Icon size={18} className={`shrink-0 ${COLORS[t.type] || COLORS.info}`} />
                <p className="text-sm text-ink">{t.message}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
