
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
  CalendarDays,
  Target,
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

type Team = {
  id: string;
  name: string;
  logoUrl?: string | null;
};

type Zone = "direct" | "playoffs" | "eliminated";

type Props = {
  initialCompetitionId?: string | null;
  onOpenCompetition?: (id: string) => void;
};

const surface =
  "rounded-2xl border border-white/[0.08] bg-[#101319]";

const numberFormatter = new Intl.NumberFormat("en-GB");

const zoneStyles = {
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
} as const;

function getZone(position: number): Zone {
  if (position <= 8) return "direct";
  if (position <= 24) return "playoffs";
  return "eliminated";
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function getErrorMessage(
  value: unknown,
  fallback: string,
): string {
  if (
    isRecord(value) &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return fallback;
}

function parseCompetitions(value: unknown): Competition[] {
  if (!Array.isArray(value)) {
    throw new Error("Invalid competitions API response.");
  }

  return value
    .filter(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string",
    )
    .map((item) => ({
      id: item.id,
      name: item.name,
      season:
        typeof item.season === "string"
          ? item.season
          : null,
    }));
}

function parseStandings(value: unknown): Standing[] {
  const records = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.data)
      ? value.data
      : null;

  if (!records) {
    throw new Error("Invalid standings API response.");
  }

  const numericFields = [
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
    (item) =>
      isRecord(item) &&
      typeof item.teamId === "string" &&
      typeof item.teamName === "string" &&
      numericFields.every(
        (field) =>
          typeof item[field] === "number" &&
          Number.isFinite(item[field]),
      ),
  );

  if (!valid) {
    throw new Error(
      "Standings response contains invalid team records.",
    );
  }

  return (records as Standing[])
    .slice()
    .sort((a, b) => a.position - b.position);
}

function parseTeams(value: unknown): Team[] {
  const records = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.data)
      ? value.data
      : [];

  return records
    .filter(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string",
    )
    .map((item) => ({
      id: item.id as string,
      name: item.name as string,
      logoUrl:
        typeof item.logoUrl === "string"
          ? item.logoUrl
          : null,
    }));
}

function ClubCrest({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.035]">
      {logoUrl && !failed ? (
        // External club logos may not be configured in next.config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${name} crest`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-8 w-8 object-contain"
        />
      ) : (
        <Shield size={18} className="text-[#b7f56a]" />
      )}
    </span>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  loading = false,
}: {
  label: string;
  value: number | string;
  icon: typeof Trophy;
  loading?: boolean;
}) {
  return (
    <div className={`${surface} p-5`}>
      <Icon size={20} className="text-[#b7f56a]" />

      <p className="mt-4 text-2xl font-semibold tabular-nums text-white sm:text-3xl">
        {loading ? "—" : value}
      </p>

      <p className="mt-2 text-xs text-[#8b98aa]">
        {label}
      </p>
    </div>
  );
}

