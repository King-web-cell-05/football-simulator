
import { Suspense } from "react";
import { Loader2, ShieldCheck, Trophy } from "lucide-react";
import VerifyEmailForm from "./verify-email-form";

function VerificationLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080b09] px-4 text-white">
      <div className="w-full max-w-[460px]">
        <div className="rounded-[26px] border border-white/10 bg-[#101512] p-10 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-400 text-black">
            <Trophy className="h-8 w-8" />
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight">
            FootballSim
          </h1>

          <div className="mt-8 flex items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-lime-400" />
          </div>

          <p className="mt-5 text-sm text-slate-400">
            Preparing your email verification...
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/10 pt-6 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            Secure account verification
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerificationLoading />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
