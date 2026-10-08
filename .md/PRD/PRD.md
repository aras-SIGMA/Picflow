# Product Requirements Document (PRD) — PicFlow

---

## 1. Executive Summary

### Problem Statement
Fotografer kesulitan menemukan platform pamer karya yang menjaga kualitas visual tanpa kompresi berlebih, sekaligus menyediakan ruang diskusi teknis seputar gear dan metadata kamera (EXIF) secara real-time.

### Proposed Solution
PicFlow bertransformasi menjadi platform media sosial berbasis web bagi komunitas fotografer yang menyediakan feed sosial real-time, ekstraksi metadata EXIF otomatis, dan pengiriman gambar multi-resolusi adaptif berbasis cloud.

### Success Criteria (KPIs)
1. **Upload Latency**: Waktu unggah dan ekstraksi gambar ukuran hingga 15MB selesai dalam waktu $\le 2.0$ detik pada koneksi $\ge 20$ Mbps.
2. **Page Load Performance**: Largest Contentful Paint (LCP) halaman Explore/Feed $\le 1.2$ detik, skor Lighthouse Performance $\ge 90$.
3. **Real-time Latency**: Latensi penyampaian interaksi (like/komentar) ke antarmuka pengguna $\le 250$ ms via WebSocket / Supabase Realtime.
4. **Metadata Extraction Accuracy**: $\ge 98\%$ file JPEG/TIFF/RAW yang memiliki tag EXIF berhasil diekstrak tanpa error parsing.

---

## 2. User Experience & Functionality

### User Personas
- **Aris (Fotografer Hobi & Prosumer)**: Menginginkan wadah portofolio publik, membaca parameter kamera foto milik fotografer lain (shutter speed, aperture, ISO, lensa), dan membangun basis followers.
- **Dina (Kolektor & Kurator Visual)**: Menikmati eksplorasi visual berkualitas tinggi, membuat koleksi bertema (moodboard), serta berinteraksi via komentar dan apresiasi karya.

### User Stories & Acceptance Criteria

#### US-01: Ekstraksi & Tampilan Metadata EXIF Otomatis
- **Story**: As a photographer, I want my camera EXIF data extracted automatically on upload so that viewers can learn the exact shooting parameters without manual entry.
- **Acceptance Criteria**:
  - Sistem mengekstrak field: Camera Make/Model, Lens, Shutter Speed, Aperture (f-stop), ISO, Focal Length, dan Timestamp.
  - Nilai field yang tidak ada otomatis dilabeli `N/A` tanpa menggagalkan proses unggah.
  - Tampilan overlay atau sidebar pada Lightbox menampilkan ikon teknis dan nilai EXIF yang rapi.

#### US-02: Pengiriman Gambar Multi-Resolusi Adaptif (Cloudinary)
- **Story**: As a user browsing on mobile or desktop, I want photos to load in optimal resolutions and modern formats so that bandwidth is saved and rendering is instantaneous.
- **Acceptance Criteria**:
  - Gambar tersimpan di Cloudinary dengan transformasi otomatis format WebP/AVIF (`f_auto,q_auto`).
  - Sistem menyediakan 3 breakpoint transformasi: Thumbnail (400px), Medium/Grid (1080px), dan High-Res/Lightbox (2048px+).
  - Tampilan grid menggunakan atribut HTML `srcset` dan `sizes` yang sesuai resolusi layar perangkat.

#### US-03: Interaksi Sosial Real-Time (Like, Komentar, Follow)
- **Story**: As a community member, I want to like, comment on photos, and follow creators with immediate updates so that engagement feels dynamic and responsive.
- **Acceptance Criteria**:
  - Klik tombol "Like" menerapkan optimistic UI update dalam $\le 50$ ms dan mensinkronisasi data ke Supabase.
  - Perubahan jumlah like dan penambahan komentar baru ter-broadcast ke pengguna lain yang membuka foto yang sama dalam $\le 250$ ms.
  - Fitur follow/unfollow memperbarui feed tab "Following" secara real-time.

#### US-04: Migrasi Database ke Cloud (Supabase PostgreSQL)
- **Story**: As a system administrator, I want database records hosted on Supabase with Row Level Security (RLS) so that user data is reliable, relational, and natively reactive.
- **Acceptance Criteria**:
  - Skema tabel `users`, `photos`, `categories`, `comments`, `likes`, dan `follows` terstruktur dengan foreign keys dan indexes.
  - Koneksi backend menggunakan connection pooling Supabase (`pg` / Prisma / Kysely / Drizzle).

