
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Loader2,
  RefreshCw,
  Shield,
  Trophy,
  Zap,
} from "lucide-react";


// =====================================================
// TYPES
// =====================================================

type Competition = {
  id: string;
  name: string;
  season?: string;
};

type Match = {
  id: string;
  leg: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  isPlayed: boolean;
  wentToExtraTime: boolean;
  homeExtraTimeScore: number | null;
  awayExtraTimeScore: number | null;
  wentToPenalties: boolean;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
};

type Tie = {
  id: string;
  tieNumber: number;
  team1: string;
  team2: string;
  isCompleted: boolean;
  winnerTeamId: string | null;
  winner: string | null;
  matches: Match[];
};

type Champion = {
  champion: {
    teamName: string;
  };
  runnerUp: {
    teamName: string;
  };
  final: {
    homeTeam: string;
    awayTeam: string;
    homeTotalGoals: number;
    awayTotalGoals: number;
    decision: string;
  };
};

type RoundKey =
  | "playoffs"
  | "round-of-16"
  | "quarter-finals"
  | "semi-finals"
  | "final";

// =====================================================
// CONFIGURATION
// =====================================================

const rounds: {
  key: RoundKey;
  name: string;
  expected: number;
}[] = [
  { key: "playoffs", name: "Play-offs", expected: 8 },
  { key: "round-of-16", name: "Round of 16", expected: 8 },
  { key: "quarter-finals", name: "Quarter-finals", expected: 4 },
  { key: "semi-finals", name: "Semi-finals", expected: 2 },
  { key: "final", name: "Final", expected: 1 },
];

const panel =
  "rounded-2xl border border-white/[0.08] bg-[#101319]";

// =====================================================
// API HELPER
// =====================================================

