"use client";

// src/app/(auth)/register/page.jsx
// Halaman Register PicFlow (Warm Cream Editorial #FEFAF3):
// - Kanvas bernuansa hangat #FEFAF3 yang nyaman di mata
// - Input rounded-2xl modern (Username, Email, Password + meter kekuatan)
// - Tombol aksi biru PicFlow (#2563EB) & transisi mulus
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { PageTransition, Reveal } from "@/components/ui/Motion";

// Skor kekuatan password sederhana 0-4
function passwordScore(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
}

const STRENGTH = [
  { label: "Terlalu pendek", color: "bg-red-500" },
  { label: "Lemah", color: "bg-red-400" },
  { label: "Cukup", color: "bg-amber-500" },
  { label: "Kuat", color: "bg-blue-600" },
  { label: "Sangat kuat", color: "bg-emerald-600" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);

  const score = useMemo(() => passwordScore(password), [password]);

  // Validasi real-time ringan
  const usernameHint =
    username.length > 0 && username.length < 3 ? "Minimal 3 karakter" : null;
  const emailHint =
    email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Format email tidak valid"
      : null;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ username, email, password });
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
        <div className="mt-7">
          <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
            Create your vault
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Mulai Vault Anda.
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Simpan karya penuh, pelajari EXIF, dan terima ulasan konstruktif
          </p>
        </div>
      </Reveal>

      {/* Form Register */}
      <Reveal delay={0.22} y={15}>
        <motion.form
          key={shakeCount}
          onSubmit={onSubmit}
          animate={error ? { x: [0, -8, 8, -6, 6, -2, 0] } : undefined}
          transition={{ duration: 0.45 }}
          className="mt-6 flex flex-col gap-3.5"
        >
          {/* Input Username */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="reg-username"
                className="text-xs font-medium text-stone-800"
              >
                Username fotografer
              </label>
              {usernameHint && (
                <span className="text-[11px] text-amber-600">{usernameHint}</span>
              )}
            </div>
            <div className="relative flex items-center rounded-2xl border border-[#DCD0BE] bg-[#FEFAF3] px-4 py-3 transition-all duration-200 focus-within:border-blue-600 focus-within:bg-[#FEFAF3] focus-within:ring-4 focus-within:ring-blue-500/15">
              <User size={18} className="mr-3 shrink-0 text-stone-500" />
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="mis. hendra_lens"
                autoComplete="username"
                required
                className="w-full bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Input Email */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="reg-email"
                className="text-xs font-medium text-stone-800"
              >
                Email address
              </label>
              {emailHint && (
                <span className="text-[11px] text-amber-600">{emailHint}</span>
              )}
            </div>
            <div className="relative flex items-center rounded-2xl border border-[#DCD0BE] bg-[#FEFAF3] px-4 py-3 transition-all duration-200 focus-within:border-blue-600 focus-within:bg-[#FEFAF3] focus-within:ring-4 focus-within:ring-blue-500/15">
              <Mail size={18} className="mr-3 shrink-0 text-stone-500" />
              <input
                id="reg-email"
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

          {/* Input Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-password"
              className="text-xs font-medium text-stone-800"
            >
              Password
            </label>
            <div className="relative flex items-center rounded-2xl border border-[#DCD0BE] bg-[#FEFAF3] px-4 py-3 transition-all duration-200 focus-within:border-blue-600 focus-within:bg-[#FEFAF3] focus-within:ring-4 focus-within:ring-blue-500/15">
              <Lock size={18} className="mr-3 shrink-0 text-stone-500" />
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
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

            {/* Indikator Kekuatan Password */}
            {password && (
              <div className="mt-1 rounded-xl border border-[#DCD0BE] bg-[#FEFAF3] p-2.5">
                <div className="flex gap-1.5" aria-hidden="true">
                  {[1, 2, 3, 4].map((step) => (
                    <span
                      key={step}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        step <= score ? STRENGTH[score].color : "bg-stone-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-stone-500" aria-live="polite">
                  Kekuatan: <span className="text-stone-800 font-semibold">{STRENGTH[score].label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Pesan Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-2 text-xs font-medium text-red-600"
              role="alert"
            >
              {error}
            </motion.div>
          )}

          {/* Tombol Submit (Sign up) */}
          <Button
            type="submit"
            variant="accent"
            loading={busy}
            size="lg"
            className="mt-2 w-full rounded-2xl !bg-blue-600 !text-white py-3.5 text-sm font-semibold transition-all hover:!bg-blue-700 active:scale-[0.99]"
            style={{ backgroundColor: "#2563EB", color: "#FFFFFF" }}
          >
            {busy ? "Mendaftarkan Akun..." : "Buat Akun Fotografer"}
            {!busy && <ArrowRight size={15} className="ml-1 text-white" />}
          </Button>
        </motion.form>
      </Reveal>

      {/* Switch ke Login & Footer sRGB */}
      <Reveal delay={0.32} y={10}>
        <div className="mt-7 flex flex-col gap-4 border-t border-[#E8DEC9] pt-5">
          <p className="text-center text-xs text-stone-600">
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
            >
              Masuk ke Sini
            </Link>
          </p>

          {/* Micro calibration footer */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400">
            <span className="flex items-center gap-1" aria-hidden="true">
              <i className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
            </span>
            <span>Standar sRGB &amp; Hak Cipta Fotografer</span>
          </div>
        </div>
      </Reveal>
    </PageTransition>
  );
}
