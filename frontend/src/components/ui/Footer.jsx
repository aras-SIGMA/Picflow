// src/components/ui/Footer.jsx
// Footer minimal: logo, tagline pendek, hak cipta.
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-faint sm:flex-row">
        <Link href="/home" className="font-semibold tracking-tight text-ink">
          PicFlow
        </Link>
        <p>Vault pribadi untuk karya fotografi terbaikmu.</p>
        <p>© {new Date().getFullYear()} PicFlow</p>
      </div>
    </footer>
  );
}