### Non-Goals
- Tidak menyediakan editor gambar / filter internal (crop, color grading, watermark) di fase ini.
- Tidak menyediakan fitur marketplace / penjualan lisensi foto atau payment gateway di fase MVP/v1.1.
- Tidak mendukung upload format video.

---

## 3. AI System Requirements (Opsional / Roadmap Lanjutan)

### Tool Requirements
- Ekstraksi tag otomatis (Auto-tagging): Cloudinary AI Content Analysis API atau model Vision (CLIP/Gemini Vision) untuk mendeteksi subjek (landscape, portrait, street, night, macro).

### Evaluation Strategy
- Precision@5 $\ge 80\%$ untuk akurasi tag visual otomatis sebelum disimpan ke tabel `photo_tags`.

---

## 4. Technical Specifications

### Architecture Overview

```
[ Next.js Client (App Router) ]
         │
         ├─── Direct Upload / Signed URL ────> [ Cloudinary CDN & Storage ]
         │                                            │ (Delivery: AVIF/WebP)
         ├─── REST API Requests ─────────────> [ Node.js Express Backend ]
         │                                            │
         │                                     [ Supabase PostgreSQL ]
         │                                            │
         └─── Realtime Channel (WebSocket) <──────────┘ (Change Data Capture)
```

### Integration Points
1. **Cloudinary SDK**:
   - Menghasilkan signature untuk upload langsung dari klien (Direct Signed Upload) guna menghemat beban memory server Node.js.
   - Mengambil URL transformasi dinamis (`w_400`, `w_1080`, `w_2048`).
2. **Supabase PostgreSQL & Realtime**:
   - Database relations dengan PostgreSQL 15+.
   - Supabase Realtime Client (`@supabase/supabase-js`) disematkan pada frontend untuk listen event `INSERT`/`DELETE` di tabel `likes` dan `comments`.
3. **EXIF Parser**:
   - `exif-parser` / `exifr` dijalankan pada sisi client sebelum/selama upload untuk parsing cepat sebelum dikirim ke database bersama payload metadata.

### Security & Privacy
- **JWT & Supabase Auth/Token**: Autentikasi stateless dengan access token JWT.
- **Sanitasi File**: Whitelist format MIME `image/jpeg`, `image/png`, `image/webp`, `image/tiff`. Ukuran file dibatasi maksimal 25MB per upload.
- **Proteksi EXIF Lokasi (GPS)**: Opsi default stripping koordinat GPS sensitif untuk privasi pengguna, kecuali pengguna secara eksplisit mengaktifkan "Share Location".

---

## 5. Risks & Roadmap

### Phased Rollout

#### Phase 1: Infrastructure & Cloud Migration (Minggu 1-2)
- Migrasi database lokal MySQL ke Supabase PostgreSQL.
- Integrasi Cloudinary SDK menggantikan penyimpanan lokal `uploads/`.
- Perbaikan API auth dan photo schema agar kompatibel dengan PostgreSQL.

#### Phase 2: EXIF & Image Optimization (Minggu 3)
- Ekstraksi EXIF otomatis (`exifr`) saat upload.
- Penambahan komponen responsive image dengan `srcset` Cloudinary.
- Tampilan metadata panel pada Lightbox & halaman detail foto.

#### Phase 3: Social & Real-time Layer (Minggu 4-5)
- Pembuatan tabel `likes`, `comments`, `follows`.
- Integrasi Supabase Realtime pada counter like dan feed komentar.
- Tampilan Feed Beranda (Tab "Explore" vs Tab "Following").

### Technical Risks & Mitigasi
1. **Beban Bandwidth & Memory Server Saat Upload Foto Besar**:
   - *Mitigasi*: Gunakan pola Direct Upload dari browser langsung ke Cloudinary menggunakan pre-signed upload tickets. Backend hanya menerima payload JSON metadata dan image URL.
2. **Koneksi WebSocket Drop di Jaringan Mobile Lemah**:
   - *Mitigasi*: Mekanisme fallback polling interval dan reconnect handler otomatis pada Supabase Realtime client.
3. **Kehilangan Data EXIF Akibat Kompresi Browser**:
   - *Mitigasi*: Ekstrak buffer EXIF dari file mentah `File` object sebelum file diunggah ke pipeline CDN.
