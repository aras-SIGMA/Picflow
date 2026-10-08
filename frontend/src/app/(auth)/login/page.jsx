"use client";

// src/app/(auth)/login/page.jsx
// LOGIN: POST /api/auth/login lalu simpan token & ke /home (logika lama
// TIDAK berubah). Shell split-screen (panel form + panel kolase) sekarang
// dimiliki (auth)/layout.jsx — halaman ini hanya isi panel form kiri
// (maks 420px): logo, judul, sub-teks, form, submit, link register.
// Error autentikasi tampil inline dengan shake halus.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { PageTransition, Reveal, WordReveal } from "@/components/ui/Motion";

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
      setShakeCount((s) => s + 1); // retrigger shake
      setBusy(false);
    }
  }

  return (
    <PageTransition>
      {/* Logo kecil di atas */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-base font-bold tracking-tight text-ink"
      >
        PicFlow
      </Link>

      <WordReveal
        as="h1"
        text="Shoot. Store. Repeat."
        accentWord="Store"
        className="display-1-compact mt-6"
      />
      <Reveal delay={0.3}>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Masuk untuk melanjutkan mengelola vault fotografimu.
        </p>
      </Reveal>

      <Reveal delay={0.4}>
        <motion.form
          key={shakeCount}
          onSubmit={onSubmit}
          animate={error ? { x: [0, -8, 8, -6, 6, -2, 0] } : undefined}
          transition={{ duration: 0.45 }}
          className="mt-8 flex flex-col gap-4"
        >
          <Field label="Email" error={null}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </Field>

          <div className="relative">
            <Field label="Password" error={null}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="pr-12"
              />
            </Field>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute right-3.5 top-[26px] -translate-y-1/2 text-faint transition-colors hover:text-ink"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-danger"
              role="alert"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" loading={busy} size="lg" className="mt-1 w-full">
            {busy ? "Masuk..." : "Masuk"}
          </Button>
        </motion.form>
      </Reveal>

      <Reveal delay={0.5}>
        <p className="mt-6 text-sm text-muted">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-medium text-accent transition-opacity hover:opacity-80"
          >
            Register
          </Link>
        </p>
      </Reveal>
    </PageTransition>
  );
}
