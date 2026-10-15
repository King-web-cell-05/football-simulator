"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Goal,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";

export default function SignupPage() {
  const reducedMotion = useReducedMotion();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please confirm that you agree to the terms.");
      return;
    }

    setLoading(true);

    // Demo only: replace this with your real registration API.
    window.setTimeout(() => {
      setLoading(false);
      setError(
        "Account registration is not connected yet. Connect your backend to create an account.",
      );
    }, 700);
  }

  return (
    <main
      data-page="signup"
      className="fixed inset-0 isolate flex h-dvh w-full items-center justify-center overflow-hidden bg-[#070a0e] p-2 text-white selection:bg-[#b7f56a] selection:text-[#070a0e] sm:p-4 lg:p-5"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_10%,rgba(183,245,106,0.08),transparent_40%),radial-gradient(ellipse_at_10%_90%,rgba(65,110,80,0.08),transparent_35%)]" />

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

      {/* Back link */}
      <Link
        href="/"
        className="absolute left-4 top-3 z-30 inline-flex items-center gap-2 text-xs font-medium text-[#9ba6b5] transition hover:text-white sm:left-6 sm:top-5 lg:left-8"
      >
        <ArrowLeft size={15} />
        Back to home
      </Link>

      {/* Main card */}
      <div className="grid h-full max-h-[820px] w-full max-w-6xl grid-cols-1 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b1016]/95 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:rounded-3xl lg:grid-cols-[0.85fr_1.15fr]">
        {/* Desktop information panel */}
        <motion.aside
          initial={reducedMotion ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative hidden min-h-0 flex-col justify-between overflow-hidden border-r border-white/[0.07] bg-[#0d1319] p-8 lg:flex xl:p-10"
        >
          <div className="pointer-events-none absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-[#b7f56a]/[0.06] blur-[80px]" />

          <Link href="/" className="relative flex shrink-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#b7f56a]/25 bg-[#b7f56a]/10 text-[#b7f56a]">
              <Goal size={23} />
            </span>

            <span className="text-lg font-bold tracking-tight">
              Football<span className="text-[#b7f56a]">Sim</span>
            </span>
          </Link>

          <div className="relative py-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#b7f56a]/15 bg-[#b7f56a]/[0.06] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b7f56a]">
              <Trophy size={13} />
              Start your next season
            </div>

            <h1 className="text-4xl font-semibold leading-[1.1] tracking-[-0.06em] xl:text-5xl">
              Your teams.
              <br />
              Your tactics.
              <br />
              <span className="text-[#b7f56a]">Your story.</span>
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-[#98a4b3]">
              Create your account and bring your football competitions to life
              with fixtures, match simulation, and league standings.
            </p>

            <div className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b7f56a]/10 text-[#b7f56a]">
                  <ShieldCheck size={20} />
                </span>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Built around your game
                  </p>
                  <p className="mt-1 text-xs text-[#8e9aaa]">
                    Your football workspace starts here.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  "Organize competitions",
                  "Simulate your matches",
                  "Follow your standings",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#b7f56a]" />
                    <span className="text-xs text-[#aeb8c7]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="relative shrink-0 text-[10px] text-[#687586]">
            Built for the love of the game.
          </p>
        </motion.aside>

        {/* Signup form */}
        <motion.section
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex min-h-0 flex-col justify-center overflow-hidden p-5 sm:p-8 lg:p-8 xl:p-10"
        >
          {/* Mobile brand */}
          <Link
            href="/"
            className="mb-4 flex shrink-0 items-center gap-2 lg:hidden"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b7f56a]/25 bg-[#b7f56a]/10 text-[#b7f56a]">
              <Goal size={20} />
            </span>

            <span className="text-base font-bold">
              Football<span className="text-[#b7f56a]">Sim</span>
            </span>
          </Link>

          <div className="mb-5 shrink-0">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b7f56a]">
              Create your account
            </p>

            <h2 className="text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
              Join FootballSim
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#909cac]">
              Set up your account and start building your football universe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Full name */}
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-xs font-semibold text-[#d4dbe4]"
              >
                Full name
              </label>

              <div className="relative">
                <UserRound
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#738092]"
                />

                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  minLength={2}
                  className="h-11 w-full rounded-xl border border-white/[0.1] bg-[#080c11] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-[#586474] focus:border-[#b7f56a]/60 focus:ring-2 focus:ring-[#b7f56a]/10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold text-[#d4dbe4]"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#738092]"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-white/[0.1] bg-[#080c11] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-[#586474] focus:border-[#b7f56a]/60 focus:ring-2 focus:ring-[#b7f56a]/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold text-[#d4dbe4]"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#738092]"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  className="h-11 w-full rounded-xl border border-white/[0.1] bg-[#080c11] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-[#586474] focus:border-[#b7f56a]/60 focus:ring-2 focus:ring-[#b7f56a]/10"
                />

                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8490a0] transition hover:bg-white/[0.06] hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-xs font-semibold text-[#d4dbe4]"
              >
                Confirm password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#738092]"
                />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-white/[0.1] bg-[#080c11] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-[#586474] focus:border-[#b7f56a]/60 focus:ring-2 focus:ring-[#b7f56a]/10 mb-3"
                />

                <button
                  type="button"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8490a0] transition hover:bg-white/[0.06] hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="flex cursor-pointer items-start gap-3 pt-1">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#b7f56a]"
              />

              <span className="text-xs leading-5 text-[#9ba6b5]">
                I agree to the FootballSim terms and understand the
                platform&apos;s privacy practices.
              </span>
            </label>

            {/* Validation feedback */}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs leading-5 text-red-300"
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#b7f56a] text-sm font-bold text-[#10150a] transition hover:bg-[#c9ff87] disabled:cursor-not-allowed disabled:opacity-60 mb-3"
            >
              {loading ? "Creating account..." : "Create account"}

              {!loading && (
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </form>

          <div className="my-4 flex shrink-0 items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.08]" />

            <span className="whitespace-nowrap text-[10px] text-[#687586]">
              ALREADY HAVE AN ACCOUNT?
            </span>

            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <Link
            href="/login"
            className="flex h-11 w-full shrink-0 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.02] text-sm font-semibold text-[#d0d7e0] transition hover:border-[#b7f56a]/30 hover:bg-white/[0.04]"
          >
            Sign in instead
          </Link>

          <p className="mt-3 shrink-0 text-center text-[10px] leading-5 text-[#687586]">
            Built for the love of the game.
          </p>
        </motion.section>
      </div>
    </main>
  );
}
