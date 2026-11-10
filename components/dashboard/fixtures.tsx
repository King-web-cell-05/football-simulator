
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Shield,
  Trophy,
  X,
  Zap,
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================

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

type TeamLogo = {
  id: string;
  logoUrl: string | null;
};

type StatusFilter = "all" | "played" | "scheduled";

type SimulationRequest =
  | { mode: "match"; matchId: string }
  | { mode: "matchday"; matchday: number }
  | { mode: "all" };

type SimulationResponse = {
  matches: Fixture[];
  standings: unknown[];
};

type SimulationTarget = {
  request: SimulationRequest;
  title: string;
  description: string;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

type Props = {
  initialCompetitionId?: string | null;
};

const panel =
  "rounded-2xl border border-white/[0.08] bg-[#101319]";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#b7f56a] px-4 py-3 text-xs font-bold text-[#101319] transition hover:bg-[#d0ff94] disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40";

// ==========================================
// HELPERS
// ==========================================

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
      season:
        typeof item.season === "string"
          ? item.season
          : "",
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
      typeof item.homeTeamId === "string" &&
      typeof item.awayTeamId === "string" &&
      typeof item.homeTeamName === "string" &&
      typeof item.awayTeamName === "string" &&
      typeof item.matchDay === "number" &&
      typeof item.isPlayed === "boolean",
  );

  if (!valid) {
    throw new Error(
      "The fixtures response contains invalid records.",
    );
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

function isCompleted(fixture: Fixture): boolean {
  return (
    fixture.isPlayed &&
    fixture.homeScore !== null &&
    fixture.awayScore !== null
  );
}

// ==========================================
// CLUB CRESTS
// ==========================================

const backendBase = (
  process.env.NEXT_PUBLIC_FOOTBALLSIM_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5295"
).replace(/\/+$/, "");

function resolveLogoUrl(
  value: string | null,
): string | null {
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${backendBase}${value}`;
  }

  return null;
}

function ClubCrest({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  const url = resolveLogoUrl(logoUrl);

  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.06] text-[#b7f56a] sm:h-14 sm:w-14">
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`${name} crest`}
          className="h-10 w-10 object-contain sm:h-11 sm:w-11"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <Shield size={23} aria-hidden="true" />
      )}
    </span>
  );
}

// ==========================================
// METRIC CARD
// ==========================================

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

      <p className="mt-2 text-xs text-[#8b98aa]">
        {title}
      </p>
    </div>
  );
}

// ==========================================
// FIXTURE CARD
// ==========================================

function FixtureCard({
  fixture,
  logos,
  busy,
  onSimulate,
}: {
  fixture: Fixture;
  logos: Record<string, string | null>;
  busy: boolean;
  onSimulate: (fixture: Fixture) => void;
}) {
  const completed = isCompleted(fixture);

  const homeWon =
    completed &&
    fixture.homeScore! > fixture.awayScore!;

  const awayWon =
    completed &&
    fixture.awayScore! > fixture.homeScore!;

  return (
    <article
      className={`${panel} overflow-hidden transition-colors hover:border-[#b7f56a]/20`}
    >
      {/* TOP BAR */}

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

      {/* TEAMS AND SCORE */}

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-7 sm:gap-6 sm:px-6">
        <div className="flex min-w-0 flex-col items-center gap-3 text-center">
          <ClubCrest
            logoUrl={logos[fixture.homeTeamId] ?? null}
            name={fixture.homeTeamName}
          />

          <span
            className={`text-xs font-semibold leading-5 sm:text-sm ${
              homeWon
                ? "text-white"
                : "text-[#c0c9d3]"
            }`}
          >
            {fixture.homeTeamName}
          </span>

          <span className="text-[10px] text-[#758294]">
            Home
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          {completed ? (
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl font-bold tabular-nums sm:text-3xl ${
                  homeWon
                    ? "text-[#b7f56a]"
                    : "text-white"
                }`}
              >
                {fixture.homeScore}
              </span>

              <span className="text-lg text-[#647184]">
                :
              </span>

              <span
                className={`text-2xl font-bold tabular-nums sm:text-3xl ${
                  awayWon
                    ? "text-[#b7f56a]"
                    : "text-white"
                }`}
              >
                {fixture.awayScore}
              </span>
            </div>
          ) : (
            <span className="text-xl font-semibold text-[#7e8b9a]">
              VS
            </span>
          )}

          <span className="text-[10px] uppercase tracking-widest text-[#788596]">
            {completed ? "FT" : "Fixture"}
          </span>
        </div>

        <div className="flex min-w-0 flex-col items-center gap-3 text-center">
          <ClubCrest
            logoUrl={logos[fixture.awayTeamId] ?? null}
            name={fixture.awayTeamName}
          />

          <span
            className={`text-xs font-semibold leading-5 sm:text-sm ${
              awayWon
                ? "text-white"
                : "text-[#c0c9d3]"
            }`}
          >
            {fixture.awayTeamName}
          </span>

          <span className="text-[10px] text-[#758294]">
            Away
          </span>
        </div>
      </div>

      {/* FOOTER */}

      <div className="border-t border-white/[0.06] bg-white/[0.015] px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] text-[#788596]">
            Matchday {fixture.matchDay}
          </span>

          {completed ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#b7f56a]">
              <CheckCircle2 size={14} />
              Completed
            </span>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => onSimulate(fixture)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#b7f56a] px-3 py-2 text-[11px] font-bold text-[#101319] transition hover:bg-[#d0ff94] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <Loader2
                  size={13}
                  className="animate-spin"
                />
              ) : (
                <Play size={13} fill="currentColor" />
              )}

              Simulate Match
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ==========================================
// CONFIRMATION MODAL
// ==========================================

function ConfirmationModal({
  target,
  loading,
  onCancel,
  onConfirm,
}: {
  target: SimulationTarget;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulation-dialog-title"
        aria-describedby="simulation-dialog-description"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141820] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#b7f56a]/10 text-[#b7f56a]">
            <Zap size={23} />
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close confirmation"
            className="rounded-lg p-2 text-[#9ba8b7] hover:bg-white/5 disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <h3
          id="simulation-dialog-title"
          className="mt-5 text-xl font-semibold text-white"
        >
          {target.title}
        </h3>

        <p
          id="simulation-dialog-description"
          className="mt-3 text-sm leading-6 text-[#9ba8b7]"
        >
          {target.description}
        </p>

        <div className="mt-5 rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-4 text-xs leading-5 text-amber-100/80">
          Once a fixture has been simulated, its result
          is saved and cannot be simulated again.
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={secondaryButton}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={primaryButton}
          >
            {loading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Play size={15} fill="currentColor" />
            )}

            {loading ? "Simulating..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function Fixtures({
  initialCompetitionId,
}: Props) {
  const [competitions, setCompetitions] =
    useState<Competition[]>([]);

  const [competitionId, setCompetitionId] =
    useState("");

  const [fixtures, setFixtures] =
    useState<Fixture[]>([]);

  const [logos, setLogos] = useState<
    Record<string, string | null>
  >({});

  const [
    loadingCompetitions,
    setLoadingCompetitions,
  ] = useState(true);

  const [loadingFixtures, setLoadingFixtures] =
    useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] =
    useState<StatusFilter>("all");

  const [matchday, setMatchday] =
    useState<number | "all">("all");

  const [refreshKey, setRefreshKey] =
    useState(0);

  const [simulationTarget, setSimulationTarget] =
    useState<SimulationTarget | null>(null);

  const [simulating, setSimulating] =
    useState(false);

  const [notice, setNotice] =
    useState<Notice | null>(null);

  // Prevent duplicate simulation requests.
  const simulationLock = useRef(false);

  // Track the currently selected competition
  // so stale simulation responses cannot
  // overwrite another competition's fixtures.
  const selectedCompetitionRef = useRef("");

  selectedCompetitionRef.current = competitionId;

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  // ==========================================
  // LOAD COMPETITIONS
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadCompetitions() {
      setLoadingCompetitions(true);

      try {
        const response = await fetch(
          "/api/competitions",
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
              "Unable to load competitions.",
            ),
          );
        }

        const list = parseCompetitions(payload);

        if (controller.signal.aborted) return;

        setCompetitions(list);

        setCompetitionId((previous) => {
          if (
            list.some(
              (item) => item.id === previous,
            )
          ) {
            return previous;
          }

          if (
            initialCompetitionId &&
            list.some(
              (item) =>
                item.id === initialCompetitionId,
            )
          ) {
            return initialCompetitionId;
          }

          return list[0]?.id ?? "";
        });
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load competitions.",
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

  // ==========================================
  // LOAD FIXTURES
  // ==========================================

  useEffect(() => {
    if (!competitionId) {
      setFixtures([]);
      return;
    }

    const controller = new AbortController();

    async function loadFixtures() {
      setLoadingFixtures(true);
      setError("");

      try {
        const response = await fetch(
          `/api/competitions/${encodeURIComponent(
            competitionId,
          )}/fixtures`,
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
              "Unable to load fixtures.",
            ),
          );
        }

        const rows = parseFixtures(payload);

        if (!controller.signal.aborted) {
          setFixtures(rows);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load fixtures.",
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

  // ==========================================
  // LOAD TEAM CRESTS
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadLogos() {
      try {
        const response = await fetch("/api/teams", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (!response.ok) return;

        const payload: unknown =
          await response.json();

        const items = Array.isArray(payload)
          ? payload
          : isRecord(payload) &&
              Array.isArray(payload.data)
            ? payload.data
            : [];

        const next: Record<
          string,
          string | null
        > = {};

        for (const item of items) {
          if (
            isRecord(item) &&
            typeof item.id === "string"
          ) {
            next[item.id] =
              typeof item.logoUrl === "string"
                ? item.logoUrl
                : null;
          }
        }

        if (!controller.signal.aborted) {
          setLogos(next);
        }
      } catch {
        // The shield fallback remains available.
      }
    }

    void loadLogos();

    return () => controller.abort();
  }, [refreshKey]);

  // ==========================================
  // SELECTED COMPETITION
  // ==========================================

  const selectedCompetition = competitions.find(
    (item) => item.id === competitionId,
  );

  // ==========================================
  // MATCHDAY DATA
  // ==========================================

  const matchdays = useMemo(
    () =>
      [
        ...new Set(
          fixtures.map((item) => item.matchDay),
        ),
      ].sort((a, b) => a - b),
    [fixtures],
  );

  const completed = useMemo(
    () => fixtures.filter(isCompleted),
    [fixtures],
  );

  const remaining =
    fixtures.length - completed.length;

  const totalGoals = completed.reduce(
    (sum, item) =>
      sum +
      (item.homeScore ?? 0) +
      (item.awayScore ?? 0),
    0,
  );

  // ==========================================
  // SEARCH AND FILTER
  // ==========================================

  const visibleFixtures = useMemo(() => {
    const query = search.trim().toLowerCase();

    return fixtures
      .filter((item) => {
        if (
          matchday !== "all" &&
          item.matchDay !== matchday
        ) {
          return false;
        }

        const played = isCompleted(item);

        if (status === "played" && !played) {
          return false;
        }

        if (status === "scheduled" && played) {
          return false;
        }

        return (
          item.homeTeamName
            .toLowerCase()
            .includes(query) ||
          item.awayTeamName
            .toLowerCase()
            .includes(query)
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
      const group =
        groups.get(fixture.matchDay) ?? [];

      group.push(fixture);

      groups.set(fixture.matchDay, group);
    }

    return [...groups.entries()];
  }, [visibleFixtures]);

  // ==========================================
  // MATCHDAY NAVIGATION
  // ==========================================

  function moveMatchday(direction: -1 | 1) {
    if (!matchdays.length) return;

    if (matchday === "all") {
      setMatchday(
        direction === 1
          ? matchdays[0]
          : matchdays[matchdays.length - 1],
      );

      return;
    }

    const index = matchdays.indexOf(matchday);
    const next = index + direction;

    if (
      next >= 0 &&
      next < matchdays.length
    ) {
      setMatchday(matchdays[next]);
    }
  }

  // ==========================================
  // SIMULATE SINGLE MATCH
  // ==========================================

  function requestMatchSimulation(
    fixture: Fixture,
  ) {
    if (simulating || isCompleted(fixture)) {
      return;
    }

    setSimulationTarget({
      request: {
        mode: "match",
        matchId: fixture.id,
      },
      title: "Simulate this match?",
      description:
        `${fixture.homeTeamName} vs ` +
        `${fixture.awayTeamName}. ` +
        "FootballSim will generate a result " +
        "and update the league standings.",
    });
  }

  // ==========================================
  // SIMULATE MATCHDAY
  // ==========================================

  function requestMatchdaySimulation(
    day: number,
  ) {
    if (simulating) return;

    const pending = fixtures.filter(
      (fixture) =>
        fixture.matchDay === day &&
        !fixture.isPlayed,
    );

    if (!pending.length) return;

    setSimulationTarget({
      request: {
        mode: "matchday",
        matchday: day,
      },
      title: `Simulate Matchday ${day}?`,
      description:
        `This will simulate ${pending.length} ` +
        `remaining fixture${
          pending.length === 1 ? "" : "s"
        } in Matchday ${day}. ` +
        "Completed matches will not be replayed.",
    });
  }

  // ==========================================
  // SIMULATE ALL
  // ==========================================

  function requestAllSimulation() {
    if (simulating || remaining === 0) {
      return;
    }

    setSimulationTarget({
      request: {
        mode: "all",
      },
      title: "Simulate all remaining matches?",
      description:
        `This will simulate all ${remaining} ` +
        "currently scheduled, unplayed fixtures. " +
        "Clubs added later can still receive new fixtures.",
    });
  }

  // ==========================================
  // EXECUTE SIMULATION
  // ==========================================

  async function confirmSimulation() {
    if (
      !simulationTarget ||
      !competitionId ||
      simulationLock.current
    ) {
      return;
    }

    simulationLock.current = true;
    setSimulating(true);
    setNotice(null);

    const target = simulationTarget;
    const targetCompetitionId = competitionId;

    try {
      const response = await fetch(
        `/api/competitions/${encodeURIComponent(
          targetCompetitionId,
        )}/simulate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify(target.request),
        },
      );

      const payload: unknown = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            "Unable to simulate matches.",
          ),
        );
      }

      if (
        !isRecord(payload) ||
        !Array.isArray(payload.matches)
      ) {
        throw new Error(
          "The simulation response was invalid.",
        );
      }

      const result =
        payload as SimulationResponse;

      const simulatedMatches = parseFixtures(
        result.matches,
      );

      // The user may have changed competition
      // while the request was running.
      if (
        selectedCompetitionRef.current !==
        targetCompetitionId
      ) {
        return;
      }

      // Update the visible results immediately.
      const updates = new Map(
        simulatedMatches.map(
          (match) => [match.id, match],
        ),
      );

      setFixtures((previous) =>
        previous.map(
          (fixture) =>
            updates.get(fixture.id) ?? fixture,
        ),
      );

      const count = simulatedMatches.length;

      setNotice({
        type: "success",
        message:
          count > 0
            ? `${count} match${
                count === 1 ? "" : "es"
              } simulated successfully. ` +
              "Results and standings have been updated."
            : "No remaining fixtures to simulate.",
      });

      setSimulationTarget(null);

      // Fetch the authoritative fixture records
      // again after the successful simulation.
      refresh();
    } catch (err) {
      if (
        selectedCompetitionRef.current !==
        targetCompetitionId
      ) {
        return;
      }

      setNotice({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Simulation failed.",
      });

      setSimulationTarget(null);
    } finally {
      simulationLock.current = false;
      setSimulating(false);
    }
  }

  // ==========================================
  // MAIN INTERFACE
  // ==========================================

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
            Match{" "}
            <span className="text-[#b7f56a]">
              Fixtures
            </span>
          </h1>

          <p className="mt-3 text-sm text-[#8b98aa]">
            Explore fixtures, simulate matches,
            and follow your competition results.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={
            loadingFixtures ||
            loadingCompetitions ||
            simulating
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#101319] px-5 text-xs font-semibold text-[#b7f56a] transition hover:bg-[#172019] disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              loadingFixtures ||
              loadingCompetitions
                ? "animate-spin"
                : ""
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
            {selectedCompetition?.name ??
              "Select a competition"}
          </h2>

          <p className="mt-3 max-w-xl text-xs leading-6 text-[#9baa9f]">
            Manage every matchday, simulate fixtures
            and watch your league table evolve.
            New clubs can join while your competition
            is in progress.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-lg border border-[#b7f56a]/20 bg-[#b7f56a]/10 px-3 py-2 text-xs font-semibold text-[#b7f56a]">
              {completed.length} Played
            </span>

            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[#c0c9d3]">
              {remaining} Remaining
            </span>
          </div>
        </div>
      </div>

      {/* COMPETITION SELECTOR */}

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
          disabled={
            loadingCompetitions ||
            simulating ||
            !competitions.length
          }
          onChange={(event) => {
            setCompetitionId(event.target.value);
            setMatchday("all");
            setSearch("");
            setStatus("all");
            setNotice(null);
            setSimulationTarget(null);
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
            <option
              key={competition.id}
              value={competition.id}
            >
              {competition.name}
            </option>
          ))}
        </select>
      </div>

      {/* NOTIFICATIONS */}

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${
            notice.type === "success"
              ? "border-[#b7f56a]/20 bg-[#b7f56a]/[0.06] text-[#b7f56a]"
              : "border-red-400/20 bg-red-400/[0.06] text-red-300"
          }`}
        >
          <div className="flex items-start gap-3">
            {notice.type === "success" ? (
              <CheckCircle2
                size={18}
                className="shrink-0"
              />
            ) : (
              <AlertCircle
                size={18}
                className="shrink-0"
              />
            )}

            <p className="text-xs leading-6">
              {notice.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

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

        <Metric
          title="Remaining fixtures"
          value={remaining}
          icon={Clock3}
        />

        <Metric
          title="Goals scored"
          value={totalGoals}
          icon={Activity}
        />
      </div>

      {/* SIMULATION CONTROL CENTER */}

      <div className={`${panel} overflow-hidden`}>
        <div className="border-b border-white/[0.06] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b7f56a]/10 text-[#b7f56a]">
              <Zap size={20} />
            </div>

            <div>
              <h3 className="text-base font-semibold">
                Simulation Control Center
              </h3>

              <p className="mt-1 text-xs text-[#8b98aa]">
                Control how your competition progresses.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          {/* MATCHDAY SIMULATION */}

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-[#b7f56a]">
              <CalendarDays size={17} />

              <h4 className="text-sm font-semibold">
                Simulate Matchday
              </h4>
            </div>

            <p className="mt-3 text-xs leading-6 text-[#8b98aa]">
              Play all remaining fixtures in a
              selected matchday.
            </p>

            <select
              value={matchday}
              disabled={
                simulating ||
                loadingFixtures ||
                !matchdays.length
              }
              onChange={(event) =>
                setMatchday(
                  event.target.value === "all"
                    ? "all"
                    : Number(event.target.value),
                )
              }
              className="mt-5 h-11 w-full rounded-xl border border-white/10 bg-[#0b0e12] px-4 text-xs text-white"
            >
              <option value="all">
                Select a matchday
              </option>

              {matchdays.map((day) => (
                <option key={day} value={day}>
                  Matchday {day}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={
                simulating ||
                loadingFixtures ||
                matchday === "all" ||
                !fixtures.some(
                  (fixture) =>
                    fixture.matchDay === matchday &&
                    !fixture.isPlayed,
                )
              }
              onClick={() => {
                if (matchday !== "all") {
                  requestMatchdaySimulation(matchday);
                }
              }}
              className={`${primaryButton} mt-4 w-full`}
            >
              <Play size={15} fill="currentColor" />
              Simulate Matchday
            </button>
          </div>

          {/* SIMULATE ALL */}

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-[#b7f56a]">
              <Trophy size={17} />

              <h4 className="text-sm font-semibold">
                Simulate All
              </h4>
            </div>

            <p className="mt-3 text-xs leading-6 text-[#8b98aa]">
              Simulate every currently scheduled,
              unplayed match in this competition.
            </p>

            <div className="mt-5 flex h-11 items-center rounded-xl border border-white/10 bg-[#0b0e12] px-4 text-xs text-[#9ba8b7]">
              {remaining} remaining fixtures
            </div>

            <button
              type="button"
              disabled={
                simulating ||
                loadingFixtures ||
                remaining === 0
              }
              onClick={requestAllSimulation}
              className={`${secondaryButton} mt-4 w-full`}
            >
              <Zap size={15} />
              Simulate All Remaining
            </button>
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-5 py-4">
          <p className="text-[11px] leading-5 text-[#788596]">
            To simulate a single match, use the
            Simulate Match button on its fixture card.
            Completed matches cannot be replayed.
          </p>
        </div>
      </div>

      {/* MATCHDAY CONTROLS */}

      <div className={`${panel} p-5`}>
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h3 className="text-lg font-semibold">
              Matchday schedule
            </h3>

            <p className="mt-1 text-xs text-[#8b98aa]">
              Browse matchdays, scheduled fixtures
              and completed results.
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
              <option value="all">
                All matchdays
              </option>

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
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search Arsenal, Real Madrid..."
              aria-label="Search fixtures by team"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0b0e12] pl-10 pr-4 text-xs text-white outline-none focus:border-[#b7f56a]/40"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as StatusFilter,
              )
            }
            aria-label="Filter match status"
            className="h-11 rounded-xl border border-white/10 bg-[#0b0e12] px-4 text-xs text-white"
          >
            <option value="all">
              All matches
            </option>

            <option value="played">
              Completed
            </option>

            <option value="scheduled">
              Scheduled
            </option>
          </select>
        </div>
      </div>

      {/* FIXTURE CONTENT */}

      {error ? (
        <div
          role="alert"
          className={`${panel} px-6 py-14 text-center`}
        >
          <AlertCircle
            size={30}
            className="mx-auto text-red-300"
          />

          <h3 className="mt-4 font-semibold">
            Unable to load fixtures
          </h3>

          <p className="mt-2 text-sm text-[#8b98aa]">
            {error}
          </p>

          <button
            type="button"
            onClick={refresh}
            className={`${primaryButton} mt-5`}
          >
            Try again
          </button>
        </div>
      ) : loadingFixtures || loadingCompetitions ? (
        <div
          role="status"
          className="grid gap-4 md:grid-cols-2"
        >
          {Array.from(
            { length: 6 },
            (_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-2xl border border-white/[0.08] bg-[#101319]"
              />
            ),
          )}
        </div>
      ) : groupedFixtures.length ? (
        <div className="space-y-8">
          {groupedFixtures.map(([day, matches]) => {
            const pendingCount = fixtures.filter(
              (fixture) =>
                fixture.matchDay === day &&
                !fixture.isPlayed,
            ).length;

            return (
              <div key={day}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#b7f56a]">
                      Competition schedule
                    </p>

                    <h3 className="mt-2 text-xl font-semibold">
                      Matchday {day}
                    </h3>

                    <p className="mt-1 text-xs text-[#8b98aa]">
                      {matches.length} displayed matches
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {pendingCount > 0 ? (
                      <button
                        type="button"
                        disabled={simulating}
                        onClick={() =>
                          requestMatchdaySimulation(day)
                        }
                        className={primaryButton}
                      >
                        <Play
                          size={14}
                          fill="currentColor"
                        />
                        Play Matchday
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#b7f56a]/20 bg-[#b7f56a]/10 px-3 py-2 text-xs text-[#b7f56a]">
                        <CheckCircle2 size={14} />
                        Completed
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {matches.map((fixture) => (
                    <FixtureCard
                      key={fixture.id}
                      fixture={fixture}
                      logos={logos}
                      busy={simulating}
                      onSimulate={
                        requestMatchSimulation
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={`${panel} px-6 py-14 text-center`}
        >
          <CalendarDays
            size={32}
            className="mx-auto text-[#b7f56a]"
          />

          <h3 className="mt-4 font-semibold">
            {fixtures.length
              ? "No matching fixtures"
              : "No fixtures available"}
          </h3>

          <p className="mt-2 text-xs text-[#8b98aa]">
            {fixtures.length
              ? "Try changing your search or filters."
              : "Register at least two clubs to generate your first fixture."}
          </p>
        </div>
      )}

      {/* FOOTER */}

      {!loadingFixtures && !error && (
        <p className="pb-4 text-center text-xs text-[#8290a2]">
          Showing {visibleFixtures.length} of{" "}
          {fixtures.length} matches
        </p>
      )}

      {/* CONFIRMATION MODAL */}

      {simulationTarget && (
        <ConfirmationModal
          target={simulationTarget}
          loading={simulating}
          onCancel={() => {
            if (!simulating) {
              setSimulationTarget(null);
            }
          }}
          onConfirm={() => {
            void confirmSimulation();
          }}
        />
      )}
    </section>
  );
}
