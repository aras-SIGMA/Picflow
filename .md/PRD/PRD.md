# Product Requirements Document (PRD) — PicFlow

---

## 1. Executive Summary

### Problem Statement
Fotografer kesulitan menemukan platform pamer karya yang menjaga kualitas visual tanpa kompresi berlebih, sekaligus menyediakan ruang diskusi teknis seputar gear dan metadata kamera (EXIF) secara real-time. Platform sosial konvensional sering mereduksi resolusi, mengabaikan kalibrasi warna sRGB, serta tidak memfasilitasi kritik fotografi yang konstruktif dan terstruktur.

### Proposed Solution
PicFlow bertransformasi menjadi platform media sosial dan showcase fotografi kurasi berbasis web yang menyediakan:
1. Feed sosial dan interaksi real-time (Like, Komentar, Follow).
2. Ekstraksi otomatis metadata optik kamera & EXIF.
3. Pengiriman gambar multi-resolusi adaptif berbasis CDN Cloudinary (WebP/AVIF).
4. Sistem kritik konstruktif 4 pilar teknis fotografi (Komposisi, Pencahayaan, Warna & Tone, Konsep).
5. Antarmuka editorial elegan berbasis kanvas *Warm Cream* (`#FFFDF6`), animasi dinamis WebGL *GradientWaves*, dan pendaran spektrum sRGB *Aurora*.

### Success Criteria (KPIs)
1. **Upload Latency**: Waktu unggah dan ekstraksi gambar ukuran hingga 25MB selesai dalam waktu $\le 2.0$ detik pada koneksi $\ge 20$ Mbps.
2. **Page Load Performance**: Largest Contentful Paint (LCP) halaman Explore/Feed $\le 1.2$ detik, skor Lighthouse Performance $\ge 90$.
3. **Real-time Latency**: Latensi penyampaian interaksi (like, komentar, kritik) ke antarmuka pengguna $\le 250$ ms via Server-Sent Events (SSE) / WebSocket / Supabase Realtime.
4. **Metadata Extraction Accuracy**: $\ge 98\%$ file JPEG/TIFF/RAW yang memiliki tag EXIF berhasil diekstrak tanpa error parsing.
5. **Critique Constructiveness Index**: $\ge 80\%$ ulasan foto menyertakan skor 4 pilar serta poin penguatan & rekomendasi perbaikan yang terstruktur.

---

## 2. User Experience & Functionality

### User Personas
- **Aris (Fotografer Hobi & Prosumer)**: Menginginkan wadah portofolio publik berkualitas tinggi, membaca parameter kamera foto fotografer lain (shutter speed, aperture, ISO, lensa), mendapatkan kritik teknis untuk meningkatkan kemampuan, dan membangun basis pengikut.
- **Dina (Kolektor & Kurator Visual)**: Menikmati eksplorasi visual berkualitas tinggi, memfilter feed karya berdasarkan genre atau gear kamera, serta mengapresiasi karya melalui interaksi real-time.

### User Stories & Acceptance Criteria

#### US-01: Ekstraksi & Tampilan Metadata EXIF Otomatis
- **Story**: As a photographer, I want my camera EXIF data extracted automatically on upload so that viewers can learn the exact shooting parameters without manual entry.
- **Acceptance Criteria**:
  - Sistem mengekstrak field: Camera Make/Model, Lens, Shutter Speed, Aperture (f-stop), ISO, Focal Length, Sensor, dan Timestamp.
  - Nilai field yang tidak ada otomatis dilabeli `N/A` tanpa menggagalkan proses unggah.
  - Tampilan overlay atau sidebar pada Lightbox & Halaman Detail Foto menampilkan badge teknis EXIF yang presisi.

#### US-02: Pengiriman Gambar Multi-Resolusi Adaptif (Cloudinary)
- **Story**: As a user browsing on mobile or desktop, I want photos to load in optimal resolutions and modern formats so that bandwidth is saved and rendering is instantaneous.
- **Acceptance Criteria**:
  - Gambar tersimpan di Cloudinary dengan transformasi otomatis format WebP/AVIF (`f_auto,q_auto`).
  - Sistem menyediakan 3 breakpoint transformasi: Thumbnail (400px), Medium/Grid (1080px), dan High-Res/Lightbox (2048px+).
  - Tampilan grid menggunakan masonry responsif dengan atribut HTML `srcset` dan `sizes` yang adaptif terhadap viewport.

#### US-03: Interaksi Sosial Real-Time (Like, Komentar, Follow)
- **Story**: As a community member, I want to like, comment on photos, and follow creators with immediate updates so that engagement feels dynamic and responsive.
- **Acceptance Criteria**:
  - Klik tombol "Like" menerapkan optimistic UI update dalam $\le 50$ ms dan mensinkronisasi data ke backend/Supabase.
  - Perubahan jumlah like dan penambahan komentar baru ter-broadcast ke pengguna lain secara real-time via event stream (SSE / WebSocket).
  - Fitur follow/unfollow memperbarui feed tab "Following" secara real-time.

