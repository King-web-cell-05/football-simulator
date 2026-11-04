
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trophy,
  X,
} from "lucide-react";

type Competition = {
  id: string;
  name: string;
};

type Match = {
  id: string;
  competitionId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  isPlayed: boolean;
  matchDay: number;
  kickoffUtc: string | null;
};

type Filter = "all" | "completed" | "scheduled";

type Props = {
  initialCompetitionId?: string | null;
};

const panel =
  "rounded-2xl border border-white/[0.08] bg-[#101319]";

const field =
  "h-11 rounded-xl border border-white/10 bg-[#0b0e12] px-4 text-sm text-white outline-none focus:border-[#b7f56a]/50";

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function messageFrom(
  value: unknown,
  fallback: string
): string {
  return isRecord(value) &&
    typeof value.message === "string"
    ? value.message
    : fallback;
}

function isCompleted(match: Match) {
  return (
    match.isPlayed &&
    match.homeScore !== null &&
    match.awayScore !== null
  );
}

function parseCompetitions(value: unknown): Competition[] {
  if (!Array.isArray(value)) {
    throw new Error("Invalid competitions response.");
  }

  if (
    !value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string"
    )
  ) {
    throw new Error("Invalid competition records.");
  }

  return value as Competition[];
}

function parseMatches(value: unknown): Match[] {
  if (!Array.isArray(value)) {
    throw new Error("Invalid matches response.");
  }

  if (
    !value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.homeTeamName === "string" &&
        typeof item.awayTeamName === "string" &&
        typeof item.matchDay === "number" &&
        typeof item.isPlayed === "boolean" &&
        (item.homeScore === null ||
          typeof item.homeScore === "number") &&
        (item.awayScore === null ||
          typeof item.awayScore === "number")
    )
  ) {
    throw new Error("Invalid match records.");
  }

  return value as Match[];
}

