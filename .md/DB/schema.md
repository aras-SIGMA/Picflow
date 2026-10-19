# Dokumentasi Skema Database PicFlow (Supabase PostgreSQL)

Dokumen ini adalah referensi resmi arsitektur basis data PicFlow pada Supabase PostgreSQL, mencakup diagram relasi, definisi kolom, batasan (constraints), indeks, contoh query DDL, kebijakan keamanan Row Level Security (RLS), serta pola integrasi dengan backend Express.js.

---

## 1. Diagram Relasi Entitas (ERD)

```text
       auth.users (Supabase Managed)
             │
             │ (1:1 via trigger)
             ▼
        ┌──────────┐
        │ profiles │
        └────┬─────┘
             │
   ┌─────────┼───────────────────────────┬───────────────────────────┐
   │ 1       │ 1                         │ 1                         │ 1
   ▼ N       ▼ N                         ▼ N                         ▼ N
┌────────┐ ┌────────┐                  ┌───────┐                  ┌───────────┐
│ photos │ │ likes  │                  │follows│                  │ critiques │
└───┬────┘ └───┬────┘                  └───┬───┘                  └─────┬─────┘
    │ N        │                           │                            │
    │          └───────────────┐           │ (self-ref profiles)        │
    │                          │           ▼                            │
    │ 1                        │     ┌──────────┐                       │
┌───┴────────┐                 └────>│  photos  │<──────────────────────┘
│ categories │                       └────┬─────┘
└────────────┘                            │ 1
                                          │
                                          ▼ N
                                     ┌──────────┐
                                     │ comments │
                                     └──────────┘
```

### Ringkasan Kardinalitas
- `profiles` 1 ── N `photos` (seorang kreator dapat mengunggah banyak foto).
- `categories` 1 ── N `photos` (satu kategori menampung banyak foto).
- `photos` 1 ── N `comments` (satu foto memiliki banyak komentar diskusi).
- `photos` 1 ── N `likes` (satu foto dapat disukai banyak user; pasangan `(photo_id, user_id)` unik).
- `photos` 1 ── N `critiques` (satu foto memiliki banyak review teknis terstruktur).
- `profiles` N ── M `profiles` melalui tabel perantara `follows` (`follower_id` → `following_id`).

---

## 2. Tabel & Definisi Kolom

### 2.1 `profiles`
Menyimpan profil publik kreator. Dibuat otomatis saat user mendaftar via Supabase Auth melalui database trigger.

| Kolom | Tipe Data | Nullable | Default | Keterangan & Constraint |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | - | **Primary Key**, FK referensi ke `auth.users(id)` ON DELETE CASCADE |
| `username` | `text` | NOT NULL | - | Nama unik user, min 3 karakter |
| `full_name` | `text` | NULL | NULL | Nama lengkap tampilan kreator |
| `bio` | `text` | NULL | NULL | Deskripsi singkat bio fotografer |
| `avatar_url` | `text` | NULL | NULL | URL secure Cloudinary untuk foto profil |
| `avatar_public_id` | `text` | NULL | NULL | Public ID Cloudinary untuk penghapusan/update aset lama |
| `role` | `text` | NOT NULL | `'user'` | Peran platform: `user` atau `admin` (`CHECK role IN ('user','admin')`) |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Waktu profil terdaftar |
| `updated_at` | `timestamptz` | NULL | `now()` | Waktu profil terakhir diperbarui |

#### Contoh DDL
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  avatar_public_id TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Migrasi untuk database yang sudah berjalan (idempoten):
-- ALTER TABLE public.profiles
--   ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
--   CHECK (role IN ('user', 'admin'));
-- CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
-- Bootstrap admin pertama (manual via SQL Editor):
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<TARGET_USER_UUID>';

-- Trigger pembuatan profil otomatis saat user register di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### 2.2 `categories`
Menampung genre/klasifikasi foto kurasi PicFlow (Portrait, Landscape, Street, Nature, Wedding, Event, Product).

| Kolom | Tipe Data | Nullable | Default | Keterangan & Constraint |
|---|---|---|---|---|
| `id` | `serial` / `int4` | NOT NULL | auto-increment | **Primary Key** |
| `name` | `text` | NOT NULL | - | Nama kategori unik (`UNIQUE`) |
| `slug` | `text` | NOT NULL | - | URL-friendly slug unik (`UNIQUE`) |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Waktu kategori ditambahkan |

