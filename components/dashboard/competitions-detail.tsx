
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  RefreshCw,
  Search,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

type Competition = {
  id: string;
  name: string;
  season: string;
  createdDate: string;
};

type RegisteredTeam = {
  competitionId: string;
  competitionName: string;
  teamId: string;
  teamName: string;
};

function Skeleton() {
  return (
    <div
      role="status"
      aria-label="Loading competition details"
      className="animate-pulse space-y-5"
    >
      <div className="h-44 rounded-2xl bg-[#101b15]" />

      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-[#101319]"
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-[#101319]"
          />
        ))}
      </div>
    </div>
  );
}

export default function CompetitionDetails({
  competitionId,
  onBack,
}: {
  competitionId: string;
  onBack: () => void;
}) {
  const reducedMotion = useReducedMotion();

  const [competition, setCompetition] =
    useState<Competition | null>(null);

  const [teams, setTeams] = useState<RegisteredTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [competitionsResponse, teamsResponse] =
          await Promise.all([
            fetch("/api/competitions", {
              credentials: "same-origin",
              cache: "no-store",
              signal: controller.signal,
            }),
            fetch(
              `/api/competitions/${encodeURIComponent(
                competitionId
              )}/teams`,
              {
                credentials: "same-origin",
                cache: "no-store",
                signal: controller.signal,
              }
            ),
          ]);

        if (
          [competitionsResponse.status, teamsResponse.status].some(
            (status) => status === 401 || status === 403
          )
        ) {
          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        const [competitionsData, teamsData]: [unknown, unknown] =
          await Promise.all([
            competitionsResponse.json().catch(() => null),
            teamsResponse.json().catch(() => null),
          ]);

        if (!competitionsResponse.ok || !teamsResponse.ok) {
          const payload = !competitionsResponse.ok
            ? competitionsData
            : teamsData;

          const message =
            payload &&
            typeof payload === "object" &&
            "message" in payload &&
            typeof payload.message === "string"
              ? payload.message
              : "Unable to load competition details.";

          throw new Error(message);
        }

        if (
          !Array.isArray(competitionsData) ||
          !Array.isArray(teamsData)
        ) {
          throw new Error(
            "Unexpected response from the competition API."
          );
        }

        const found = competitionsData.find(
          (item) =>
            item &&
            typeof item === "object" &&
            item.id === competitionId
        );

        if (!found) {
          throw new Error("This competition was not found.");
        }

        const parsedTeams: RegisteredTeam[] = teamsData.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof item.teamId === "string" &&
            typeof item.teamName === "string"
        );

        if (!controller.signal.aborted) {
          setCompetition({
            id: found.id,
            name: found.name,
            season: found.season ?? "",
            createdDate: found.createdDate ?? "",
          });

          setTeams(parsedTeams);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load competition details."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [competitionId, reload]);

  const filtered = useMemo(
    () =>
      teams.filter((team) =>
        team.teamName
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      ),
    [teams, query]
  );

  const created =
    competition?.createdDate &&
    !Number.isNaN(Date.parse(competition.createdDate))
      ? new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date(competition.createdDate))
      : "Unavailable";

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#101319] px-4 py-3 text-xs text-[#b7f56a] hover:bg-[#172019]"
        >
          <ArrowLeft size={16} />
          All competitions
        </button>

        <button
          type="button"
          onClick={() => setReload((n) => n + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs text-[#b7f56a] disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {loading ? (
        <Skeleton />
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-400/20 bg-[#101319] p-10 text-center"
        >
          <CircleAlert
            className="mx-auto text-red-300"
            size={28}
          />

          <h2 className="mt-4 font-semibold">
            Competition unavailable
          </h2>

          <p className="mt-2 text-sm text-[#8b98aa]">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setReload((n) => n + 1)}
            className="mt-5 rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-bold text-black"
          >
            Try again
          </button>
        </div>
      ) : (
        competition && (
          <>
            <motion.div
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, y: 12 }
              }
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-[#b7f56a]/20 bg-gradient-to-br from-[#16251a] via-[#111b16] to-[#101319] p-6 sm:p-9"
            >
              <Trophy
                size={110}
                className="pointer-events-none absolute -right-4 -top-4 text-[#b7f56a]/10"
              />

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7f56a]">
                FootballSim / Competition center
              </p>

              <h1 className="relative mt-4 max-w-3xl text-2xl font-semibold tracking-tight sm:text-4xl">
                {competition.name}
              </h1>

              <p className="mt-3 text-sm text-[#9dac9e]">
                {competition.season || "Season not specified"}
              </p>

              <div className="mt-7 flex items-center gap-2 text-xs text-[#9dac9e]">
                <CalendarDays size={15} />
                Created {created}
              </div>
            </motion.div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.08] bg-[#101319] p-5">
                <Users
                  size={20}
                  className="text-[#b7f56a]"
                />
                <p className="mt-4 text-3xl font-semibold">
                  {teams.length}
                </p>
                <p className="mt-1 text-xs text-[#8b98aa]">
                  Registered teams
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#101319] p-5">
                <Trophy
                  size={20}
                  className="text-[#b7f56a]"
                />
                <p className="mt-4 text-lg font-semibold">
                  {competition.season || "Not specified"}
                </p>
                <p className="mt-1 text-xs text-[#8b98aa]">
                  Competition season
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#101319] p-5">
                <CalendarDays
                  size={20}
                  className="text-[#b7f56a]"
                />
                <p className="mt-4 text-lg font-semibold">
                  {created}
                </p>
                <p className="mt-1 text-xs text-[#8b98aa]">
                  Date created
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#101319] p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#b7f56a]">
                    Club registration
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    Registered teams{" "}
                    <span className="text-[#b7f56a]">
                      ({teams.length})
                    </span>
                  </h2>

                  <p className="mt-2 text-xs text-[#8b98aa]">
                    Teams registered in this competition,
                    retrieved from your backend.
                  </p>
                </div>

                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b899b]"
                  />

                  <input
                    value={query}
                    onChange={(e) =>
                      setQuery(e.target.value)
                    }
                    placeholder="Search teams..."
                    aria-label="Search registered teams"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0b0e12] pl-10 pr-3 text-xs outline-none focus:border-[#b7f56a]/40 sm:w-60"
                  />
                </div>
              </div>

              {filtered.length ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((team, index) => (
                    <motion.div
                      key={team.teamId}
                      initial={
                        reducedMotion
                          ? false
                          : { opacity: 0, y: 8 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: Math.min(index, 12) * 0.025,
                      }}
                      className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0b0e12] p-4"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.07]">
                        <Shield
                          size={19}
                          className="text-[#b7f56a]"
                        />
                      </span>

                      <span
                        className="min-w-0 truncate text-sm font-medium"
                        title={team.teamName}
                      >
                        {team.teamName}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-[#8b98aa]">
                  {query
                    ? "No matching teams."
                    : "No teams have been registered in this competition yet."}
                </div>
              )}
            </div>
          </>
        )
      )}
    </section>
  );
}
