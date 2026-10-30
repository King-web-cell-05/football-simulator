"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CalendarClock,
  ChartNoAxesCombined,
  ChevronDown,
  Goal,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import CompetitionDetails from "@/components/dashboard/competitions-detail";
import LeaguePhase from "@/components/dashboard/league-phase";

// =====================================================
// TYPES
// =====================================================

type User = {
  id: string;
  fullName: string;
  email: string;
};

type Fixture = {
  id: string;
  matchDay: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  competitionName: string;
  isPlayed: boolean;
};

type DashboardSummary = {
  generatedAtUtc: string;
  totalCompetitions: number;
  registeredTeams: number;
  totalMatches: number;
  matchesPlayed: number;
  goalsScored: number;
  currentMatchday: number;
  activeCompetition: {
    id: string;
    name: string;
    season: string;
    createdDate: string;
  } | null;
  upcomingFixtures: Fixture[];
};

type CompetitionRecord = {
  id: string;
  name: string;
  season: string;
  createdDate: string;
};

type NavigationItem = {
  label: string;
  icon: LucideIcon;
  section: string;
};

// =====================================================
// NAVIGATION
// =====================================================

const navigation: {
  heading: string;
  items: NavigationItem[];
}[] = [
  {
    heading: "Overview",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        section: "dashboard",
      },
    ],
  },
  {
    heading: "Competitions",
    items: [
      {
        label: "All Competitions",
        icon: Trophy,
        section: "competitions",
      },
      {
        label: "Create Competition",
        icon: Plus,
        section: "create-competition",
      },
      {
        label: "League Phase",
        icon: Activity,
        section: "league-phase",
      },
      {
        label: "Knockout Stage",
        icon: ArrowRight,
        section: "knockout-stage",
      },
    ],
  },
  {
    heading: "Football Data",
    items: [
      {
        label: "Teams",
        icon: Users,
        section: "teams",
      },
      {
        label: "Fixtures",
        icon: CalendarDays,
        section: "fixtures",
      },
      {
        label: "Results",
        icon: CalendarClock,
        section: "results",
      },
      {
        label: "Standings",
        icon: ChartNoAxesCombined,
        section: "standings",
      },
    ],
  },
  {
    heading: "System",
    items: [
      {
        label: "Settings",
        icon: Settings,
        section: "settings",
      },
    ],
  },
];

const allNavigationItems = navigation.flatMap((group) => group.items);

const validSections = new Set(allNavigationItems.map((item) => item.section));

function getSectionFromUrl(): string {
  if (typeof window === "undefined") {
    return "dashboard";
  }

  const params = new URLSearchParams(window.location.search);

  const section = params.get("section") ?? "dashboard";

  return validSections.has(section) ? section : "dashboard";
}

function getCompetitionIdFromUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);

  if (params.get("section") !== "competitions") {
    return null;
  }

  return params.get("competitionId");
}

// =====================================================
// HELPERS
// =====================================================

function formatFirstName(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0];

  if (!firstName) return "Manager";

  return (
    firstName.charAt(0).toLocaleUpperCase() +
    firstName.slice(1).toLocaleLowerCase()
  );
}

function formatFullName(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toLocaleUpperCase() + part.slice(1).toLocaleLowerCase(),
    )
    .join(" ");
}

function getInitials(fullName: string): string {
  return (
    fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "FS"
  );
}

