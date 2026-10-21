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
import Logo from "@/components/ui/Logo";
import { EASE } from "@/components/ui/motion";

const LINKS = [
  { href: "/home", label: "Home" },
  { href: "/search", label: "Search" },
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
      className={`relative px-1 py-1 text-sm font-medium transition-colors ${
        active ? "text-stone-900 font-semibold" : "text-stone-600 hover:text-stone-900"
      }`}
    >
      {label}
      {active && (
        <motion.span
          layoutId="nav-underline"
          transition={{ duration: 0.4, ease: EASE }}
          className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-blue-600"
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
          ? "border-b border-[#E8DEC9] bg-[#FFFDF6]/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5">
        <Link
          href={user ? "/home" : "/login"}
          aria-label="PicFlow Home"
          className="inline-flex items-center transition-transform duration-200 hover:scale-[1.02]"
        >
          <Logo variant="lockup" size={32} showTagline={false} inverted={false} />
        </Link>

        {/* Desktop */}
        {loading ? null : user ? (
          <div className="hidden items-center gap-7 sm:flex">
            {LINKS.map((l) => (
              <NavLink key={l.href} {...l} />
            ))}
            <button
              onClick={logout}
              className="rounded-full border border-[#DCD0BE] bg-[#FFFDF6] px-4 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900 hover:bg-white"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="hidden items-center gap-7 sm:flex">
            <Link href="/login" className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900">
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 shadow-xs"
            >
              Register
            </Link>
          </div>
        )}

        {/* Mobile: tombol menu (hanya saat sudah login) */}
        {!loading && user && (
          <button
            className="rounded-full border border-[#DCD0BE] p-2 text-stone-700 sm:hidden hover:bg-white"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
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
            className="border-b border-[#E8DEC9] bg-[#FFFDF6]/98 backdrop-blur-md sm:hidden"
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
                className="mt-1 w-fit rounded-full border border-[#DCD0BE] bg-white px-4 py-1.5 text-xs font-semibold text-stone-700"
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
