
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleMinus,
  RefreshCw,
  Search,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

type Competition = {
  id: string;
  name: string;
  season?: string | null;
};

type Standing = {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
  groupName?: string;
};

type Zone = "direct" | "playoffs" | "eliminated";

const surface =
  "rounded-2xl border border-white/[0.08] bg-[#101319]";

const numberFormatter = new Intl.NumberFormat("en-GB");

function getZone(position: number): Zone {
  if (position <= 8) return "direct";
  if (position <= 24) return "playoffs";
  return "eliminated";
}

const zoneStyles: Record<
  Zone,
  {
    label: string;
    color: string;
    background: string;
    border: string;
    dot: string;
  }
> = {
  direct: {
    label: "Round of 16",
    color: "text-[#b7f56a]",
    background: "bg-[#b7f56a]/[0.07]",
    border: "border-[#b7f56a]/20",
    dot: "bg-[#b7f56a]",
  },
  playoffs: {
    label: "Playoffs",
    color: "text-amber-300",
    background: "bg-amber-300/[0.06]",
    border: "border-amber-300/20",
    dot: "bg-amber-300",
  },
  eliminated: {
    label: "Eliminated",
    color: "text-rose-300",
    background: "bg-rose-300/[0.05]",
    border: "border-rose-300/20",
    dot: "bg-rose-300",
  },
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function getErrorMessage(
  payload: unknown,
  fallback: string
): string {
  if (
    isRecord(payload) &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallback;
}

function parseCompetitions(payload: unknown): Competition[] {
  if (!Array.isArray(payload)) {
    throw new Error("Invalid competitions API response.");
  }

  return payload
    .filter(
      (value): value is Record<string, unknown> =>
        isRecord(value) &&
        typeof value.id === "string" &&
        typeof value.name === "string"
    )
    .map((value) => ({
      id: value.id as string,
      name: value.name as string,
      season:
        typeof value.season === "string"
          ? value.season
          : "",
    }));
}

function parseStandings(payload: unknown): Standing[] {
  const records = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.data)
      ? payload.data
      : null;

  if (!records) {
    throw new Error("Invalid standings API response.");
  }

  const requiredNumbers = [
    "played",
    "wins",
    "draws",
    "losses",
    "goalsFor",
    "goalsAgainst",
    "goalDifference",
    "points",
    "position",
  ];

  const valid = records.every(
    (value) =>
      isRecord(value) &&
      typeof value.teamId === "string" &&
      typeof value.teamName === "string" &&
      requiredNumbers.every(
        (key) =>
          typeof value[key] === "number" &&
          Number.isFinite(value[key])
      )
  );

  if (!valid) {
    throw new Error("Standings contain invalid team records.");
  }

  return (records as Standing[]).sort(
    (a, b) => a.position - b.position
  );
}

function LoadingTable() {
  return (
    <div
      role="status"
      aria-label="Loading league standings"
      className={`${surface} overflow-hidden p-5`}
    >
      <div className="mb-6 h-7 w-48 animate-pulse rounded-lg bg-white/[0.07]" />
      <div className="space-y-3">
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl bg-white/[0.045]"
          />
        ))}
      </div>
    </div>
  );
}

