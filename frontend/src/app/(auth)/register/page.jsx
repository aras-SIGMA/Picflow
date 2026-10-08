"use client";

// src/app/(auth)/register/page.jsx
// REGISTER: POST /api/auth/register lalu simpan token & ke /home (logika
// lama TIDAK berubah). Shell split-screen dimiliki (auth)/layout.jsx —
// halaman ini hanya isi panel form kiri: logo, judul, sub-teks, form
// (username/email/password + indikator kekuatan), submit, link login.
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { PageTransition, Reveal, WordReveal } from "@/components/ui/Motion";

// Skor kekuatan password sederhana 0-4 (panjang + variasi karakter).
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
  { label: "Terlalu pendek", color: "bg-[var(--danger)]" },
  { label: "Lemah", color: "bg-[var(--danger)]" },
  { label: "Cukup", color: "bg-[var(--accent-2)]" },
  { label: "Kuat", color: "bg-[var(--success)]" },
  { label: "Sangat kuat", color: "bg-[var(--success)]" },
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

  // Validasi real-time ringan (UI saja — validasi tetap dari backend).
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
      {/* Logo kecil di atas */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-base font-bold tracking-tight text-ink"
      >
        PicFlow
      </Link>

      <WordReveal
        as="h1"
        text="Start your vault."
        accentWord="vault"
        className="display-1-compact mt-6"
      />
      <Reveal delay={0.3}>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Buat akun dan mulai simpan karya terbaikmu malam ini juga.
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
          <Field label="Username" error={usernameHint}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </Field>

          <Field label="Email" error={emailHint}>
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
                autoComplete="new-password"
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

          {/* Indikator kekuatan password */}
          {password && (
            <div>
              <div className="flex gap-1.5" aria-hidden="true">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      step <= score ? STRENGTH[score].color : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-faint" aria-live="polite">
                Kekuatan password: {STRENGTH[score].label}
              </p>
            </div>
          )}

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
            {busy ? "Mendaftar..." : "Buat akun"}
          </Button>
        </motion.form>
      </Reveal>

      <Reveal delay={0.5}>
        <p className="mt-6 text-sm text-muted">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-accent transition-opacity hover:opacity-80"
          >
            Login
          </Link>
        </p>
      </Reveal>
    </PageTransition>
  );
}
