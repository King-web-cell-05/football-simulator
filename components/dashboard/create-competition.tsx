
"use client";

import { useId, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Flag,
  Info,
  Loader2,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  WandSparkles,
} from "lucide-react";

type Competition = {
  id: string;
  name: string;
  season?: string | null;
  createdDate: string;
};

type CreateCompetitionProps = {
  onCreated?: (competition: Competition) => void;
  onCancel?: () => void;
};

const MAX_NAME_LENGTH = 150;

const suggestedNames = [
  "Champions League 2026/27",
  "Elite Football Championship",
  "FootballSim Premier Cup",
];

const tournamentStages = [
  {
    number: "01",
    title: "Create competition",
    description: "Set up your tournament",
    icon: Trophy,
  },
  {
    number: "02",
    title: "Add participating clubs",
    description: "Build your competition lineup",
    icon: Users,
  },
  {
    number: "03",
    title: "Generate fixtures",
    description: "Prepare the league phase",
    icon: CalendarDays,
  },
  {
    number: "04",
    title: "Simulate the tournament",
    description: "Play through to the final",
    icon: Flag,
  },
];

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Just created";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CreateCompetition({
  onCreated,
  onCancel,
}: CreateCompetitionProps) {
  const nameId = useId();
  const errorId = useId();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Competition | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const trimmedName = name.trim();
  const validName =
    trimmedName.length > 0 &&
    trimmedName.length <= MAX_NAME_LENGTH;

  const previewName = trimmedName || "Your competition name";

  const remainingCharacters = MAX_NAME_LENGTH - name.length;

  const handleNameChange = (value: string) => {
    setName(value);
    if (error) setError("");
  };

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading || !validName) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : `Unable to create competition (${response.status}).`
        );
      }

      if (
        !data ||
        typeof data.id !== "string" ||
        !data.id.trim()
      ) {
        throw new Error(
          "The server did not return a valid competition ID."
        );
      }

      const competition: Competition = {
        id: data.id,
        name:
          typeof data.name === "string"
            ? data.name
            : trimmedName,
        season: data.season ?? null,
        createdDate:
          typeof data.createdDate === "string"
            ? data.createdDate
            : new Date().toISOString(),
      };

      setCreated(competition);
      setName("");

      // The parent dashboard may navigate immediately.
      onCreated?.(competition);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <div className="relative mx-auto flex min-h-[75vh] w-full max-w-3xl items-center justify-center overflow-hidden px-4 py-12 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-lime-400/[0.06] blur-[100px]"
        />

        <div className="relative w-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0f1310] px-6 py-12 text-center shadow-[0_30px_100px_rgba(0,0,0,0.25)] sm:px-12 sm:py-16">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[28px] border border-lime-400/20 bg-lime-400/[0.08] shadow-[0_0_60px_rgba(163,230,53,0.08)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-lime-400 text-[#0b1107]">
              <Check className="h-9 w-9 stroke-[2.5]" />
            </div>
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime-400/15 bg-lime-400/[0.07] px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-lime-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            COMPETITION CREATED
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.045em] text-white sm:text-4xl">
            You&apos;re all set.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#98a49b]">
            Your new competition has been created successfully.
            It&apos;s time to bring in the clubs and get the
            tournament underway.
          </p>

          <div className="mx-auto mt-9 max-w-md rounded-2xl border border-white/[0.08] bg-[#151b16] p-5 text-left">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-lime-400/15 bg-lime-400/[0.08]">
                <Trophy className="h-6 w-6 text-lime-400" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#778579]">
                  Your new competition
                </p>

                <h2 className="mt-1 break-words text-base font-semibold text-white">
                  {created.name}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#92a095]">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(created.createdDate)}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Private
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="group mx-auto mt-8 inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-[#b9f56b] px-7 text-sm font-semibold text-[#10160c] transition-all duration-200 hover:bg-[#cbff88] hover:shadow-[0_8px_30px_rgba(185,245,107,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1310]"
          >
            Go to competitions
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full w-full overflow-hidden bg-[#080b09] text-white">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-140px] top-[-180px] h-[450px] w-[450px] rounded-full bg-lime-400/[0.035] blur-[110px]"
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-5 pb-14 pt-7 sm:px-8 lg:px-10 lg:pt-10 xl:px-12">
        {/* Breadcrumbs */}
        <div className="mb-9 flex flex-wrap items-center gap-2 text-xs text-[#78877d]">
          <button
            type="button"
            onClick={onCancel}
            className="transition-colors hover:text-white"
          >
            Workspace
          </button>

          <ChevronRight className="h-3.5 w-3.5 text-[#48564b]" />

          <button
            type="button"
            onClick={onCancel}
            className="transition-colors hover:text-white"
          >
            Competitions
          </button>

          <ChevronRight className="h-3.5 w-3.5 text-[#48564b]" />

          <span className="font-medium text-[#dce7dc]">
            Create competition
          </span>
        </div>

        {/* Page heading */}
        <div className="mb-9 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-lime-400/15 bg-lime-400/[0.055] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b9f56b]">
              <Sparkles className="h-3.5 w-3.5" />
              Tournament setup
            </div>

            <h1 className="text-[30px] font-bold leading-tight tracking-[-0.05em] text-[#f5f8f5] sm:text-[38px]">
              Create a competition
            </h1>

            <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#8c9b90] sm:text-sm">
              Every great tournament starts somewhere.
              Give yours a name and build your way to the final.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 text-xs font-medium text-[#b7c3b9] transition-all hover:border-white/20 hover:bg-white/[0.055] hover:text-white disabled:opacity-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to competitions
          </button>
        </div>

        {/* Main workspace */}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
          {/* LEFT: FORM */}
          <div className="min-w-0">
            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-[22px] border border-white/[0.085] bg-[#101512] shadow-[0_18px_60px_rgba(0,0,0,0.13)]"
            >
              {/* Form header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-6 py-6 sm:px-8">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border border-lime-400/15 bg-lime-400/[0.075]">
                    <Trophy className="h-5 w-5 text-[#b9f56b]" />
                  </div>

                  <div>
                    <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-[#f3f7f3]">
                      Competition details
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-[#849287]">
                      The essentials to get your tournament started.
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1.5 text-[10px] font-semibold text-[#a4b1a6]">
                  STEP 01 / 01
                </span>
              </div>

              <div className="space-y-8 px-6 py-8 sm:px-8">
                {/* Name */}
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label
                      htmlFor={nameId}
                      className="text-[13px] font-semibold text-[#e5eee6]"
                    >
                      Competition name{" "}
                      <span className="text-[#b9f56b]">*</span>
                    </label>

                    <span className="text-[11px] tabular-nums text-[#77867a]">
                      {name.length}/{MAX_NAME_LENGTH}
                    </span>
                  </div>

                  <div className="relative">
                    <Trophy className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#67786a]" />

                    <input
                      id={nameId}
                      type="text"
                      value={name}
                      onChange={(event) =>
                        handleNameChange(event.target.value)
                      }
                      maxLength={MAX_NAME_LENGTH}
                      minLength={1}
                      placeholder="e.g. Champions League 2026/27"
                      autoComplete="off"
                      autoFocus
                      required
                      disabled={loading}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? errorId : undefined}
                      className="h-[54px] w-full rounded-[13px] border border-white/[0.1] bg-[#090d0a] pl-11 pr-4 text-[13px] font-medium text-white outline-none transition-all duration-200 placeholder:font-normal placeholder:text-[#657268] hover:border-white/[0.18] focus:border-[#a9e965]/60 focus:ring-[3px] focus:ring-lime-400/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[11px] text-[#819084]">
                      <Info className="h-3.5 w-3.5" />
                      Give your tournament a recognizable name.
                    </p>

                    {remainingCharacters <= 20 && (
                      <span className="text-[11px] text-amber-300">
                        {remainingCharacters} characters remaining
                      </span>
                    )}
                  </div>

                  {/* Suggestions */}
                  {showSuggestions && !name && (
                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="flex items-center gap-2 text-[11px] font-medium text-[#9cab9f]">
                          <WandSparkles className="h-3.5 w-3.5 text-[#b9f56b]" />
                          Need inspiration?
                        </p>

                        <button
                          type="button"
                          onClick={() => setShowSuggestions(false)}
                          className="text-[11px] text-[#6e7d71] transition-colors hover:text-white"
                        >
                          Hide
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {suggestedNames.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              handleNameChange(suggestion)
                            }
                            className="group inline-flex items-center gap-2 rounded-lg border border-white/[0.075] bg-white/[0.025] px-3 py-2 text-[11px] text-[#aab9ad] transition-all hover:border-lime-400/25 hover:bg-lime-400/[0.055] hover:text-[#d9f6bb] disabled:opacity-50"
                          >
                            <Plus className="h-3 w-3 text-[#738575] transition-colors group-hover:text-lime-400" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <div className="h-px bg-white/[0.07]" />

                {/* Tournament format */}
                <section>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[13px] font-semibold text-[#e6eee7]">
                        Tournament format
                      </h3>

                      <p className="mt-1.5 text-xs text-[#819084]">
                        The structure your competition will follow.
                      </p>
                    </div>

                    <span className="shrink-0 rounded-md border border-lime-400/15 bg-lime-400/[0.065] px-2.5 py-1 text-[10px] font-medium text-[#b9f56b]">
                      Default
                    </span>
                  </div>

                  <div className="relative overflow-hidden rounded-[15px] border border-lime-400/20 bg-[#141c15] p-5">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-lime-400/[0.045] blur-[40px]"
                    />

                    <div className="relative flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-lime-400/15 bg-lime-400/[0.08]">
                        <Trophy className="h-6 w-6 text-[#b9f56b]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-[13px] font-semibold text-white">
                            Champions League format
                          </h4>

                          <CheckCircle2 className="h-4 w-4 text-[#b9f56b]" />
                        </div>

                        <p className="mt-1.5 text-xs leading-6 text-[#91a095]">
                          A league phase followed by knockout
                          rounds, leading to a championship final.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-md border border-white/[0.07] bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-[#bac7bc]">
                            League phase
                          </span>

                          <span className="rounded-md border border-white/[0.07] bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-[#bac7bc]">
                            Knockout rounds
                          </span>

                          <span className="rounded-md border border-white/[0.07] bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-[#bac7bc]">
                            Grand final
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-[#718075]">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    This is the current tournament format.
                    Additional formats can be introduced later.
                  </p>
                </section>

                <div className="h-px bg-white/[0.07]" />

                {/* Privacy */}
                <section>
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035]">
                      <LockKeyhole className="h-[18px] w-[18px] text-[#b2c3b5]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[13px] font-semibold text-[#e6eee7]">
                          Private workspace
                        </h3>

                        <span className="rounded-md border border-lime-400/15 bg-lime-400/[0.06] px-2 py-0.5 text-[10px] font-medium text-[#b9f56b]">
                          Enabled
                        </span>
                      </div>

                      <p className="mt-1.5 max-w-md text-xs leading-6 text-[#829185]">
                        Your competition is associated with your
                        account. Only you can manage its teams,
                        fixtures, and results through your workspace.
                      </p>
                    </div>

                    <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#b9f56b]" />
                  </div>
                </section>

                {/* Error */}
                {error && (
                  <div
                    id={errorId}
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3.5"
                  >
                    <CircleAlert className="mt-0.5 h-[17px] w-[17px] shrink-0 text-red-400" />

                    <div>
                      <p className="text-xs font-semibold text-red-300">
                        Couldn&apos;t create competition
                      </p>

                      <p className="mt-1 text-xs leading-5 text-red-300/80">
                        {error}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Form footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] bg-[#0d120e] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.09] px-5 text-xs font-medium text-[#a8b7aa] transition-all hover:border-white/20 hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!validName || loading}
                  className="group inline-flex h-11 items-center justify-center gap-2.5 rounded-xl bg-[#b9f56b] px-6 text-xs font-bold text-[#10170c] shadow-[0_6px_20px_rgba(185,245,107,0.08)] transition-all duration-200 hover:bg-[#cbff88] hover:shadow-[0_8px_28px_rgba(185,245,107,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d120e] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating competition...
                    </>
                  ) : (
                    <>
                      Create competition
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[#647267]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#809b78]" />
              Your competition is securely linked to your account.
            </div>
          </div>

          {/* RIGHT: PREVIEW & NEXT STEPS */}
          <aside className="space-y-5">
            {/* Live preview */}
            <div className="overflow-hidden rounded-[22px] border border-white/[0.085] bg-[#101512]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#b9f56b]" />

                  <h3 className="text-xs font-semibold text-[#e4eee5]">
                    Competition preview
                  </h3>
                </div>

                <span className="rounded-md bg-white/[0.045] px-2 py-1 text-[10px] font-medium text-[#91a092]">
                  Live
                </span>
              </div>

              <div className="p-5">
                <div className="relative overflow-hidden rounded-[17px] border border-lime-400/10 bg-[linear-gradient(145deg,#1a281b_0%,#111a13_55%,#0d140f_100%)] px-5 pb-5 pt-7">
                  {/* Decorative pitch markings */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.045]"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(185,245,107,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(185,245,107,0.4) 1px,transparent 1px)",
                      backgroundSize: "30px 30px",
                    }}
                  />

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full border border-lime-300/10"
                  />

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-4 -top-6 h-28 w-28 rounded-full border border-lime-300/10"
                  />

                  <div className="relative">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-lime-400/20 bg-lime-400/10">
                        <Trophy className="h-5 w-5 text-[#b9f56b]" />
                      </div>

                      <span className="rounded-full border border-lime-400/15 bg-lime-400/[0.07] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#b9f56b]">
                        Draft
                      </span>
                    </div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8aa18c]">
                      FootballSim competition
                    </p>

                    <h4
                      className={`mt-2 min-h-[58px] break-words text-xl font-bold leading-snug tracking-[-0.035em] ${
                        trimmedName
                          ? "text-white"
                          : "text-[#738575]"
                      }`}
                    >
                      {previewName}
                    </h4>

                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-[#a3b7a4]">
                        <LockKeyhole className="h-3 w-3" />
                        Private
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-[10px] text-[#a3b7a4]">
                        <Clock3 className="h-3 w-3" />
                        Not started
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#778a7a]" />

                  <p className="text-[11px] leading-5 text-[#829084]">
                    A preview of how your competition will appear
                    in your workspace.
                  </p>
                </div>
              </div>
            </div>

            {/* Roadmap */}
            <div className="overflow-hidden rounded-[22px] border border-white/[0.085] bg-[#101512]">
              <div className="border-b border-white/[0.07] px-5 py-5">
                <h3 className="text-[13px] font-semibold text-[#e5eee6]">
                  Your tournament journey
                </h3>

                <p className="mt-1.5 text-[11px] leading-5 text-[#829084]">
                  Here&apos;s what comes after creating your competition.
                </p>
              </div>

              <div className="px-5 py-5">
                {tournamentStages.map((stage, index) => {
                  const Icon = stage.icon;
                  const isFirst = index === 0;
                  const isLast =
                    index === tournamentStages.length - 1;

                  return (
                    <div
                      key={stage.number}
                      className="relative flex gap-3.5"
                    >
                      {!isLast && (
                        <div
                          aria-hidden="true"
                          className="absolute left-[17px] top-9 h-[calc(100%-30px)] w-px bg-white/[0.08]"
                        />
                      )}

                      <div
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border ${
                          isFirst
                            ? "border-lime-400/25 bg-lime-400/[0.1] text-[#b9f56b]"
                            : "border-white/[0.075] bg-white/[0.035] text-[#7b8a7e]"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div
                        className={`min-w-0 flex-1 ${
                          !isLast ? "pb-7" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-xs font-semibold ${
                              isFirst
                                ? "text-[#eaf5e7]"
                                : "text-[#aab8ac]"
                            }`}
                          >
                            {stage.title}
                          </p>

                          {isFirst && (
                            <span className="rounded-md bg-lime-400/[0.08] px-2 py-0.5 text-[9px] font-semibold text-[#b9f56b]">
                              Current
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-[11px] leading-5 text-[#77877b]">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Help card */}
            <div className="rounded-[18px] border border-lime-400/[0.1] bg-lime-400/[0.035] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-400/[0.08]">
                  <Sparkles className="h-4 w-4 text-[#b9f56b]" />
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-[#e1eddf]">
                    Start simple, build bigger.
                  </h4>

                  <p className="mt-1.5 text-[11px] leading-6 text-[#8c9e8e]">
                    You only need a name to get started.
                    You&apos;ll configure the teams and fixtures
                    inside your competition workspace.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.06] pt-5 text-[11px] text-[#627265] sm:flex-row sm:items-center sm:justify-between">
          <span>FootballSim · Competition management</span>

          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Built for secure tournament management
          </span>
        </div>
      </div>
    </div>
  );
}