function getGreeting(date: Date): string {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const panel = "rounded-2xl border border-white/[0.075] bg-[#101319]";

const muted = "text-[#8b98aa]";

// =====================================================
// FOOTBALL VISUALS
// =====================================================

function FootballBall({
  className = "",
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      animate={animate ? { rotate: 360, y: [0, -8, 0] } : undefined}
      transition={
        animate
          ? {
              rotate: {
                duration: 24,
                repeat: Infinity,
                ease: "linear",
              },
              y: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }
          : undefined
      }
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        className="h-full w-full drop-shadow-[0_0_25px_rgba(183,245,106,0.12)]"
      >
        <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2" />
        <path
          d="M50 28 68 41 61 62 39 62 32 41Z"
          fill="currentColor"
          fillOpacity=".18"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M50 28 49 5M68 41 90 34M61 62 76 83M39 62 24 83M32 41 10 34M49 5 29 15 10 34 8 58 24 83 50 96 76 83 92 58 90 34 71 15 49 5Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </motion.div>
  );
}

function PitchLines({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 560 300"
      fill="none"
      className={`pointer-events-none ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect
        x="12"
        y="12"
        width="536"
        height="276"
        rx="4"
        stroke="currentColor"
      />
      <path d="M280 12V288" stroke="currentColor" />
      <circle cx="280" cy="150" r="54" stroke="currentColor" />
      <circle cx="280" cy="150" r="3" fill="currentColor" />
      <rect x="12" y="74" width="90" height="152" stroke="currentColor" />
      <rect x="458" y="74" width="90" height="152" stroke="currentColor" />
      <rect x="12" y="113" width="34" height="74" stroke="currentColor" />
      <rect x="514" y="113" width="34" height="74" stroke="currentColor" />
    </svg>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-white/[0.075] ${className}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-[#080a0d] p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-7">
        <div className="flex items-center gap-3">
          <FootballBall className="h-10 w-10 text-[#b7f56a]" />
          <span className="text-xl font-bold">
            Football<span className="text-[#b7f56a]">Sim</span>
          </span>
        </div>

        <SkeletonLine className="mt-14 h-10 w-72" />
        <SkeletonLine className="h-4 w-96 max-w-full" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={`${panel} space-y-5 p-6`}>
              <SkeletonLine className="h-10 w-10" />
              <SkeletonLine className="h-4 w-32" />
              <SkeletonLine className="h-9 w-20" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// =====================================================
// ALL COMPETITIONS — LIVE API
// =====================================================

function CompetitionsSection({
  onCreate,
  onOpen,
}: {
  onCreate: () => void;
  onOpen: (id: string) => void;
}) {
  const reducedMotion = useReducedMotion();

  const [items, setItems] = useState<CompetitionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/competitions", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            payload &&
            typeof payload === "object" &&
            "message" in payload &&
            typeof payload.message === "string"
              ? payload.message
              : `Could not load competitions (HTTP ${response.status}).`;

          throw new Error(message);
        }

        if (!Array.isArray(payload)) {
          throw new Error("Unexpected competitions response.");
        }

        const parsed: CompetitionRecord[] = payload
          .filter(
            (entry): entry is CompetitionRecord =>
              entry !== null &&
              typeof entry === "object" &&
              typeof entry.id === "string" &&
              typeof entry.name === "string",
          )
          .map((entry) => ({
            id: entry.id,
            name: entry.name,
            season: typeof entry.season === "string" ? entry.season : "",
            createdDate:
              typeof entry.createdDate === "string" ? entry.createdDate : "",
          }));

        if (!controller.signal.aborted) {
          setItems(parsed);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load competitions.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [reload]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return items.filter((item) =>
      `${item.name} ${item.season}`.toLowerCase().includes(term),
    );
  }, [items, query]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b7f56a]">
            <Goal size={15} />
            FootballSim / Tournament Hub
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            All <span className="text-[#b7f56a]">Competitions</span>
          </h1>

          <p className="mt-2 text-sm text-[#8b98aa]">
            Your tournaments, seasons and competition workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#b7f56a] px-5 text-xs font-bold text-[#080a0d] transition hover:bg-[#caff91]"
        >
          <Plus size={16} />
          Create competition
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#b7f56a]/15 bg-gradient-to-r from-[#142019] via-[#101a16] to-[#101319] p-6 sm:p-8">
        <PitchLines className="absolute -right-24 -top-20 h-64 w-[450px] text-[#b7f56a]/[0.09]" />

        <FootballBall
          className="absolute right-8 top-6 hidden h-24 w-24 text-[#b7f56a]/30 sm:block"
          animate={!reducedMotion}
        />

        <div className="relative max-w-lg">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b7f56a]">
            The competition arena
          </p>

          <h2 className="mt-3 text-xl font-semibold sm:text-2xl">
            Every great tournament starts here.
          </h2>

          <p className="mt-2 text-xs leading-6 text-[#9aaa9c]">
            Manage your tournaments and follow every season from kickoff to the
            final whistle.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#788596]"
          />

          <input
            aria-label="Search competitions"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search competitions or seasons..."
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#101319] pl-11 pr-4 text-xs text-white outline-none placeholder:text-[#667386] focus:border-[#b7f56a]/40"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8b98aa]">
            {loading
              ? "Loading competitions..."
              : `${filtered.length} competitions`}
          </span>

          <button
            type="button"
            disabled={loading}
            aria-label="Refresh competitions"
            onClick={() => setReload((value) => value + 1)}
            className="rounded-xl border border-white/[0.08] bg-[#101319] p-3 text-[#b7f56a] disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`${panel} animate-pulse p-6`}>
              <SkeletonLine className="h-12 w-12" />
              <SkeletonLine className="mt-8 h-5 w-3/4" />
              <SkeletonLine className="mt-3 h-3 w-1/3" />
              <SkeletonLine className="mt-8 h-10 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className={`${panel} px-6 py-14 text-center`}>
          <AlertCircle size={28} className="mx-auto text-red-300" />

          <h3 className="mt-4 font-semibold">Unable to load competitions</h3>

          <p className="mt-2 text-xs text-[#8b98aa]">{error}</p>

          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className="mt-5 rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-bold text-black"
          >
            Try again
          </button>
        </div>
      ) : filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, index) => (
            <motion.article
              key={item.id}
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: Math.min(index, 8) * 0.04,
              }}
              className={`${panel} group relative overflow-hidden p-6 transition-colors hover:border-[#b7f56a]/30`}
            >
              <div className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#b7f56a]/20 bg-[#b7f56a]/[0.08] text-[#b7f56a]">
                  <Trophy size={22} />
                </span>

                <span className="rounded-full border border-white/[0.09] px-3 py-1.5 text-[9px] text-[#a3afbc]">
                  Tournament
                </span>
              </div>

              <h3 className="mt-7 min-h-12 text-lg font-semibold tracking-tight">
                {item.name}
              </h3>

              <p className="mt-2 text-xs text-[#b7f56a]">
                {item.season || "Season not specified"}
              </p>

              <div className="mt-7 flex items-center gap-2 border-t border-white/[0.07] pt-5 text-[11px] text-[#8794a5]">
                <CalendarDays size={14} />
                Created{" "}
                {item.createdDate && !Number.isNaN(Date.parse(item.createdDate))
                  ? new Intl.DateTimeFormat("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(item.createdDate))
                  : "date unavailable"}
              </div>

              <button
                type="button"
                onClick={() => onOpen(item.id)}
                className="mt-6 flex w-full items-center justify-between rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.05] px-4 py-3 text-xs font-semibold text-[#b7f56a] transition hover:bg-[#b7f56a]/[0.11]"
              >
                Manage competition
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className={`${panel} px-6 py-16 text-center`}>
          <Trophy size={34} className="mx-auto text-[#b7f56a]" />

          <h3 className="mt-4 text-lg font-semibold">
            {query ? "No matching competitions" : "No competitions yet"}
          </h3>

          <p className="mt-2 text-xs text-[#8b98aa]">
            {query
              ? "Try another search term."
              : "Create your first competition to get started."}
          </p>

          {!query && (
            <button
              type="button"
              onClick={onCreate}
              className="mt-5 rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-bold text-black"
            >
              Create competition
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// =====================================================
// DASHBOARD PAGE
// =====================================================

export default function DashboardPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const [activeSection, setActiveSection] = useState("dashboard");

  const [selectedCompetitionId, setSelectedCompetitionId] = useState<
    string | null
  >(null);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // ===================================================
  // URL SYNCHRONIZATION
  // ===================================================

  useEffect(() => {
    function syncSection() {
      setActiveSection(getSectionFromUrl());
      setSelectedCompetitionId(getCompetitionIdFromUrl());
    }

    syncSection();

    window.addEventListener("popstate", syncSection);

    return () => window.removeEventListener("popstate", syncSection);
  }, []);

  const selectSection = useCallback((section: string) => {
    const nextSection = validSections.has(section) ? section : "dashboard";

    setActiveSection(nextSection);
    setSelectedCompetitionId(null);
    setMobileNavOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
    setAccountMenuOpen(false);
    setNotificationsOpen(false);

    const url = new URL(window.location.href);

    url.searchParams.delete("competitionId");

    if (nextSection === "dashboard") {
      url.searchParams.delete("section");
    } else {
      url.searchParams.set("section", nextSection);
    }

    window.history.pushState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const openCompetition = useCallback((competitionId: string) => {
    const url = new URL(window.location.href);

    url.searchParams.set("section", "competitions");
    url.searchParams.set("competitionId", competitionId);

    window.history.pushState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );

    setActiveSection("competitions");
    setSelectedCompetitionId(competitionId);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const closeCompetition = useCallback(() => {
    const url = new URL(window.location.href);

    url.searchParams.delete("competitionId");

    window.history.pushState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );

    setSelectedCompetitionId(null);
  }, []);

  const activeNavigationItem = allNavigationItems.find(
    (item) => item.section === activeSection,
  );

  const activeSectionLabel = activeNavigationItem?.label ?? "Dashboard";

  // ===================================================
  // DATE
  // ===================================================

  useEffect(() => {
    setCurrentDate(new Date());

    const interval = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  // ===================================================
  // AUTHENTICATION AND DASHBOARD DATA
  // ===================================================

  const loadDashboard = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setDashboardError("");
        setLoadingSummary(true);

        const sessionResponse = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal,
        });

        if (sessionResponse.status === 401 || sessionResponse.status === 403) {
          router.replace("/login");
          return;
        }

        if (!sessionResponse.ok) {
          throw new Error("Unable to validate your session.");
        }

        const sessionData = await sessionResponse.json();

        if (!sessionData?.user?.id || !sessionData?.user?.fullName) {
          throw new Error("Invalid account information.");
        }

        if (signal?.aborted) return;

        setUser(sessionData.user);
        setCheckingSession(false);

        const summaryResponse = await fetch("/api/dashboard/summary", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal,
        });

        if (summaryResponse.status === 401 || summaryResponse.status === 403) {
          router.replace("/login");
          return;
        }

        const data = await summaryResponse.json().catch(() => null);

        if (!summaryResponse.ok) {
          throw new Error(
            data?.message ||
              `Unable to load dashboard (HTTP ${summaryResponse.status}).`,
          );
        }

        if (
          !data ||
          typeof data.totalCompetitions !== "number" ||
          !Array.isArray(data.upcomingFixtures)
        ) {
          throw new Error("Unexpected dashboard API response.");
        }

        if (signal?.aborted) return;

        setSummary(data);
      } catch (error) {
        if (signal?.aborted) return;

        setDashboardError(
          error instanceof Error ? error.message : "Unable to load dashboard.",
        );
      } finally {
        if (!signal?.aborted) {
          setCheckingSession(false);
          setLoadingSummary(false);
        }
      }
    },
    [router],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadDashboard(controller.signal);

    return () => controller.abort();
  }, [loadDashboard]);

  // ===================================================
  // SIGN OUT
  // ===================================================

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Unable to sign out.");
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setDashboardError("Unable to sign out. Please try again.");
      setSigningOut(false);
      setAccountMenuOpen(false);
    }
  }

  // ===================================================
  // SEARCH SHORTCUT
  // ===================================================

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setAccountMenuOpen(false);
        setNotificationsOpen(false);
        setMobileNavOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredNavigation = useMemo(
    () =>
      allNavigationItems.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery],
  );

  // ===================================================
  // DASHBOARD STATISTICS
  // ===================================================

  const stats = [
    {
      label: "Registered teams",
      value: summary?.registeredTeams ?? "—",
      detail: "In the current workspace",
      icon: Users,
    },
    {
      label: "Matches played",
      value: summary?.matchesPlayed ?? "—",
      detail: summary
        ? `Of ${summary.totalMatches} scheduled`
        : "Waiting for API data",
      icon: CalendarDays,
    },
    {
      label: "Goals scored",
      value: summary?.goalsScored ?? "—",
      detail: "From completed matches",
      icon: Trophy,
    },
    {
      label: "Competitions",
      value: summary?.totalCompetitions ?? "—",
      detail: "Stored in your database",
      icon: ChartNoAxesCombined,
    },
  ];

  const matchProgress =
    summary && summary.totalMatches > 0
      ? Math.min(
          100,
          Math.round((summary.matchesPlayed / summary.totalMatches) * 100),
        )
      : 0;

  const competition = summary?.activeCompetition;

  if (checkingSession) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0d] px-5 text-white">
        <div className="max-w-sm text-center">
          <ShieldCheck size={30} className="mx-auto text-[#b7f56a]" />

          <h1 className="mt-4 text-xl font-semibold">Session unavailable</h1>

          <p className="mt-2 text-sm text-[#8b98aa]">
            {dashboardError || "Please sign in to continue."}
          </p>

          <Link
            href="/login"
            className="mt-5 inline-flex rounded-xl bg-[#b7f56a] px-5 py-3 text-sm font-semibold text-black"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  const firstName = formatFirstName(user.fullName);
  const fullName = formatFullName(user.fullName);
  const initials = getInitials(user.fullName);

  // ===================================================
  // MAIN RENDER
  // ===================================================

  return (
    <main className="min-h-screen bg-[#080a0d] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-48 -top-48 h-[520px] w-[520px] rounded-full bg-[#b7f56a]/[0.035] blur-[120px]" />
      </div>

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      {/* ============================================= */}
      {/* SIDEBAR */}
      {/* ============================================= */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/[0.065] bg-[#0b0e12] transition-transform duration-300 lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[78px] shrink-0 items-center justify-between border-b border-white/[0.06] px-6">
          <Link
            href="/dashboard"
            onClick={(event) => {
              event.preventDefault();
              selectSection("dashboard");
            }}
            className="flex items-center gap-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b7f56a]/30 bg-[#b7f56a]/[0.08] text-[#b7f56a]">
              <FootballBall className="h-6 w-6" animate={!reducedMotion} />
            </span>

            <span className="text-[17px] font-bold tracking-tight">
              Football
              <span className="text-[#b7f56a]">Sim</span>
            </span>
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileNavOpen(false)}
            className="p-2 text-[#8b98aa] lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pb-3 pt-4">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-xs text-[#8b98aa]"
          >
            <Search size={15} />

            <span className="flex-1 text-left">Find a workspace</span>

            <span className="rounded-md border border-white/[0.09] px-1.5 py-1 text-[9px]">
              Ctrl K
            </span>
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-5 pt-3">
          {navigation.map((group) => (
            <div key={group.heading}>
              <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.19em] text-[#647083]">
                {group.heading}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeSection === item.section;

                  return (
                    <button
                      key={item.section}
                      type="button"
                      onClick={() => selectSection(item.section)}
                      className={`relative flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-medium transition ${
                        active
                          ? "bg-[#b7f56a]/[0.085] text-[#c9fb8b]"
                          : "text-[#98a3b2] hover:bg-white/[0.045] hover:text-white"
                      }`}
                    >
                      {active && (
                        <span className="absolute -left-3 top-2.5 h-5 w-[3px] rounded-r-full bg-[#b7f56a]" />
                      )}

                      <Icon
                        size={16}
                        className={active ? "text-[#b7f56a]" : "text-[#758194]"}
                      />

                      <span className="flex-1">{item.label}</span>

                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#b7f56a]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/[0.06] p-3">
          <div className="mb-3 rounded-xl border border-[#b7f56a]/10 bg-[#b7f56a]/[0.035] p-3">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#b7f56a]" />

              <span className="text-[11px] font-semibold">
                Manager workspace
              </span>
            </div>

            <p className="text-[10px] leading-4 text-[#758192]">
              Manage competitions, clubs and seasons in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => selectSection("settings")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-[#98a3b2] hover:bg-white/[0.04]"
          >
            <Settings size={15} />
            Preferences
          </button>
        </div>
      </aside>

      {/* ============================================= */}
      {/* MAIN WORKSPACE */}
      {/* ============================================= */}

      <div className="relative min-h-screen lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080a0d]/90 backdrop-blur-xl">
          <div className="flex h-[78px] items-center justify-between gap-3 px-4 sm:px-7 xl:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setMobileNavOpen(true)}
                className="rounded-xl border border-white/[0.08] p-2.5 text-[#9aa5b4] lg:hidden"
              >
                <Menu size={18} />
              </button>

              <div className="flex min-w-0 items-center gap-2 text-[11px]">
                <span className="hidden text-[#647083] sm:inline">
                  Workspace
                </span>

                <span className="hidden text-[#414c5b] sm:inline">/</span>

                <span className="truncate font-medium text-[#dfe5ec]">
                  {selectedCompetitionId
                    ? "Competition Details"
                    : activeSectionLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden items-center gap-2 rounded-full border border-[#b7f56a]/15 bg-[#b7f56a]/[0.045] px-3 py-2 md:flex">
                <span className="h-2 w-2 rounded-full bg-[#b7f56a]" />

                <span className="text-[10px] text-[#b7d997]">
                  {loadingSummary ? "Refreshing data" : "Dashboard"}
                </span>
              </div>

              <button
                type="button"
                aria-label="Search workspace"
                onClick={() => setSearchOpen(true)}
                className="rounded-lg p-2 text-[#8b97a8] hover:bg-white/[0.05]"
              >
                <Search size={17} />
              </button>

              <div className="relative">
                <button
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="rounded-lg p-2 text-[#8b97a8] hover:bg-white/[0.05]"
                >
                  <Bell size={17} />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-white/[0.09] bg-[#10151b] p-4 shadow-2xl">
                    <p className="text-xs font-semibold">Notifications</p>

                    <p className="mt-2 text-xs leading-5 text-[#8793a4]">
                      Competition notifications will appear here when connected.
                    </p>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  aria-label="Account menu"
                  aria-expanded={accountMenuOpen}
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.035] p-1"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#b7f56a]/20 bg-[#b7f56a]/[0.11] text-[10px] font-bold text-[#c7fa8c]">
                    {initials}
                  </span>

                  <ChevronDown
                    size={13}
                    className="mr-1 hidden text-[#788596] sm:block"
                  />
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-white/[0.1] bg-[#10151b] p-2 shadow-2xl">
                    <div className="border-b border-white/[0.07] px-3 py-3">
                      <p className="truncate text-xs font-semibold">
                        {fullName}
                      </p>

                      <p className="mt-1 truncate text-[10px] text-[#7d8999]">
                        {user.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        selectSection("settings");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-[#a9b4c1] hover:bg-white/[0.05]"
                    >
                      <Settings size={14} />
                      Account settings
                    </button>

                    <button
                      type="button"
                      disabled={signingOut}
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-red-300 hover:bg-red-400/[0.08] disabled:opacity-50"
                    >
                      <LogOut size={14} />
                      {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* =========================================== */}
        {/* SEARCH DIALOG */}
        {/* =========================================== */}

        {searchOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search dashboard"
            className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 px-4 pt-[15vh] backdrop-blur-sm"
          >
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.1] bg-[#10151b] shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/[0.07] px-4">
                <Search size={18} className="text-[#8490a0]" />

                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Find a dashboard section..."
                  className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />

                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="rounded-lg p-2 text-[#8b98aa]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto p-2">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.section}
                      type="button"
                      onClick={() => selectSection(item.section)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs text-[#b2bdca] hover:bg-white/[0.05]"
                    >
                      <Icon size={16} className="text-[#b7f56a]" />

                      {item.label}
                    </button>
                  );
                })}

                {filteredNavigation.length === 0 && (
                  <p className="p-4 text-xs text-[#8b98aa]">
                    No matching sections found.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================== */}
        {/* MAIN CONTENT */}
        {/* =========================================== */}

        <div className="mx-auto w-full max-w-[1720px] px-4 pb-10 pt-7 sm:px-7 sm:pt-9 xl:px-10">
          {dashboardError && (
            <div
              role="alert"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4"
            >
              <p className="text-xs text-red-200">{dashboardError}</p>

              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="rounded-lg border border-red-300/20 px-3 py-2 text-xs text-red-200"
              >
                Retry
              </button>
            </div>
          )}

          {activeSection === "competitions" ? (
            selectedCompetitionId ? (
              <CompetitionDetails
                competitionId={selectedCompetitionId}
                onBack={closeCompetition}
              />
            ) : (
              <CompetitionsSection
                onCreate={() => selectSection("create-competition")}
                onOpen={openCompetition}
              />
            )
          ) : activeSection === "league-phase" ? (
            <LeaguePhase
              initialCompetitionId={summary?.activeCompetition?.id}
              onOpenCompetition={openCompetition}
            />
          ) : activeSection !== "dashboard" ? (
            <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <FootballBall
                className="h-20 w-20 text-[#b7f56a]"
                animate={!reducedMotion}
              />

              <h1 className="mt-6 text-3xl font-semibold">
                {activeSectionLabel}
              </h1>

              <p className="mt-3 max-w-md text-sm leading-6 text-[#8d9aab]">
                This section will be connected to the corresponding FootballSim
                API endpoints.
              </p>

              <button
                type="button"
                onClick={() => selectSection("dashboard")}
                className="mt-6 flex items-center gap-2 rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-bold text-black"
              >
                <LayoutDashboard size={16} />
                Back to dashboard
              </button>
            </section>
          ) : (
            <div className="space-y-6">
              {/* GREETING */}

              <motion.section
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col justify-between gap-6 2xl:flex-row 2xl:items-end"
              >
                <div>
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.17em] text-[#76869c]">
                    {currentDate ? formatDate(currentDate) : "\u00a0"}
                  </p>

                  <h1 className="text-[30px] font-semibold tracking-[-0.055em] text-[#f4f6f8] sm:text-[37px]">
                    {currentDate ? getGreeting(currentDate) : "Welcome"},{" "}
                    <span className="text-[#b7f56a]">{firstName}</span>
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8996a7]">
                    Your competition overview, matchday activity, and tournament
                    progress at a glance.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-[230px] items-center gap-3 rounded-xl border border-white/[0.09] bg-[#10151b] px-3.5 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#b7f56a]/10 text-[#b7f56a]">
                      <Trophy size={18} />
                    </span>

                    <div className="min-w-0">
                      <p className="text-[9px] text-[#778597]">
                        Latest competition
                      </p>

                      <p className="mt-1 truncate text-xs font-semibold">
                        {competition?.name || "No competition created"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => selectSection("create-competition")}
                    className="flex h-[52px] items-center justify-center gap-3 rounded-xl bg-[#b7f56a] px-5 text-xs font-bold text-black transition hover:bg-[#c9ff87]"
                  >
                    <Plus size={16} />
                    Create competition
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </motion.section>

              {/* FOOTBALL BANNER */}

              <div className="relative overflow-hidden rounded-2xl border border-[#b7f56a]/[0.14] bg-gradient-to-r from-[#122018] via-[#101a16] to-[#101319] px-5 py-5 sm:px-7">
                <PitchLines className="absolute -right-14 -top-16 h-56 w-[420px] text-[#b7f56a]/[0.09]" />

                <div className="relative z-10 flex items-center justify-between gap-5">
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.19em] text-[#b7f56a]">
                      The simulation hub
                    </p>

                    <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                      Every match tells a story.
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-[#92a498]">
                      Build the fixtures. Run the simulation. Watch your
                      tournament unfold.
                    </p>
                  </div>

                  <FootballBall
                    className="h-16 w-16 shrink-0 text-[#b7f56a]/75 sm:h-20 sm:w-20"
                    animate={!reducedMotion}
                  />
                </div>
              </div>

              {/* STATISTICS */}

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#657287]">
                    Live database snapshot
                  </p>

                  <span className="rounded-md border border-white/[0.06] px-2 py-1 text-[9px] text-[#768396]">
                    {loadingSummary
                      ? "Loading"
                      : summary
                        ? "API data"
                        : "Unavailable"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                      <motion.article
                        key={stat.label}
                        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                        }}
                        className={`${panel} group p-5 transition duration-300 hover:-translate-y-1 hover:border-[#b7f56a]/25`}
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.06] text-[#b7f56a]">
                          <Icon size={19} />
                        </span>

                        <p className="mt-5 text-xs text-[#8b98aa]">
                          {stat.label}
                        </p>

                        <p className="mt-2 text-3xl font-semibold tracking-tight">
                          {stat.value}
                        </p>

                        <p className="mt-2 text-[10px] text-[#6d7c8e]">
                          {stat.detail}
                        </p>
                      </motion.article>
                    );
                  })}
                </div>
              </section>

              {/* COMPETITION OVERVIEW */}

              <div className="grid gap-4 2xl:grid-cols-[1.65fr_0.9fr]">
                <div className={`${panel} overflow-hidden`}>
                  <div className="border-b border-white/[0.06] p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#b7f56a]">
                          Competition overview
                        </p>

                        <h2 className="mt-2 text-xl font-semibold">
                          {competition?.name || "Your tournament workspace"}
                        </h2>
                      </div>

                      <Trophy size={28} className="text-[#b7f56a]" />
                    </div>

                    <p className="mt-3 text-xs text-[#8b98aa]">
                      {competition?.season || "Season not specified"}
                    </p>
                  </div>

                  <div className="space-y-6 p-6">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8b98aa]">Match completion</span>

                      <span className="font-semibold text-[#b7f56a]">
                        {matchProgress}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${matchProgress}%`,
                        }}
                        transition={{ duration: 0.7 }}
                        className="h-full rounded-full bg-[#b7f56a]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {[
                        {
                          label: "Total matches",
                          value: summary?.totalMatches ?? "—",
                        },
                        {
                          label: "Matches played",
                          value: summary?.matchesPlayed ?? "—",
                        },
                        {
                          label: "Matchday",
                          value: summary?.currentMatchday ?? "—",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl border border-white/[0.06] bg-[#0b0e12] p-4"
                        >
                          <p className="text-xl font-semibold">{item.value}</p>

                          <p className="mt-2 text-[10px] text-[#8794a5]">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (competition?.id) {
                          openCompetition(competition.id);
                        } else {
                          selectSection("competitions");
                        }
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-[#b7f56a]/20 bg-[#b7f56a]/[0.06] px-4 py-3 text-xs font-semibold text-[#b7f56a] hover:bg-[#b7f56a]/[0.1]"
                    >
                      Manage competitions
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

                <div className={`${panel} p-6`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Upcoming fixtures</h2>

                    <CalendarDays size={19} className="text-[#b7f56a]" />
                  </div>

                  <p className="mt-2 text-xs text-[#8b98aa]">
                    Next matches in your workspace.
                  </p>

                  <div className="mt-5 space-y-3">
                    {summary?.upcomingFixtures?.length ? (
                      summary.upcomingFixtures.slice(0, 4).map((fixture) => (
                        <div
                          key={fixture.id}
                          className="rounded-xl border border-white/[0.06] bg-[#0b0e12] p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-[10px] text-[#7d8a9b]">
                              Matchday {fixture.matchDay}
                            </span>

                            <span className="text-[10px] text-[#b7f56a]">
                              Scheduled
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="min-w-0 flex-1 truncate text-xs font-medium">
                              {fixture.homeTeam}
                            </span>

                            <span className="text-[10px] text-[#7d8a9b]">
                              VS
                            </span>

                            <span className="min-w-0 flex-1 truncate text-right text-xs font-medium">
                              {fixture.awayTeam}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-10 text-center">
                        <CalendarDays
                          size={25}
                          className="mx-auto text-[#b7f56a]/70"
                        />

                        <p className="mt-3 text-xs text-[#8b98aa]">
                          No upcoming fixtures available.
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => selectSection("fixtures")}
                    className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/[0.08] px-4 py-3 text-xs text-[#b7f56a] hover:bg-white/[0.03]"
                  >
                    View all fixtures
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>

              {/* QUICK ACTIONS */}

              <section className={`${panel} p-6`}>
                <div className="mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#b7f56a]">
                    Competition management
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">Your next move</h2>

                  <p className="mt-2 text-xs text-[#8b98aa]">
                    Navigate to the tools that power your football competition.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "Competitions",
                      detail: "Manage tournaments",
                      section: "competitions",
                      icon: Trophy,
                    },
                    {
                      label: "Teams",
                      detail: "Manage registered clubs",
                      section: "teams",
                      icon: Users,
                    },
                    {
                      label: "League phase",
                      detail: "Follow matchdays",
                      section: "league-phase",
                      icon: Activity,
                    },
                    {
                      label: "Knockout stage",
                      detail: "Track elimination rounds",
                      section: "knockout-stage",
                      icon: ArrowRight,
                    },
                  ].map((action) => {
                    const Icon = action.icon;

                    return (
                      <button
                        key={action.section}
                        type="button"
                        onClick={() => selectSection(action.section)}
                        className="group rounded-xl border border-white/[0.07] bg-[#0b0e12] p-4 text-left transition hover:border-[#b7f56a]/25 hover:bg-[#b7f56a]/[0.035]"
                      >
                        <Icon size={20} className="text-[#b7f56a]" />

                        <p className="mt-4 text-sm font-semibold">
                          {action.label}
                        </p>

                        <p className="mt-1 text-[10px] text-[#7c8999]">
                          {action.detail}
                        </p>

                        <ArrowUpRight
                          size={15}
                          className="mt-4 text-[#7c8999] transition group-hover:text-[#b7f56a]"
                        />
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
