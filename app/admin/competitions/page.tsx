
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Shield,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

import { ClubCrest } from "@/components/shared/club-crest";

// ==========================================
// TYPES
// ==========================================

type Competition = {
  id: string;
  name: string;
  season: string | null;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  createdDate: string;
  teamCount: number;
  matchCount: number;
  playedMatchCount: number;
};

type CompetitionResponse = {
  items: Competition[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type CompetitionTeam = {
  teamId: string;
  teamName: string;
  groupName: string;
};

type CompetitionDetails = Competition & {
  teams: CompetitionTeam[];
  pendingMatchCount: number;
  knockoutTieCount: number;
};

type CompetitionStats = {
  totalCompetitions: number;
  totalCreators: number;
  totalParticipations: number;
  totalMatches: number;
  playedMatches: number;
  pendingMatches: number;
};

const emptyStats: CompetitionStats = {
  totalCompetitions: 0,
  totalCreators: 0,
  totalParticipations: 0,
  totalMatches: 0,
  playedMatches: 0,
  pendingMatches: 0,
};

const PAGE_SIZE = 10;

const panel =
  "rounded-2xl border border-white/[0.08] bg-[#101319]";

// ==========================================
// HELPERS
// ==========================================

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getProgress(c: Competition) {
  if (c.matchCount <= 0) return 0;

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (c.playedMatchCount / c.matchCount) * 100
      )
    )
  );
}