#### Contoh DDL
```sql
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Data Awal Kategori Baku
INSERT INTO public.categories (name, slug) VALUES
  ('Portrait', 'portrait'),
  ('Landscape', 'landscape'),
  ('Street', 'street'),
  ('Nature', 'nature'),
  ('Wedding', 'wedding'),
  ('Event', 'event'),
  ('Product', 'product')
ON CONFLICT (slug) DO NOTHING;
```

---

### 2.3 `photos`
Menyimpan portofolio karya fotografi, metadata EXIF kamera/lensa, dimensi sensor, dan tautan Cloudinary.

| Kolom | Tipe Data | Nullable | Default | Keterangan & Constraint |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | **Primary Key** |
| `user_id` | `uuid` | NOT NULL | - | FK → `profiles(id)` ON DELETE CASCADE |
| `category_id` | `int4` | NOT NULL | - | FK → `categories(id)` ON DELETE RESTRICT |
| `title` | `text` | NOT NULL | - | Judul karya |
| `description` | `text` | NULL | NULL | Deskripsi narasi karya |
| `image_url` | `text` | NOT NULL | - | URL Cloudinary resolusi master |
| `cloudinary_public_id` | `text` | NOT NULL | - | ID aset Cloudinary untuk lifecycle destroy |
| `width` | `int4` | NULL | NULL | Lebar piksel asli gambar |
| `height` | `int4` | NULL | NULL | Tinggi piksel asli gambar |
| `aspect_ratio` | `numeric(4,2)` | NULL | NULL | Rasio aspek sensor kamera (cth: `1.50` untuk 3:2) |
| `camera_make` | `text` | NULL | NULL | Merk kamera (cth: "Sony", "Canon", "Fujifilm") |
| `camera_model` | `text` | NULL | NULL | Model bodi kamera (cth: "ILCE-7RM4", "EOS R5") |
| `lens` | `text` | NULL | NULL | Nama lensa (cth: "FE 24-70mm F2.8 GM II") |
| `focal_length` | `text` | NULL | NULL | Jarak fokus terbaca EXIF (cth: "50mm") |
| `aperture` | `text` | NULL | NULL | Bukaan diafragma (cth: "f/2.8") |
| `shutter_speed` | `text` | NULL | NULL | Kecepatan rana (cth: "1/500s", "2s") |
| `iso` | `int4` | NULL | NULL | Sensitivitas ISO (cth: 100, 800, 3200) |
| `taken_at` | `timestamptz` | NULL | NULL | Waktu pemotretan asli dari tag EXIF `DateTimeOriginal` |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Waktu diunggah ke PicFlow |
| `updated_at` | `timestamptz` | NULL | `now()` | Waktu data foto diperbarui |

#### Contoh DDL
```sql
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  width INT,
  height INT,
  aspect_ratio NUMERIC(4,2),
  camera_make TEXT,
  camera_model TEXT,
  lens TEXT,
  focal_length TEXT,
  aperture TEXT,
  shutter_speed TEXT,
  iso INT,
  taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_photos_user_id ON public.photos(user_id);
CREATE INDEX idx_photos_category_id ON public.photos(category_id);
CREATE INDEX idx_photos_created_at ON public.photos(created_at DESC);
```

---

### 2.4 `comments`
Menyimpan komentar diskusi umum antar fotografer pada suatu karya foto.

| Kolom | Tipe Data | Nullable | Default | Keterangan & Constraint |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | **Primary Key** |
| `photo_id` | `uuid` | NOT NULL | - | FK → `photos(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | NOT NULL | - | FK → `profiles(id)` ON DELETE CASCADE |
| `content` | `text` | NOT NULL | - | Isi komentar (1 s/d 1000 karakter) |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Waktu komentar diposting |
| `updated_at` | `timestamptz` | NULL | `now()` | Waktu komentar diperbarui |

#### Contoh DDL
```sql
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_comments_content_length CHECK (char_length(content) BETWEEN 1 AND 1000)
);

