"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  Search,
  Shield,
  Trophy,
} from "lucide-react";

type Competition = {
  id: string;
  name: string;
  season?: string | null;
};

type Fixture = {
  id: string;
  competitionId: string;
  competitionName: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  kickoffUtc: string | null;
  homeScore: number | null;
  awayScore: number | null;
  isPlayed: boolean;
  matchDay: number;
};

type StatusFilter = "all" | "played" | "scheduled";

type Props = {
  initialCompetitionId?: string | null;
};

const panel = "rounded-2xl border border-white/[0.08] bg-[#101319]";

function getErrorMessage(value: unknown, fallback: string): string {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseCompetitions(value: unknown): Competition[] {
  if (!Array.isArray(value)) {
    throw new Error("Unexpected competitions response.");
  }

  return value
    .filter(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string",
    )
    .map((item) => ({
      id: item.id as string,
      name: item.name as string,
      season: typeof item.season === "string" ? item.season : "",
    }));
}

function parseFixtures(value: unknown): Fixture[] {
  if (!Array.isArray(value)) {
    throw new Error("Unexpected fixtures response.");
  }

  const valid = value.every(
    (item) =>
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.homeTeamName === "string" &&
      typeof item.awayTeamName === "string" &&
      typeof item.matchDay === "number" &&
      typeof item.isPlayed === "boolean",
  );

  if (!valid) {
    throw new Error("The fixtures response contains invalid records.");
  }

  return value as Fixture[];
}

function formatKickoff(value: string | null): string {
  if (!value) return "Kickoff not scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Kickoff not scheduled";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

function Metric({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: typeof Trophy;
}) {
  return (
    <div className={`${panel} p-5`}>
      <Icon size={20} className="text-[#b7f56a]" />
      <div className="mt-4 text-3xl font-semibold tabular-nums text-white">
        {value}
      </div>
      <p className="mt-2 text-xs text-[#8b98aa]">{title}</p>
    </div>
  );
}

type TeamLogo = { id: string; logoUrl: string | null };

const backendBase = (
  process.env.NEXT_PUBLIC_FOOTBALLSIM_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5295"
).replace(/\/$/, "");

function resolveLogoUrl(value: string | null): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${backendBase}${value}`;
  return null;
}

function ClubCrest({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [logoUrl]);
  const url = resolveLogoUrl(logoUrl);
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.06] text-[#b7f56a]">
      {url && !failed ? (
        // External club crests may not be configured in next/image remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`${name} crest`} className="h-9 w-9 object-contain" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : <Shield size={21} aria-hidden="true" />}
    </span>
  );
}

function FixtureCard({ fixture, logos }: { fixture: Fixture; logos: Record<string, string | null> }) {
  const completed =
    fixture.isPlayed &&
    fixture.homeScore !== null &&
    fixture.awayScore !== null;

  const homeWon = completed && fixture.homeScore! > fixture.awayScore!;

  const awayWon = completed && fixture.awayScore! > fixture.homeScore!;

  return (
    <article
      className={`${panel} overflow-hidden transition-colors hover:border-[#b7f56a]/20`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-[#9ba8b7]">
          <CalendarDays size={14} />
          {formatKickoff(fixture.kickoffUtc)}
        </div>

        <span
          className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${
            completed
              ? "border-[#b7f56a]/20 bg-[#b7f56a]/10 text-[#b7f56a]"
              : "border-white/10 bg-white/[0.04] text-[#a5b0bd]"
          }`}
        >
          {completed ? "Full time" : "Scheduled"}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-7 sm:gap-6 sm:px-6">
        <div className="flex min-w-0 flex-col items-center gap-3 text-center">
          <ClubCrest logoUrl={logos[fixture.homeTeamId] ?? null} name={fixture.homeTeamName} />

          <span
            className={`text-xs font-semibold leading-5 sm:text-sm ${
              homeWon ? "text-white" : "text-[#c0c9d3]"
            }`}
          >
            {fixture.homeTeamName}
          </span>

          <span className="text-[10px] text-[#758294]">Home</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          {completed ? (
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl font-bold tabular-nums sm:text-3xl ${
                  homeWon ? "text-[#b7f56a]" : "text-white"
                }`}
              >
                {fixture.homeScore}
              </span>
              <span className="text-lg text-[#647184]">:</span>
              <span
                className={`text-2xl font-bold tabular-nums sm:text-3xl ${
                  awayWon ? "text-[#b7f56a]" : "text-white"
                }`}
              >
                {fixture.awayScore}
              </span>
            </div>
          ) : (
            <span className="text-xl font-semibold text-[#7e8b9a]">VS</span>
          )}

          <span className="text-[10px] uppercase tracking-widest text-[#788596]">
            {completed ? "FT" : "Fixture"}
          </span>
        </div>

        <div className="flex min-w-0 flex-col items-center gap-3 text-center">
          <ClubCrest logoUrl={logos[fixture.awayTeamId] ?? null} name={fixture.awayTeamName} />

          <span
            className={`text-xs font-semibold leading-5 sm:text-sm ${
              awayWon ? "text-white" : "text-[#c0c9d3]"
            }`}
          >
            {fixture.awayTeamName}
          </span>

          <span className="text-[10px] text-[#758294]">Away</span>
        </div>
      </div>

      <div className="border-t border-white/[0.06] bg-white/[0.015] px-5 py-3 text-center text-[10px] text-[#788596]">
        Matchday {fixture.matchDay}
      </div>
    </article>
  );
}

