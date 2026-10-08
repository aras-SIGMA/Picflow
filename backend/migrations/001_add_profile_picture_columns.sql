-- Jalankan manual pada database picflow. Tidak dijalankan otomatis oleh aplikasi.
-- MySQL 8 mendukung IF NOT EXISTS sehingga aman bila kolom sudah tersedia.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(2048) NULL,
  ADD COLUMN IF NOT EXISTS profile_picture_public_id VARCHAR(255) NULL;
