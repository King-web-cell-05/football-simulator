
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Loader2,
  LockKeyhole,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  Trophy,
} from "lucide-react";

const CODE_LENGTH = 6;
const COOLDOWN_SECONDS = 60;

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email")?.trim() ?? "";

  const [digits, setDigits] = useState<string[]>(
    Array(CODE_LENGTH).fill("")
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!cooldownUntil) return;

    const update = () => {
      setSecondsLeft(
        Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      );
    };

    update();
    const interval = window.setInterval(update, 1000);

    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  const code = digits.join("");
  const isComplete = /^\d{6}$/.test(code);

  function updateDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "");

    if (!clean) {
      setDigits((current) => {
        const next = [...current];
        next[index] = "";
        return next;
      });
      return;
    }

    const nextDigits = [...digits];

    for (
      let offset = 0;
      offset < clean.length && index + offset < CODE_LENGTH;
      offset++
    ) {
      nextDigits[index + offset] = clean[offset];
    }

    setDigits(nextDigits);
    setError("");

    const nextIndex = Math.min(
      index + clean.length,
      CODE_LENGTH - 1
    );

    inputRefs.current[nextIndex]?.focus();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    index: number
  ) {
    if (event.key === "Backspace") {
      event.preventDefault();

      const next = [...digits];

      if (next[index]) {
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < CODE_LENGTH - 1
    ) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);

    if (!pasted) return;

    const next = Array(CODE_LENGTH).fill("");

    pasted.split("").forEach((digit, index) => {
      next[index] = digit;
    });

    setDigits(next);
    setError("");

    inputRefs.current[
      Math.min(pasted.length, CODE_LENGTH - 1)
    ]?.focus();
  }

  async function handleVerify() {
    if (!isComplete || loading || !email) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ?? "Verification failed. Please try again."
        );
      }

      if (data?.isEmailVerified !== true) {
        throw new Error(
          "The server did not confirm email verification."
        );
      }

      setVerified(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email || resending || secondsLeft > 0) return;

    setResending(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        "/api/auth/resend-verification-code",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ?? "Unable to request a new code."
        );
      }

      setNotice(
        data?.message ??
          "If eligible, a new code will be sent to your email."
      );

      setCooldownUntil(Date.now() + COOLDOWN_SECONDS * 1000);
      setSecondsLeft(COOLDOWN_SECONDS);
      setDigits(Array(CODE_LENGTH).fill(""));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to resend verification code."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080b09] px-4 py-12 text-white">
      <div className="w-full max-w-[460px]">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-white"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-black">
            <Trophy className="h-5 w-5" />
          </span>
          FootballSim
        </Link>

        <div className="rounded-[26px] border border-white/10 bg-[#101512] p-6 shadow-2xl sm:p-9">
          {verified ? (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-lime-400/10">
                <CheckCircle2 className="h-10 w-10 text-lime-400" />
              </div>

              <h1 className="mt-7 text-3xl font-bold tracking-tight">
                Email verified
              </h1>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                Your email has been verified successfully.
                You can now sign in to FootballSim.
              </p>

              <button
                onClick={() => router.push("/login")}
                className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-400 font-semibold text-black hover:bg-lime-300"
              >
                Continue to login
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-lime-400/20 bg-lime-400/10">
                <MailCheck className="h-7 w-7 text-lime-400" />
              </div>

              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-lime-400">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                Account security
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                Verify your email
              </h1>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                Enter the 6-digit verification code sent to
              </p>

              <p className="mt-1 break-all text-sm font-semibold text-white">
                {email || "your email address"}
              </p>

              {!email ? (
                <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
                  Your email address is missing. Return to signup
                  and complete registration.
                </div>
              ) : (
                <>
                  <div className="mt-8">
                    <label className="mb-3 block text-xs font-semibold text-slate-300">
                      Verification code
                    </label>

                    <div
                      className="grid grid-cols-6 gap-2 sm:gap-3"
                      role="group"
                      aria-label="Six-digit verification code"
                    >
                      {digits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(element) => {
                            inputRefs.current[index] = element;
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete={
                            index === 0 ? "one-time-code" : "off"
                          }
                          maxLength={6}
                          value={digit}
                          onChange={(event) =>
                            updateDigit(index, event.target.value)
                          }
                          onKeyDown={(event) =>
                            handleKeyDown(event, index)
                          }
                          onPaste={handlePaste}
                          disabled={loading}
                          aria-label={`Code digit ${index + 1}`}
                          className="h-14 min-w-0 rounded-xl border border-white/10 bg-[#090d0a] text-center text-xl font-bold text-white outline-none transition focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/10 disabled:opacity-50"
                        />
                      ))}
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      Codes expire 10 minutes after issuance.
                    </p>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="mt-6 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-xs leading-5 text-red-300"
                    >
                      <CircleAlert className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  {notice && (
                    <div
                      role="status"
                      className="mt-6 flex items-start gap-2 rounded-xl border border-lime-400/20 bg-lime-400/10 p-4 text-xs leading-5 text-lime-200"
                    >
                      <Check className="h-4 w-4 shrink-0" />
                      {notice}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={!isComplete || loading}
                    className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-400 text-sm font-semibold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify email
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="mt-6 text-center">
                    <p className="text-xs text-slate-400">
                      Didn&apos;t receive the code?
                    </p>

                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending || secondsLeft > 0}
                      className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-lime-400 hover:text-lime-300 disabled:cursor-not-allowed disabled:text-slate-500"
                    >
                      {resending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}

                      {secondsLeft > 0
                        ? `Try again in ${secondsLeft}s`
                        : "Resend verification code"}
                    </button>
                  </div>
                </>
              )}

              <div className="mt-8 border-t border-white/10 pt-6">
                <Link
                  href={email ? "/login" : "/signup"}
                  className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400 transition hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {email ? "Back to login" : "Back to signup"}
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4" />
          Secure email verification powered by FootballSim
        </p>
      </div>
    </main>
  );
}