async function readApi<T>(
  url: string,
  method: "GET" | "POST" = "GET"
): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    cache: "no-store",
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Request failed (HTTP ${response.status}).`;

    throw new Error(message);
  }

  return data as T;
}

// =====================================================
// MATCH ROW COMPONENT
// =====================================================

function MatchRow({ match }: { match: Match }) {
  const home =
    match.homeScore === null
      ? "–"
      : match.homeScore + (match.homeExtraTimeScore ?? 0);

  const away =
    match.awayScore === null
      ? "–"
      : match.awayScore + (match.awayExtraTimeScore ?? 0);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0b0e12] px-4 py-3">
      <div className="mb-3 flex items-center justify-between text-[10px] text-[#8492a4]">
        <span>
          {match.leg === 1 ? "First leg" : "Second leg"}
        </span>

        <span
          className={
            match.isPlayed ? "text-[#b7f56a]" : ""
          }
        >
          {match.isPlayed ? "Full time" : "Not played"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
        <span className="min-w-0 flex-1 truncate">
          {match.homeTeam}
        </span>

        <span className="shrink-0 rounded-lg bg-white/[0.06] px-3 py-2 font-semibold tabular-nums">
          {home} : {away}
        </span>

        <span className="min-w-0 flex-1 truncate text-right">
          {match.awayTeam}
        </span>
      </div>

      {match.isPlayed &&
        (match.wentToExtraTime || match.wentToPenalties) && (
          <p className="mt-2 text-center text-[10px] text-[#9eabb9]">
            {match.wentToExtraTime
              ? "After extra time"
              : ""}

            {match.wentToPenalties
              ? ` · Penalties ${match.homePenaltyScore ?? "–"}–${match.awayPenaltyScore ?? "–"}`
              : ""}
          </p>
        )}
    </div>
  );
}

// =====================================================
// MAIN KNOCKOUT STAGE COMPONENT
// =====================================================

export default function KnockoutStage({
  initialCompetitionId,
}: {
  initialCompetitionId?: string | null;
}) {
  // ===================================================
  // STATE
  // ===================================================

  const [competitions, setCompetitions] = useState<
    Competition[]
  >([]);

  const [competitionId, setCompetitionId] = useState(
    initialCompetitionId ?? ""
  );

  const [round, setRound] = useState<RoundKey>("playoffs");

  const [tiesByRound, setTiesByRound] = useState<
    Record<RoundKey, Tie[]>
  >({
    playoffs: [],
    "round-of-16": [],
    "quarter-finals": [],
    "semi-finals": [],
    final: [],
  });

  const [champion, setChampion] = useState<Champion | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // ===================================================
  // LOAD COMPETITIONS
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    readApi<Competition[]>("/api/competitions")
      .then((items) => {
        if (!cancelled) {
          setCompetitions(items);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "Unable to load competitions."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ===================================================
  // INITIAL COMPETITION
  // ===================================================

  useEffect(() => {
    if (initialCompetitionId) {
      setCompetitionId(initialCompetitionId);
    }
  }, [initialCompetitionId]);

  // ===================================================
  // REFRESH KNOCKOUT DATA
  // ===================================================

  const refresh = useCallback(async () => {
    if (!competitionId) return;

    setLoading(true);
    setError("");

    const base = `/api/competitions/${competitionId}/knockout`;

    try {
      const results = await Promise.all(
        rounds.map((r) =>
          readApi<Tie[]>(`${base}/${r.key}`)
        )
      );

      setTiesByRound({
        playoffs: results[0],
        "round-of-16": results[1],
        "quarter-finals": results[2],
        "semi-finals": results[3],
        final: results[4],
      });

      if (
        results[4].length &&
        results[4][0].isCompleted
      ) {
        try {
          setChampion(
            await readApi<Champion>(`${base}/champion`)
          );
        } catch {
          setChampion(null);
        }
      } else {
        setChampion(null);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load knockout fixtures."
      );
    } finally {
      setLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ===================================================
  // ROUND DATA
  // ===================================================

  const selected = rounds.find(
    (r) => r.key === round
  )!;

  const ties = tiesByRound[round];

  const allFirstLegsPlayed =
    ties.length === selected.expected &&
    ties.every((t) =>
      t.matches.some(
        (m) => m.leg === 1 && m.isPlayed
      )
    );

  const firstLegsRemaining = ties.some((t) =>
    t.matches.some(
      (m) => m.leg === 1 && !m.isPlayed
    )
  );

  const secondLegsRemaining =
    round !== "final" &&
    ties.some((t) =>
      t.matches.some(
        (m) => m.leg === 2 && !m.isPlayed
      )
    );

  const complete =
    ties.length === selected.expected &&
    ties.every(
      (t) => t.isCompleted && t.winnerTeamId
    );

  const previous =
    rounds[
      rounds.findIndex((r) => r.key === round) - 1
    ];

  const canDraw =
    ties.length === 0 &&
    (round === "playoffs" ||
      (previous &&
        tiesByRound[previous.key].length ===
          previous.expected &&
        tiesByRound[previous.key].every(
          (t) => t.isCompleted && t.winnerTeamId
        )));

  const progress = useMemo(
    () =>
      rounds.reduce(
        (sum, r) =>
          sum +
          tiesByRound[r.key].filter(
            (t) => t.isCompleted
          ).length,
        0
      ),
    [tiesByRound]
  );

  // ===================================================
  // PERFORM KNOCKOUT ACTION
  // ===================================================

  async function perform(
    action: string,
    label: string
  ) {
    if (!competitionId || busy) return;

    const warning =
      action === "draw"
        ? `Generate the ${selected.name} draw? This saves fixtures to the database.`
        : `${label} for ${selected.name}? This saves match results to the database.`;

    if (!window.confirm(warning)) return;

    setBusy(action);
    setError("");
    setNotice("");

    try {
      await readApi<unknown>(
        `/api/competitions/${competitionId}/knockout/${round}/${action}`,
        "POST"
      );

      setNotice(
        `${label} completed successfully.`
      );

      await refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The operation failed."
      );
    } finally {
      setBusy("");
    }
  }

  // ===================================================
  // MAIN RENDER
  // ===================================================

  return (
    <section className="space-y-6 text-white">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b7f56a]">
            <Trophy size={15} />
            FootballSim / Road to glory
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Knockout{" "}
            <span className="text-[#b7f56a]">
              Stage
            </span>
          </h1>

          <p className="mt-2 text-sm text-[#8b98aa]">
            Manage every draw, leg and qualification
            on the road to the final.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={!competitionId || loading || !!busy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-xs font-semibold text-[#c4d0dc] disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </div>

      {/* COMPETITION SELECTOR */}

      <div className={`${panel} p-4 sm:p-5`}>
        <label
          htmlFor="knockout-competition"
          className="mb-2 block text-xs font-semibold text-[#9aa9b9]"
        >
          Competition
        </label>

        <div className="relative">
          <select
            id="knockout-competition"
            value={competitionId}
            onChange={(e) => {
              setCompetitionId(e.target.value);
              setError("");
              setNotice("");
            }}
            className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#0b0e12] px-4 pr-10 text-sm text-white outline-none focus:border-[#b7f56a]/50"
          >
            <option value="">
              Select a competition
            </option>

            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.season
                  ? ` · ${c.season}`
                  : ""}
              </option>
            ))}
          </select>

          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-4 top-4 text-[#8b98aa]"
          />
        </div>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-xs text-red-200"
        >
          <AlertCircle
            size={17}
            className="shrink-0"
          />
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-[#b7f56a]/20 bg-[#b7f56a]/[0.05] p-4 text-xs text-[#c5f48d]"
        >
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}

      {competitionId && (
        <>
          {/* STATISTICS */}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`${panel} p-5`}>
              <p className="text-xs text-[#8b98aa]">
                Knockout ties completed
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {progress}
                <span className="text-lg text-[#7e8b9a]">
                  {" "}
                  / 23
                </span>
              </p>
            </div>

            <div className={`${panel} p-5`}>
              <p className="text-xs text-[#8b98aa]">
                Rounds generated
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {
                  rounds.filter(
                    (r) =>
                      tiesByRound[r.key].length > 0
                  ).length
                }
                <span className="text-lg text-[#7e8b9a]">
                  {" "}
                  / 5
                </span>
              </p>
            </div>

            <div className={`${panel} p-5`}>
              <p className="text-xs text-[#8b98aa]">
                Tournament status
              </p>

              <p className="mt-3 text-sm font-semibold text-[#b7f56a]">
                {champion
                  ? "Champion crowned"
                  : progress
                    ? "In progress"
                    : "Awaiting knockout draw"}
              </p>
            </div>
          </div>

          {/* CHAMPION DISPLAY */}

          {champion && (
            <div className="rounded-2xl border border-[#b7f56a]/25 bg-gradient-to-r from-[#172519] to-[#101319] p-6 sm:p-8">
              <Trophy
                className="mb-4 text-[#b7f56a]"
                size={32}
              />

              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b7f56a]">
                Tournament champion
              </p>

              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                {champion.champion.teamName}
              </h2>

 
              <p className="mt-2 text-xs text-[#a3b5a5]">
                Runner-up:{" "}
                {champion.runnerUp.teamName}
                {" · "}
                Final:{" "}
                {champion.final.homeTotalGoals}
                {"–"}
                {champion.final.awayTotalGoals}
                {" · "}
                {champion.final.decision}
              </p>
            </div>
          )}

          {/* =========================================== */}
          {/* INTERACTIVE TOURNAMENT BRACKET */}
          {/* =========================================== */}

         

          {/* =========================================== */}
          {/* ROUND NAVIGATION */}
          {/* =========================================== */}

          <div
            className="flex gap-2 overflow-x-auto pb-2"
            role="tablist"
            aria-label="Knockout rounds"
          >
            {rounds.map((r) => (
              <button
                key={r.key}
                role="tab"
                aria-selected={round === r.key}
                type="button"
                onClick={() => {
                  setRound(r.key);
                  setNotice("");
                }}
                className={`shrink-0 rounded-xl border px-4 py-3 text-xs font-semibold transition ${
                  round === r.key
                    ? "border-[#b7f56a]/40 bg-[#b7f56a]/10 text-[#b7f56a]"
                    : "border-white/[0.08] bg-[#101319] text-[#91a0b1] hover:text-white"
                }`}
              >

                {r.name}{" "}
                {tiesByRound[r.key].length
                  ? `(${tiesByRound[r.key].length})`
                  : ""}
              </button>
            ))}
          </div>

          {/* ROUND ACTIONS */}

          <div
            className={`${panel} flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center`}
          >
            <div>
              <h2 className="text-lg font-semibold">
                {selected.name}
              </h2>

              <p className="mt-1 text-xs text-[#8b98aa]">
                {ties.length} of{" "}
                {selected.expected} ties generated
                {" · "}
                {
                  ties.filter(
                    (t) => t.isCompleted
                  ).length
                }{" "}
                completed
              </p>
            </div>

           
<div className="flex flex-wrap gap-2">
  {ties.length === 0 ? (
    <button
      type="button"
      disabled={!canDraw || loading || !!busy}
      onClick={() =>
        void perform("draw", "Generate draw")
      }
      className="inline-flex items-center gap-2 rounded-xl bg-[#b7f56a] px-4 py-3 text-xs font-bold text-[#080a0d] transition hover:bg-[#caff8d] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {busy ? (
        <Loader2
          size={15}
          className="animate-spin"
        />
      ) : (
        <Zap size={15} />
      )}
      Generate draw
    </button>
  ) : (
    <>
      {round === "final" ? (
        complete ? (
          <div
            role="status"
            className="inline-flex items-center gap-2 rounded-xl border border-[#b7f56a]/25 bg-[#b7f56a]/10 px-4 py-3 text-xs font-semibold text-[#b7f56a]"
          >
            <CheckCircle2 size={16} />
            Final Completed
          </div>
        ) : (
          <button
            type="button"
            disabled={!!busy || loading}
            onClick={() =>
              void perform("simulate", "Simulate final")
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#b7f56a] px-4 py-3 text-xs font-bold text-[#080a0d] transition hover:bg-[#caff8d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "simulate" ? (
              <Loader2
                size={15}
                className="animate-spin"
              />
            ) : (
              <Trophy size={15} />
            )}
            {busy === "simulate"
              ? "Simulating Final..."
              : "Simulate Final"}
          </button>
        )
      ) : complete ? (
        <div
          role="status"
          className="inline-flex items-center gap-2 rounded-xl border border-[#b7f56a]/25 bg-[#b7f56a]/10 px-4 py-3 text-xs font-semibold text-[#b7f56a]"
        >
          <CheckCircle2 size={16} />
          Round Completed
        </div>
      ) : (
        <>
          <button
            type="button"
            disabled={
              !!busy ||
              loading ||
              !firstLegsRemaining
            }
            onClick={() =>
              void perform(
                "simulate-first-legs",
                "Simulate first legs"
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-[#b7f56a]/30 bg-[#b7f56a]/10 px-4 py-3 text-xs font-semibold text-[#b7f56a] transition hover:bg-[#b7f56a]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "simulate-first-legs" ? (
              <Loader2
                size={15}
                className="animate-spin"
              />
            ) : (
              <Zap size={15} />
            )}
            {busy === "simulate-first-legs"
              ? "Simulating..."
              : "Simulate First Legs"}
          </button>

          <button
            type="button"
            disabled={
              !!busy ||
              loading ||
              !allFirstLegsPlayed ||
              !secondLegsRemaining
            }
            onClick={() =>
              void perform(
                "simulate-second-legs",
                "Simulate second legs"
              )
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#b7f56a] px-4 py-3 text-xs font-bold text-[#080a0d] transition hover:bg-[#caff8d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "simulate-second-legs" ? (
              <Loader2
                size={15}
                className="animate-spin"
              />
            ) : (
              <Zap size={15} />
            )}
            {busy === "simulate-second-legs"
              ? "Simulating..."
              : "Simulate Second Legs"}
          </button>
        </>
      )}
    </>
  )}
</div>

          </div>

          {/* MATCH FIXTURES */}

          {loading ? (
            <div
              className={`${panel} flex items-center justify-center gap-3 p-12 text-sm text-[#8b98aa]`}
            >
              <Loader2
                size={18}
                className="animate-spin"
              />
              Loading knockout fixtures...
            </div>
          ) : ties.length === 0 ? (
            <div
              className={`${panel} p-12 text-center`}
            >
              <Shield
                size={32}
                className="mx-auto text-[#b7f56a]"
              />

              <h3 className="mt-4 font-semibold">
                No {selected.name.toLowerCase()} fixtures yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-[#8b98aa]">
                {round === "playoffs"
                  ? "Complete all 144 league-phase matches, then generate the play-off draw."
                  : `Complete the previous round to unlock the ${selected.name.toLowerCase()} draw.`}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {ties.map((tie) => (
                <article
                  key={tie.id}
                  className={`${panel} p-5`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8190a2]">
                      Tie{" "}
                      {String(
                        tie.tieNumber
                      ).padStart(2, "0")}
                    </span>

                    <span
                      className={`text-[10px] ${
                        tie.isCompleted
                          ? "text-[#b7f56a]"
                          : "text-[#8b98aa]"
                      }`}
                    >
                      {tie.isCompleted
                        ? "Completed"
                        : "Pending"}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-semibold">
                    {tie.team1}{" "}
                    <span className="px-1 text-[#687789]">
                      vs
                    </span>{" "}
                    {tie.team2}
                  </h3>

                  <div className="mt-4 space-y-2">
                    {tie.matches.map((match) => (
                      <MatchRow
                        key={match.id}
                        match={match}
                      />
                    ))}
                  </div>

                  {tie.isCompleted && (
                    <div className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-xs text-[#b7f56a]">
                      <CheckCircle2 size={15} />
                      Qualified:{" "}
                      <strong>
                        {tie.winner ??
                          "Winner confirmed"}
                      </strong>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* NEXT ROUND */}

          {complete && round !== "final" && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#b7f56a]/20 bg-[#b7f56a]/[0.05] p-4">
              <p className="text-xs text-[#c5f48d]">
                All ties complete. The next round is ready.
              </p>

              <button
                type="button"
                onClick={() =>
                  setRound(
                    rounds[
                      rounds.findIndex(
                        (r) => r.key === round
                      ) + 1
                    ].key
                  )
                }
                className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#b7f56a]"
              >
                Next round
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
