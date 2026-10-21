"use client";

// src/components/ui/futuristic-nav.jsx
// Futuristic Floating Navigation Bar (LumaBar):
// - Diadaptasi dengan 3 warna dasar PicFlow: Red (#D62B2B), Green (#16A34A), Blue (#2563EB)
// - Efek active indicator glow dengan spring animation
// - Desain glassmorphism Warm Cream (#FFFDF6) dengan border halus dan backdrop blur
// - Tooltip mengambang dan integrasi routing Next.js Link

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  ImagePlus,
  Search,
  TrendingUp,
  User,
} from "lucide-react";

export const DEFAULT_NAV_ITEMS = [
  { id: 0, href: "/home", icon: <Home size={20} />, label: "Home" },
  { id: 1, href: "/search", icon: <Search size={20} />, label: "Search" },
  { id: 2, href: "/addphoto", icon: <ImagePlus size={20} />, label: "Share Shot" },
  { id: 3, href: "/dashboard", icon: <TrendingUp size={20} />, label: "Analytics" },
  { id: 4, href: "/account", icon: <User size={20} />, label: "Profile" },
];

export default function LumaBar({
  items = DEFAULT_NAV_ITEMS,
  className = "",
}) {
  const pathname = usePathname();

  // Sinkronkan active index secara reaktif dari URL path
  const activeIndex = items.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href)
  );
  const active = activeIndex >= 0 ? activeIndex : 0;

  return (
    <nav
      aria-label="Floating futuristic navigation"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${className}`}
    >
      <div className="relative flex items-center justify-center gap-1.5 sm:gap-3 rounded-full border border-[#E8DEC9]/90 bg-[#FFFDF6]/85 px-3 sm:px-5 py-2 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 overflow-hidden">
        {/* Active Indicator Glow dengan 3 Warna Dasar PicFlow (Red, Green, Blue) */}
        <motion.div
          layoutId="active-indicator"
          className="absolute h-12 w-12 rounded-full blur-xl -z-10 bg-gradient-to-r from-[#D62B2B]/40 via-[#16A34A]/40 to-[#2563EB]/50"
          animate={{
            left: `calc(${active * (100 / items.length)}% + ${100 / items.length / 2}%)`,
            translateX: "-50%",
          }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
        />

        {items.map((item, index) => {
          const isActive = index === active;

          return (
            <div key={item.id} className="relative flex flex-col items-center group">
              <Link
                href={item.href}
                aria-label={item.label}
                className="relative z-10 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-colors focus:outline-none"
              >
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  animate={{
                    scale: isActive ? 1.2 : 1,
                    color: isActive ? "#2563EB" : "#57534E",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="flex items-center justify-center"
                >
                  {item.icon}
                </motion.div>

                {/* Micro Active Pill Dot */}
                {isActive && (
                  <motion.span
                    layoutId="active-dot"
                    className="absolute bottom-1 h-1 w-1 rounded-full bg-gradient-to-r from-[#D62B2B] via-[#16A34A] to-[#2563EB]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>

              {/* Floating Tooltip */}
              <span className="pointer-events-none absolute bottom-full mb-2.5 whitespace-nowrap rounded-lg border border-[#E8DEC9] bg-[#FFFDF6]/95 px-2.5 py-1 text-[11px] font-semibold text-stone-900 shadow-md opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
