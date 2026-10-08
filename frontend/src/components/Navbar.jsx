"use client";

// src/components/Navbar.jsx
// Navbar minimal: logo kiri, link tipis kanan (desktop) / menu drawer
// (mobile). Sticky transparan -> solid saat scroll, indikator underline
// aktif bergerak via layoutId.
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EASE } from "@/components/ui/motion";

const LINKS = [
  { href: "/home", label: "Home" },
  { href: "/addphoto", label: "Add Photo" },
  { href: "/account", label: "Account" },
];

function NavLink({ href, label, onClick }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative px-1 py-1 text-sm transition-colors ${
        active ? "text-ink" : "text-muted hover:text-ink"
      }`}
    >
      {label}
      {active && (
        <motion.span
          layoutId="nav-underline"
          transition={{ duration: 0.4, ease: EASE }}
          className="absolute -bottom-0.5 left-0 right-0 h-px bg-white"
        />
      )}
    </Link>
  );
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Transisi transparan -> solid saat scroll.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={`sticky top-0 z-40 transition-colors duration-500 ${
        scrolled
          ? "border-b border-line bg-[var(--bg)]/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href={user ? "/home" : "/login"}
          className="text-base font-bold tracking-tight text-ink"
        >
          PicFlow
        </Link>

        {/* Desktop */}
        {loading ? null : user ? (
          <div className="hidden items-center gap-7 sm:flex">
            {LINKS.map((l) => (
              <NavLink key={l.href} {...l} />
            ))}
            <button
              onClick={logout}
              className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-muted transition-colors hover:border-white/40 hover:text-ink"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="hidden items-center gap-7 sm:flex">
            <Link href="/login" className="text-sm text-muted transition-colors hover:text-ink">
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-white/85"
            >
              Register
            </Link>
          </div>
        )}

        {/* Mobile: tombol menu (hanya saat sudah login) */}
        {!loading && user && (
          <button
            className="rounded-full border border-line p-2 text-muted sm:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        )}
      </nav>

      {/* Drawer mobile (fade + slide, tanpa animasi height) */}
      <AnimatePresence>
        {menuOpen && user && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="border-b border-line bg-[var(--bg)]/95 backdrop-blur-md sm:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {LINKS.map((l) => (
                <NavLink key={l.href} {...l} onClick={() => setMenuOpen(false)} />
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="mt-1 w-fit rounded-full border border-white/15 px-4 py-1.5 text-sm text-muted"
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