export default function LeaguePhase({
  initialCompetitionId,
  onOpenCompetition,
}: Props) {
  const reducedMotion = useReducedMotion();

  const [competitions, setCompetitions] =
    useState<Competition[]>([]);

  const [competitionId, setCompetitionId] =
    useState("");

  const [standings, setStandings] =
    useState<Standing[]>([]);

  const [teams, setTeams] = useState<Team[]>([]);

  const [loadingCompetitions, setLoadingCompetitions] =
    useState(true);

  const [loadingStandings, setLoadingStandings] =
    useState(false);

  const [competitionError, setCompetitionError] =
    useState("");

  const [standingsError, setStandingsError] =
    useState("");

  const [search, setSearch] = useState("");

  const [zoneFilter, setZoneFilter] =
    useState<"all" | Zone>("all");

  const [reload, setReload] = useState(0);

  const refresh = useCallback(() => {
    setReload((previous) => previous + 1);
  }, []);

  // Load competitions and available team crests.
  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialData() {
      setLoadingCompetitions(true);
      setCompetitionError("");

      try {
        const response = await fetch("/api/competitions", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        const payload: unknown = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              payload,
              "Unable to load competitions.",
            ),
          );
        }

        const list = parseCompetitions(payload);

        if (controller.signal.aborted) return;

        setCompetitions(list);

        setCompetitionId((previous) => {
          if (list.some((c) => c.id === previous)) {
            return previous;
          }

          if (
            initialCompetitionId &&
            list.some(
              (c) => c.id === initialCompetitionId,
            )
          ) {
            return initialCompetitionId;
          }

          return list[0]?.id ?? "";
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        setCompetitionError(
          error instanceof Error
            ? error.message
            : "Unable to load competitions.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCompetitions(false);
        }
      }
    }

    async function loadTeams() {
      try {
        const response = await fetch("/api/teams", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (!response.ok) return;

        const payload: unknown = await response
          .json()
          .catch(() => null);

        if (!controller.signal.aborted) {
          setTeams(parseTeams(payload));
        }
      } catch {
        // Team crests are optional.
        // Standings remain usable without them.
      }
    }

    void loadInitialData();
    void loadTeams();

    return () => controller.abort();
  }, [initialCompetitionId, reload]);

  // Load current competition standings.
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
            competitionId,
          )}/standings`,
          {
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          },
        );

        const payload: unknown = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              payload,
              `Standings API returned ${response.status}.`,
            ),
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
              : "Unable to load standings.",
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
    (competition) => competition.id === competitionId,
  );

  const logoByTeamId = useMemo(() => {
    return new Map(
      teams.map((team) => [
        team.id.toLowerCase(),
        team.logoUrl,
      ]),
    );
  }, [teams]);

  // UEFA qualification zones only apply to
  // the full 36-club format.
  const usesUefaZones = standings.length === 36;

  const filteredStandings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return standings.filter((team) => {
      const matchesSearch = team.teamName
        .toLowerCase()
        .includes(query);

      const matchesZone =
        !usesUefaZones ||
        zoneFilter === "all" ||
        getZone(team.position) === zoneFilter;

      return matchesSearch && matchesZone;
    });
  }, [
    standings,
    search,
    zoneFilter,
    usesUefaZones,
  ]);

  const stats = useMemo(() => {
    const totalTeams = standings.length;

    const totalPlayed = standings.reduce(
      (sum, team) => sum + team.played,
      0,
    );

    const totalGoals = standings.reduce(
      (sum, team) => sum + team.goalsFor,
      0,
    );

    const direct = usesUefaZones
      ? standings.filter(
          (team) => getZone(team.position) === "direct",
        ).length
      : 0;

    const playoffs = usesUefaZones
      ? standings.filter(
          (team) => getZone(team.position) === "playoffs",
        ).length
      : 0;

    const eliminated = usesUefaZones
      ? standings.filter(
          (team) => getZone(team.position) === "eliminated",
        ).length
      : 0;

    return {
      totalTeams,
      completedMatches: totalPlayed / 2,
      totalGoals,
      direct,
      playoffs,
      eliminated,
      maxPlayed: Math.max(
        0,
        ...standings.map((team) => team.played),
      ),
    };
  }, [standings, usesUefaZones]);

  const expectedFixtures =
    (standings.length * (standings.length - 1)) / 2;

  // This indicates that the registered clubs have
  // completed the expected single round-robin matches.
  const isComplete =
    standings.length >= 2 &&
    standings.every(
      (team) => team.played === standings.length - 1,
    );

  return (
    <section className="space-y-6 text-white">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7f56a]">
            <Activity size={15} />
            FootballSim / Tournament Center
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            League{" "}
            <span className="text-[#b7f56a]">
              Phase
            </span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#8b98aa]">
            Track live standings, club performance,
            results and league positions across your
            competitions.
          </p>
        </div>

        <button
          type="button"
          disabled={
            loadingStandings || loadingCompetitions
          }
          onClick={refresh}
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
          reducedMotion
            ? false
            : { opacity: 0, y: 12 }
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
            FootballSim / Competition standings
          </p>

          <h2 className="mt-3 text-xl font-semibold sm:text-2xl">
            {selectedCompetition?.name ??
              "Choose a competition"}
          </h2>

          <p className="mt-2 text-xs leading-6 text-[#9baa9f]">
            Your league grows as clubs join.
            Fixtures and standings are managed
            through your competition database.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#b7f56a]/20 bg-[#b7f56a]/[0.08] px-3 py-2 text-[10px] font-semibold text-[#b7f56a]">
              {isComplete
                ? "Current league schedule completed"
                : standings.length
                  ? `${standings.length} clubs registered`
                  : "Awaiting standings"}
            </span>

            {selectedCompetition &&
              onOpenCompetition && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenCompetition(
                      selectedCompetition.id,
                    )
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
        <Metric
          label="Registered clubs"
          value={stats.totalTeams}
          icon={Users}
          loading={loadingStandings}
        />

        <Metric
          label="Expected fixtures"
          value={expectedFixtures}
          icon={CalendarDays}
          loading={loadingStandings}
        />

        <Metric
          label="Completed matches"
          value={stats.completedMatches}
          icon={CheckCircle2}
          loading={loadingStandings}
        />

        <Metric
          label="Total goals"
          value={stats.totalGoals}
          icon={Target}
          loading={loadingStandings}
        />
      </div>

      {/* LEAGUE TABLE */}
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

            {usesUefaZones && (
              <select
                value={zoneFilter}
                onChange={(event) =>
                  setZoneFilter(
                    event.target.value as
                      | "all"
                      | Zone,
                  )
                }
                aria-label="Filter qualification zone"
                className="h-11 rounded-xl border border-white/10 bg-[#0b0e12] px-3 text-xs text-white outline-none focus:border-[#b7f56a]/40"
              >
                <option value="all">
                  All positions
                </option>
                <option value="direct">
                  Round of 16
                </option>
                <option value="playoffs">
                  Playoffs
                </option>
                <option value="eliminated">
                  Eliminated
                </option>
              </select>
            )}
          </div>
        </div>

        {loadingCompetitions || loadingStandings ? (
          <div
            role="status"
            className="space-y-3 p-5"
          >
            {Array.from(
              { length: 6 },
              (_, index) => (
                <div
                  key={index}
                  className="h-14 animate-pulse rounded-xl bg-white/[0.045]"
                />
              ),
            )}
          </div>
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
              onClick={refresh}
              className="mt-5 rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-bold text-black"
            >
              Try again
            </button>
          </div>
        ) : filteredStandings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.07] bg-[#0b0e12] text-[10px] uppercase tracking-wider text-[#8290a2]">
                  <th
                    scope="col"
                    className="px-5 py-4"
                  >
                    Pos
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-4"
                  >
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
                      key={label}
                      scope="col"
                      className="px-3 py-4 text-center"
                    >
                      {label}
                    </th>
                  ))}

                  {usesUefaZones && (
                    <th
                      scope="col"
                      className="px-4 py-4"
                    >
                      Qualification
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredStandings.map((team) => {
                  const zone = getZone(team.position);
                  const style = zoneStyles[zone];

                  const logoUrl =
                    logoByTeamId.get(
                      team.teamId.toLowerCase(),
                    ) ?? null;

                  return (
                    <tr
                      key={team.teamId}
                      className="border-b border-white/[0.055] transition hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs font-bold tabular-nums text-[#b7f56a]">
                          {team.position}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ClubCrest
                            name={team.teamName}
                            logoUrl={logoUrl}
                          />

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
                        {team.goalDifference > 0
                          ? "+"
                          : ""}
                        {team.goalDifference}
                      </td>

                      <td className="px-3 py-3 text-center text-sm font-bold tabular-nums text-white">
                        {team.points}
                      </td>

                      {usesUefaZones && (
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
                      )}
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
                ? "Try changing your search or filters."
                : "Registered clubs will appear when the standings API returns them."}
            </p>
          </div>
        )}

        <div className="flex flex-col justify-between gap-4 border-t border-white/[0.07] px-5 py-5 sm:px-6 xl:flex-row xl:items-center">
          <div className="flex flex-wrap gap-4 text-xs text-[#9aa6b5]">
            <span>P — Played</span>
            <span>W — Won</span>
            <span>D — Drawn</span>
            <span>L — Lost</span>
            <span>GD — Goal difference</span>
            <span>Pts — Points</span>
          </div>
        </div>
      </div>

      {/* BOTTOM STATISTICS */}
      {standings.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="Completed league matches"
            value={numberFormatter.format(
              stats.completedMatches,
            )}
            icon={CheckCircle2}
          />

          <Metric
            label="Total goals scored"
            value={numberFormatter.format(
              stats.totalGoals,
            )}
            icon={Activity}
          />

          <Metric
            label="Most matches played by a club"
            value={stats.maxPlayed}
            icon={Trophy}
          />
        </div>
      )}

      <p className="pb-4 text-center text-xs text-[#758294]">
        FootballSim — Live competition standings
      </p>
    </section>
  );
}
