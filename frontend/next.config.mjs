/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Izinkan next/image load gambar dari Express (folder /uploads) dan Cloudinary */
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 400],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
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
