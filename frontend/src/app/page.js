// src/app/page.js
// Root: arahkan ke /home kalau sudah login, ke /login kalau belum.
// Logika redirect tidak berubah; tampilannya loader aperture bertema kamera.
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";
import ApertureLoader from "@/components/ui/ApertureLoader";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getToken() ? "/home" : "/login");
  }, [router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <ApertureLoader size={30} />
      <p className="text-sm text-muted">Membuka PicFlow...</p>
    </div>
  );
}
