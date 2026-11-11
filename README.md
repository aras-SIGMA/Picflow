<div align="center">

# PicFlow

**Showcase, critique, and elevate your photographic vision.**

Platform kurasi fotografi dengan kalibrasi warna sRGB, ekstraksi metadata optik EXIF otomatis, dan sistem kritik konstruktif 4 pilar.

`Next.js 16` · `React 19` · `Express 5` · `Supabase PostgreSQL` · `Cloudinary`

</div>

---

## Daftar Isi

- [Tentang PicFlow](#tentang-picflow)
- [Fitur Utama](#fitur-utama)
- [Arsitektur Teknologi](#arsitektur-teknologi)
- [Struktur Proyek](#struktur-proyek)
- [Memulai](#memulai)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Referensi API](#referensi-api)
- [Design System](#design-system)
- [Roadmap](#roadmap)

---

## Tentang PicFlow

Platform sosial konvensional sering menurunkan resolusi gambar, mengabaikan kalibrasi warna sRGB, dan tidak memfasilitasi kritik fotografi yang terstruktur. PicFlow hadir sebagai alternatif kurasi: mempertahankan integritas warna tanpa kompresi agresif, mengekstrak metadata kamera secara instan, dan mendorong diskusi teknis yang konstruktif.

### Persona Pengguna

- **Fotografer (Hobi & Prosumer)** — portofolio publik berkualitas tinggi, membaca parameter optik karya fotografer lain, menerima kritik teknis sistematis, dan membangun basis pengikut.
- **Kolektor & Kurator Visual** — eksplorasi karya berkualitas, filter feed berdasarkan genre atau gear kamera, apresiasi via interaksi real-time.

---

## Fitur Utama

### Ekstraksi Metadata EXIF Otomatis
Setiap unggahan diparse otomatis (via `exifr`) untuk mengekstrak Camera Make/Model, Lens, Shutter Speed, Aperture, ISO, Focal Length, Sensor, dan Timestamp. Field kosong dilabeli `N/A` tanpa menggagalkan proses unggah.

### Pengiriman Gambar Multi-Resolusi Adaptif
Transformasi otomatis Cloudinary (WebP/AVIF via `f_auto,q_auto`) dengan 3 breakpoint: Thumbnail (`400px`), Medium/Grid (`1080px`), dan High-Res/Lightbox (`2048px+`). Grid masonry responsif memakai `srcset` dan `sizes` adaptif.

### Sistem Kritik Konstruktif 4 Pilar
Skor numerik skala 1-5 untuk **Komposisi**, **Pencahayaan**, **Warna & Tone**, serta **Konsep & Naratif**, dilengkapi kolom terpisah untuk *Strengths* dan *Areas for Improvement*. Halaman foto menghitung agregat rata-rata per pilar dan skor keseluruhan. Dibatasi 1 kritik per pengguna per karya, dapat disunting kembali.

### Interaksi Sosial Real-Time
Like, komentar, dan follow tersinkronisasi instan via Server-Sent Events (latency `<250ms`) dengan optimistic UI update. Klik beruntun dilindungi *synchronous lock ref* di frontend dan penanganan idempoten `23505 (unique_violation)` di backend.

### RGB Histogram & Live EXIF
Komponen visual kurva tonal (ITU-R BT.709, square-root scaling, sampling offscreen canvas) dengan deteksi clipping pada panel EXIF dan panel detail foto.

### Creator Dashboard
Metrik kinerja portofolio (likes, views, critiques, engagement rate) dalam rentang waktu tertentu, divisualisasikan via kurva insight SVG interaktif.

### Role-Based Access Control
Peran `user` dan `admin` dengan middleware `verifyToken` + `verifyAdmin`. Nilai role selalu diambil ulang dari database pada setiap verifikasi token (anti privilege escalation). Moderasi bersifat kontekstual in-place.

### Halaman Pencarian Multi-Dimensi
Filter lintas dimensi (kamera, lensa, aperture, focal length, kategori) dengan sinkronisasi URL parameter.

---

## Arsitektur Teknologi

| Layer | Teknologi |
| --- | --- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion, lucide-react, OGL (WebGL) |
| **Backend** | Express 5, Node.js (ESM), Zod (validasi), Multer (upload), exifr (metadata) |
| **Database** | Supabase PostgreSQL (Row Level Security, trigger, cascading delete) |
| **Media CDN** | Cloudinary (transformasi multi-resolusi, WebP/AVIF) |
| **Realtime** | Server-Sent Events (SSE) via `/api/realtime/stream` |
| **Auth** | JWT stateless, persistensi sesi via `AuthContext` |

---

## Struktur Proyek

```text
picflow/
├── backend/
│   ├── config/           Konfigurasi Supabase & Cloudinary
│   ├── controllers/      Logika endpoint (auth, category, photo, user)
│   ├── lib/              Helper (exif, realtime, cloudinary)
│   ├── middleware/       verifyToken, verifyAdmin, errorHandler
│   ├── models/           Query database
│   ├── routes/           Definisi rute API
│   ├── docs/             Spesifikasi OpenAPI 3.0
│   └── server.js         Entry point Express + endpoint SSE
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (auth)/           login, register
│       │   ├── (app)/
│       │   │   ├── home/         Feed utama + filter gear
│       │   │   ├── search/       Pencarian multi-dimensi
│       │   │   ├── addphoto/     Studio upload
│       │   │   ├── dashboard/    Analitik kreator
│       │   │   ├── account/      Profil pribadi & publik [id]
│       │   │   └── photos/[id]/  Detail foto
│       │   └── page.js           Landing page guest
│       ├── components/           Komponen fitur (PhotoCard, Lightbox, RGBHistogram, dll.)
│       │   └── ui/               Komponen primitif (Button, Modal, Dropzone, dll.)
│       ├── context/              AuthContext
│       └── lib/                  Klien API, Cloudinary, EXIF, realtime
│
├── .md/
│   ├── PRD/              Product Requirements Document
│   ├── DESIGN/           Design System (sumber kebenaran visual)
│   └── DB/               Skema database & RLS
│
└── assets/               Aset brand & logo resmi
```

`vercel.json` (root) = konfigurasi deploy Services untuk kedua folder di atas.

---

## Memulai

### Prasyarat

- Node.js 20+
- Akun Supabase (dengan skema dari `.md/DB/schema.md`)
- Akun Cloudinary

### Instalasi

```bash
# Clone repositori
git clone <repo-url>
cd picflow

# Backend
cd backend
npm install
# Buat file .env (lihat Variabel Lingkungan)
npm run dev          # berjalan di http://localhost:8000

# Frontend (terminal terpisah)
cd frontend
npm install
npm run dev          # berjalan di http://localhost:3001
```

### Skrip Tersedia

**Backend**
```bash
npm run dev          # nodemon, auto-reload
npm start            # produksi
```

**Frontend**
```bash
npm run dev          # dev server port 3001
npm run build        # build produksi
npm start            # jalankan build
npm run lint         # ESLint
```

---

## Deploy ke Vercel

Repo ini sudah siap deploy dari **root repo** — tanpa mengubah Root Directory di dashboard.

`vercel.json` memakai [Vercel Services](https://vercel.com/docs/services): dua service dalam satu project, satu domain.

| Service | Root | Rewrite |
| --- | --- | --- |
| `frontend` | `frontend/` | `/(.*)` |
| `backend` | `backend/` | `/api/(.*)` |

Langkah:

1. Push branch ke GitHub.
2. Vercel → **Add New Project** → import repo. Biarkan Root Directory kosong, framework terdeteksi otomatis.
3. **Deploy**.
4. Tambah Environment Variables (nilai dari `backend/.env`, jangan commit): `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

`NEXT_PUBLIC_API_URL` **tidak perlu** diisi — default-nya same-origin (lihat `src/lib/api.js`).

Catatan arsitektur: backend berjalan sebagai Vercel Function, jadi `app.listen` dilewati lewat guard `process.env.VERCEL` dan file upload ditampung di `os.tmpdir()` sebelum diteruskan ke Cloudinary (filesystem deploy read-only).

---

## Variabel Lingkungan

### `backend/.env`

```env
SUPABASE_URL=https://<project>.supabase.co
# Secret key (prefix `sb_secret_...`) — melewati Row Level Security
SUPABASE_SECRET_KEY=<secret-key>
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
```

> Gunakan **secret key** hanya di backend. Jangan pernah mengeksposnya ke klien.

### `frontend/.env.local`

```env
# Opsional. Kosongkan di deploy: frontend memanggil backend lewat origin yang
# sama (lihat vercel.json → rewrites /api/*).
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Referensi API

Base URL: `http://localhost:8000/api`

### Autentikasi

| Method | Endpoint | Auth | Deskripsi |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | - | Registrasi user baru |
| `POST` | `/auth/login` | - | Login, mengembalikan JWT |
| `GET` | `/auth/me` | Token | Ambil profil user aktif |
| `PUT` | `/auth/profile` | Token | Perbarui full name, bio, username |

### Foto

| Method | Endpoint | Auth | Deskripsi |
| --- | --- | --- | --- |
| `POST` | `/photos` | Token | Unggah foto + ekstraksi EXIF |
| `GET` | `/photos` | Opsional | Feed dengan filter (kategori, gear, following) |
| `GET` | `/photos/:id` | Opsional | Detail foto |
| `PUT` | `/photos/:id` | Token | Perbarui metadata foto |
| `DELETE` | `/photos/:id` | Token | Hapus foto |
| `POST` | `/photos/:id/like` | Token | Toggle like |

### Komentar & Kritik

| Method | Endpoint | Auth | Deskripsi |
| --- | --- | --- | --- |
| `GET` | `/photos/:id/comments` | Opsional | Daftar komentar |
| `POST` | `/photos/:id/comments` | Token | Tambah komentar |
| `DELETE` | `/photos/:id/comments/:commentId` | Token | Hapus komentar |
| `GET` | `/photos/:id/critiques` | Opsional | Daftar kritik + agregat skor |
| `POST` | `/photos/:id/critiques` | Token | Tambah kritik 4 pilar |
| `PUT` | `/photos/:id/critiques/:critiqueId` | Token | Sunting kritik |
| `DELETE` | `/photos/:id/critiques/:critiqueId` | Token | Hapus kritik |

### User & Sosial

| Method | Endpoint | Auth | Deskripsi |
| --- | --- | --- | --- |
| `GET` | `/users/dashboard` | Token | Metrik analitik kreator |
| `GET` | `/users/:id` | Opsional | Profil publik (UUID atau username) |
| `POST` | `/users/:id/follow` | Token | Toggle follow |
| `GET` | `/users/:id/follow-status` | Token | Status follow |

### Kategori

| Method | Endpoint | Auth | Deskripsi |
| --- | --- | --- | --- |
| `GET` | `/categories` | - | Daftar kategori |
| `GET` | `/categories/:id` | - | Detail kategori |
| `POST` | `/categories` | Admin | Buat kategori |
| `PUT` | `/categories/:id` | Admin | Perbarui kategori |
| `DELETE` | `/categories/:id` | Admin | Hapus kategori |

### Realtime

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| `GET` | `/realtime/stream` | SSE stream interaksi (like, komentar, kritik, follow) |

---

## Design System

PicFlow mengadopsi estetika **Modern Fluid Editorial & Calibrated Spectrum**. Referensi lengkap di `.md/DESIGN/design.md`.

### Palet Utama (Trio Gamut sRGB)

| Gamut | Hex | Peran |
| --- | --- | --- |
| **Red** | `#EF4444` | Like aktif, tally kamera, status destruktif |
| **Green** | `#10B981` | Status aktif, kreator terverifikasi, aksi konfirmasi |
| **Blue** | `#3B82F6` / `#2563EB` | Aksi primer, tautan, fokus form |

### Kanvas

| Token | Light | Dark |
| --- | --- | --- |
| Background | `#FFFDF6` | `#070B14` |
| Surface Subtle | `#F5EFE6` | `#0B0F19` |
| Card | `#FFFFFF` | `#111827` |
| Border Subtle | `#E8DEC9` | `#1E293B` |
| Border Strong | `#DCD0BE` | `#334155` |
| Text Primary | `#1C1917` | `#F8FAFC` |
| Text Muted | `#57534E` | `#94A3B8` |

### Prinsip

- **High-Key Photographic Clarity** — kanvas bersih untuk apresiasi detail visual.
- **Organic Flowing Spectrum** — kurva fluid merepresentasikan aliran inspirasi.
- **Floating Micro-Orbits** — kartu karya dalam lingkaran aperture mengambang.
- **Floating Pill Utility** — kontrol utama berbentuk kapsul `rounded-full`.
- **Gear-Centric Credibility** — menonjolkan ekosistem kamera & parameter EXIF.

---

## Roadmap

- [ ] Editor gambar internal (crop, retouching, watermark generator)
- [ ] Dasbor moderasi admin terdedikasi
- [ ] Marketplace lisensi foto & payment gateway
- [ ] Dukungan format video pendek
- [ ] AI-assisted photography critique

---

<div align="center">

**PicFlow** — *sRGB STANDARD & CRAFT*

Dibangun untuk fotografer yang peduli pada setiap piksel.

</div>
