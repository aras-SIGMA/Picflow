"use client";

// src/components/PhotoMarqueeSlider.jsx
// Panel kanan visual autentikasi PicFlow (Light Modern Editorial):
// - Kanvas terang yang bersih, tanpa shadow berat
// - 1 jalur carousel foto berformat portrait yang terus bergeser ke kanan secara otomatis
// - Kartu foto portrait menampilkan karya pengguna, info kreator, dan metadata aperture
import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { listPhotos, fileUrl } from "@/lib/api";
import { isCloudinaryUrl } from "@/lib/cloudinary";

// Fallback kurasi foto format portrait resolusi tinggi bila DB belum memiliki cukup foto
const FALLBACK_PORTRAIT_PHOTOS = [
  {
    id_photo: "fb-p1",
    title: "Curves of Mojave Dunes",
    image_url:
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
    camera_model: "Sony α7R V",
    aperture: "f/2.8",
    shutter_speed: "1/500s",
    iso: "100",
    category_name: "Landscape",
    creator: { username: "erik_dune", avatar_url: null },
  },
  {
    id_photo: "fb-p2",
    title: "Cinematic Ambient Portrait",
    image_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    camera_model: "Leica SL2-S",
    aperture: "f/1.4",
    shutter_speed: "1/1000s",
    iso: "160",
    category_name: "Portrait",
    creator: { username: "maya_portrait", avatar_url: null },
  },
  {
    id_photo: "fb-p3",
    title: "Alpine Mist & Pine Forest",
    image_url:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    camera_model: "Canon EOS R5",
    aperture: "f/4.0",
    shutter_speed: "1/250s",
    iso: "200",
    category_name: "Nature",
    creator: { username: "clara_mountain", avatar_url: null },
  },
  {
    id_photo: "fb-p4",
    title: "Tokyo Alleyway Blue Hour",
    image_url:
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80",
    camera_model: "Fujifilm X-T5",
    aperture: "f/2.0",
    shutter_speed: "1/160s",
    iso: "640",
    category_name: "Street",
    creator: { username: "kenji_tokyo", avatar_url: null },
  },
  {
    id_photo: "fb-p5",
    title: "Monolithic Geometry",
    image_url:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    camera_model: "Hasselblad 907X",
    aperture: "f/8.0",
    shutter_speed: "1/125s",
    iso: "100",
    category_name: "Architecture",
    creator: { username: "marcus_arch", avatar_url: null },
  },
  {
    id_photo: "fb-p6",
    title: "Pacific Horizon Dusk",
    image_url:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    camera_model: "Nikon Z8",
    aperture: "f/2.8",
    shutter_speed: "1/800s",
    iso: "200",
    category_name: "Seascape",
    creator: { username: "kai_coastal", avatar_url: null },
  },
];

