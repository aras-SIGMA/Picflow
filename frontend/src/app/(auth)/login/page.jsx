"use client";

// src/app/(auth)/login/page.jsx
// Halaman Login PicFlow (Warm Cream Editorial #FEFAF3):
// - Kanvas bernuansa hangat #FEFAF3 yang nyaman di mata
// - Input rounded-2xl modern dengan ikon presisi (Mail, Lock)
// - Tombol aksi biru PicFlow (#2563EB) & transisi mulus
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { PageTransition, Reveal } from "@/components/ui/Motion";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login({ email, password });
      router.push("/home");
    } catch (err) {
      setError(err.errors?.join(", ") || err.message);
      setShakeCount((s) => s + 1);
      setBusy(false);
    }
  }

  return (
    <PageTransition>
      {/* Brand Header */}
      <Reveal y={10}>
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Kembali ke beranda PicFlow"
            className="group inline-flex items-center transition-transform duration-200 hover:scale-[1.02]"
          >
            <Logo variant="lockup" size={38} showTagline={true} inverted={false} />
          </Link>
        </div>
      </Reveal>

      {/* Headline & Sub-headline (#FEFAF3 Kanvas) */}
      <Reveal delay={0.12} y={12}>
        <div className="mt-8">
          <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
            Login your account
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Welcome Back!
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Enter your email and password
          </p>
        </div>
      </Reveal>

      {/* Form Login */}
      <Reveal delay={0.22} y={15}>
        <motion.form
          key={shakeCount}
          onSubmit={onSubmit}
          animate={error ? { x: [0, -8, 8, -6, 6, -2, 0] } : undefined}
          transition={{ duration: 0.45 }}
          className="mt-7 flex flex-col gap-4"
        >
          {/* Input Email dengan Ikon Mail */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-email"
              className="text-xs font-medium text-stone-800"
            >
              Email address
            </label>
            <div className="relative flex items-center rounded-2xl border border-[#DCD0BE] bg-[#FEFAF3] px-4 py-3.5 transition-all duration-200 focus-within:border-blue-600 focus-within:bg-[#FEFAF3] focus-within:ring-4 focus-within:ring-blue-500/15">
              <Mail size={18} className="mr-3 shrink-0 text-stone-500" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                required
                className="w-full bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Input Password dengan Ikon Lock */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-password"
              className="text-xs font-medium text-stone-800"
            >
              Password
            </label>
            <div className="relative flex items-center rounded-2xl border border-[#DCD0BE] bg-[#FEFAF3] px-4 py-3.5 transition-all duration-200 focus-within:border-blue-600 focus-within:bg-[#FEFAF3] focus-within:ring-4 focus-within:ring-blue-500/15">
              <Lock size={18} className="mr-3 shrink-0 text-stone-500" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                autoComplete="current-password"
                required
                className="w-full bg-transparent pr-8 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-4 text-stone-400 transition-colors hover:text-stone-700"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Link Forgot Password */}
          <div className="flex items-center justify-start pt-0.5">
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Fitur pemulihan kata sandi akan segera hadir di pembaruan berikutnya.");
              }}
              className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Pesan Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-xs font-medium text-red-600"
              role="alert"
            >
              {error}
            </motion.div>
          )}

          {/* Tombol Submit (Sign in) */}
          <Button
            type="submit"
            variant="accent"
            loading={busy}
            size="lg"
            className="mt-2 w-full rounded-2xl !bg-blue-600 !text-white py-3.5 text-sm font-semibold transition-all hover:!bg-blue-700 active:scale-[0.99]"
            style={{ backgroundColor: "#2563EB", color: "#FFFFFF" }}
          >
            {busy ? "Memverifikasi..." : "Sign in"}
            {!busy && <ArrowRight size={15} className="ml-1 text-white" />}
          </Button>
        </motion.form>
      </Reveal>

      {/* Switch ke Register & Footer sRGB */}
      <Reveal delay={0.32} y={10}>
        <div className="mt-8 flex flex-col gap-4 border-t border-[#E8DEC9] pt-5">
          <p className="text-center text-xs text-stone-600">
            Belum memiliki akun fotografer?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
            >
              Daftar Sekarang
            </Link>
          </p>

          {/* Micro calibration footer */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400">
            <span className="flex items-center gap-1" aria-hidden="true">
              <i className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
            </span>
            <span>Kalibrasi sRGB terverifikasi</span>
          </div>
        </div>
      </Reveal>
    </PageTransition>
  );
}
