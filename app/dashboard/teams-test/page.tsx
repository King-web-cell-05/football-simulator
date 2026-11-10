
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowDownAZ,
  ArrowUpDown,
  CheckCircle2,
  Globe2,
  ImageOff,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";

type Team = {
  id: string;
  name: string;
  country: string;
  coefficient: number;
  logoUrl: string | null;
};

type SortOption =
  | "name-asc"
  | "name-desc"
  | "coefficient-desc"
  | "coefficient-asc";

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5295"
).replace(/\/$/, "");

// ==========================================
// RESOLVE TEAM LOGO URL
// ==========================================

function resolveTeamLogoUrl(
  logoUrl: string | null | undefined
): string | null {
  if (!logoUrl?.trim()) return null;

  const value = logoUrl.trim();

  if (
    value.startsWith("https://") ||
    value.startsWith("http://")
  ) {
    return value;
  }

  if (value.startsWith("/uploads/team-logos/")) {
    return `${API_ORIGIN}${value}`;
  }

  return null;
}

// ==========================================
// TEAM LOGO COMPONENT
// ==========================================

function TeamLogo({
  name,
  logoUrl,
  size = "default",
}: {
  name: string;
  logoUrl: string | null;
  size?: "default" | "large";
}) {
  const [failedUrl, setFailedUrl] =
    useState<string | null>(null);

  const resolvedUrl = resolveTeamLogoUrl(logoUrl);

  const hasImage =
    Boolean(resolvedUrl) &&
    failedUrl !== resolvedUrl;

  const dimensions =
    size === "large"
      ? "h-24 w-24"
      : "h-16 w-16";

  return (
    <div
      className={`
        ${dimensions}
        relative flex shrink-0 items-center
        justify-center overflow-hidden
        rounded-2xl border border-white/5
        bg-white/[0.045] p-3
      `}
    >
      {hasImage && resolvedUrl ? (
        // Standard img supports external and backend URLs
        // without requiring Next.js remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={resolvedUrl}
          src={resolvedUrl}
          alt={`${name} club crest`}
          className="h-full w-full object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(resolvedUrl)}
        />
      ) : (
        <Shield
          className="h-8 w-8 text-lime-400"
          strokeWidth={1.8}
        />
      )}
    </div>
  );
}

// ==========================================
// STAT CARD
// ==========================================

