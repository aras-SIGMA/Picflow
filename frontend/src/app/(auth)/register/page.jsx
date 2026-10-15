"use client";

// src/app/(auth)/register/page.jsx
// Halaman Register PicFlow:
// - Style Persona: Clean SaaS Minimalist with Atmospheric Dark sRGB Aurora Backdrop
// - Theme Polarity: Warm Cream Card (#FFFDF6) Floating on Dark Canvas (#070B14)
// - Typography & Tokens: Sesuai .md/DESIGN/design.md
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
  { label: "Too short", color: "bg-[#EF4444]" },
  { label: "Weak", color: "bg-[#F87171]" },
  { label: "Fair", color: "bg-[#F59E0B]" },
  { label: "Strong", color: "bg-[#2563EB]" },
  { label: "Very strong", color: "bg-[#10B981]" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);

  const score = useMemo(() => passwordScore(password), [password]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service to proceed.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await register({ username, email, password });
      router.push("/home");
    } catch (err) {
      setError(err.errors?.join(", ") || err.message || "Failed to create account. Please check your data.");
      setShakeCount((s) => s + 1);
      setBusy(false);
    }
  }

  return (
    <div className="relative w-full">
      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.95,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative w-full"
      >
        {/* Ambient Floating Under-glow Aura (Efek Mengambang Spektrum sRGB pada Kanvas Terang) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-2.5 sm:-inset-4 rounded-[32px] bg-gradient-to-b from-[#3B82F6]/15 via-[#FFFDF6]/60 to-[#10B981]/15 blur-2xl opacity-75 -z-10"
        />

        <div
          className="relative w-full rounded-[20px] bg-[#FFFDF6] p-9 sm:p-10 border border-[#E8DEC9] transition-shadow duration-300"
          style={{
            boxShadow: `
              0 30px 60px -15px rgba(28, 25, 23, 0.12),
              0 14px 28px -12px rgba(37, 99, 235, 0.08),
              0 4px 12px -4px rgba(28, 25, 23, 0.05),
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)
            `,
          }}
        >
        {/* ======================================================================= */}
        {/* 1. HEADER (Heading & Subtitle)                                          */}
        {/* ======================================================================= */}
        <div className="text-center">
          <h1 className="text-[24px] font-bold tracking-[-0.02em] leading-[1.3] text-[#1C1917]">
            Create an Account
          </h1>
          <p className="mt-1.5 text-[14px] font-normal leading-[1.5] text-[#57534E]">
            Join the verified community of visual creators
          </p>
        </div>

        {/* ======================================================================= */}
        {/* 2. FORM & INPUT CONTROLS (20px rhythm)                                  */}
        {/* ======================================================================= */}
        <motion.form
          key={shakeCount}
          onSubmit={onSubmit}
          animate={error ? { x: [0, -8, 8, -6, 6, -2, 0] } : undefined}
          transition={{ duration: 0.4 }}
          className="mt-5 space-y-4"
        >
          {/* Error Notification Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-start gap-2.5 rounded-lg border border-[#EF4444]/25 bg-red-50/90 p-3 text-[13px] text-[#EF4444]"
              role="alert"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span className="leading-tight">{error}</span>
            </motion.div>
          )}

          {/* Input Username */}
          <div>
            <label
              htmlFor="reg-username"
              className="block mb-[6px] text-[12px] font-semibold text-[#1C1917]"
            >
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex_optics"
              autoComplete="username"
              required
              className="h-11 w-full rounded-lg px-[14px] bg-[#F8F3E8] border border-[#DCD0BE] text-[14px] text-[#1C1917] placeholder:text-[#8F887C] transition-all duration-150 focus:bg-[#FFFDF6] focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/15 focus:outline-none"
            />
          </div>

          {/* Input Email */}
          <div>
            <label
              htmlFor="reg-email"
              className="block mb-[6px] text-[12px] font-semibold text-[#1C1917]"
            >
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
              className="h-11 w-full rounded-lg px-[14px] bg-[#F8F3E8] border border-[#DCD0BE] text-[14px] text-[#1C1917] placeholder:text-[#8F887C] transition-all duration-150 focus:bg-[#FFFDF6] focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/15 focus:outline-none"
            />
          </div>

          {/* Input Password */}
          <div>
            <label
              htmlFor="reg-password"
              className="block mb-[6px] text-[12px] font-semibold text-[#1C1917]"
            >
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                required
                className="h-11 w-full rounded-lg pl-[14px] pr-10 bg-[#F8F3E8] border border-[#DCD0BE] text-[14px] text-[#1C1917] placeholder:text-[#8F887C] transition-all duration-150 focus:bg-[#FFFDF6] focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/15 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 text-[#8F887C] transition-colors hover:text-[#1C1917] focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Micro Password Strength Meter */}
            {password && (
              <div className="mt-2 rounded-md bg-[#F5EFE6] p-2 border border-[#E8DEC9]">
                <div className="flex gap-1.5" aria-hidden="true">
                  {[1, 2, 3, 4].map((step) => (
                    <span
                      key={step}
                      className={`h-1 flex-1 rounded-full transition-colors duration-250 ${
                        step <= score ? STRENGTH[score].color : "bg-[#DCD0BE]"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#57534E]">
                  <span>Strength</span>
                  <span className="font-semibold text-[#1C1917]">
                    {STRENGTH[score].label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Selection Control (Terms Checkbox) */}
          <div className="pt-0.5">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#DCD0BE] text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer accent-[#2563EB]"
              />
              <span className="text-[12px] leading-tight text-[#57534E]">
                I agree to the{" "}
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Terms of Service document will open in a separate window.");
                  }}
                  className="font-medium text-[#2563EB] hover:text-[#1D4ED8]"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Privacy Policy document will open in a separate window.");
                  }}
                  className="font-medium text-[#2563EB] hover:text-[#1D4ED8]"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          {/* ===================================================================== */}
          {/* 3. PRIMARY ACTION TRIGGER (Full-width, h-11, rounded-lg)              */}
          {/* ===================================================================== */}
          <button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-lg bg-[#2563EB] text-[#FFFFFF] text-[14px] font-semibold transition-all duration-150 hover:bg-[#1D4ED8] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(37,99,235,0.25)] flex items-center justify-center cursor-pointer"
          >
            {busy ? "Creating Account..." : "Create Account"}
          </button>

          {/* Hairline Divider */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8DEC9]" />
            </div>
            <span className="relative bg-[#FFFDF6] px-3 text-[12px] font-normal text-[#57534E] uppercase tracking-wider">
              or
            </span>
          </div>

          {/* ===================================================================== */}
          {/* 4. SECONDARY ACTION TRIGGER (Ghost/Outline with Google SVG)             */}
          {/* ===================================================================== */}
          <button
            type="button"
            onClick={() => {
              alert("Google Sign-In integration is configured for production credentials.");
            }}
            className="h-11 w-full rounded-lg bg-[#F5EFE6] border border-[#E8DEC9] text-[#1C1917] text-[14px] font-medium transition-colors duration-150 hover:bg-[#EFE7DC] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign up with Google</span>
          </button>
        </motion.form>

          {/* ======================================================================= */}
          {/* 5. FOOTNOTE SWITCH LINK                                                 */}
          {/* ======================================================================= */}
          <div className="mt-6 text-center text-[13px] text-[#57534E]">
            <span>Already have an account? </span>
            <Link
              href="/login"
              className="font-medium text-[#2563EB] transition-colors hover:text-[#1D4ED8]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