export default function LeaguePhase({
  initialCompetitionId,
  onOpenCompetition,
}: {
  initialCompetitionId?: string | null;
  onOpenCompetition?: (id: string) => void;
}) {
  const reducedMotion = useReducedMotion();

  const [competitions, setCompetitions] = useState<
    Competition[]
  >([]);
  const [competitionId, setCompetitionId] = useState("");
  const [standings, setStandings] = useState<Standing[]>([]);

  const [loadingCompetitions, setLoadingCompetitions] =
    useState(true);
  const [loadingStandings, setLoadingStandings] =
    useState(false);

  const [competitionError, setCompetitionError] =
    useState("");
  const [standingsError, setStandingsError] = useState("");

  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<
    "all" | Zone
  >("all");
  const [reload, setReload] = useState(0);

  const loadCompetitions = useCallback(
    async (signal: AbortSignal) => {
      setLoadingCompetitions(true);
      setCompetitionError("");

      try {
        const response = await fetch("/api/competitions", {
          cache: "no-store",
          credentials: "same-origin",
          signal,
        });

        const payload: unknown = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              payload,
              `Competitions API returned ${response.status}.`
            )
          );
        }

        const list = parseCompetitions(payload);

        if (signal.aborted) return;

        setCompetitions(list);
        setCompetitionId((previous) => {
          if (previous && list.some((c) => c.id === previous)) {
            return previous;
          }

          if (
            initialCompetitionId &&
            list.some((c) => c.id === initialCompetitionId)
          ) {
            return initialCompetitionId;
          }

          return list[0]?.id ?? "";
        });
      } catch (error) {
        if (signal.aborted) return;

        setCompetitionError(
          error instanceof Error
            ? error.message
            : "Unable to load competitions."
        );
      } finally {
        if (!signal.aborted) {
          setLoadingCompetitions(false);
        }
      }
    },
    [initialCompetitionId]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadCompetitions(controller.signal);

    return () => controller.abort();
  }, [loadCompetitions, reload]);

  useEffect(() => {
    if (!competitionId) {
      setStandings([]);
      setLoadingStandings(false);
      return;
    }

    const controller = new AbortController();

    async function loadStandings() {
      setLoadingStandings(true);
      setStandingsError("");
      setStandings([]);

      try {
        const response = await fetch(
          `/api/competitions/${encodeURIComponent(
            competitionId
          )}/standings`,
          {
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          }
        );

        const payload: unknown = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              payload,
              `Standings API returned ${response.status}.`
            )
          );
        }

        const rows = parseStandings(payload);

        if (!controller.signal.aborted) {
          setStandings(rows);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setStandingsError(
            error instanceof Error
              ? error.message
              : "Unable to load standings."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStandings(false);
        }
      }
    }

    void loadStandings();

    return () => controller.abort();
  }, [competitionId, reload]);

  const selectedCompetition = competitions.find(
    (competition) => competition.id === competitionId
  );

  const filteredStandings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return standings.filter((team) => {
      const matchesName = team.teamName
        .toLowerCase()
        .includes(query);

      const matchesZone =
        zoneFilter === "all" ||
        getZone(team.position) === zoneFilter;

      return matchesName && matchesZone;
    });
  }, [standings, search, zoneFilter]);

  const stats = useMemo(() => {
    const totalTeams = standings.length;
    const direct = standings.filter(
      (team) => getZone(team.position) === "direct"
    ).length;
    const playoffs = standings.filter(
      (team) => getZone(team.position) === "playoffs"
    ).length;
    const eliminated = standings.filter(
      (team) => getZone(team.position) === "eliminated"
    ).length;

    const totalPlayed = standings.reduce(
      (sum, team) => sum + team.played,
      0
    );

    const totalGoals = standings.reduce(
      (sum, team) => sum + team.goalsFor,
      0
    );

    return {
      totalTeams,
      direct,
      playoffs,
      eliminated,
      completedMatches: totalPlayed / 2,
      totalGoals,
      maxPlayed: Math.max(
        0,
        ...standings.map((team) => team.played)
      ),
    };
  }, [standings]);

  const isComplete =
    standings.length === 36 &&
    standings.every((team) => team.played === 8);

  return (
    <section className="space-y-6 text-white">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7f56a]">
            <Activity size={15} />
            FootballSim / Tournament Center
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            League{" "}
            <span className="text-[#b7f56a]">Phase</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#8b98aa]">
            Live standings, qualification positions and
            league performance from your competition database.
          </p>
        </div>

        <button
          type="button"
          disabled={loadingStandings || loadingCompetitions}
          onClick={() => setReload((value) => value + 1)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#101319] px-5 text-xs font-semibold text-[#b7f56a] transition hover:bg-[#172019] disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              loadingStandings || loadingCompetitions
                ? "animate-spin"
                : ""
            }
          />
          Refresh standings
        </button>
      </div>

      {/* HERO */}
      <motion.div
        initial={
          reducedMotion ? false : { opacity: 0, y: 12 }
        }
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-[#b7f56a]/20 bg-gradient-to-br from-[#17271a] via-[#101b16] to-[#101319] p-6 sm:p-8"
      >
        <Trophy
          size={145}
          className="pointer-events-none absolute -right-5 -top-6 text-[#b7f56a]/[0.07]"
        />

        <div className="relative max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b7f56a]">
            UEFA-style league standings
          </p>

          <h2 className="mt-3 text-xl font-semibold sm:text-2xl">
            {selectedCompetition?.name ||
              "Choose a competition"}
          </h2>

          <p className="mt-2 text-xs leading-6 text-[#9baa9f]">
            36 clubs. Eight league fixtures per club.
            One league table. Every point matters.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#b7f56a]/20 bg-[#b7f56a]/[0.08] px-3 py-2 text-[10px] font-semibold text-[#b7f56a]">
              {isComplete
                ? "League phase complete"
                : standings.length
                  ? "League phase standings"
                  : "Awaiting standings"}
            </span>

            {selectedCompetition &&
              onOpenCompetition && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenCompetition(selectedCompetition.id)
                  }
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#b7f56a] hover:underline"
                >
                  Competition details
                  <ArrowRight size={14} />
                </button>
              )}
          </div>
        </div>
      </motion.div>

      {/* COMPETITION SELECTOR */}
      <div className={`${surface} p-5 sm:p-6`}>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="w-full max-w-md">
            <label
              htmlFor="league-competition"
              className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#8b98aa]"
            >
              Select competition
            </label>

            <div className="relative">
              <select
                id="league-competition"
                value={competitionId}
                disabled={
                  loadingCompetitions ||
                  competitions.length === 0
                }
                onChange={(event) => {
                  setCompetitionId(event.target.value);
                  setSearch("");
                  setZoneFilter("all");
                }}
                className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#0b0e12] px-4 pr-11 text-sm font-medium text-white outline-none focus:border-[#b7f56a]/50 disabled:opacity-50"
              >
                {!competitions.length && (
                  <option value="">
                    {loadingCompetitions
                      ? "Loading competitions..."
                      : "No competitions available"}
                  </option>
                )}

                {competitions.map((competition) => (
                  <option
                    key={competition.id}
                    value={competition.id}
                  >
                    {competition.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#b7f56a]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8b98aa]">
            <span className="h-2 w-2 rounded-full bg-[#b7f56a]" />
            Live backend standings
          </div>
        </div>

        {competitionError && (
          <p
            role="alert"
            className="mt-4 text-xs text-red-300"
          >
            {competitionError}
          </p>
        )}
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Total clubs",
            value: stats.totalTeams,
            icon: Users,
          },
          {
            label: "Direct qualifiers",
            value: stats.direct,
            icon: CheckCircle2,
          },
          {
            label: "Playoff places",
            value: stats.playoffs,
            icon: Activity,
          },
          {
            label: "Elimination zone",
            value: stats.eliminated,
            icon: CircleMinus,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className={`${surface} p-5`}>
              <Icon size={19} className="text-[#b7f56a]" />

              <p className="mt-4 text-2xl font-semibold tabular-nums sm:text-3xl">
                {loadingStandings ? "—" : item.value}
              </p>

              <p className="mt-2 text-xs text-[#8b98aa]">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* TABLE */}
      <div className={`${surface} overflow-hidden`}>
        <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] p-5 sm:p-6 xl:flex-row xl:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#b7f56a]">
              Official competition data
            </p>

            <h3 className="mt-2 text-xl font-semibold">
              League standings
            </h3>

            <p className="mt-2 text-xs text-[#8b98aa]">
              {loadingStandings
                ? "Retrieving standings..."
                : `${filteredStandings.length} of ${standings.length} clubs shown`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#798698]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search clubs..."
                aria-label="Search clubs"
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0b0e12] pl-10 pr-3 text-xs text-white outline-none focus:border-[#b7f56a]/40 sm:w-52"
              />
            </div>

            <select
              value={zoneFilter}
              onChange={(event) =>
                setZoneFilter(
                  event.target.value as "all" | Zone
                )
              }
              aria-label="Filter qualification zone"
              className="h-11 rounded-xl border border-white/10 bg-[#0b0e12] px-3 text-xs text-white outline-none focus:border-[#b7f56a]/40"
            >
              <option value="all">All positions</option>
              <option value="direct">Round of 16</option>
              <option value="playoffs">Playoffs</option>
              <option value="eliminated">Eliminated</option>
            </select>
          </div>
        </div>

        {loadingCompetitions || loadingStandings ? (
          <LoadingTable />
        ) : standingsError ? (
          <div
            role="alert"
            className="px-5 py-14 text-center"
          >
            <AlertCircle
              size={30}
              className="mx-auto text-red-300"
            />

            <h4 className="mt-4 font-semibold">
              Unable to load standings
            </h4>

            <p className="mt-2 text-sm text-[#8b98aa]">
              {standingsError}
            </p>

            <button
              type="button"
              onClick={() =>
                setReload((value) => value + 1)
              }
              className="mt-5 rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-bold text-black"
            >
              Try again
            </button>
          </div>
        ) : filteredStandings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.07] bg-[#0b0e12] text-[10px] uppercase tracking-wider text-[#8290a2]">
                  <th scope="col" className="px-5 py-4">
                    Pos
                  </th>
                  <th scope="col" className="px-4 py-4">
                    Club
                  </th>
                  {[
                    "P",
                    "W",
                    "D",
                    "L",
                    "GF",
                    "GA",
                    "GD",
                    "Pts",
                  ].map((label) => (
                    <th
                      scope="col"
                      key={label}
                      className="px-3 py-4 text-center"
                    >
                      {label}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-4">
                    Qualification
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredStandings.map((team) => {
                  const zone = getZone(team.position);
                  const style = zoneStyles[zone];

                  return (
                    <tr
                      key={team.teamId}
                      className="border-b border-white/[0.055] transition hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-3">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold tabular-nums ${style.color} ${style.background} ${style.border}`}
                        >
                          {team.position}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-[#b7f56a]">
                            <Shield size={17} />
                          </span>

                          <span className="whitespace-nowrap text-xs font-semibold">
                            {team.teamName}
                          </span>
                        </div>
                      </td>

                      {[
                        team.played,
                        team.wins,
                        team.draws,
                        team.losses,
                        team.goalsFor,
                        team.goalsAgainst,
                      ].map((value, index) => (
                        <td
                          key={index}
                          className="px-3 py-3 text-center text-xs tabular-nums text-[#b2becb]"
                        >
                          {value}
                        </td>
                      ))}

                      <td
                        className={`px-3 py-3 text-center text-xs font-medium tabular-nums ${
                          team.goalDifference > 0
                            ? "text-[#b7f56a]"
                            : team.goalDifference < 0
                              ? "text-rose-300"
                              : "text-[#b2becb]"
                        }`}
                      >
                        {team.goalDifference > 0 ? "+" : ""}
                        {team.goalDifference}
                      </td>

                      <td className="px-3 py-3 text-center text-sm font-bold tabular-nums text-white">
                        {team.points}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-medium ${style.color} ${style.background} ${style.border}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                          />
                          {style.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <Trophy
              size={30}
              className="mx-auto text-[#b7f56a]"
            />

            <h4 className="mt-4 font-semibold">
              {standings.length
                ? "No matching clubs"
                : "No standings available"}
            </h4>

            <p className="mt-2 text-xs text-[#8b98aa]">
              {standings.length
                ? "Change your search or qualification filter."
                : "Standings will appear once the backend returns registered clubs."}
            </p>
          </div>
        )}

        <div className="flex flex-col justify-between gap-4 border-t border-white/[0.07] px-5 py-5 sm:px-6 xl:flex-row xl:items-center">
          <div className="flex flex-wrap gap-4">
            {(
              ["direct", "playoffs", "eliminated"] as Zone[]
            ).map((zone) => (
              <div
                key={zone}
                className="flex items-center gap-2"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${zoneStyles[zone].dot}`}
                />

                <span className="text-[11px] text-[#9aa6b5]">
                  {zone === "direct"
                    ? "1–8: Round of 16"
                    : zone === "playoffs"
                      ? "9–24: Playoffs"
                      : "25–36: Eliminated"}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-[#758294]">
            P Played · W Won · D Drawn · L Lost ·
            GF Goals for · GA Goals against ·
            GD Goal difference
          </p>
        </div>
      </div>

      {/* BOTTOM STATISTICS */}
      {standings.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className={`${surface} p-5`}>
            <p className="text-xs text-[#8b98aa]">
              Completed league matches
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {numberFormatter.format(stats.completedMatches)}
            </p>
          </div>

          <div className={`${surface} p-5`}>
            <p className="text-xs text-[#8b98aa]">
              Total goals scored
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {numberFormatter.format(stats.totalGoals)}
            </p>
          </div>

          <div className={`${surface} p-5`}>
            <p className="text-xs text-[#8b98aa]">
              Most matches played by a club
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {stats.maxPlayed}
              <span className="ml-2 text-xs font-normal text-[#8b98aa]">
                of 8 scheduled
              </span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