CREATE INDEX idx_comments_photo_id ON public.comments(photo_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
```

---

### 2.5 `likes`
Mencatat tanda apresiasi (*like*) karya. Pasangan user dan foto dilindungi batasan unik agar tidak terjadi double-like.

| Kolom | Tipe Data | Nullable | Default | Keterangan & Constraint |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | **Primary Key** |
| `photo_id` | `uuid` | NOT NULL | - | FK → `photos(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | NOT NULL | - | FK → `profiles(id)` ON DELETE CASCADE |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Waktu foto disukai |

#### Contoh DDL
```sql
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_likes_photo_user UNIQUE (photo_id, user_id)
);

CREATE INDEX idx_likes_photo_id ON public.likes(photo_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
```

---

### 2.6 `follows`
Hubungan sosial dua arah antar sesama kreator (follower mengikuti following). Mencegah user mengikuti diri sendiri.

| Kolom | Tipe Data | Nullable | Default | Keterangan & Constraint |
|---|---|---|---|---|
| `follower_id` | `uuid` | NOT NULL | - | FK → `profiles(id)` ON DELETE CASCADE |
| `following_id` | `uuid` | NOT NULL | - | FK → `profiles(id)` ON DELETE CASCADE |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Waktu mulai mengikuti |

#### Contoh DDL
```sql
CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT chk_no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_following_id ON public.follows(following_id);
```

---

### 2.7 `critiques`
Fitur signature PicFlow: ruang telaah teknis karya secara mendalam dengan penilaian 4 pilar fotografi (skor 1–5), poin kekuatan, serta saran pengembangan.

| Kolom | Tipe Data | Nullable | Default | Keterangan & Constraint |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | **Primary Key** |
| `photo_id` | `uuid` | NOT NULL | - | FK → `photos(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | NOT NULL | - | FK → `profiles(id)` ON DELETE CASCADE |
| `rating_composition` | `int4` | NOT NULL | - | Nilai komposisi (`CHECK 1..5`) |
| `rating_lighting` | `int4` | NOT NULL | - | Nilai pencahayaan & dynamic range (`CHECK 1..5`) |
| `rating_color` | `int4` | NOT NULL | - | Nilai harmoni warna / gradasi B&W (`CHECK 1..5`) |
| `rating_concept` | `int4` | NOT NULL | - | Nilai ide/konsep karya (`CHECK 1..5`) |
| `strengths` | `text` | NOT NULL | - | Aspek kekuatan teknis/artistik karya (3–2000 char) |
| `improvements` | `text` | NOT NULL | - | Saran konstruktif perbaikan karya (3–2000 char) |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Waktu kritik diunggah |
| `updated_at` | `timestamptz` | NULL | `now()` | Waktu kritik disunting |

#### Contoh DDL
```sql
CREATE TABLE public.critiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating_composition INT NOT NULL CHECK (rating_composition BETWEEN 1 AND 5),
  rating_lighting INT NOT NULL CHECK (rating_lighting BETWEEN 1 AND 5),
  rating_color INT NOT NULL CHECK (rating_color BETWEEN 1 AND 5),
  rating_concept INT NOT NULL CHECK (rating_concept BETWEEN 1 AND 5),
  strengths TEXT NOT NULL CHECK (char_length(strengths) BETWEEN 3 AND 2000),
  improvements TEXT NOT NULL CHECK (char_length(improvements) BETWEEN 3 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_critiques_photo_user UNIQUE (photo_id, user_id)
);

CREATE INDEX idx_critiques_photo_id ON public.critiques(photo_id);
CREATE INDEX idx_critiques_user_id ON public.critiques(user_id);
CREATE INDEX idx_critiques_created_at ON public.critiques(created_at DESC);
```

> **Catatan Validasi & Konkurensi**:
> - Pasangan `(photo_id, user_id)` pada `critiques` bersifat unik (`1 pengguna = 1 ulasan`). Upaya review berulang ditolak backend dengan status `409 Conflict`, dan user diarahkan untuk memperbarui ulasan via `PUT /api/photos/:id/critiques/:critiqueId`.
> - Pada interaksi `likes` dan `follows`, backend menangani error kode PostgreSQL `23505 (unique_violation)` secara idempoten guna mengantisipasi *rapid-click / network retry* tanpa memicu error 500 ke klien.

---

## 3. Keputusan Arsitektur & Pola Data (Design Decisions)

1. **Transformasi Gambar Cloudinary Dinamis (Tanpa Kolom Turunan)**
   - Kolom di tabel `photos` hanya menyimpan `image_url` master asli dan `cloudinary_public_id`.
   - Varian URL seperti `thumbnail_url` (400px), `medium_url` (1080px), dan `high_res_url` (2048px) dihasilkan *on-the-fly* via helper backend `getCloudinaryDeliveryUrl()` dengan flag transformasi otomatis `f_auto,q_auto,w_{size},c_limit`.
   - **Keuntungan**: Mengurangi redundansi data di basis data, mempermudah perubahan breakpoint di kemudian hari tanpa migrasi baris.

2. **Agregasi Likes & Komentar via Relasi Embed PostgREST**
   - Tidak ada kolom denormalisasi `likes_count` atau `comments_count` statis di tabel `photos`.
   - Backend menghitung jumlah interaksi lewat relasi embed Supabase:
     ```javascript
     supabase.from("photos").select("*, likes(count), comments(count)")
     ```
   - **Keuntungan**: Mencegah *race condition* dan data desinkronisasi bila ada transaksi yang gagal atau dibatalkan.

3. **Integritas Penilaian Kritik**
   - Fotografer **dilarang memberikan kritik pada karyanya sendiri** via validasi di level endpoint (`photo.user_id !== req.user.id`).
   - Setiap skor kritik 4 pilar divalidasi oleh skema Zod dan batasan PostgreSQL `CHECK (rating BETWEEN 1 AND 5)`.
   - Formula nilai rerata keseluruhan (*overall score*):
     $$\text{Overall Score} = \frac{\text{composition} + \text{lighting} + \text{color} + \text{concept}}{4}$$

4. **Pembersihan Jalur Legacy Fallback**
   - Sebelumnya, backend memiliki mekanisme transisional yang menyimpan ulasan kritik ke dalam tabel `comments` menggunakan prefix `__PICFLOW_CRITIQUE__:`.
   - Mekanisme fallback tersebut telah sepenuhnya **dihapus**. Tabel `critiques` kini menjadi satu-satunya sumber data resmi untuk fitur telaah teknis portofolio.

---

## 4. Kebijakan Row Level Security (RLS) Referensi

Di bawah ini adalah konfigurasi rekomendasi RLS PostgreSQL untuk Supabase:

```sql
-- 1. Enable RLS pada semua tabel publik
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.critiques ENABLE ROW LEVEL SECURITY;

-- 2. Kebijakan Baca Terbuka (Public Read)
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read photos" ON public.photos FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Public read likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Public read follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Public read critiques" ON public.critiques FOR SELECT USING (true);

-- 3. Kebijakan Tulis Berdasarkan Pemilik (Owner Write)
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users insert own photos" ON public.photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own photos" ON public.photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own photos" ON public.photos
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users insert own critiques" ON public.critiques
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Critique authors, photo owners, or admins delete critique" ON public.critiques
  FOR DELETE USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT user_id FROM public.photos WHERE id = critiques.photo_id) OR
    EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
  );

CREATE POLICY "Users manage own likes" ON public.likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own follows" ON public.follows
  FOR ALL USING (auth.uid() = follower_id);

-- 4. Kategori: mutasi khusus admin
CREATE POLICY "Admins insert categories" ON public.categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
  );

CREATE POLICY "Admins update categories" ON public.categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
  );

CREATE POLICY "Admins delete categories" ON public.categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
  );
```

> **Catatan Backend Service Key**: Backend Express.js menggunakan client admin Supabase dengan `SUPABASE_SECRET_KEY` (service role) yang secara default melewati RLS (*bypasses RLS*), namun kebijakan RLS di atas wajib diaktifkan guna melindungi database jika diakses langsung oleh client-side SDK Supabase.

> **Catatan RBAC**: Peran platform disimpan di `profiles.role` (`user` | `admin`). Kebijakan RLS di atas sudah memberlakukan moderasi admin (hapus kritik & mutasi kategori). Middleware Express (`verifyAdmin`) tetap menjadi lapisan otorisasi utama karena service key melewati RLS; kolom `role` tidak pernah dibaca dari input klien, selalu di-query ulang dari `profiles` per request.