function StatCard({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111714] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">
            {label}
          </p>

          <h3 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {value}
          </h3>

          <p className="mt-2 text-xs text-zinc-500">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-lime-400/10 p-3 text-lime-400">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TEAM CARD
// ==========================================

function TeamCard({ team }: { team: Team }) {
  const resolvedLogo = resolveTeamLogoUrl(team.logoUrl);

  return (
    <article className="group rounded-2xl border border-white/10 bg-[#111714] p-5 transition-all duration-200 hover:border-lime-400/30 hover:bg-[#151d18]">
      <div className="flex items-start gap-4">
        <TeamLogo
          name={team.name}
          logoUrl={team.logoUrl}
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-white">
            {team.name}
          </h3>

          <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
            <Globe2 size={13} />
            <span>{team.country}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-lime-400/15 bg-lime-400/10 px-2.5 py-1 text-xs font-medium text-lime-400">
              Coefficient: {team.coefficient}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {resolvedLogo ? (
            <>
              <CheckCircle2
                size={14}
                className="text-lime-400"
              />
              Logo URL available
            </>
          ) : (
            <>
              <ImageOff
                size={14}
                className="text-amber-400"
              />
              No logo URL
            </>
          )}
        </div>

        <span className="text-xs text-zinc-500">
          FootballSim Club
        </span>
      </div>
    </article>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function TeamsTestPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [sort, setSort] =
    useState<SortOption>("name-asc");

  // ========================================
  // FETCH TEAMS
  // ========================================

  const fetchTeams = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await fetch("/api/teams", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        const data: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof data === "object" &&
            data !== null &&
            "message" in data &&
            typeof data.message === "string"
              ? data.message
              : "Unable to load teams.";

          throw new Error(message);
        }

        if (!Array.isArray(data)) {
          throw new Error(
            "Invalid teams response from the server."
          );
        }

        setTeams(data as Team[]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading teams."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchTeams();
  }, [fetchTeams]);

  // ========================================
  // COUNTRIES
  // ========================================

  const countries = useMemo(() => {
    return [...new Set(teams.map((t) => t.country))]
      .sort((a, b) => a.localeCompare(b));
  }, [teams]);

  // ========================================
  // FILTER AND SORT
  // ========================================

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = teams.filter((team) => {
      const matchesSearch =
        team.name.toLowerCase().includes(query) ||
        team.country.toLowerCase().includes(query);

      const matchesCountry =
        country === "all" ||
        team.country === country;

      return matchesSearch && matchesCountry;
    });

    result.sort((a, b) => {
      switch (sort) {
        case "name-desc":
          return b.name.localeCompare(a.name);

        case "coefficient-desc":
          return b.coefficient - a.coefficient;

        case "coefficient-asc":
          return a.coefficient - b.coefficient;

        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [teams, search, country, sort]);

  // ========================================
  // STATISTICS
  // ========================================

  const totalTeams = teams.length;

  const teamsWithLogos = teams.filter(
    (team) => Boolean(resolveTeamLogoUrl(team.logoUrl))
  ).length;

  const teamsWithoutLogos =
    totalTeams - teamsWithLogos;

  const totalCountries = countries.length;

  // ========================================
  // RENDER
  // ========================================

  return (
    <main className="min-h-screen bg-[#080d0a] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-lime-400">
              <Trophy size={15} />
              FootballSim Arena
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Teams & Clubs
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Explore and manage your football clubs,
              crests, and coefficients.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchTeams(true)}
            disabled={loading || refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />
            Refresh teams
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              <p className="font-medium">
                Failed to load teams
              </p>

              <p className="mt-1">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* STATISTICS */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Clubs"
            value={totalTeams}
            icon={Users}
            description="Registered football clubs"
          />

          <StatCard
            label="Logo URLs"
            value={teamsWithLogos}
            icon={ShieldCheck}
            description="Clubs with a saved logo URL"
          />

          <StatCard
            label="Missing Logos"
            value={teamsWithoutLogos}
            icon={ImageOff}
            description="Clubs without logo URLs"
          />

          <StatCard
            label="Countries"
            value={totalCountries}
            icon={Globe2}
            description="Represented nations"
          />
        </div>

        {/* FILTERS */}

        <div className="mb-6 rounded-2xl border border-white/10 bg-[#111714] p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_200px_220px]">
            {/* SEARCH */}

            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search clubs or countries..."
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0b110d] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-lime-400/40"
              />
            </div>

            {/* COUNTRY */}

            <div className="relative">
              <Globe2
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <select
                value={country}
                onChange={(e) =>
                  setCountry(e.target.value)
                }
                className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#0b110d] pl-10 pr-4 text-sm text-white outline-none focus:border-lime-400/40"
              >
                <option value="all">
                  All countries
                </option>

                {countries.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* SORT */}

            <div className="relative">
              <ArrowUpDown
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value as SortOption)
                }
                className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#0b110d] pl-10 pr-4 text-sm text-white outline-none focus:border-lime-400/40"
              >
                <option value="name-asc">
                  Name: A to Z
                </option>

                <option value="name-desc">
                  Name: Z to A
                </option>

                <option value="coefficient-desc">
                  Highest coefficient
                </option>

                <option value="coefficient-asc">
                  Lowest coefficient
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* RESULTS HEADER */}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">
            Showing{" "}
            <span className="font-semibold text-white">
              {filteredTeams.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-white">
              {totalTeams}
            </span>{" "}
            clubs
          </p>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <ArrowDownAZ size={15} />
            Live API data
          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-[#111714]">
            <Loader2
              size={30}
              className="animate-spin text-lime-400"
            />

            <p className="text-sm text-zinc-400">
              Loading football clubs...
            </p>
          </div>
        ) : filteredTeams.length === 0 ? (
          /* EMPTY STATE */

          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#111714] p-6 text-center">
            <Shield
              size={36}
              className="mb-4 text-zinc-500"
            />

            <h3 className="font-semibold text-white">
              No clubs found
            </h3>

            <p className="mt-2 max-w-sm text-sm text-zinc-400">
              Try changing your search or country filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCountry("all");
                setSort("name-asc");
              }}
              className="mt-5 rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* TEAM GRID */

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
              />
            ))}
          </div>
        )}

        {/* FOOTER */}

        {!loading && filteredTeams.length > 0 && (
          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-zinc-500">
            FootballSim — Competition Management Platform
          </div>
        )}
      </div>
    </main>
  );
}
