// config/database.js
// Koneksi ke MySQL menggunakan mysql2/promise.
// Kita pakai "pool" (kumpulan koneksi) supaya tidak membuat koneksi baru
// setiap kali query dijalankan.

import mysql from "mysql2/promise";
import "dotenv/config";

const pool = mysql.createPool({
  host: process.env.db_host,
  user: process.env.db_user,
  password: process.env.db_password,
  database: process.env.db_name,
});

// Export pool agar bisa dipakai di file api/
export default pool;