#### US-04: Migrasi Database ke Cloud (Supabase PostgreSQL)
- **Story**: As a system administrator, I want database records hosted on Supabase with Row Level Security (RLS) so that user data is reliable, relational, and natively reactive.
- **Acceptance Criteria**:
  - Skema tabel `users`, `photos`, `categories`, `comments`, `likes`, `follows`, dan `critiques` terstruktur dengan relasi foreign keys, cascading delete, dan indexes.
  - Koneksi backend Express terintegrasi dengan client Supabase PostgreSQL yang aman menggunakan stateless service credentials.

#### US-05: Sistem Kritik Konstruktif Fotografi 4 Pilar
- **Story**: As a photographer, I want structured feedback on my technical execution so that I can systematically refine my craft.
- **Acceptance Criteria**:
  - Penilai memberikan skor numerik (skala 1-5) pada 4 pilar: Composition (Komposisi), Lighting (Pencahayaan), Color & Tone (Warna), dan Concept & Narrative (Konsep).
  - Form menyediakan kolom input terpisah untuk "Strengths" (Kekuatan karya) dan "Areas for Improvement" (Saran pengembangan).
  - Halaman foto menghitung agregat skor rata-rata per pilar dan skor keseluruhan secara otomatis.
  - Penambahan dan penghapusan kritik ter-sinkronisasi instan via event real-time `critique:added` dan `critique:deleted`.

#### US-06: Editorial Showcase Landing Page & Ekosistem Kamera Calibrated
- **Story**: As a guest visitor, I want an engaging editorial landing page with smooth motion and gear credibility so that I understand PicFlow's value proposition immediately.
- **Acceptance Criteria**:
  - Hero section dilengkapi cursor-tracking spotlight mask dengan soft Gaussian falloff yang mengungkap grid fotografi di balik kanvas `#FFFDF6`.
  - Headline editorial dengan aksen sRGB (Red, Green, Blue) dan viewfinder reticle framing kamera (tally lamp REC aktif).
  - Komponen infinite carousel `LogoLoop` menampilkan 12 instrumen kamera dan software editing kurasi (Sony, Canon, Nikon, Fujifilm, Leica, Hasselblad, Panasonic, Sigma, DJI, Godox, Photoshop, Lightroom) dengan state idle monokromatis dan hover warna asli.
  - Bagian Footer dan CTA komunitas disatukan dalam satu window frame dengan shader WebGL dinamis `<GradientWaves />` (OGL).

#### US-07: Autentikasi Kreator & Floating Vault Access (Login/Register)
- **Story**: As a photographer, I want a secure and visually polished login/registration experience that feels native to the platform aesthetic.
- **Acceptance Criteria**:
  - Kanvas latar belakang menggunakan tema terang Warm Cream `#FFFDF6` dengan animasi aurora dinamis spektrum sRGB dan micro-grid fotografi.
  - Kartu form didesain melayang (*floating elevated card*) dengan multi-tier box-shadow, under-glow pendaran warna, dan durasi transisi lembut quintic easing (`0.95s`).
  - Form Register dilengkapi meter kekuatan password real-time 5-level (Too short, Weak, Fair, Strong, Very strong).
  - Navigasi kembali mengambang di pojok kiri atas dan logo resmi PicFlow di pojok kanan atas.

#### US-08: Manajemen Portofolio & Profil Fotografer
- **Story**: As a creator, I want a dedicated account page to showcase my published works and track engagement statistics.
- **Acceptance Criteria**:
  - Halaman `/account` menampilkan header profil fotografer, bio singkat, dan total akumulasi likes serta followers.
  - Tabulasi galeri karya pribadi dalam masonry grid adaptif dengan aksi cepat buka detail foto.
  - Dukungan autentikasi berbasis token JWT stateless dengan persistensi sesi pengguna via `AuthContext`.

### Non-Goals
- Tidak menyediakan editor gambar / filter manipulasi internal (crop, retouching manual, watermark generator) di fase ini.
- Tidak menyediakan marketplace komersial lisensi foto atau payment gateway checkout di rilis MVP saat ini.
- Tidak mendukung upload format video pendek atau audio.

---

## 3. AI System Requirements (Opsional / Roadmap Lanjutan)

### Tool Requirements
- Ekstraksi tag otomatis (Auto-tagging): Cloudinary AI Content Analysis API atau model Vision (CLIP/Gemini Vision) untuk mendeteksi subjek (landscape, portrait, street, night, macro).
- Analisis rasio komposisi otomatis (Rule of Thirds AI Detector) untuk mendampingi skor kritik.

