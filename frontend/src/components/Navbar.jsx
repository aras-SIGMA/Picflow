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
  BarChart3,
  Home,
  ImagePlus,
  LogOut,
  Menu,
  Search,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/ui/Logo";

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
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 16);
          ticking = false;
        });
        ticking = true;
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ESC untuk menutup + kunci scroll body selama sidebar terbuka.
  useEffect(() => {
    if (!menuOpen) return;

    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full flex justify-center pointer-events-none transition-all duration-500">
      <motion.nav
        layout
        transition={{ type: "spring", stiffness: 360, damping: 32 }}
        className={`pointer-events-auto relative flex items-center justify-between transition-all duration-500 ${
          scrolled
            ? "mt-2 sm:mt-3 w-[95%] sm:w-[94%] max-w-5xl rounded-full border border-[#E8DEC9] bg-[#FFFDF6]/98 sm:bg-[#FFFDF6]/92 backdrop-blur-none sm:backdrop-blur-2xl shadow-xl shadow-stone-900/5 px-3.5 sm:px-6 py-1.5 sm:py-2"
            : "w-full max-w-6xl rounded-none border-b border-transparent bg-transparent px-3.5 sm:px-4 py-2.5 sm:py-3.5"
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
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-stone-600 transition-colors hover:text-stone-900 px-2.5 sm:px-3 py-1.5"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-blue-600 px-3.5 sm:px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-95"
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

        </motion.nav>
      </header>

      {/* ======================================================== */}
      {/* MOBILE: Pop-up Sidebar (kanan), minimalis                 */}
      {/* ======================================================== */}
      <AnimatePresence>
          {menuOpen && user && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 bg-stone-900/25 sm:hidden"
                aria-hidden="true"
              />
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                className="fixed right-0 top-0 z-50 flex h-full w-[78%] max-w-[300px] flex-col border-l border-[#E8DEC9] bg-[#FFFDF6] shadow-2xl sm:hidden"
              >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between border-b border-[#E8DEC9] px-4 py-3">
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="flex min-w-0 items-center gap-2.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-stone-900 text-xs font-bold text-white">
                      {user?.profile_picture_url || user?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.profile_picture_url || user.avatar_url}
                          alt={user.username || "Avatar"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (user?.username || "U").charAt(0).toUpperCase()
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-stone-900">
                        {user?.username || "Photographer"}
                      </span>
                      <span className="block truncate text-[10px] text-stone-500">
                        {user?.email || "PicFlow Member"}
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close menu"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-white hover:text-stone-900"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-2.5 py-3">
                  <ul className="space-y-0.5">
                    {LINKS.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/home" &&
                          pathname?.startsWith(item.href));
                      const Icon = item.icon;

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            aria-current={isActive ? "page" : undefined}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                              isActive
                                ? "bg-white text-blue-700 shadow-2xs"
                                : "text-stone-700 hover:bg-white hover:text-stone-900"
                            }`}
                          >
                            <Icon
                              size={17}
                              className={isActive ? "text-blue-600" : "text-stone-400"}
                            />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Browse
                  </p>
                  <ul className="space-y-0.5">
                    <li>
                      <Link
                        href="/home/filters"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-stone-700 transition-colors hover:bg-white hover:text-stone-900"
                      >
                        <SlidersHorizontal size={17} className="text-stone-400" />
                        <span>Filter Feed</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-stone-700 transition-colors hover:bg-white hover:text-stone-900"
                      >
                        <BarChart3 size={17} className="text-stone-400" />
                        <span>Dashboard</span>
                      </Link>
                    </li>
                  </ul>
                </nav>

                {/* Footer: Logout */}
                <div className="border-t border-[#E8DEC9] p-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut size={17} />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
    </>
  );
}
