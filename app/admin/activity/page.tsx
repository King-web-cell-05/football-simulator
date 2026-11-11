
"use client";

import {
  useCallback,
  useEffect,
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
  RefreshCw,
  ShieldCheck,
  Trophy,
  UserPlus,
} from "lucide-react";

type ActivityType = "all" | "user" | "competition";
type DaysFilter = 7 | 30 | 90 | 365;

type ActivityItem = {
  id: string;
  type: "user" | "competition";
  title: string;
  description: string;
  actorName: string | null;
  actorEmail: string | null;
  entityId: string;
  createdAtUtc: string;
};

type ActivitySummary = {
  registrations: number;
  competitionsCreated: number;
  recordedEvents: number;
  playedLeagueMatches: number;
  pendingLeagueMatches: number;
};

type ActivityResponse = {
  generatedAtUtc: string;
  filters: {
    type: ActivityType;
    days: number;
  };
  summary: ActivitySummary;
  items: ActivityItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

const PAGE_SIZE = 10;

const panel =
  "rounded-2xl border border-white/[0.08] bg-[#101319]";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date) + " UTC";
}

function getErrorMessage(
  payload: unknown,
  fallback: string
) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallback;
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof Activity;
  loading: boolean;
}) {
  return (
    <div className={`${panel} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-400">
          {label}
        </p>

        <div className="rounded-xl border border-lime-300/10 bg-lime-300/[0.07] p-3 text-lime-300">
          <Icon size={20} />
        </div>
      </div>

      <div className="mt-6 text-3xl font-semibold tabular-nums text-white">
        {loading ? (
          <Loader2
            size={25}
            className="animate-spin text-lime-300"
          />
        ) : (
          value.toLocaleString("en-NG")
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ActivityRow({
  item,
}: {
  item: ActivityItem;
}) {
  const isUser = item.type === "user";
  const Icon = isUser ? UserPlus : Trophy;

  return (
    <div className="flex gap-4 border-b border-white/[0.06] px-5 py-5 last:border-b-0 sm:px-6">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
          isUser
            ? "border-blue-400/15 bg-blue-400/10 text-blue-300"
            : "border-lime-300/15 bg-lime-300/10 text-lime-300"
        }`}
      >
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-white">
            {item.title}
          </h3>

          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              isUser
                ? "bg-blue-400/10 text-blue-300"
                : "bg-lime-300/10 text-lime-300"
            }`}
          >
            {isUser
              ? "Registration"
              : "Competition"}
          </span>
        </div>

        <p className="mt-2 break-words text-sm text-slate-300">
          {item.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span>
            {isUser
              ? item.actorEmail || "Email unavailable"
              : `Created by ${
                  item.actorName || "Unknown owner"
                }`}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={13} />
            {formatDate(item.createdAtUtc)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminActivityPage() {
  const [type, setType] =
    useState<ActivityType>("all");

  const [days, setDays] =
    useState<DaysFilter>(30);

  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [data, setData] =
    useState<ActivityResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadActivity() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        type,
        days: String(days),
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });

      try {
        const response = await fetch(
          `/api/admin/activity?${params.toString()}`,
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
              "Unable to load platform activity."
            )
          );
        }

        if (
          !payload ||
          typeof payload !== "object" ||
          !("items" in payload) ||
          !Array.isArray(payload.items) ||
          !("summary" in payload) ||
          !payload.summary
        ) {
          throw new Error(
            "Invalid activity response received."
          );
        }

        if (!controller.signal.aborted) {
          setData(payload as ActivityResponse);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
        setData(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadActivity();

    return () => controller.abort();
  }, [type, days, page, refreshKey]);

  const summary = data?.summary;

  const metrics = [
    {
      label: "New Registrations",
      value: summary?.registrations ?? 0,
      description: `Registered in the last ${days} days`,
      icon: UserPlus,
    },
    {
      label: "New Competitions",
      value: summary?.competitionsCreated ?? 0,
      description: `Created in the last ${days} days`,
      icon: Trophy,
    },
    {
      label: "Recorded Events",
      value: summary?.recordedEvents ?? 0,
      description: "Registrations and competition creation",
      icon: Activity,
    },
    {
      label: "Played League Matches",
      value: summary?.playedLeagueMatches ?? 0,
      description: "All-time platform total",
      icon: CheckCircle2,
    },
  ];

  function changeType(value: ActivityType) {
    setType(value);
    setPage(1);
  }

  function changeDays(value: DaysFilter) {
    setDays(value);
    setPage(1);
  }

  const totalPages = Math.max(
    1,
    data?.totalPages ?? 1
  );

  return (
    <section className="mx-auto max-w-[1500px] space-y-7 text-white">
      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime-300">
            <Activity size={15} />
            Administration / Activity
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Platform{" "}
            <span className="text-lime-300">
              Activity
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Monitor user registrations, competition
            creation and league-match statistics
            across FootballSim.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#101319] px-4 py-3 text-xs font-semibold text-lime-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh Activity
        </button>
      </div>

      {/* METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
            loading={loading}
          />
        ))}
      </div>

      {/* FILTERS */}
      <div className={`${panel} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">
              Activity Filters
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Filter events by type and time period.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CalendarDays size={15} />
            Last {days} days
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All Activity"],
                ["user", "Registrations"],
                ["competition", "Competitions"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => changeType(value)}
                aria-pressed={type === value}
                className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  type === value
                    ? "bg-lime-300 text-black"
                    : "border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="sm:ml-auto">
            <select
              aria-label="Activity date range"
              value={days}
              onChange={(event) =>
                changeDays(
                  Number(event.target.value) as DaysFilter
                )
              }
              className="rounded-xl border border-white/10 bg-[#0b0e12] px-4 py-2.5 text-xs text-white outline-none focus:border-lime-300/40"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last 365 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* ACTIVITY FEED */}
      <div className={`${panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-5">
          <div>
            <h2 className="text-base font-semibold">
              Recent Activity
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Chronological record of available events
            </p>
          </div>

          <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-400">
            {data?.totalCount ?? 0} Events
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4">
            <Loader2
              size={28}
              className="animate-spin text-lime-300"
            />
            <p className="text-sm text-slate-400">
              Loading platform activity...
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <AlertCircle
              size={30}
              className="mx-auto text-red-300"
            />
            <p className="mt-4 text-sm text-red-300">
              {error}
            </p>
            <button
              type="button"
              onClick={refresh}
              className="mt-5 rounded-xl border border-white/10 px-4 py-2 text-xs text-white hover:bg-white/10"
            >
              Try Again
            </button>
          </div>
        ) : data?.items.length ? (
          <div>
            {data.items.map((item) => (
              <ActivityRow
                key={`${item.type}-${item.id}`}
                item={item}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Activity
              size={32}
              className="mx-auto text-slate-500"
            />
            <h3 className="mt-4 text-sm font-semibold">
              No activity found
            </h3>
            <p className="mt-2 text-xs text-slate-500">
              Try another activity type or date range.
            </p>
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] px-5 py-4">
          <p className="text-xs text-slate-500">
            Showing {data?.items.length ?? 0} of{" "}
            {data?.totalCount ?? 0} events
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
              className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="px-3 text-xs text-slate-400">
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
              className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* PLATFORM STATUS */}
      <div className={`${panel} p-5`}>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-lime-300/10 p-3 text-lime-300">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2 className="text-sm font-semibold">
              Activity Monitoring
            </h2>
            <p className="mt-2 text-xs leading-6 text-slate-400">
              This page reconstructs registration and
              competition creation events from stored
              timestamps. Played and pending league-match
              counts are current platform totals, not
              timestamped simulation events. Historical
              simulation and administrative action logs
              would require dedicated audit records.
            </p>

            {data?.generatedAtUtc && (
              <p className="mt-3 text-xs text-slate-500">
                Last data snapshot:{" "}
                {formatDate(data.generatedAtUtc)}
              </p>
            )}

            <p className="mt-2 text-xs text-slate-500">
              Pending league matches:{" "}
              {summary?.pendingLeagueMatches ?? "—"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