function getStatus(c: Competition) {
  if (c.matchCount === 0) {
    return "Not started";
  }

  if (c.playedMatchCount >= c.matchCount) {
    return "League phase complete";
  }

  return "In progress";
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-[#b7f56a] transition-all duration-500"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
        }}
      />
    </div>
  );
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function errorMessage(
  payload: unknown,
  fallback: string
) {
  if (
    isRecord(payload) &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallback;
}

// ==========================================
// STATISTICS CARD
// ==========================================

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  note: string;
  icon: typeof Trophy;
  loading: boolean;
}) {
  return (
    <div className={`${panel} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[#9ba8b7]">
          {label}
        </p>

        <div className="rounded-xl border border-[#b7f56a]/10 bg-[#b7f56a]/[0.07] p-3 text-[#b7f56a]">
          <Icon size={20} />
        </div>
      </div>

      <div className="mt-6 text-3xl font-semibold tabular-nums text-white">
        {loading ? (
          <Loader2
            size={25}
            className="animate-spin text-[#b7f56a]"
          />
        ) : (
          value.toLocaleString("en-NG")
        )}
      </div>

      <p className="mt-2 text-xs text-[#788596]">
        {note}
      </p>
    </div>
  );
}

// ==========================================
// COMPETITION DETAILS MODAL
// ==========================================

function CompetitionDetailsModal({
  competition,
  onClose,
}: {
  competition: Competition;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<CompetitionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const progress = getProgress(details ?? competition);
  const pending = details?.pendingMatchCount ?? Math.max(
    0,
    competition.matchCount - competition.playedMatchCount
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadDetails() {
      setLoading(true);
      setError("");
      setDetails(null);

      try {
        const response = await fetch(
          `/api/admin/competitions/${encodeURIComponent(
            competition.id
          )}`,
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
            errorMessage(
              payload,
              "Unable to load competition details."
            )
          );
        }

        if (
          !isRecord(payload) ||
          payload.id !== competition.id ||
          !Array.isArray(payload.teams) ||
          !payload.teams.every(
            (team) =>
              isRecord(team) &&
              typeof team.teamId === "string" &&
              typeof team.teamName === "string"
          )
        ) {
          throw new Error("Invalid competition details response.");
        }

        if (!controller.signal.aborted) {
          setDetails(payload as CompetitionDetails);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load competition details."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadDetails();

    return () => controller.abort();
  }, [competition.id, retry]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="competition-details-title"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#101319] text-white shadow-2xl"
      >
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#101319] px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b7f56a]">
              FootballSim / Competition Details
            </p>

            <h2
              id="competition-details-title"
              className="mt-2 truncate text-xl font-semibold"
            >
              {competition.name}
            </h2>

            <p className="mt-1 text-xs text-[#8b98aa]">
              {competition.season ||
                "Season not specified"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close competition details"
            className="rounded-xl border border-white/10 p-2.5 text-[#9ba8b7] transition hover:bg-white/10"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          {/* OWNER INFORMATION */}
          <div className={`${panel} p-5`}>
            <div className="mb-5 flex items-center gap-3">
              <UserRound
                size={18}
                className="text-[#b7f56a]"
              />

              <h3 className="text-sm font-semibold">
                Competition Ownership
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-[#c0c9d3]">
                <UserRound
                  size={16}
                  className="shrink-0 text-[#8b98aa]"
                />
                {competition.ownerName ||
                  "Unassigned owner"}
              </div>

              <div className="flex items-center gap-3 break-all text-sm text-[#9ba8b7]">
                <Mail
                  size={16}
                  className="shrink-0"
                />
                {competition.ownerEmail ||
                  "No email available"}
              </div>

              <div className="flex items-center gap-3 text-sm text-[#9ba8b7]">
                <CalendarDays
                  size={16}
                  className="shrink-0"
                />
                Created{" "}
                {formatDate(competition.createdDate)}
              </div>
            </div>
          </div>

          {/* MATCH PROGRESS */}
          <div className={`${panel} p-5`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity
                  size={18}
                  className="text-[#b7f56a]"
                />

                <h3 className="text-sm font-semibold">
                  League-Phase Progress
                </h3>
              </div>

              <span className="text-xl font-semibold text-[#b7f56a]">
                {progress}%
              </span>
            </div>

            <div className="mt-5">
              <ProgressBar value={progress} />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                {
                  label: "Total Matches",
                  value: (details?.matchCount ?? competition.matchCount),
                },
                {
                  label: "Played",
                  value: (details?.playedMatchCount ?? competition.playedMatchCount),
                },
                {
                  label: "Pending",
                  value: pending,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/[0.05] bg-[#0b0e12] p-3 text-center"
                >
                  <p className="text-xl font-semibold tabular-nums text-white">
                    {item.value}
                  </p>

                  <p className="mt-2 text-[10px] text-[#8b98aa]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* PARTICIPATING CLUBS */}
          <div className={`${panel} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-5">
              <div className="flex items-center gap-3">
                <Shield
                  size={19}
                  className="text-[#b7f56a]"
                />

                <div>
                  <h3 className="text-sm font-semibold">
                    Participating Clubs
                  </h3>

                  <p className="mt-1 text-xs text-[#8b98aa]">
                    Registered teams and their groups
                  </p>
                </div>
              </div>

              <span className="rounded-lg border border-[#b7f56a]/15 bg-[#b7f56a]/10 px-3 py-1.5 text-xs font-semibold text-[#b7f56a]">
                {details?.teamCount ?? competition.teamCount} Clubs
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {loading ? (
                <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-[#9ba8b7]">
                  <Loader2
                    size={20}
                    className="animate-spin text-[#b7f56a]"
                  />
                  Loading participating teams...
                </div>
              ) : error ? (
                <div className="py-10 text-center">
                  <AlertCircle
                    size={26}
                    className="mx-auto text-red-300"
                  />

                  <p className="mt-4 text-sm text-red-300">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setRetry((current) => current + 1)
                    }
                    className="mt-5 rounded-xl border border-white/10 px-4 py-2 text-xs text-white hover:bg-white/10"
                  >
                    Try again
                  </button>
                </div>
              ) : (details?.teams.length ?? 0) === 0 ? (
                <div className="py-12 text-center">
                  <Shield
                    size={30}
                    className="mx-auto text-[#8b98aa]"
                  />

                  <p className="mt-4 text-sm text-[#9ba8b7]">
                    No teams registered yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {details?.teams.map((club) => (
                    <div
                      key={club.teamId}
                      className="group flex min-w-0 items-center gap-4 rounded-xl border border-white/[0.07] bg-[#0b0e12] p-4 transition hover:border-[#b7f56a]/25 hover:bg-[#141b19]"
                    >
                      <ClubCrest
                        logoUrl={null}
                        name={club.teamName}
                        size="md"
                      />

                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-white">
                          {club.teamName}
                        </h4>

                        {club.groupName && (
                          <p className="mt-1 text-xs text-[#8b98aa]">
                            Group {club.groupName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {details && (
            <div className={`${panel} flex items-center justify-between p-5`}>
              <span className="text-sm text-[#9ba8b7]">Knockout ties</span>
              <span className="font-semibold text-white">{details.knockoutTieCount}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#b7f56a] px-5 py-3 text-sm font-bold text-[#101319] transition hover:bg-[#d0ff94]"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN ADMIN PAGE
// ==========================================

export default function AdminCompetitionsPage() {
  const [competitions, setCompetitions] =
    useState<Competition[]>([]);

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const [selected, setSelected] =
    useState<Competition | null>(null);

  const [stats, setStats] = useState<CompetitionStats>(emptyStats);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadStats() {
      setStatsLoading(true);
      setStatsError("");
      try {
        const response = await fetch("/api/admin/competitions/stats", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(errorMessage(payload, "Unable to load statistics."));
        }
        if (
          !isRecord(payload) ||
          !Object.keys(emptyStats).every(
            (key) => typeof payload[key] === "number"
          )
        ) {
          throw new Error("Invalid competition statistics response.");
        }
        if (!controller.signal.aborted) setStats(payload as CompetitionStats);
      } catch (err) {
        if (!controller.signal.aborted) {
          setStatsError(err instanceof Error ? err.message : "Unable to load statistics.");
        }
      } finally {
        if (!controller.signal.aborted) setStatsLoading(false);
      }
    }
    void loadStats();
    return () => controller.abort();
  }, [refreshKey]);

  // Debounce search input.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  // ==========================================
  // LOAD COMPETITIONS
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });

        if (search) {
          params.set("search", search);
        }

        const response = await fetch(
          `/api/admin/competitions?${params.toString()}`,
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
            errorMessage(
              payload,
              "Unable to load competitions."
            )
          );
        }

        if (
          !isRecord(payload) ||
          !Array.isArray(payload.items)
        ) {
          throw new Error(
            "Invalid competitions response."
          );
        }

        const data =
          payload as CompetitionResponse;

        if (controller.signal.aborted) return;

        setCompetitions(data.items);
        setTotalCount(data.totalCount);
        setTotalPages(
          Math.max(1, data.totalPages)
        );
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load competitions."
        );

        setCompetitions([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [page, search, refreshKey]);

  // ==========================================
  // PLATFORM-WIDE STATISTICS
  // ==========================================

  const metrics = [
    { label: "Competitions", value: stats.totalCompetitions, note: "Across the platform", icon: Trophy },
    { label: "Creators", value: stats.totalCreators, note: "Unique competition owners", icon: UserRound },
    { label: "Team Entries", value: stats.totalParticipations, note: "Across all competitions", icon: Shield },
    { label: "Total Matches", value: stats.totalMatches, note: "League-phase fixtures", icon: Activity },
    { label: "Matches Played", value: stats.playedMatches, note: "Completed fixtures", icon: CheckCircle2 },
    { label: "Pending Matches", value: stats.pendingMatches, note: "Remaining fixtures", icon: Clock3 },
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <section className="mx-auto max-w-[1500px] space-y-7 text-white">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7f56a]">
            <Activity size={15} />
            FootballSim / Administration
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Competition{" "}
            <span className="text-[#b7f56a]">
              Management
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8b98aa]">
            Monitor competitions, participating clubs,
            ownership and match progress across
            the FootballSim platform.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#101319] px-5 text-xs font-semibold text-[#b7f56a] transition hover:bg-[#172019] disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh Data
        </button>
      </div>

      {/* METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
            loading={statsLoading}
          />
        ))}
      </div>

      {statsError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
          <span>{statsError}</span>
          <button type="button" onClick={refresh} className="underline">Retry</button>
        </div>
      )}

      {/* SEARCH */}
      <div className={`${panel} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">
              Find Competitions
            </h2>

            <p className="mt-1 text-xs text-[#8b98aa]">
              Search by competition name, season, creator name or email.
            </p>
          </div>

          <span className="rounded-lg bg-white/[0.04] px-3 py-2 text-xs text-[#9ba8b7]">
            {totalCount} Results
          </span>
        </div>

        <div className="relative mt-5">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#788596]"
          />

          <input
            type="search"
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
            placeholder="Search competitions..."
            aria-label="Search competitions"
            className="h-12 w-full rounded-xl border border-white/10 bg-[#0b0e12] pl-12 pr-4 text-sm text-white outline-none placeholder:text-[#647184] focus:border-[#b7f56a]/40"
          />
        </div>
      </div>

      {/* COMPETITIONS TABLE */}
      <div className={`${panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-5">
          <div>
            <h2 className="text-base font-semibold">
              Platform Competitions
            </h2>

            <p className="mt-1 text-xs text-[#8b98aa]">
              View competitions created by users.
            </p>
          </div>

          <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-[#9ba8b7]">
            Page {page} of {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="border-b border-white/[0.07] bg-white/[0.02]">
              <tr className="text-xs text-[#8b98aa]">
                <th className="px-5 py-4 font-medium">
                  Competition
                </th>
                <th className="px-5 py-4 font-medium">
                  Owner
                </th>
                <th className="px-5 py-4 font-medium">
                  Clubs
                </th>
                <th className="px-5 py-4 font-medium">
                  Match Progress
                </th>
                <th className="px-5 py-4 font-medium">
                  League Phase
                </th>
                <th className="px-5 py-4 font-medium">
                  Created
                </th>
                <th className="px-5 py-4 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-20 text-center"
                  >
                    <Loader2
                      size={26}
                      className="mx-auto animate-spin text-[#b7f56a]"
                    />

                    <p className="mt-4 text-sm text-[#9ba8b7]">
                      Loading competitions...
                    </p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >
                    <AlertCircle
                      size={28}
                      className="mx-auto text-red-300"
                    />

                    <p className="mt-4 text-sm text-red-300">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={refresh}
                      className="mt-5 rounded-xl border border-white/10 px-4 py-2 text-xs text-white"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : competitions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >
                    <Trophy
                      size={30}
                      className="mx-auto text-[#788596]"
                    />

                    <p className="mt-4 text-sm text-[#9ba8b7]">
                      No competitions found.
                    </p>
                  </td>
                </tr>
              ) : (
                competitions.map((competition) => {
                  const progress =
                    getProgress(competition);

                  const status =
                    getStatus(competition);

                  return (
                    <tr
                      key={competition.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      {/* COMPETITION */}
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#b7f56a]/10 text-[#b7f56a]">
                            <Trophy size={20} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">
                              {competition.name}
                            </p>

                            <p className="mt-1 text-xs text-[#8b98aa]">
                              {competition.season ||
                                "Season not specified"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* OWNER */}
                      <td className="px-5 py-5">
                        <p className="text-sm text-[#c0c9d3]">
                          {competition.ownerName ||
                            "Unassigned"}
                        </p>

                        <p className="mt-1 text-xs text-[#788596]">
                          {competition.ownerEmail ||
                            "No email"}
                        </p>
                      </td>

                      {/* CLUB COUNT */}
                      <td className="px-5 py-5">
                        <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white">
                          {competition.teamCount}
                        </span>
                      </td>

                      {/* PROGRESS */}
                      <td className="px-5 py-5">
                        <div className="w-40 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#9ba8b7]">
                              {competition.playedMatchCount}/
                              {competition.matchCount}
                            </span>

                            <span className="font-semibold text-[#b7f56a]">
                              {progress}%
                            </span>
                          </div>

                          <ProgressBar value={progress} />
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                            status ===
                            "League phase complete"
                              ? "bg-[#b7f56a]/10 text-[#b7f56a]"
                              : status === "In progress"
                                ? "bg-amber-400/10 text-amber-300"
                                : "bg-white/[0.05] text-[#9ba8b7]"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* DATE */}
                      <td className="px-5 py-5 text-xs text-[#9ba8b7]">
                        {formatDate(
                          competition.createdDate
                        )}
                      </td>

                      {/* ACTION */}
                      <td className="px-5 py-5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSelected(competition)
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-white transition hover:border-[#b7f56a]/30 hover:text-[#b7f56a]"
                        >
                          View Details
                          <ArrowUpRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] px-5 py-4">
          <p className="text-xs text-[#8b98aa]">
            Showing {competitions.length} of{" "}
            {totalCount} competitions
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1)
                )
              }
              aria-label="Previous page"
              className="rounded-lg border border-white/10 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="px-3 text-xs text-[#9ba8b7]">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >= totalPages || loading
              }
              onClick={() =>
                setPage((current) =>
                  Math.min(totalPages, current + 1)
                )
              }
              aria-label="Next page"
              className="rounded-lg border border-white/10 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* DETAILS MODAL */}
      {selected && (
        <CompetitionDetailsModal
          competition={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
