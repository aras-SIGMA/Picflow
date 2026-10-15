# Design System — PicFlow

> Dokumen ini adalah **sumber kebenaran tunggal** untuk arsitektur visual dan sistem antarmuka PicFlow.
> Diadaptasi dari referensi desain visual modern bertema **Fluid Organic Canvas** dan diselaraskan secara presisi untuk platform showcase fotografi, kritik konstruktif, dan eksplorasi karya berkualitas tinggi.

---

## 1. Filosofi & Arah Desain

PicFlow mengadopsi estetika **Modern Fluid Editorial & Calibrated Spectrum**. Desain memadukan kanvas terang yang bersih (*high-key clarity*) dengan kurva organik mengalir (*fluid wave shape*) yang merepresentasikan esensi **"Flow"** dalam fotografi: aliran inspirasi, pencahayaan, dan spektrum warna sRGB.

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Logo PicFlow]          [Explore]  [Kritik]  [Kreator]   [Masuk] [Daftar] │
│                                                                        │
│   Showcase, critique, and                  ( Organic Fluid Wave )      │
│   elevate your photographic               ( Gradient: sRGB Multi-Gamut)│
│   vision to its peak.                     (   [○] Foto 1 (Red Ring)    │
│                                           (         [○] Top Creator    │
│   Komunitas kurasi foto beresolusi         (  [○] Foto 2 (Green) [○] Lensa│
│   tinggi dengan kalibrasi warna sRGB.      (        [○] Foto 3 (Blue)  │
│                                                                        │
│   [ 🔍 Cari genre, gear kamera, lensa...    (Jelajahi Karya) ]         │
│   Populer: [Street] [Landscape] [Sony Alpha] [Fujifilm Film Sim]       │
│                                                                        │
│   Diabadikan oleh fotografer dengan gear:                              │
│      [Sony]     [Canon]     [Fujifilm]     [Leica]     [Hasselblad]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prinsip Desain

| Prinsip | Implementasi Visual |
| --- | --- |
| **High-Key Photographic Clarity** | Kanvas utama bersih (`#FFFFFF` / `#F8FAFC`) memberi ruang bernapas lega pada tipografi dan memudahkan apresiasi detail visual tanpa distraksi gelap monoton. |
| **Organic Flowing Spectrum** | Bidang grafis kanan menggunakan kurva organik dinamis (*fluid wave/blob*) dengan gradien spektrum sRGB hangat, merepresentasikan energi kreatif dan shutter dinamis. |
| **Floating Micro-Orbits** | Kartu karya foto dan profil fotografer terbaik dikemas dalam lingkaran mengambang (*floating circle apertures*) dengan ring putih tegas dan *soft ambient shadow*. |
| **Floating Pill Utility** | Semua elemen kontrol utama (search capsule, CTA button, category chips) mengadopsi bentuk kapsul (`rounded-full`) dengan elevasi lembut bergaya modern. |
| **Gear-Centric Credibility** | Menghargai instrumen fotografi dengan menonjolkan ekosistem kamera (Leica, Sony, Fujifilm, Canon) dan parameter EXIF secara presisi. |

---

## 3. Identitas Merek & Logo

Sumber aset resmi: `assets/images/stitch_picflow_brand_design_system/`.

### 3.1 Logo Mark (Optical Aperture)
- **Simbol**: Lensa aperture 4 blade melingkar dengan barrel neutral precision dan core optic glass highlight.
- **Spektrum 4 Blade**:
  - Blade Biru: `#60A5FA → #3B82F6`
  - Blade Hijau: `#34D399 → #10B981`
  - Blade Merah: `#F87171 → #EF4444`
  - Blade Slate: `#94A3B8 → #475569`
- **Optical Core**: `#0B0F19` dengan cincin `#CBD5E1` dan pantulan kaca miring 30°.

### 3.2 Wordmark & Tagline
- **"Pic"**: Font sans-serif tebal (weight 800) warna pekat (`#0F172A`).
- **"Flow"**: Gradien horizontal spektrum sRGB penuh (`#EF4444` → `#10B981` → `#3B82F6`).
- **Tagline**: `sRGB STANDARD & CRAFT` (font mono, uppercase, tracking `0.16em`) didampingi 3 micro-dot R-G-B (Merah, Hijau, Biru) 4px.

---

## 4. Palet Warna (Color System)

Warna utama PicFlow dikunci ketat pada **Trio Gamut sRGB: Merah, Hijau, dan Biru** (tanpa warna utama lain). Untuk kanvas dan permukaan aplikasi, PicFlow mendukung dua polaritas: **Tema Terang (Light Mode)** dan **Tema Gelap (Dark Mode)**, disampel langsung dari kanvas landing page & visual cinematic fotografi.

> **Catatan Fleksibilitas Hex**: Nilai hex kanvas terang (`#FFFDF6`) dan gelap (`#070B14`) di bawah ini disampel dari implementasi landing page/auth saat ini. Nilai numerik hex ini dapat disesuaikan kembali kapan pun pengguna memberikan kode hex kustom spesifik.

### 4.1 Warna Utama (Primary Palette — Hanya Merah, Hijau, Biru)
Warna aksen dan identitas brand PicFlow **hanya terdiri dari 3 warna**:

| Gamut Utama | Nilai Hex Utama | Varian Soft / Light | Peran & Semantik Antarmuka |
| --- | --- | --- | --- |
| **sRGB Red (Merah)** | `#EF4444` | `#FEE2E2` / `#F87171` | Wave fluid hero, tombol Like/Suka aktif, indikator rekam/tally kamera, status penting/destruktif, badge genre Street & Human Interest. |
| **sRGB Green (Hijau)** | `#10B981` | `#D1FAE5` / `#34D399` | Indikator status sistem aktif, badge kreator terverifikasi, skor kritik tinggi, genre Nature & Landscape, tombol aksi konfirmasi. |
| **sRGB Blue (Biru)** | `#3B82F6` / `#2563EB` | `#DBEAFE` / `#60A5FA` | Tombol aksi primer ("Jelajahi Karya", search CTA, filter aktif), tautan aktif, fokus elemen form, genre Architecture & Gear. |

### 4.2 Warna Dasar Aplikasi (Application Theme: Mode Terang & Mode Gelap)
Sistem kanvas aplikasi dirancang dalam dua mode utama:

#### A. Mode Terang (Light Theme — Editorial Warm Canvas)
Disampel dari kanvas landing page, auth card, dan feed beranda:

| Token / Layer | Nilai Hex (Sampel Landing Page) | Keterangan & Penggunaan |
| --- | --- | --- |
| **Canvas Background** | `#FFFDF6` | Kanvas dasar utama aplikasi (warm cream/ivory editorial, nyaman di mata). |
| **Surface Subtle** | `#F5EFE6` | Latar seksi sekunder, strip carousel, dan pill container. |
| **Card Surface** | `#FFFFFF` | Latar kartu feed, form, dan panel melayang (*floating cards*). |
| **Elevated Surface** | `#F8F3E8` | Latar input form, chip kategori, dan dropdown. |
| **Border Subtle** | `#E8DEC9` | Garis pembatas ringan dan divider antar section. |
| **Border Strong** | `#DCD0BE` | Garis luar kartu, kapsul pencarian, dan frame avatar. |
| **Text Primary (Ink)** | `#1C1917` / `#0F172A` | Teks judul display, headline, dan teks kontras tinggi. |
| **Text Muted** | `#57534E` / `#475569` | Sub-headline, metadata, dan deskripsi sekunder. |
| **Text Faint** | `#8F887C` / `#94A3B8` | Placeholder, label kecil, dan caption nonaktif. |

#### B. Mode Gelap (Dark Theme — Obsidian Cinema Canvas)
Disampel dari kanvas pendaran aurora spotlight, dark backdrop, dan optical core:

| Token / Layer | Nilai Hex (Sampel Landing / Cinematic) | Keterangan & Penggunaan |
| --- | --- | --- |
| **Canvas Background** | `#070B14` | Kanvas hitam obsidian ultra-dalam, menghadirkan kontras maksimal untuk showcase fotografi. |
| **Surface Subtle** | `#0B0F19` | Latar panel sekunder, core lensa kamera, dan container navigasi. |
| **Card Surface** | `#111827` / `#0F172A` | Latar kartu feed gelap dengan elevasi bayangan halus. |
| **Elevated Surface** | `#1E293B` | Latar input aktif, modal dialog, dan popover menu gelap. |
| **Border Subtle** | `#1E293B` | Garis divider lembut antar komponen gelap. |
| **Border Strong** | `#334155` | Border kartu gelap dan cincin pemisah visual. |
| **Text Primary (Ink)** | `#F8FAFC` | Teks putih bersih untuk judul dan headline. |
| **Text Muted** | `#94A3B8` | Teks sekunder dan caption teknis EXIF. |
| **Text Faint** | `#64748B` | Placeholder dan metadata tersamar. |

### 4.3 Gradien Spektrum sRGB (Trio Merah, Hijau, Biru)
Perpaduan spektrum visual di kurva fluid hero, background aurora, dan footer WebGL memancarkan 3 warna utama:
- **Gradient Utama (Trio Spectrum Flow)**:
  `linear-gradient(135deg, #EF4444 0%, #10B981 50%, #3B82F6 100%)`
  *(atau dengan oranye transisi alami: `#EF4444` → `#F97316` → `#10B981` → `#3B82F6`)*
- **Layer Gelombang Sekunder (Cyan-Blue Depth)**:
  `radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.45), transparent 70%)`
- **Pendaran Ambient 3-Titik**:
  Spot blur Merah (`#EF4444`/15), Hijau (`#10B981`/15), dan Biru (`#3B82F6`/18) dengan radius `blur-[100px]`.
- **Halftone Dot Texture**:
  Pola titik-titik mikro putih transparan (`rgba(255, 255, 255, 0.25)`) dengan jarak 12px di dalam bidang wave.

---

## 5. Tipografi (Typography Hierarchy)

Font primer menggunakan **Geist Sans / Plus Jakarta Sans** untuk kejernihan digital, dipadukan dengan **JetBrains Mono** untuk angka teknis EXIF kamera.

### 5.1 Skala Tipografi
| Tingkat | Ukuran & Weight | Line Height | Contoh Pemakaian |
| --- | --- | --- | --- |
| **Hero Display** | `clamp(2.75rem, 5vw, 4.25rem)` (Extrabold 800) | `1.08` | "Showcase, critique, and elevate..." |
| **Section Title** | `clamp(1.75rem, 3vw, 2.5rem)` (Bold 700) | `1.15` | "Karya Terkurasi Minggu Ini" |
| **Subtitle Hero** | `1.125rem` / `18px` (Regular 400) | `1.6` | "Komunitas fotografer untuk berbagi portfolio..." |
| **Input & CTA** | `0.9375rem` / `15px` (Medium 500) | `1.4` | Teks dalam kapsul pencarian & tombol aksi. |
| **Category Chips** | `0.8125rem` / `13px` (Medium 500) | `1.3` | Filter tag pill ("Street", "Sony Alpha"). |
| **Technical Meta** | `0.75rem` / `12px` (Mono Semibold 600) | `1.2` | "1/500s · f/2.8 · ISO 100 · 35mm" |

---

## 6. Komponen Kunci (Berdasarkan Referensi Desain)

### 6.1 Hero Search Capsule (Pencarian Utama)
Komponen pencarian floating di tengah-bawah headline hero:
- **Bentuk**: Kapsul melingkar penuh (`rounded-full`), tinggi 62px.
- **Latar & Bayangan**: Putih solid (`#FFFFFF`) dengan elevasi halus:
  `box-shadow: 0 20px 40px -15px rgba(37, 99, 235, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.8)`.
- **Elemen Kiri**: Ikon kaca pembesar (`Search` Lucide) warna `--ink-muted` + placeholder dinamis ("Cari genre, gear kamera, lensa, atau fotografer...").
- **Elemen Kanan**: Tombol aksi berbentuk kapsul solid biru elektrik (`bg-[#2563EB] text-white hover:bg-[#1D4ED8]`) bertuliskan **"Jelajahi Karya"** atau **"Cari Foto"**.

### 6.2 Filter Chips & Kategori Populer (Colorful sRGB Badges)
Deretan filter cepat tepat di bawah Hero Search Capsule dengan aksen warna sRGB dinamis:
- **Label**: "Populer:" (`text-xs font-semibold text-slate-500`).
- **Pill Chips**: Tombol kapsul kecil (`rounded-full px-3.5 py-1 text-xs font-medium`).
- **Skema Warna Multi-Kategori**:
  - *Genre Street & Human Interest*: Aksen sRGB Red (`bg-red-50 text-red-700 border-red-200 hover:bg-red-100`).
  - *Genre Landscape & Alam*: Aksen sRGB Green (`bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`).
  - *Genre Arsitektur & Gear Kamera*: Aksen sRGB Blue (`bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100`).
  - *Netral*: Border tipis `#E2E8F0`, teks `#475569`, latar `#FFFFFF`, hover ke `#F1F5F9`.

### 6.3 Hero Organic Wave & Floating Photo Orbits
Elemen visual utama di sisi kanan viewport hero:
- **Organic Waveform**: Bentuk kurva kurvatur SVG halus mengalir yang dibalut perpaduan spektrum sRGB kaya warna (Merah `#EF4444` → Oranye `#F97316` → Hijau `#10B981` → Biru `#3B82F6`) dengan drop shadow lembut.
- **Texture Overlay**: Titik-titik halftone berpola kisi (*dot matrix*) di dalam bidang gradien.
- **Floating Photo Circles (Orbit Fotografi sRGB)**:
  - 5–6 lingkaran dengan berbagai diameter (64px, 88px, 110px).
  - Berisi foto showcase portofolio resolusi tinggi dan avatar fotografer terverifikasi.
  - Setiap lingkaran memiliki ring border putih tebal (3px solid `#FFFFFF`) dengan aksen glow tipis sesuai blade warna logo (Merah, Hijau, atau Biru) dan bayangan mengambang:
    `box-shadow: 0 16px 32px -8px rgba(0, 0, 0, 0.22)`.
  - Floating animasi lambat (*smooth hovering bobbing animation*, durasi 4–6 detik berlawanan arah).

### 6.4 Ecosystem Social Proof Bar (Brand Kamera & Lensa)
Bar horizontal di bawah area hero untuk membangun kredibilitas:
- **Label Pengantar**: "Karya diabadikan dengan instrumen fotografi terpercaya" (`text-xs font-medium uppercase tracking-wider text-slate-400 text-center`).
- **Logo Monokrom**: Sony Alpha, Canon EOS, Nikon Z, Fujifilm, Leica, Hasselblad dalam warna slate netral (`#94A3B8`) dengan transisi opasitas ke `#334155` saat hover.

### 6.5 Grid Galeri & Masonry Portofolio
- **Card**: Radius sudut `16px` (`rounded-2xl`), overflow terpotong rapi dengan aspek rasio mempertahankan proporsi sensor 3:2, 4:3, atau 1:1.
- **Hover Reveal**: Overlay tipis menampilkan judul foto, nama kreator ber-avatar bulat, dan parameter EXIF cepat (shutter speed, aperture, ISO).
- **Interaksi Instan**: Floating Like Button berbentuk kapsul mini dan indikator jumlah kritik/diskusi.

### 6.6 Panel Kritik Konstruktif (4 Pilar)
Panel ulasan teknis fotografi terstruktur:
- **Rating 4 Pilar**: Komposisi, Pencahayaan, Warna & Tone sRGB, Konsep Visual (skala 1–5).
- **Badge Skor**: Desain pill dengan warna semantik (Komp: Ungu, Cahaya: Amber, Warna: Emerald, Konsep: Sky).
- **Kotak Ulasan**: Dua section terpisah dengan aksen kartu bersih:
  - *Kekuatan Visual* (border hijau lembut, ikon `ThumbsUp`).
  - *Saran Pengembangan* (border biru lembut, ikon `Lightbulb`).

### 6.7 Layout Autentikasi & Showcase Slider
- **Split-Screen Desktop**: Panel formulir berada di sisi **kiri** (`lg:col-span-5`), dan artboard preview foto di sisi **kanan** (`lg:col-span-7`).
- **Kanvas Warm Cream `#FFFDF6`**: Latar form, input field, dan border seragam menggunakan `#FFFDF6` dengan aksen border `#DCD0BE` / `#E8DEC9`.
- **Photo Marquee Slider (1 Jalur Potret)**:
  - Format kartu **portrait** (`h-[420px] w-[270px]`) menampilkan preview foto kurasi / unggahan pengguna.
  - Animasi kontinu bergerak otomatis ke **arah kanan** (`marquee-right`, `translateX(-50%)` → `0%`).
  - Kartu dilengkapi kapsul informasi putih/krem semi-transparan (`bg-[#FFFDF6]/95`) di bagian bawah dengan metadata EXIF aperture dan username fotografer.
  - Masking gradien shadow gelap kiri-kanan dihapus untuk estetika flat yang jernih.
- **Tombol Aksi**: Pill solid biru royal `#2563EB` dengan teks putih tegas (`#FFFFFF`).

---

## 7. Elevasi & Bayangan (Shadow System)

| Token | CSS Box Shadow | Pemakaian |
| --- | --- | --- |
| `--shadow-card` | `0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)` | Kartu galeri foto & item feed. |
| `--shadow-search` | `0 20px 40px -15px rgba(37,99,235,0.14), 0 0 0 1px rgba(226,232,240,0.9)` | Hero Search Capsule. |
| `--shadow-floating`| `0 18px 36px -10px rgba(15,23,42,0.25)` | Floating Photo Circles di atas wave. |
| `--shadow-dropdown`| `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` | Menu dropdown & modal overlay. |

---

## 8. Sistem Radius

| Token | Nilai | Pemakaian |
| --- | --- | --- |
| `--radius-sm` | `10px` | Input form, item list internal, micro badges. |
| `--radius-md` | `16px` | Kartu foto, panel kritik, container dialog. |
| `--radius-lg` | `24px` | Modal Lightbox besar, showcase banner. |
| `--radius-pill` | `9999px` (`rounded-full`) | Tombol aksi, search capsule, category chips, avatar bulat. |

---

## 9. Gerak & Micro-Interactions (Motion)

- **Floating Bobbing**:
  Foto lingkaran di hero bergerak naik-turun halus (translasi Y: `-8px` ke `+8px`, durasi 5s, ease-in-out infinite).
- **Search Capsule Focus**:
  Saat input pencarian difokuskan, bayangan melebar halus dengan ring border biru lembut (`ring-4 ring-blue-500/15`).
- **Spring Pop Buttons**:
  Tombol interaksi like dan bookmark menggunakan framer-motion spring (`stiffness: 450, damping: 17`) dengan scale pop ke `1.2`.
- **Wave Morph (Opsional)**:
  Kurva SVG hero dapat memiliki deformasi kurvatur sangat lambat untuk menghidupkan kesan air/cahaya mengalir.
- **Respect User Preferences**:
  Semua animasi floating dan morphing otomatis nonaktif pada `prefers-reduced-motion: reduce`.

---

## 10. Panduan Do's & Don'ts

### ✅ Do's
1. **Gunakan kanvas putih/terang** sebagai latar dominan halaman eksplorasi dan landing untuk keterbacaan teks maksimal.
2. **Batasi gradien hangat (koral-pink)** khusus untuk elemen fluid hero dan aksen branding agar tidak mengaburkan warna foto karya.
3. **Selalu sertakan avatar dan gear kamera** pada kartu showcase untuk memelihara konteks komunitas fotografer.
4. **Jaga bentuk kapsul (`rounded-full`)** pada seluruh elemen pemicu aksi (search, CTA button, chip tag).

### ❌ Don'ts
1. **Jangan gunakan background gelap pekat** di seluruh layar hero — referensi mengutamakan kanvas terang dengan kontras kurva fluid yang kuat.
2. **Jangan gunakan tombol kotak bersudut tajam** — semua elemen tombol harus mengadopsi pill shape seragam.
3. **Jangan menutupi foto karya** dengan gradien warna pekat yang merusak kalibrasi warna asli karya fotografer.

---

## 11. Referensi Berkas Terkait
- **Dokumen PRD**: `.md/PRD/PRD.md`
- **Aset Logo & Branding**: `assets/images/stitch_picflow_brand_design_system/`
- **Global Styles & Tailwind Theme**: `frontend/src/app/globals.css`
- **Komponen Galeri**: `frontend/src/components/PhotoCard.jsx`, `MasonryGrid.jsx`
- **Komponen Hero & Shell**: `frontend/src/components/Navbar.jsx`, `frontend/src/app/page.js`
