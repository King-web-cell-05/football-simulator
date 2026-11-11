
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Trophy,
  UserCheck,
  UserRoundX,
  Users,
  Shield,
  TrendingUp,
} from "lucide-react";

export const instant = false;

type RecentUser = {
  id: string;
  fullName: string;
  email: string;
  isEmailVerified: boolean;
  isSuspended: boolean;
  createdAtUtc: string;
};

type RecentCompetition = {
  id: string;
  name: string;
  season: string;
  ownerId: string | null;
  ownerName: string | null;
  createdDate: string;
};

type Overview = {
  generatedAtUtc: string;
  users: {
    total: number;
    active: number;
    verified: number;
    unverified: number;
    suspended: number;
    newLast30Days: number;
  };
  competitions: {
    total: number;
    newLast30Days: number;
    withPendingLeagueMatches: number;
    withoutPendingLeagueMatches: number;
  };
  clubs: {
    total: number;
    defaultClubs: number;
    privateClubs: number;
  };
  leagueMatches: {
    total: number;
    played: number;
    pending: number;
  };
  recentRegistrations: RecentUser[];
  recentCompetitions: RecentCompetition[];
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

async function getOverview(): Promise<Overview> {
  const token = (await cookies()).get(
    "footballsim_session"
  )?.value;

  if (!token) {
    redirect("/login");
  }

  const apiUrl = process.env.FOOTBALLSIM_API_URL;

  if (!apiUrl) {
    throw new Error(
      "FootballSim backend URL is not configured."
    );
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/admin/dashboard/overview`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );
  } catch {
    throw new Error(
      "Unable to connect to the FootballSim backend."
    );
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 403) {
    redirect("/dashboard");
  }

  if (!response.ok) {
    throw new Error(
      "Unable to load administrator statistics."
    );
  }

  return (await response.json()) as Overview;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#11161D] p-5 transition-colors hover:border-white/20">
      <div className="mb-7 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-400">
          {title}
        </p>

        <div className="rounded-xl border border-white/5 bg-white/5 p-2.5 text-lime-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="text-3xl font-semibold tracking-tight text-white">
        {value.toLocaleString("en-NG")}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-white">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-2 text-xs font-medium text-lime-300 transition hover:text-lime-200"
        >
          {linkLabel ?? "View all"}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const data = await getOverview();

  const completionRate =
    data.leagueMatches.total > 0
      ? Math.round(
          (data.leagueMatches.played /
            data.leagueMatches.total) *
            100
        )
      : 0;

  const verificationRate =
    data.users.total > 0
      ? Math.round(
          (data.users.verified / data.users.total) *
            100
        )
      : 0;

  return (
    <div className="mx-auto max-w-[1500px] space-y-9">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
            <ShieldCheck className="h-4 w-4" />
            Private Administration
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Platform Overview
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Monitor FootballSim users, competitions,
            clubs and match activity across the platform.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <p className="text-[11px] text-slate-500">
            Last updated
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-200">
            <Clock3 className="h-3.5 w-3.5 text-lime-300" />
            {formatDate(data.generatedAtUtc)}
          </p>
        </div>
      </div>

      {/* MAIN STATISTICS */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={data.users.total}
          subtitle={`${data.users.newLast30Days} registered in the last 30 days`}
          icon={Users}
        />

        <StatCard
          title="Competitions"
          value={data.competitions.total}
          subtitle={`${data.competitions.newLast30Days} created in the last 30 days`}
          icon={Trophy}
        />

        <StatCard
          title="Total Clubs"
          value={data.clubs.total}
          subtitle={`${data.clubs.privateClubs} private clubs`}
          icon={Shield}
        />

        <StatCard
          title="League Matches"
          value={data.leagueMatches.total}
          subtitle={`${data.leagueMatches.played} matches completed`}
          icon={Activity}
        />
      </section>

      {/* PLATFORM HEALTH */}
      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#11161D] p-6">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Match Completion
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                League-phase simulation progress
              </p>
            </div>

            <div className="rounded-xl bg-lime-300/10 p-2.5 text-lime-300">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-4xl font-semibold tracking-tight text-white">
                {completionRate}%
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Overall completion
              </p>
            </div>

            <p className="text-sm text-slate-400">
              {data.leagueMatches.played} /{" "}
              {data.leagueMatches.total}
            </p>
          </div>

          <div
            role="progressbar"
            aria-label="League match completion"
            aria-valuenow={completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2.5 overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-lime-300 transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          <div className="mt-7 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/[0.035] p-4">
              <div className="mb-2 flex items-center gap-2 text-lime-300">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs">Played</span>
              </div>
              <p className="text-2xl font-semibold text-white">
                {data.leagueMatches.played}
              </p>
            </div>

            <div className="rounded-xl bg-white/[0.035] p-4">
              <div className="mb-2 flex items-center gap-2 text-amber-300">
                <Clock3 className="h-4 w-4" />
                <span className="text-xs">Pending</span>
              </div>
              <p className="text-2xl font-semibold text-white">
                {data.leagueMatches.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#11161D] p-6">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                User Accounts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Registration and verification overview
              </p>
            </div>

            <div className="rounded-xl bg-lime-300/10 p-2.5 text-lime-300">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-4xl font-semibold text-white">
                {verificationRate}%
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Accounts verified
              </p>
            </div>

            <span className="text-sm text-slate-400">
              {data.users.verified} of {data.users.total}
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-lime-300"
              style={{ width: `${verificationRate}%` }}
            />
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            {[
              {
                label: "Active",
                value: data.users.active,
                icon: UserCheck,
                color: "text-lime-300",
              },
              {
                label: "Unverified",
                value: data.users.unverified,
                icon: Clock3,
                color: "text-amber-300",
              },
              {
                label: "Suspended",
                value: data.users.suspended,
                icon: UserRoundX,
                color: "text-red-300",
              },
              {
                label: "Verified",
                value: data.users.verified,
                icon: CheckCircle2,
                color: "text-sky-300",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.035] p-3"
                >
                  <Icon
                    className={`h-4 w-4 ${item.color}`}
                  />

                  <div>
                    <p className="text-xs text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RECENT ACTIVITY */}
      <section className="grid gap-5 xl:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-white/10 bg-[#11161D] p-5 sm:p-6">
          <SectionHeading
            title="Recent Registrations"
            description="Latest accounts created on FootballSim"
            href="/admin/users"
            linkLabel="Manage users"
          />

          <div className="space-y-1">
            {data.recentRegistrations.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No registrations found.
              </p>
            ) : (
              data.recentRegistrations.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-white/[0.035]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-semibold text-lime-300">
                    {initials(user.fullName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {user.fullName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user.email}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={[
                        "inline-block rounded-full px-2 py-1 text-[10px] font-medium",
                        user.isSuspended
                          ? "bg-red-400/10 text-red-300"
                          : user.isEmailVerified
                            ? "bg-lime-300/10 text-lime-300"
                            : "bg-amber-300/10 text-amber-300",
                      ].join(" ")}
                    >
                      {user.isSuspended
                        ? "Suspended"
                        : user.isEmailVerified
                          ? "Verified"
                          : "Unverified"}
                    </span>

                    <p className="mt-1 text-[10px] text-slate-500">
                      {formatDate(user.createdAtUtc)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-white/10 bg-[#11161D] p-5 sm:p-6">
          <SectionHeading
            title="Recent Competitions"
            description="Latest competitions created by users"
            href="/admin/competitions"
            linkLabel="View competitions"
          />

          <div className="space-y-1">
            {data.recentCompetitions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No competitions found.
              </p>
            ) : (
              data.recentCompetitions.map(
                (competition) => (
                  <div
                    key={competition.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-4 transition hover:bg-white/[0.035]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                      <Trophy className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {competition.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        Created by{" "}
                        {competition.ownerName ??
                          "Unknown user"}
                      </p>
                    </div>

                    <p className="shrink-0 text-[10px] text-slate-500">
                      {formatDate(
                        competition.createdDate
                      )}
                    </p>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </section>

      {/* PLATFORM SUMMARY */}
      <section className="rounded-2xl border border-white/10 bg-[#11161D] p-6">
        <SectionHeading
          title="Platform Summary"
          description="Additional competition and club statistics"
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Default Clubs",
              value: data.clubs.defaultClubs,
            },
            {
              label: "Private Clubs",
              value: data.clubs.privateClubs,
            },
            {
              label: "Competitions with Pending Matches",
              value:
                data.competitions
                  .withPendingLeagueMatches,
            },
            {
              label: "Competitions without Pending Matches",
              value:
                data.competitions
                  .withoutPendingLeagueMatches,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/5 bg-white/[0.025] p-4"
            >
              <p className="min-h-9 text-xs leading-5 text-slate-400">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-5">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-lime-300" />
          FootballSim Administration
        </p>

        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-xs font-medium text-lime-300 hover:text-lime-200"
        >
          Manage platform users
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