function ScoreDisplay({ match }: { match: Match }) {
  if (!isCompleted(match)) {
    return (
      <span className="text-xl font-semibold text-[#8591a2]">
        VS
      </span>
    );
  }

  const homeWins = match.homeScore! > match.awayScore!;
  const awayWins = match.awayScore! > match.homeScore!;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span
        className={`text-2xl font-bold tabular-nums ${
          homeWins ? "text-[#b7f56a]" : "text-white"
        }`}
      >
        {match.homeScore}
      </span>

      <span className="text-[#687487]">:</span>

      <span
        className={`text-2xl font-bold tabular-nums ${
          awayWins ? "text-[#b7f56a]" : "text-white"
        }`}
      >
        {match.awayScore}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Trophy;
}) {
  return (
    <div className={`${panel} p-5`}>
      <Icon size={20} className="text-[#b7f56a]" />
      <p className="mt-4 text-3xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="mt-2 text-xs text-[#8b98aa]">
        {label}
      </p>
    </div>
  );
}

export default function Results({
  initialCompetitionId,
}: Props) {
  const [competitions, setCompetitions] = useState<
    Competition[]
  >([]);
  const [competitionId, setCompetitionId] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);

  const [loadingCompetitions, setLoadingCompetitions] =
    useState(true);
  const [loadingMatches, setLoadingMatches] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [matchday, setMatchday] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const [editing, setEditing] = useState<Match | null>(null);
  const [homeInput, setHomeInput] = useState("");
  const [awayInput, setAwayInput] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCompetitions() {
      setLoadingCompetitions(true);
      setError("");

      try {
        const response = await fetch("/api/competitions", {
          cache: "no-store",
          signal: controller.signal,
        });

        const payload: unknown = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            messageFrom(
              payload,
              "Unable to load competitions."
            )
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
            list.some((c) => c.id === initialCompetitionId)
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
            : "Unable to load competitions."
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
      setMatches([]);
      return;
    }

    const controller = new AbortController();

    async function loadMatches() {
      setLoadingMatches(true);
      setError("");
      setMatches([]);

      try {
        const response = await fetch(
          `/api/competitions/${encodeURIComponent(
            competitionId
          )}/fixtures`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const payload: unknown = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            messageFrom(
              payload,
              "Unable to retrieve matches."
            )
          );
        }

        const data = parseMatches(payload);

        if (!controller.signal.aborted) {
          setMatches(data);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load results."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMatches(false);
        }
      }
    }

    void loadMatches();

    return () => controller.abort();
  }, [competitionId, refreshKey]);

  const selectedCompetition = competitions.find(
    (item) => item.id === competitionId
  );

  const matchdays = useMemo(
    () =>
      [...new Set(matches.map((m) => m.matchDay))].sort(
        (a, b) => a - b
      ),
    [matches]
  );

  const completedMatches = matches.filter(isCompleted);
  const scheduledMatches =
    matches.length - completedMatches.length;

  const totalGoals = completedMatches.reduce(
    (sum, match) =>
      sum +
      (match.homeScore ?? 0) +
      (match.awayScore ?? 0),
    0
  );

  const visibleMatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return matches
      .filter((match) => {
        if (
          matchday !== "all" &&
          match.matchDay !== Number(matchday)
        ) {
          return false;
        }

        const completed = isCompleted(match);

        if (filter === "completed" && !completed) {
          return false;
        }

        if (filter === "scheduled" && completed) {
          return false;
        }

        return (
          match.homeTeamName.toLowerCase().includes(query) ||
          match.awayTeamName.toLowerCase().includes(query)
        );
      })
      .sort(
        (a, b) =>
          a.matchDay - b.matchDay ||
          a.homeTeamName.localeCompare(b.homeTeamName)
      );
  }, [matches, matchday, filter, search]);

  const groupedMatches = useMemo(() => {
    const groups = new Map<number, Match[]>();

    for (const match of visibleMatches) {
      const existing = groups.get(match.matchDay) ?? [];
      existing.push(match);
      groups.set(match.matchDay, existing);
    }

    return [...groups.entries()];
  }, [visibleMatches]);

  const homeScore = Number(homeInput);
  const awayScore = Number(awayInput);

  const scoresValid =
    homeInput.trim() !== "" &&
    awayInput.trim() !== "" &&
    /^\d+$/.test(homeInput.trim()) &&
    /^\d+$/.test(awayInput.trim()) &&
    Number.isSafeInteger(homeScore) &&
    Number.isSafeInteger(awayScore) &&
    homeScore <= 99 &&
    awayScore <= 99;

  const unchanged =
    editing !== null &&
    isCompleted(editing) &&
    editing.homeScore === homeScore &&
    editing.awayScore === awayScore;

  function openEditor(match: Match) {
    setEditing(match);
    setHomeInput(
      match.homeScore === null
        ? ""
        : String(match.homeScore)
    );
    setAwayInput(
      match.awayScore === null
        ? ""
        : String(match.awayScore)
    );
    setConfirming(false);
    setSaveError("");
    setSuccess("");
  }

  function closeEditor() {
    if (saving) return;

    setEditing(null);
    setConfirming(false);
    setSaveError("");
  }

  function requestConfirmation() {
    if (!scoresValid || unchanged) return;

    setSaveError("");
    setConfirming(true);
  }

  async function saveResult() {
    if (
      !editing ||
      !confirming ||
      !scoresValid ||
      unchanged ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const response = await fetch(
        `/api/matches/${encodeURIComponent(
          editing.id
        )}/result`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            homeScore,
            awayScore,
          }),
        }
      );

      const payload: unknown = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          messageFrom(
            payload,
            "Unable to save this match result."
          )
        );
      }

      setEditing(null);
      setConfirming(false);

      setSuccess(
        `${editing.homeTeamName} ${homeScore}–${awayScore} ${editing.awayTeamName} saved successfully.`
      );

      setRefreshKey((current) => current + 1);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Unable to save result."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6 text-white">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b7f56a]">
            <Trophy size={15} />
            FootballSim / Match Center
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Match <span className="text-[#b7f56a]">Results</span>
          </h1>

          <p className="mt-3 text-sm text-[#8b98aa]">
            Review match scores, record new results and
            manage completed fixtures.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSuccess("");
            setRefreshKey((value) => value + 1);
          }}
          disabled={loadingMatches || loadingCompetitions}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#101319] px-5 text-xs font-semibold text-[#b7f56a] disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              loadingMatches || loadingCompetitions
                ? "animate-spin"
                : ""
            }
          />
          Refresh results
        </button>
      </div>

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-[#b7f56a]/20 bg-gradient-to-br from-[#17271a] via-[#101b16] to-[#101319] p-7 sm:p-8">
        <Trophy
          size={140}
          className="pointer-events-none absolute -right-4 -top-6 text-[#b7f56a]/[0.07]"
        />

        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#b7f56a]">
            Competition results center
          </p>

          <h2 className="mt-3 text-2xl font-semibold">
            {selectedCompetition?.name ??
              "Select a competition"}
          </h2>

          <p className="mt-3 max-w-xl text-xs leading-6 text-[#a0afa3]">
            Manage results from your tournament database.
            Score changes are saved only after confirmation.
          </p>
        </div>
      </div>

      {/* COMPETITION SELECTOR */}
      <div className={`${panel} p-5`}>
        <label
          htmlFor="results-competition"
          className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-[#8b98aa]"
        >
          Select competition
        </label>

        <select
          id="results-competition"
          value={competitionId}
          disabled={loadingCompetitions || !competitions.length}
          onChange={(event) => {
            setCompetitionId(event.target.value);
            setSearch("");
            setFilter("all");
            setMatchday("all");
            setSuccess("");
          }}
          className={`${field} w-full max-w-lg`}
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
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Total matches"
          value={matches.length}
          icon={CalendarDays}
        />
        <StatCard
          label="Completed"
          value={completedMatches.length}
          icon={CheckCircle2}
        />
        <StatCard
          label="Awaiting results"
          value={scheduledMatches}
          icon={Clock3}
        />
        <StatCard
          label="Goals scored"
          value={totalGoals}
          icon={Activity}
        />
      </div>

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-[#b7f56a]/20 bg-[#b7f56a]/[0.06] p-4 text-sm text-[#b7f56a]"
        >
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* FILTERS */}
      <div className={`${panel} p-5 sm:p-6`}>
        <div className="mb-5">
          <h3 className="text-lg font-semibold">
            Results management
          </h3>
          <p className="mt-1 text-xs text-[#8b98aa]">
            Find a match and select Edit score to change its result.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8290a2]"
            />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search clubs..."
              aria-label="Search matches by club"
              className={`${field} w-full pl-10`}
            />
          </div>

          <select
            value={matchday}
            onChange={(event) =>
              setMatchday(event.target.value)
            }
            aria-label="Filter matchday"
            className={field}
          >
            <option value="all">All matchdays</option>
            {matchdays.map((day) => (
              <option key={day} value={day}>
                Matchday {day}
              </option>
            ))}
          </select>

          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as Filter)
            }
            aria-label="Filter match status"
            className={field}
          >
            <option value="all">All matches</option>
            <option value="completed">Completed</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* MATCHES */}
      {error ? (
        <div
          role="alert"
          className={`${panel} p-12 text-center`}
        >
          <AlertCircle
            size={30}
            className="mx-auto text-red-300"
          />
          <h3 className="mt-4 font-semibold">
            Unable to load results
          </h3>
          <p className="mt-2 text-sm text-[#8b98aa]">
            {error}
          </p>
          <button
            type="button"
            onClick={() =>
              setRefreshKey((value) => value + 1)
            }
            className="mt-5 rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-semibold text-black"
          >
            Try again
          </button>
        </div>
      ) : loadingMatches || loadingCompetitions ? (
        <div
          role="status"
          aria-label="Loading results"
          className="grid gap-4 md:grid-cols-2"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-2xl border border-white/[0.08] bg-[#101319]"
            />
          ))}
        </div>
      ) : groupedMatches.length ? (
        <div className="space-y-8">
          {groupedMatches.map(([day, dayMatches]) => (
            <div key={day}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#b7f56a]">
                    Competition results
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">
                    Matchday {day}
                  </h3>
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-[#9ba8b7]">
                  {dayMatches.length} matches
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {dayMatches.map((match) => (
                  <article
                    key={match.id}
                    className={`${panel} overflow-hidden transition-colors hover:border-[#b7f56a]/20`}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
                      <span className="text-xs text-[#8b98aa]">
                        Matchday {match.matchDay}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${
                          isCompleted(match)
                            ? "border-[#b7f56a]/20 bg-[#b7f56a]/10 text-[#b7f56a]"
                            : "border-white/10 bg-white/[0.04] text-[#a5b0bd]"
                        }`}
                      >
                        {isCompleted(match)
                          ? "Full time"
                          : "Scheduled"}
                      </span>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-7">
                      <div className="flex min-w-0 flex-col items-center gap-3 text-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.06] text-[#b7f56a]">
                          <Shield size={21} />
                        </span>
                        <span className="text-xs font-semibold leading-5 sm:text-sm">
                          {match.homeTeamName}
                        </span>
                        <span className="text-[10px] text-[#758294]">
                          Home
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <ScoreDisplay match={match} />
                        <span className="text-[10px] uppercase tracking-widest text-[#788596]">
                          {isCompleted(match) ? "FT" : "Fixture"}
                        </span>
                      </div>

                      <div className="flex min-w-0 flex-col items-center gap-3 text-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.06] text-[#b7f56a]">
                          <Shield size={21} />
                        </span>
                        <span className="text-xs font-semibold leading-5 sm:text-sm">
                          {match.awayTeamName}
                        </span>
                        <span className="text-[10px] text-[#758294]">
                          Away
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-white/[0.015] px-5 py-3">
                      <span className="text-[10px] text-[#8290a2]">
                        {isCompleted(match)
                          ? "Result recorded"
                          : "Awaiting result"}
                      </span>

                      <button
                        type="button"
                        onClick={() => openEditor(match)}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#b7f56a]/20 bg-[#b7f56a]/[0.06] px-3 py-2 text-xs font-semibold text-[#b7f56a] transition hover:bg-[#b7f56a]/15"
                      >
                        <Pencil size={13} />
                        {isCompleted(match)
                          ? "Edit score"
                          : "Enter score"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${panel} p-12 text-center`}>
          <Trophy
            size={32}
            className="mx-auto text-[#b7f56a]"
          />
          <h3 className="mt-4 font-semibold">
            No matching results
          </h3>
          <p className="mt-2 text-xs text-[#8b98aa]">
            Try another search, matchday or status filter.
          </p>
        </div>
      )}

      {!loadingMatches && !error && (
        <p className="pb-4 text-center text-xs text-[#8290a2]">
          Showing {visibleMatches.length} of{" "}
          {matches.length} matches
        </p>
      )}

      {/* SCORE EDITOR AND CONFIRMATION */}
      {editing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeEditor();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="result-dialog-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#101319] p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#b7f56a]">
                  FootballSim / Score Management
                </p>

                <h3
                  id="result-dialog-title"
                  className="mt-2 text-xl font-semibold"
                >
                  {confirming
                    ? "Confirm score change"
                    : isCompleted(editing)
                      ? "Edit match result"
                      : "Record match result"}
                </h3>

                <p className="mt-2 text-xs text-[#8b98aa]">
                  Matchday {editing.matchDay}
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeEditor}
                aria-label="Close editor"
                className="rounded-lg border border-white/10 p-2 text-[#9ba8b7] disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>

            {!confirming ? (
              <>
                <div className="mt-7 grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="home-result-score"
                      className="mb-3 block text-xs font-medium text-white"
                    >
                      {editing.homeTeamName}
                    </label>

                    <input
                      id="home-result-score"
                      type="number"
                      min={0}
                      max={99}
                      step={1}
                      inputMode="numeric"
                      value={homeInput}
                      onChange={(event) =>
                        setHomeInput(event.target.value)
                      }
                      className={`${field} w-full text-center text-xl font-bold`}
                    />
                    <p className="mt-2 text-[10px] text-[#8b98aa]">
                      Home score
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="away-result-score"
                      className="mb-3 block text-xs font-medium text-white"
                    >
                      {editing.awayTeamName}
                    </label>

                    <input
                      id="away-result-score"
                      type="number"
                      min={0}
                      max={99}
                      step={1}
                      inputMode="numeric"
                      value={awayInput}
                      onChange={(event) =>
                        setAwayInput(event.target.value)
                      }
                      className={`${field} w-full text-center text-xl font-bold`}
                    />
                    <p className="mt-2 text-[10px] text-[#8b98aa]">
                      Away score
                    </p>
                  </div>
                </div>

                {isCompleted(editing) && (
                  <p className="mt-5 rounded-xl border border-white/[0.07] bg-[#0b0e12] p-4 text-xs text-[#9ba8b7]">
                    Current result:{" "}
                    <strong className="text-white">
                      {editing.homeScore}–{editing.awayScore}
                    </strong>
                  </p>
                )}

                <p className="mt-4 text-xs leading-5 text-[#8b98aa]">
                  Enter whole-number scores from 0 to 99.
                  You will review the change before saving.
                </p>

                <div className="mt-7 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="rounded-xl border border-white/10 px-5 py-3 text-xs font-semibold text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={!scoresValid || unchanged}
                    onClick={requestConfirmation}
                    className="rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Review result
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#0b0e12] p-5">
                  <p className="text-center text-xs text-[#8b98aa]">
                    {editing.homeTeamName} vs{" "}
                    {editing.awayTeamName}
                  </p>

                  <div className="mt-5 text-center">
                    <p className="text-xs text-[#8b98aa]">
                      Previous result
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {isCompleted(editing)
                        ? `${editing.homeScore} – ${editing.awayScore}`
                        : "Not played"}
                    </p>
                  </div>

                  <div className="mt-5 text-center">
                    <p className="text-xs text-[#8b98aa]">
                      New result
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#b7f56a]">
                      {homeScore} – {awayScore}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-4">
                  <AlertCircle
                    size={18}
                    className="shrink-0 text-amber-300"
                  />
                  <p className="text-xs leading-5 text-[#c4bca7]">
                    Saving will update the match in your
                    database. League standings may change
                    because of the new result.
                  </p>
                </div>

                {saveError && (
                  <p
                    role="alert"
                    className="mt-4 text-xs text-red-300"
                  >
                    {saveError}
                  </p>
                )}

                <div className="mt-7 flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setConfirming(false);
                      setSaveError("");
                    }}
                    className="rounded-xl border border-white/10 px-5 py-3 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void saveResult()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-bold text-black disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={15} />
                    )}
                    {saving
                      ? "Saving..."
                      : "Confirm and save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