export default function PhotoMarqueeSlider() {
  const [photos, setPhotos] = useState(FALLBACK_PORTRAIT_PHOTOS);

  useEffect(() => {
    let active = true;
    listPhotos({ feed: "explore" })
      .then((res) => {
        if (!active) return;
        const liveItems = Array.isArray(res?.data) ? res.data : [];
        if (liveItems.length > 0) {
          const formattedLive = liveItems.map((p) => ({
            id_photo: p.id_photo || p.id,
            title: p.title || "Karya PicFlow Vault",
            image_url: p.medium_url || p.photo_url || fileUrl(p.image_url),
            camera_model: p.camera_model || p.exif_data?.camera || "Kamera Digital",
            aperture: p.aperture || "f/2.8",
            shutter_speed: p.shutter_speed || "1/500s",
            iso: p.iso || "100",
            category_name: p.categories?.name || p.category || "Editorial",
            creator: {
              username: p.profiles?.username || p.creator?.username || "fotografer",
              avatar_url: p.profiles?.avatar_url || p.creator?.avatar_url || null,
            },
          }));

          setPhotos([...formattedLive, ...FALLBACK_PORTRAIT_PHOTOS]);
        }
      })
      .catch(() => {
        // Fallback siap pakai bila API offline
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <aside
      aria-label="Preview Karya Fotografer Komunitas"
      className="relative flex h-full w-full flex-col justify-between overflow-hidden p-6 lg:p-8"
    >
      {/* ============ AREA 1 JALUR CAROUSEL FOTO PORTRAIT (BERGESER KE KANAN OTOMATIS) ============ */}
      <div className="relative flex flex-1 items-center overflow-hidden py-4">
        {/* 1 Jalur Tunggal: Bergerak ke Kanan Secara Otomatis */}
        <div className="relative w-full overflow-hidden">
          <div className="marquee-right flex gap-5">
            {/* Salinan ganda agar loop tanpa patahan */}
            {[...photos, ...photos].map((photo, idx) => (
              <PortraitPhotoCard key={`single-track-${photo.id_photo}-${idx}`} photo={photo} />
            ))}
          </div>
        </div>
      </div>

      {/* ============ FOOTER ARTBOARD EDITORIAL (TEMA TERANG #FEFAF3) ============ */}
      <div className="relative z-20 border-t border-[#E8DEC9] pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="max-w-md">
            <p className="text-xs font-bold tracking-wider text-blue-600 uppercase">
              Vault Komunitas PicFlow
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
              Eksplorasi Karya Tanpa Batas.
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">
              Koleksi foto resolusi penuh dari para fotografer terkurasi dengan
              kalibrasi warna sRGB dan parameter optik EXIF orisinal.
            </p>
          </div>

          {/* Micro dots sRGB */}
          <div
            className="flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-[#DFD3BE] bg-[#FEFAF3] px-3 py-1 text-[11px] text-stone-600"
            title="Dikalibrasi pada standar warna sRGB"
          >
            <span className="flex items-center gap-1" aria-hidden="true">
              <i className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
            </span>
            <span className="text-[10px] font-medium tracking-wide text-stone-700">
              sRGB Standard
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Kartu foto format PORTRAIT
function PortraitPhotoCard({ photo }) {
  const isCloudinary = isCloudinaryUrl(photo.image_url);

  return (
    <figure className="group relative h-[420px] w-[270px] lg:h-[460px] lg:w-[290px] flex-shrink-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E8DEC9] bg-[#FEFAF3]">
      {/* Gambar Foto Portrait Penuh & Jernih Tanpa Shadow Gelap */}
      <Image
        src={photo.image_url}
        alt={photo.title || "Karya Fotografi Portrait"}
        fill
        sizes="(max-width: 1024px) 270px, 290px"
        unoptimized={!isCloudinary}
        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />

      {/* Badge Kategori di Pojok Kiri Atas */}
      <div className="absolute left-3 top-3 z-10">
        <span className="rounded-full border border-[#E2D7C5] bg-[#FEFAF3]/90 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-stone-800 backdrop-blur-md">
          {photo.category_name}
        </span>
      </div>

      {/* Info Karya di Bawah Kartu: Kapsul Terang Minimalis #FEFAF3 */}
      <figcaption className="absolute inset-x-3 bottom-3 z-10 rounded-2xl border border-[#E2D7C5] bg-[#FEFAF3]/95 p-3 backdrop-blur-md">
        <p className="truncate text-xs font-bold text-stone-900 group-hover:text-blue-600 transition-colors">
          {photo.title}
        </p>

        <div className="mt-1 flex items-center justify-between text-[11px] text-stone-600">
          {/* Username Kreator */}
          <span className="flex items-center gap-1.5 font-medium truncate max-w-[130px]">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-600">
              @
            </span>
            <span className="truncate">{photo.creator.username}</span>
          </span>

          {/* Metadata EXIF Aperture */}
          <span className="flex items-center gap-1 rounded-md border border-[#E2D7C5] bg-[#FEFAF3] px-1.5 py-0.5 font-mono text-[10px] text-stone-700">
            <Camera size={10} className="text-blue-600" />
            {photo.aperture}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}
