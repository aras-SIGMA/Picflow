/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Izinkan next/image load gambar dari Express (folder /uploads) */
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
    ],
    // Backend Express berjalan di localhost:8000 (IP loopback), jadi next/image
    // harus diizinkan mengambil gambar dari IP privat. Tanpa ini, Next.js 16
    // memblokirnya sebagai proteksi SSRF.
    dangerouslyAllowLocalIP: true,
  },
  reactCompiler: true,
};

export default nextConfig;
