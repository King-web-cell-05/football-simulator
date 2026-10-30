
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Goal,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Trophy,
} from "lucide-react";

type LoginResponse = {
  message?: string;
  title?: string;
  requiresEmailVerification?: boolean;
  user?: {
    id: string;
    fullName: string;
    email: string;
    isEmailVerified?: boolean;
  };
};

const inputClass =
  "h-12 w-full rounded-xl border border-white/[0.1] bg-[#080c11] pl-11 text-sm text-white outline-none transition placeholder:text-[#586474] focus:border-[#b7f56a]/60 focus:ring-2 focus:ring-[#b7f56a]/10";

export default function LoginPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setNeedsVerification(false);

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | LoginResponse
        | null;

      if (!response.ok) {
        if (
          response.status === 403 &&
          result?.requiresEmailVerification
        ) {
          setNeedsVerification(true);
          setError(
            result.message ??
              "Please verify your email address before signing in.",
          );
          return;
        }

        if (response.status === 401) {
          setError("Invalid email or password. Please try again.");
          return;
        }

        if (response.status === 429) {
          setError(
            "Too many login attempts. Please wait a moment and try again.",
          );
          return;
        }

        setError(
          result?.message ??
            result?.title ??
            "Unable to sign in. Please try again.",
        );

        return;
      }

      if (!result?.user?.id) {
        setError(
          "The server returned an incomplete login response. Please try again.",
        );
        return;
      }

      // JWT is stored in an HttpOnly cookie by
      // the Next.js API route, not browser storage.
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError(
        "Unable to connect to FootballSim. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070a0e] px-5 py-16 text-white selection:bg-[#b7f56a] selection:text-[#070a0e] sm:px-8">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_10%,rgba(183,245,106,0.09),transparent_40%),radial-gradient(ellipse_at_90%_90%,rgba(65,110,80,0.08),transparent_35%)]" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

      {/* Back link */}
      <Link
        href="/"
        className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 text-xs font-medium text-[#9ba6b5] transition hover:text-white sm:left-8 sm:top-8"
      >
        <ArrowLeft size={15} />
        Back to home
      </Link>

      {/* Main card */}
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b1016]/95 shadow-[0_30px_100px_rgba(0,0,0,0.45)] lg:grid-cols-[0.9fr_1.1fr]">
        {/* Information panel */}
        <motion.aside
          initial={reducedMotion ? false : { opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.07] bg-[#0d1319] p-9 lg:flex xl:p-12"
        >
          <div className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full bg-[#b7f56a]/[0.06] blur-[80px]" />

          <Link href="/" className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#b7f56a]/25 bg-[#b7f56a]/10 text-[#b7f56a]">
              <Goal size={24} />
            </span>

            <span className="text-lg font-bold tracking-tight">
              Football<span className="text-[#b7f56a]">Sim</span>
            </span>
          </Link>

          <div className="relative py-12">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#b7f56a]/15 bg-[#b7f56a]/[0.06] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#b7f56a]">
              <Trophy size={13} />
              Your game starts here
            </div>

            <h1 className="text-4xl font-semibold leading-[1.1] tracking-[-0.06em] xl:text-5xl">
              Every season
              <br />
              has a story.
              <br />
              <span className="text-[#b7f56a]">Write yours.</span>
            </h1>

            <p className="mt-6 max-w-sm text-sm leading-7 text-[#98a4b3]">
              Sign in to manage your competitions, simulate matches, and
              follow your football world.
            </p>

            <div className="mt-9 space-y-4">
              {[
                "Manage your football competitions",
                "Track fixtures and league standings",
                "Keep your season organized",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#b7f56a]/10 text-[#b7f56a]">
                    <ShieldCheck size={12} />
                  </span>

                  <span className="text-xs text-[#c1cad5]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-[10px] text-[#687586]">
            Built for the love of the game.
          </p>
        </motion.aside>

        {/* Login form */}
        <motion.section
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="p-6 sm:p-10 lg:p-12 xl:p-14"
        >
          {/* Mobile brand */}
          <Link
            href="/"
            className="mb-9 inline-flex items-center gap-2 lg:hidden"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b7f56a]/25 bg-[#b7f56a]/10 text-[#b7f56a]">
              <Goal size={20} />
            </span>

            <span className="font-bold">
              Football<span className="text-[#b7f56a]">Sim</span>
            </span>
          </Link>

          <div className="mb-8">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b7f56a]">
              Welcome back
            </p>

            <h2 className="text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
              Sign in to FootballSim
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#909cac]">
              Enter your account details to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold text-[#d4dbe4]"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#738092]"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setNeedsVerification(false);
                  }}
                  required
                  disabled={loading}
                  className={`${inputClass} pr-4`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-[#d4dbe4]"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-[#b7f56a] transition hover:text-[#d2ff9e]"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#738092]"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8490a0] transition hover:bg-white/[0.06] hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Error feedback */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs leading-5 text-red-300"
              >
                <p>{error}</p>

                {needsVerification && (
                  <Link
                    href={`/verify-email?email=${encodeURIComponent(normalizedEmail)}`}
                    className="mt-3 inline-flex items-center gap-2 font-semibold text-[#b7f56a] transition hover:text-[#d2ff9e]"
                  >
                    Verify your email
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#b7f56a] text-sm font-bold text-[#10150a] transition hover:bg-[#c9ff87] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}

              {!loading && (
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-white/[0.08]" />

            <span className="text-[10px] text-[#687586]">
              NEW TO FOOTBALLSIM?
            </span>

            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <Link
            href="/signup"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.02] text-sm font-semibold text-[#d0d7e0] transition hover:border-[#b7f56a]/30 hover:bg-white/[0.04]"
          >
            Create an account
          </Link>

          <p className="mt-8 text-center text-[10px] leading-5 text-[#687586]">
            By continuing, you agree to use FootballSim responsibly.
          </p>
        </motion.section>
      </div>
    </main>
  );
}
