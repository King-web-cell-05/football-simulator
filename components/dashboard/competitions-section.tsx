
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Plus,
  Search,
  Trophy,
  RefreshCw,
  AlertCircle,
  Goal,
} from "lucide-react";

type Competition = {
  id: string;
  name: string;
  season: string;
  createdDate: string;
};

type Props = {
  onCreate: () => void;
  onOpen: (competitionId: string) => void;
};

const card =
  "rounded-2xl border border-white/[0.08] bg-[#101319]";

function CompetitionSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading competitions"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className={`${card} animate-pulse p-6`}
        >
          <div className="mb-7 flex justify-between">
            <div className="h-12 w-12 rounded-xl bg-white/[0.07]" />
            <div className="h-5 w-16 rounded-full bg-white/[0.05]" />
          </div>

          <div className="h-5 w-3/4 rounded bg-white/[0.08]" />
          <div className="mt-3 h-3 w-1/3 rounded bg-white/[0.05]" />

          <div className="mt-8 border-t border-white/[0.07] pt-5">
            <div className="h-4 w-1/2 rounded bg-white/[0.06]" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading competitions...</span>
    </div>
  );
}

export default function CompetitionsSection({
  onCreate,
  onOpen,
}: Props) {
  const reducedMotion = useReducedMotion();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadCompetitions = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/competitions", {
          credentials: "same-origin",
          cache: "no-store",
          signal,
        });

        if (response.status === 401) {
          throw new Error("Session expired. Please sign in again.");
        }

        if (!response.ok) {
          throw new Error("Unable to load competitions.");
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Unexpected competition response.");
        }

        if (signal?.aborted) return;

        setCompetitions(data as Competition[]);
      } catch (err) {
        if (signal?.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadCompetitions(controller.signal);

    return () => controller.abort();
  }, [loadCompetitions]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return competitions.filter((competition) =>
      `${competition.name} ${competition.season}`
        .toLowerCase()
        .includes(query)
    );
  }, [competitions, search]);

  function formatCreatedDate(value: string) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Date unavailable"
      : new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(date);
  }

  return (
    <section className="space-y-7">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b7f56a]">
            <Goal size={15} />
            FootballSim Tournament Hub
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            All <span className="text-[#b7f56a]">Competitions</span>
          </h1>

          <p className="mt-3 text-sm text-[#8b98aa]">
            Explore and manage tournaments from your football workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#b7f56a] px-5 text-xs font-bold text-[#080a0d] transition hover:bg-[#caff91]"
        >
          <Plus size={17} />
          Create Competition
        </button>
      </div>

      {/* Tournament banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#b7f56a]/15 bg-gradient-to-r from-[#142019] via-[#111914] to-[#101319] p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-12 text-[160px] leading-none opacity-[0.06] sm:text-[210px]"
        >
          ⚽
        </div>

        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#b7f56a]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#b7f56a]" />
            Tournament management
          </div>

          <h2 className="text-xl font-semibold sm:text-2xl">
            Every great tournament starts here.
          </h2>

          <p className="mt-2 max-w-lg text-xs leading-6 text-[#9aaa9c]">
            Organize competitions, track seasons, and manage the journey
            from league phase to the final.
          </p>
        </div>
      </div>

      {/* Search and counter */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#788596]"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search competitions or seasons..."
            aria-label="Search competitions"
            className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#101319] pl-11 pr-4 text-xs text-white outline-none transition placeholder:text-[#667386] focus:border-[#b7f56a]/40"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8b98aa]">
            {loading ? "Loading..." : `${filtered.length} competitions`}
          </span>

          <button
            type="button"
            onClick={() => void loadCompetitions()}
            disabled={loading}
            aria-label="Refresh competitions"
            className="rounded-xl border border-white/[0.08] bg-[#101319] p-3 text-[#b7f56a] transition hover:bg-white/[0.05] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && <CompetitionSkeleton />}

      {/* Error */}
      {!loading && error && (
        <div className={`${card} px-6 py-12 text-center`}>
          <AlertCircle size={28} className="mx-auto text-red-300" />

          <h3 className="mt-4 text-base font-semibold">
            Could not load competitions
          </h3>

          <p className="mt-2 text-xs text-[#8b98aa]">{error}</p>

          <button
            type="button"
            onClick={() => void loadCompetitions()}
            className="mt-5 rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-bold text-black"
          >
            Try again
          </button>
        </div>
      )}

      {/* Competition cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((competition, index) => (
            <motion.article
              key={competition.id}
              initial={
                reducedMotion ? false : { opacity: 0, y: 16 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: Math.min(index, 8) * 0.045,
              }}
              whileHover={
                reducedMotion ? undefined : { y: -4 }
              }
              className={`${card} group relative overflow-hidden p-6 transition-colors hover:border-[#b7f56a]/30`}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#b7f56a]/[0.035] blur-3xl" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#b7f56a]/20 bg-[#b7f56a]/[0.08] text-[#b7f56a]">
                  <Trophy size={23} />
                </div>

                <span className="rounded-full border border-white/[0.09] px-3 py-1.5 text-[9px] text-[#a3afbc]">
                  Tournament
                </span>
              </div>

              <h3 className="relative mt-7 line-clamp-2 min-h-12 text-lg font-semibold tracking-tight">
                {competition.name}
              </h3>

              <p className="mt-2 text-xs text-[#b7f56a]">
                {competition.season || "Season not specified"}
              </p>

              <div className="mt-7 flex items-center gap-2 border-t border-white/[0.07] pt-5 text-[11px] text-[#8794a5]">
                <CalendarDays size={14} />
                Created {formatCreatedDate(competition.createdDate)}
              </div>

              <button
                type="button"
                onClick={() => onOpen(competition.id)}
                className="mt-6 flex w-full items-center justify-between rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.05] px-4 py-3 text-xs font-semibold text-[#b7f56a] transition hover:bg-[#b7f56a]/[0.11]"
              >
                Manage competition
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </motion.article>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className={`${card} px-6 py-16 text-center`}>
          <Trophy
            size={36}
            className="mx-auto text-[#b7f56a]"
          />

          <h3 className="mt-5 text-lg font-semibold">
            {search ? "No matching competitions" : "No competitions yet"}
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-[#8b98aa]">
            {search
              ? "Try a different competition name or season."
              : "Create your first competition to begin your FootballSim journey."}
          </p>

          {!search && (
            <button
              type="button"
              onClick={onCreate}
              className="mt-6 rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-bold text-black"
            >
              Create Competition
            </button>
          )}
        </div>
      )}
    </section>
  );
}