export default function Fixtures({ initialCompetitionId }: Props) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitionId, setCompetitionId] = useState("");
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [logos, setLogos] = useState<Record<string, string | null>>({});

  const [loadingCompetitions, setLoadingCompetitions] = useState(true);
  const [loadingFixtures, setLoadingFixtures] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [matchday, setMatchday] = useState<number | "all">("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCompetitions() {
      setLoadingCompetitions(true);
      setError("");

      try {
        const response = await fetch("/api/competitions", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getErrorMessage(payload, "Unable to load competitions."),
          );
        }

        const list = parseCompetitions(payload);

        if (controller.signal.aborted) return;

        setCompetitions(list);

        setCompetitionId((previous) => {
          if (list.some((item) => item.id === previous)) {
            return previous;
          }

          if (
            initialCompetitionId &&
            list.some((item) => item.id === initialCompetitionId)
          ) {
            return initialCompetitionId;
          }

          return list[0]?.id ?? "";
        });
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error ? err.message : "Unable to load competitions.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCompetitions(false);
        }
      }
    }

    void loadCompetitions();

    return () => controller.abort();
  }, [initialCompetitionId, refreshKey]);

  useEffect(() => {
    if (!competitionId) {
      setFixtures([]);
      return;
    }

    const controller = new AbortController();

    async function loadFixtures() {
      setLoadingFixtures(true);
      setError("");
      setFixtures([]);

      try {
        const response = await fetch(
          `/api/competitions/${encodeURIComponent(competitionId)}/fixtures`,
          {
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          },
        );

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(getErrorMessage(payload, "Unable to load fixtures."));
        }

        const rows = parseFixtures(payload);

        if (!controller.signal.aborted) {
          setFixtures(rows);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error ? err.message : "Unable to load fixtures.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingFixtures(false);
        }
      }
    }

    void loadFixtures();

    return () => controller.abort();
  }, [competitionId, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadLogos() {
      try {
        const response = await fetch("/api/teams", {
          cache: "no-store", credentials: "same-origin", signal: controller.signal,
        });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        const items = Array.isArray(payload) ? payload :
          isRecord(payload) && Array.isArray(payload.data) ? payload.data : [];
        const next: Record<string, string | null> = {};
        for (const item of items) {
          if (isRecord(item) && typeof item.id === "string") {
            next[item.id] = typeof item.logoUrl === "string" ? item.logoUrl : null;
          }
        }
        if (!controller.signal.aborted) setLogos(next);
      } catch { /* Crest fallback remains available. */ }
    }
    void loadLogos();
    return () => controller.abort();
  }, [refreshKey]);

  const selectedCompetition = competitions.find(
    (item) => item.id === competitionId,
  );

  const matchdays = useMemo(
    () =>
      [...new Set(fixtures.map((item) => item.matchDay))].sort((a, b) => a - b),
    [fixtures],
  );

  const completed = fixtures.filter(
    (item) =>
      item.isPlayed && item.homeScore !== null && item.awayScore !== null,
  );

  const remaining = fixtures.length - completed.length;

  const totalGoals = completed.reduce(
    (sum, item) => sum + (item.homeScore ?? 0) + (item.awayScore ?? 0),
    0,
  );

  const visibleFixtures = useMemo(() => {
    const query = search.trim().toLowerCase();

    return fixtures
      .filter((item) => {
        if (matchday !== "all" && item.matchDay !== matchday) {
          return false;
        }

        const played =
          item.isPlayed && item.homeScore !== null && item.awayScore !== null;

        if (status === "played" && !played) return false;
        if (status === "scheduled" && played) return false;

        return (
          item.homeTeamName.toLowerCase().includes(query) ||
          item.awayTeamName.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (a.matchDay !== b.matchDay) {
          return a.matchDay - b.matchDay;
        }

        const first = a.kickoffUtc
          ? new Date(a.kickoffUtc).getTime()
          : Number.MAX_SAFE_INTEGER;

        const second = b.kickoffUtc
          ? new Date(b.kickoffUtc).getTime()
          : Number.MAX_SAFE_INTEGER;

        return first - second;
      });
  }, [fixtures, matchday, status, search]);

  const groupedFixtures = useMemo(() => {
    const groups = new Map<number, Fixture[]>();

    for (const fixture of visibleFixtures) {
      const group = groups.get(fixture.matchDay) ?? [];
      group.push(fixture);
      groups.set(fixture.matchDay, group);
    }

    return [...groups.entries()];
  }, [visibleFixtures]);

  function moveMatchday(direction: -1 | 1) {
    if (!matchdays.length) return;

    if (matchday === "all") {
      setMatchday(
        direction === 1 ? matchdays[0] : matchdays[matchdays.length - 1],
      );
      return;
    }

    const index = matchdays.indexOf(matchday);
    const next = index + direction;

    if (next >= 0 && next < matchdays.length) {
      setMatchday(matchdays[next]);
    }
  }

  return (
    <section className="space-y-6 text-white">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7f56a]">
            <Activity size={15} />
            FootballSim / Match Center
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Match <span className="text-[#b7f56a]">Fixtures</span>
          </h1>

          <p className="mt-3 text-sm text-[#8b98aa]">
            Explore fixtures, results and matchday schedules from your
            competition database.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loadingFixtures || loadingCompetitions}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#101319] px-5 text-xs font-semibold text-[#b7f56a] transition hover:bg-[#172019] disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              loadingFixtures || loadingCompetitions ? "animate-spin" : ""
            }
          />
          Refresh fixtures
        </button>
      </div>

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-[#b7f56a]/20 bg-gradient-to-br from-[#17271a] via-[#101b16] to-[#101319] p-7">
        <Trophy
          size={135}
          className="pointer-events-none absolute -right-5 -top-6 text-[#b7f56a]/[0.07]"
        />

        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b7f56a]">
            FootballSim / Fixture Center
          </p>

          <h2 className="mt-3 text-2xl font-semibold">
            {selectedCompetition?.name ?? "Select a competition"}
          </h2>

          <p className="mt-3 text-xs leading-6 text-[#9baa9f]">
            Follow every matchday, monitor completed games and explore results
            across your competition.
          </p>
        </div>
      </div>

      {/* SELECTOR */}
      <div className={`${panel} p-5`}>
        <label
          htmlFor="fixture-competition"
          className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-[#8b98aa]"
        >
          Select competition
        </label>

        <select
          id="fixture-competition"
          value={competitionId}
          disabled={loadingCompetitions || !competitions.length}
          onChange={(event) => {
            setCompetitionId(event.target.value);
            setMatchday("all");
            setSearch("");
            setStatus("all");
          }}
          className="h-12 w-full max-w-lg rounded-xl border border-white/10 bg-[#0b0e12] px-4 text-sm text-white outline-none focus:border-[#b7f56a]/40 disabled:opacity-50"
        >
          {!competitions.length && (
            <option value="">
              {loadingCompetitions
                ? "Loading competitions..."
                : "No competitions found"}
            </option>
          )}

          {competitions.map((competition) => (
            <option key={competition.id} value={competition.id}>
              {competition.name}
            </option>
          ))}
        </select>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric
          title="Total fixtures"
          value={fixtures.length}
          icon={CalendarDays}
        />
        <Metric
          title="Completed matches"
          value={completed.length}
          icon={CheckCircle2}
        />
        <Metric title="Remaining fixtures" value={remaining} icon={Clock3} />
        <Metric title="Goals scored" value={totalGoals} icon={Activity} />
      </div>

      {/* MATCHDAY CONTROLS */}
      <div className={`${panel} p-5`}>
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h3 className="text-lg font-semibold">Matchday schedule</h3>
            <p className="mt-1 text-xs text-[#8b98aa]">
              Browse matchdays returned by your backend.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => moveMatchday(-1)}
              disabled={!matchdays.length}
              aria-label="Previous matchday"
              className="rounded-lg border border-white/10 p-2.5 text-[#b7f56a] hover:bg-white/5 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            <select
              value={matchday}
              onChange={(event) =>
                setMatchday(
                  event.target.value === "all"
                    ? "all"
                    : Number(event.target.value),
                )
              }
              className="h-10 rounded-lg border border-white/10 bg-[#0b0e12] px-3 text-xs text-white"
            >
              <option value="all">All matchdays</option>
              {matchdays.map((day) => (
                <option key={day} value={day}>
                  Matchday {day}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => moveMatchday(1)}
              disabled={!matchdays.length}
              aria-label="Next matchday"
              className="rounded-lg border border-white/10 p-2.5 text-[#b7f56a] hover:bg-white/5 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8290a2]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Arsenal, Real Madrid..."
              aria-label="Search fixtures by team"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0b0e12] pl-10 pr-4 text-xs text-white outline-none focus:border-[#b7f56a]/40"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            aria-label="Filter match status"
            className="h-11 rounded-xl border border-white/10 bg-[#0b0e12] px-4 text-xs text-white"
          >
            <option value="all">All matches</option>
            <option value="played">Completed</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* CONTENT */}
      {error ? (
        <div role="alert" className={`${panel} px-6 py-14 text-center`}>
          <AlertCircle size={30} className="mx-auto text-red-300" />
          <h3 className="mt-4 font-semibold">Unable to load fixtures</h3>
          <p className="mt-2 text-sm text-[#8b98aa]">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-5 rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-bold text-black"
          >
            Try again
          </button>
        </div>
      ) : loadingFixtures || loadingCompetitions ? (
        <div role="status" className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-52 animate-pulse rounded-2xl border border-white/[0.08] bg-[#101319]"
            />
          ))}
        </div>
      ) : groupedFixtures.length ? (
        <div className="space-y-8">
          {groupedFixtures.map(([day, matches]) => (
            <div key={day}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#b7f56a]">
                    Competition schedule
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">Matchday {day}</h3>
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-[#9ba8b7]">
                  {matches.length} matches
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {matches.map((fixture) => (
                  <FixtureCard key={fixture.id} fixture={fixture} logos={logos} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${panel} px-6 py-14 text-center`}>
          <CalendarDays size={32} className="mx-auto text-[#b7f56a]" />
          <h3 className="mt-4 font-semibold">
            {fixtures.length ? "No matching fixtures" : "No fixtures available"}
          </h3>
          <p className="mt-2 text-xs text-[#8b98aa]">
            {fixtures.length
              ? "Try changing your search or filters."
              : "Matches will appear when they are available in your competition database."}
          </p>
        </div>
      )}

      {!loadingFixtures && !error && (
        <p className="pb-4 text-center text-xs text-[#8290a2]">
          Showing {visibleFixtures.length} of {fixtures.length} matches
        </p>
      )}
    </section>
  );
}
