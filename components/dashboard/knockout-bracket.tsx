
"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crown,
  Shield,
  Trophy,
} from "lucide-react";

type KnockoutMatch = {
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

export type KnockoutTie = {
  id: string;
  tieNumber: number;
  team1: string;
  team2: string;
  isCompleted: boolean;
  winnerTeamId: string | null;
  winner: string | null;
  matches: KnockoutMatch[];
};

export type KnockoutRoundKey =
  | "playoffs"
  | "round-of-16"
  | "quarter-finals"
  | "semi-finals"
  | "final";

export type KnockoutRounds = Record<
  KnockoutRoundKey,
  KnockoutTie[]
>;

type Champion = {
  champion: { teamName: string };
  runnerUp: { teamName: string };
  final: {
    homeTotalGoals: number;
    awayTotalGoals: number;
    decision: string;
  };
};

type Props = {
  tiesByRound: KnockoutRounds;
  champion?: Champion | null;
  onSelectRound?: (round: KnockoutRoundKey) => void;
};

const stages: {
  key: KnockoutRoundKey;
  label: string;
  short: string;
}[] = [
  {
    key: "round-of-16",
    label: "Round of 16",
    short: "R16",
  },
  {
    key: "quarter-finals",
    label: "Quarter-finals",
    short: "QF",
  },
  {
    key: "semi-finals",
    label: "Semi-finals",
    short: "SF",
  },
  {
    key: "final",
    label: "Final",
    short: "FINAL",
  },
];

function totalScore(
  tie: KnockoutTie,
  team: string
): number | null {
  const played = tie.matches.filter(
    (match) => match.isPlayed
  );

  if (!played.length) return null;

  return played.reduce((total, match) => {
    if (match.homeTeam === team) {
      return (
        total +
        (match.homeScore ?? 0) +
        (match.homeExtraTimeScore ?? 0)
      );
    }

    if (match.awayTeam === team) {
      return (
        total +
        (match.awayScore ?? 0) +
        (match.awayExtraTimeScore ?? 0)
      );
    }

    return total;
  }, 0);
}

function TeamLine({
  name,
  score,
  winner,
  eliminated,
}: {
  name: string;
  score: number | null;
  winner: boolean;
  eliminated: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${
        winner
          ? "bg-[#b7f56a]/[0.09]"
          : "bg-white/[0.025]"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold ${
          winner
            ? "border-[#b7f56a]/30 bg-[#b7f56a]/10 text-[#b7f56a]"
            : "border-white/10 bg-white/[0.04] text-[#8995a5]"
        }`}
      >
        <Shield size={13} />
      </span>

      <span
        title={name}
        className={`min-w-0 flex-1 truncate text-xs font-semibold ${
          winner
            ? "text-[#d2ff9c]"
            : eliminated
              ? "text-[#667486]"
              : "text-[#d9e0e8]"
        }`}
      >
        {name}
      </span>

      {winner && (
        <CheckCircle2
          size={13}
          className="shrink-0 text-[#b7f56a]"
        />
      )}

      <span
        className={`min-w-6 text-right text-sm font-bold tabular-nums ${
          winner
            ? "text-[#b7f56a]"
            : "text-[#c0cad5]"
        }`}
      >
        {score ?? "–"}
      </span>
    </div>
  );
}

function TieCard({
  tie,
  stage,
  onSelectRound,
}: {
  tie: KnockoutTie;
  stage: KnockoutRoundKey;
  onSelectRound?: (round: KnockoutRoundKey) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const firstScore = totalScore(tie, tie.team1);
  const secondScore = totalScore(tie, tie.team2);

  const team1Won =
    tie.isCompleted && tie.winner === tie.team1;

  const team2Won =
    tie.isCompleted && tie.winner === tie.team2;

  return (
    <article className="group relative rounded-xl border border-white/[0.09] bg-[#12171d] p-3 transition-colors hover:border-[#b7f56a]/30">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#7d8b9d]">
          Tie {String(tie.tieNumber).padStart(2, "0")}
        </span>

        <span
          className={`rounded-full px-2 py-1 text-[9px] font-medium ${
            tie.isCompleted
              ? "bg-[#b7f56a]/10 text-[#b7f56a]"
              : "bg-white/[0.05] text-[#8794a5]"
          }`}
        >
          {tie.isCompleted ? "Completed" : "Pending"}
        </span>
      </div>

      <div className="space-y-1.5">
        <TeamLine
          name={tie.team1}
          score={firstScore}
          winner={team1Won}
          eliminated={tie.isCompleted && !team1Won}
        />

        <TeamLine
          name={tie.team2}
          score={secondScore}
          winner={team2Won}
          eliminated={tie.isCompleted && !team2Won}
        />
      </div>

      {tie.isCompleted && tie.winner && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#b7f56a]">
          <ArrowRight size={12} />
          <span className="truncate">
            {tie.winner} advances
          </span>
        </div>
      )}

      {tie.matches.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-3 flex w-full items-center justify-between border-t border-white/[0.06] pt-3 text-[10px] text-[#8f9cad] hover:text-white"
        >
          Match details
          {expanded ? (
            <ChevronUp size={13} />
          ) : (
            <ChevronDown size={13} />
          )}
        </button>
      )}

      {expanded && (
        <div className="mt-3 space-y-2">
          {tie.matches
            .slice()
            .sort((a, b) => a.leg - b.leg)
            .map((match) => (
              <div
                key={match.id}
                className="rounded-lg border border-white/[0.06] bg-[#090c10] p-3"
              >
                <p className="mb-2 text-[9px] uppercase tracking-wider text-[#778598]">
                  {stage === "final"
                    ? "Championship final"
                    : `Leg ${match.leg}`}
                </p>

                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="min-w-0 flex-1 truncate">
                    {match.homeTeam}
                  </span>

                  <span className="shrink-0 font-bold tabular-nums">
                    {match.isPlayed
                      ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
                      : "vs"}
                  </span>

                  <span className="min-w-0 flex-1 truncate text-right">
                    {match.awayTeam}
                  </span>
                </div>

                {match.wentToExtraTime && (
                  <p className="mt-2 text-center text-[10px] text-[#9ba8b7]">
                    Extra time:{" "}
                    {match.homeExtraTimeScore ?? 0}–
                    {match.awayExtraTimeScore ?? 0}
                  </p>
                )}

                {match.wentToPenalties && (
                  <p className="mt-1 text-center text-[10px] text-[#b7f56a]">
                    Penalties:{" "}
                    {match.homePenaltyScore ?? 0}–
                    {match.awayPenaltyScore ?? 0}
                  </p>
                )}
              </div>
            ))}
        </div>
      )}

      {onSelectRound && (
        <button
          type="button"
          onClick={() => onSelectRound(stage)}
          className="mt-3 text-[10px] font-semibold text-[#b7f56a] hover:underline"
        >
          Open round
        </button>
      )}
    </article>
  );
}

function BracketColumn({
  stage,
  ties,
  onSelectRound,
}: {
  stage: (typeof stages)[number];
  ties: KnockoutTie[];
  onSelectRound?: (round: KnockoutRoundKey) => void;
}) {
  const completed = ties.filter(
    (tie) => tie.isCompleted
  ).length;

  return (
    <div className="w-[260px] shrink-0">
      <div className="mb-5 flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b7f56a]">
            {stage.short}
          </p>

          <h3 className="mt-1 text-sm font-semibold">
            {stage.label}
          </h3>
        </div>

        <span className="text-[10px] text-[#8794a5]">
          {completed}/{ties.length}
        </span>
      </div>

      <div className="flex h-full flex-col justify-around gap-5 pb-10">
        {ties.length ? (
          ties
            .slice()
            .sort((a, b) => a.tieNumber - b.tieNumber)
            .map((tie) => (
              <TieCard
                key={tie.id}
                tie={tie}
                stage={stage.key}
                onSelectRound={onSelectRound}
              />
            ))
        ) : (
          <div className="rounded-xl border border-dashed border-white/[0.12] p-5 text-center">
            <Shield
              size={22}
              className="mx-auto text-[#6c7a8a]"
            />

            <p className="mt-3 text-xs font-semibold">
              Awaiting draw
            </p>

            <p className="mt-2 text-[10px] leading-5 text-[#8794a5]">
              Fixtures appear here after the round is generated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function KnockoutBracket({
  tiesByRound,
  champion,
  onSelectRound,
}: Props) {
  const playoffs = useMemo(
    () =>
      [...tiesByRound.playoffs].sort(
        (a, b) => a.tieNumber - b.tieNumber
      ),
    [tiesByRound.playoffs]
  );

  const completedPlayoffs = playoffs.filter(
    (tie) => tie.isCompleted
  ).length;

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b7f56a]">
            Tournament progression
          </p>

          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Road to the{" "}
            <span className="text-[#b7f56a]">
              Championship
            </span>
          </h2>

          <p className="mt-2 text-xs leading-6 text-[#8b98aa]">
            Follow every club from the knockout
            play-offs to the final.
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-[#b7f56a]/20 bg-[#b7f56a]/[0.06] px-3 py-2 text-[10px] font-semibold text-[#b7f56a]">
          <Trophy size={13} />
          Live tournament bracket
        </span>
      </div>

      {/* PLAY-OFF QUALIFIERS */}

      <div className="rounded-2xl border border-white/[0.08] bg-[#101319] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">
              Knockout play-off qualifiers
            </h3>

            <p className="mt-1 text-[10px] text-[#8b98aa]">
              Eight winners advance to join the top
              eight league-phase clubs.
            </p>
          </div>

          <span className="text-xs font-semibold text-[#b7f56a]">
            {completedPlayoffs}/8 qualified
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {playoffs.length ? (
            playoffs.map((tie) => (
              <div
                key={tie.id}
                className="rounded-xl border border-white/[0.07] bg-[#0b0e12] p-3"
              >
                <p className="text-[9px] uppercase tracking-wider text-[#7f8b9c]">
                  Play-off {tie.tieNumber}
                </p>

                <p className="mt-2 truncate text-xs font-semibold text-[#b7f56a]">
                  {tie.winner ?? "Winner pending"}
                </p>
              </div>
            ))
          ) : (
            <p className="col-span-full py-4 text-xs text-[#8b98aa]">
              No play-off fixtures generated yet.
            </p>
          )}
        </div>

        {onSelectRound && (
          <button
            type="button"
            onClick={() => onSelectRound("playoffs")}
            className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#b7f56a]"
          >
            View play-off fixtures
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* MAIN BRACKET */}

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1015]">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
          <div>
            <p className="text-sm font-semibold">
              Championship bracket
            </p>

            <p className="mt-1 text-[10px] text-[#8290a2]">
              Scroll horizontally to explore every round
            </p>
          </div>

          <span className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[10px] text-[#8f9cad]">
            R16 → Final
          </span>
        </div>

        <div className="overflow-x-auto p-5">
          <div className="flex min-w-max items-stretch gap-8">
            {stages.map((stage, index) => (
              <div
                key={stage.key}
                className="relative flex items-stretch"
              >
                <BracketColumn
                  stage={stage}
                  ties={tiesByRound[stage.key]}
                  onSelectRound={onSelectRound}
                />

                {index < stages.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute -right-6 top-1/2 flex items-center text-[#b7f56a]/40"
                  >
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHAMPION */}

      {champion && (
        <div className="relative overflow-hidden rounded-2xl border border-[#b7f56a]/25 bg-gradient-to-br from-[#192b1b] via-[#101b15] to-[#101319] p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-[#b7f56a]/[0.07] blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#b7f56a]/30 bg-[#b7f56a]/10 text-[#b7f56a]">
              <Trophy size={32} />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7f56a]">
              Champions of FootballSim
            </p>

            <Crown
              size={22}
              className="mt-5 text-[#b7f56a]"
            />

            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {champion.champion.teamName}
            </h2>

            <p className="mt-3 text-xs text-[#a6b7a6]">
              Tournament winners
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <div className="rounded-xl border border-white/[0.08] bg-black/20 px-5 py-3">
                <p className="text-[10px] text-[#8e9caa]">
                  Runner-up
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {champion.runnerUp.teamName}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-black/20 px-5 py-3">
                <p className="text-[10px] text-[#8e9caa]">
                  Final score
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {champion.final.homeTotalGoals}–
                  {champion.final.awayTotalGoals}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-black/20 px-5 py-3">
                <p className="text-[10px] text-[#8e9caa]">
                  Decision
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {champion.final.decision}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