### Evaluation Strategy
- Precision@5 $\ge 80\%$ untuk akurasi tag visual otomatis sebelum disimpan ke tabel `photo_tags`.

---

## 4. Technical Specifications

### Architecture Overview

```
[ Next.js Client (App Router - Port 3001) ]
         │
         ├─── Direct Upload / Signed URL ────> [ Cloudinary CDN & Storage ]
         │                                            │ (Delivery: AVIF/WebP)
         ├─── REST API Requests ─────────────> [ Node.js Express Backend ]
         │                                            │
         │                                     [ Supabase PostgreSQL ]
         │                                            │
         └─── Realtime Channel (SSE/WebSocket) ───────┘ (Change Data Capture)
```

### Integration Points
1. **Cloudinary SDK**:
   - Menghasilkan signature untuk upload langsung dari klien guna memangkas beban memori server backend.
   - Menyediakan transformasi URL dinamis adaptif breakpoint (`w_400`, `w_1080`, `w_2048`).
2. **Supabase PostgreSQL & Realtime**:
   - Skema basis data relasional PostgreSQL dengan tabel `users`, `photos`, `categories`, `comments`, `likes`, `follows`, dan `critiques`.
   - Streaming event server (SSE/WebSocket) mem-broadcast update counter interaksi instan antar pengguna.
3. **EXIF Parser Engine**:
   - Parsing buffer gambar mentah client-side sebelum payload diunggah ke pipeline cloud CDN.
4. **WebGL Rendering (OGL) & Motion**:
   - Library `ogl` untuk render shader gelombang spektrum sRGB `<GradientWaves />` pada GPU.
   - `framer-motion` untuk transisi halaman, spotlight cursor reveal, dan entrance easing kartu form.

### Security & Privacy
- **JWT & Stateless Auth**: Autentikasi stateless dengan token JWT berkeamanan tinggi yang disimpan aman pada sisi klien.
- **Sanitasi File & MIME Verification**: Validasi ketat format `image/jpeg`, `image/png`, `image/webp`, `image/tiff` dengan batas maksimum 25MB per berkas.
- **Proteksi EXIF Lokasi (GPS)**: Opsi default stripping koordinat lokasi sensitif demi menjaga privasi kreator.

---

## 5. Risks & Roadmap

### Phased Rollout

#### Phase 1: Infrastructure & Cloud Migration (Completed)
- Migrasi database lokal MySQL ke Supabase PostgreSQL.
- Integrasi Cloudinary SDK menggantikan penyimpanan lokal `uploads/`.
- Perbaikan API auth dan photo schema agar kompatibel dengan PostgreSQL.

#### Phase 2: EXIF & Image Optimization (Completed)
- Ekstraksi EXIF otomatis saat upload foto (`/addphoto`).
- Integrasi responsive image dengan Cloudinary multi-resolution delivery.
- Tampilan metadata panel teknis pada Lightbox & halaman detail karya (`/photos/[id]`).

#### Phase 3: Social & Real-time Layer (Completed)
- Pembuatan tabel dan relasi `likes`, `comments`, `follows`.
- Integrasi event stream real-time pada counter like dan feed komentar.
- Tampilan Feed Beranda `/home` dengan tabulasi "Explore" dan "Following".

#### Phase 4: Constructive Critique & Visual Identity (Completed)
- Implementasi sistem kritik konstruktif 4 pilar fotografi (`critiques`).
- Redesain landing page editorial lengkap dengan cursor spotlight mask hero, ekosistem 12 brand kamera `LogoLoop`, dan footer terpadu WebGL `GradientWaves`.
- Redesain halaman login & register bertema Warm Cream `#FFFDF6`, pendaran aurora sRGB, dan kartu floating halus.

#### Phase 5: Advanced Curation & Community Challenges (Upcoming)
- Fitur *Collections & Moodboards* tematik fotografer.
- Filter feed berbasis kamera dan lensa (Gear-specific browse).
- Mode *Re-Shoot Challenge* atau evaluasi histogram & palet warna sRGB otomatis.

### Technical Risks & Mitigasi
1. **Beban Bandwidth & Memory Server Saat Upload Foto Besar**:
   - *Mitigasi*: Gunakan pola Direct Upload dari browser langsung ke Cloudinary menggunakan pre-signed upload tickets. Backend hanya menerima payload JSON metadata dan image URL.
2. **Koneksi Real-time Drop di Jaringan Mobile Lemah**:
   - *Mitigasi*: Mekanisme fallback polling interval dan reconnect handler otomatis pada SSE/WebSocket client.
3. **Kehilangan Data EXIF Akibat Kompresi Browser**:
   - *Mitigasi*: Ekstrak buffer EXIF dari file mentah `File` object sebelum file diunggah ke pipeline CDN.
