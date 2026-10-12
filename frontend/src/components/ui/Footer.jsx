// src/components/ui/Footer.jsx
// Footer minimal: logo, tagline pendek, hak cipta.
import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-[#E8DEC9] bg-[#FEFAF3]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-stone-500 sm:flex-row">
        <Link href="/" className="inline-flex items-center">
          <Logo variant="lockup" size={28} showTagline={true} inverted={false} />
        </Link>
        <p className="text-center sm:text-left">Vault pribadi untuk karya fotografi terbaik dengan standar sRGB.</p>
        <p>© {new Date().getFullYear()} PicFlow. Hak cipta terpelihara.</p>
      </div>
    </footer>
  );
}
