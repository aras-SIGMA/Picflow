"use client";

// src/components/Navbar.jsx
// Navbar PicFlow dengan Desain Capsule Futuristik & Animasi Tabung Melayang:
// - Saat di posisi atas (unscrolled): Tampilan luas max-w-6xl bersih dan transparan.
// - Saat di-scroll (scrolled): Seluruh navbar bertransformasi & menyusut menjadi
//   sebuah "tabung panjang" (floating elongated pill tube) dengan border halus #E8DEC9,
//   glassmorphism Warm Cream #FFFDF6, dan bayangan elevasi halus.
// - Navigasi cluster (pengganti link standar) mengadopsi gaya kapsul futuristik
//   dengan active indicator glow yang memadukan 3 warna dasar PicFlow:
//   Red (#D62B2B), Green (#16A34A), dan Blue (#2563EB).

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  ImagePlus,
  LogOut,
  Menu,
  Search,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/ui/Logo";
import { EASE } from "@/components/ui/motion";

const LINKS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/addphoto", label: "Add Photo", icon: ImagePlus },
  { href: "/account", label: "Account", icon: User },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Deteksi scroll untuk memicu transformasi menjadi tabung panjang melayang
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full flex justify-center pointer-events-none transition-all duration-500">
      <motion.nav
        layout
        transition={{ type: "spring", stiffness: 360, damping: 32 }}
        className={`pointer-events-auto relative flex items-center justify-between transition-all duration-500 ${
          scrolled
            ? "mt-2.5 sm:mt-3 w-[94%] max-w-5xl rounded-full border border-[#E8DEC9] bg-[#FFFDF6]/92 backdrop-blur-2xl shadow-xl shadow-stone-900/5 px-4 sm:px-6 py-2"
            : "w-full max-w-6xl rounded-none border-b border-transparent bg-transparent px-4 py-3.5"
        }`}
      >
        {/* Brand Logo */}
        <Link
          href={user ? "/home" : "/login"}
          aria-label="PicFlow Home"
          className="inline-flex items-center transition-transform duration-200 hover:scale-[1.02] shrink-0"
        >
          <Logo
            variant="lockup"
            size={scrolled ? 28 : 32}
            showTagline={false}
            inverted={false}
          />
        </Link>

        {/* ======================================================== */}
        {/* DESKTOP: Futuristic Capsule Navigation Dock              */}
        {/* ======================================================== */}
        {loading ? null : user ? (
          <div className="hidden items-center sm:flex">
            <div className="relative flex items-center gap-1 rounded-full border border-[#E8DEC9]/90 bg-[#F5EFE6]/75 p-1 backdrop-blur-md shadow-2xs">
              {LINKS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/home" && pathname?.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className="relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all focus:outline-none"
                  >
                    {/* Active Indicator Glow dengan 3 Warna Dasar PicFlow (Red, Green, Blue) */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-rgb-glow"
                        className="absolute -inset-1 rounded-full blur-md opacity-60 bg-gradient-to-r from-[#D62B2B]/35 via-[#16A34A]/35 to-[#2563EB]/45 -z-10 pointer-events-none"
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      />
                    )}

                    {/* Active White Capsule Pill */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-full bg-white shadow-xs border border-[#E8DEC9]"
                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      />
                    )}

                    {/* Active Micro Tri-Color Accent Dot */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-micro-dot"
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-2 rounded-full bg-gradient-to-r from-[#D62B2B] via-[#16A34A] to-[#2563EB]"
                      />
                    )}

                    {/* Icon & Label */}
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={`relative z-10 flex items-center gap-1.5 transition-colors ${
                        isActive
                          ? "text-[#2563EB] font-bold"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <Icon
                        size={15}
                        className={isActive ? "text-[#2563EB]" : "text-stone-500"}
                      />
                      <span>{item.label}</span>
                    </motion.span>
                  </Link>
                );
              })}

              {/* Vertical Separator */}
              <div className="mx-0.5 h-4 w-px bg-[#DCD0BE]/80" />

              {/* Logout Button */}
              <motion.button
                onClick={logout}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                aria-label="Logout"
                className="relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-stone-600 transition-all hover:bg-white hover:text-stone-900 hover:shadow-2xs"
              >
                <LogOut size={13} className="text-stone-500" />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="hidden items-center gap-4 sm:flex">
            <Link
              href="/login"
              className="text-xs font-semibold text-stone-600 transition-colors hover:text-stone-900 px-3 py-1.5"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 hover:shadow-sm"
            >
              Register
            </Link>
          </div>
        )}

        {/* Mobile: Menu Toggle Button */}
        {!loading && user && (
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCD0BE] bg-[#FFFDF6] p-2 text-stone-700 sm:hidden hover:bg-white shadow-2xs"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        )}

        {/* ======================================================== */}
        {/* MOBILE: Dropdown Drawer                                  */}
        {/* ======================================================== */}
        <AnimatePresence>
          {menuOpen && user && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-[#E8DEC9] bg-[#FFFDF6]/98 p-3 shadow-xl backdrop-blur-2xl sm:hidden pointer-events-auto"
            >
              <div className="flex flex-col gap-1">
                {LINKS.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/home" && pathname?.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <Icon
                        size={15}
                        className={isActive ? "text-blue-600" : "text-stone-400"}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <div className="my-1 border-t border-[#E8DEC9]" />

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  );
}
