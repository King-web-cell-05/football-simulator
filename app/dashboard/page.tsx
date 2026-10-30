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
  Check,
  ChevronDown,
  Clock3,
  Goal,
  CircleDot,
  Zap,
  Radio,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

// Football-inspired decorative elements: no images or extra dependencies.
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
              rotate: { duration: 24, repeat: Infinity, ease: "linear" },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
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

function DashboardSkeleton({ section = "dashboard" }: { section?: string }) {
  return (
    <main
      role="status"
      aria-label="Loading FootballSim dashboard"
      className="min-h-screen bg-[#080a0d] text-white"
    >
      <div className="fixed inset-y-0 left-0 hidden w-[264px] border-r border-white/[0.06] bg-[#0b0e12] p-5 lg:block">
        <div className="flex items-center gap-3">
          <FootballBall className="h-9 w-9 text-[#b7f56a]" />
          <span className="text-lg font-bold">
            Football<span className="text-[#b7f56a]">Sim</span>
          </span>
        </div>
        <div className="mt-12 space-y-5">
          {Array.from({ length: 3 }, (_, group) => (
            <div key={group} className="space-y-3">
              <SkeletonLine className="h-2 w-20" />
              {Array.from({ length: group === 0 ? 1 : 4 }, (_, i) => (
                <SkeletonLine key={i} className="h-9 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="lg:pl-[264px]">
        <div className="flex h-[78px] items-center justify-between border-b border-white/[0.06] px-5 sm:px-9">
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="h-9 w-28 rounded-full" />
        </div>
        <div className="mx-auto max-w-[1720px] space-y-6 px-4 py-9 sm:px-9">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-4">
              <SkeletonLine className="h-3 w-44" />
              <SkeletonLine className="h-10 w-72 max-w-[80vw]" />
              <SkeletonLine className="h-3 w-64 max-w-[70vw]" />
            </div>
            <FootballBall className="h-16 w-16 text-[#b7f56a]/70" />
          </div>
          {section === "dashboard" ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/[0.07] bg-[#101319] p-5"
                  >
                    <SkeletonLine className="h-9 w-9" />
                    <SkeletonLine className="mt-5 h-3 w-28" />
                    <SkeletonLine className="mt-3 h-9 w-20" />
                    <SkeletonLine className="mt-3 h-2 w-36" />
                  </div>
                ))}
              </div>
              <div className="grid gap-4 2xl:grid-cols-[1.65fr_0.9fr]">
                <div className="space-y-4">
                  <div className="h-72 rounded-2xl border border-[#b7f56a]/10 bg-[#101713] p-7">
                    <SkeletonLine className="h-6 w-36" />
                    <SkeletonLine className="mt-12 h-8 w-2/3" />
                    <SkeletonLine className="mt-5 h-3 w-1/2" />
                    <SkeletonLine className="mt-14 h-2 w-3/4" />
                  </div>
                  <div className="h-52 rounded-2xl border border-white/[0.07] bg-[#101319] p-7">
                    <SkeletonLine className="h-6 w-40" />
                    <SkeletonLine className="mt-10 h-14 w-3/4" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-72 rounded-2xl border border-white/[0.07] bg-[#101319] p-6">
                    <SkeletonLine className="h-6 w-40" />
                    {Array.from({ length: 3 }, (_, i) => (
                      <SkeletonLine key={i} className="mt-6 h-10 w-full" />
                    ))}
                  </div>
                  <div className="h-52 rounded-2xl border border-white/[0.07] bg-[#101319] p-6">
                    <SkeletonLine className="h-6 w-40" />
                    <SkeletonLine className="mt-7 h-10 w-full" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-80 rounded-2xl border border-white/[0.07] bg-[#101319] p-8">
              <SkeletonLine className="h-7 w-48" />
              <SkeletonLine className="mt-8 h-4 w-3/4" />
            </div>
          )}
          <span className="sr-only">Loading your football workspace</span>
        </div>
      </div>
    </main>
  );
}

// =====================================================
// DASHBOARD COMPONENT
// =====================================================

export default function DashboardPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  // Authentication
  const [user, setUser] = useState<User | null>(null);

  const [checkingSession, setCheckingSession] = useState(true);

  const [signingOut, setSigningOut] = useState(false);

  // Dashboard data
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const [loadingSummary, setLoadingSummary] = useState(true);

  const [dashboardError, setDashboardError] = useState("");

  // Navigation
  const [activeSection, setActiveSection] = useState("dashboard");

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // ===================================================
  // SYNCHRONIZE SECTION WITH URL
  // ===================================================

  useEffect(() => {
    function syncSection() {
      setActiveSection(getSectionFromUrl());
    }

    syncSection();

    window.addEventListener("popstate", syncSection);

    return () => {
      window.removeEventListener("popstate", syncSection);
    };
  }, []);

  const selectSection = useCallback((section: string) => {
    const nextSection = validSections.has(section) ? section : "dashboard";

    setActiveSection(nextSection);

    setMobileNavOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
    setAccountMenuOpen(false);
    setNotificationsOpen(false);

    const url = new URL(window.location.href);

    if (nextSection === "dashboard") {
      url.searchParams.delete("section");
    } else {
      url.searchParams.set("section", nextSection);
    }

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;

    window.history.pushState(null, "", nextUrl);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const activeNavigationItem = allNavigationItems.find(
    (item) => item.section === activeSection,
  );

  const activeSectionLabel = activeNavigationItem?.label ?? "Dashboard";

  // ===================================================
  // CURRENT DATE
  // ===================================================

  useEffect(() => {
    setCurrentDate(new Date());

    const interval = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  // ===================================================
  // AUTHENTICATION + DASHBOARD DATA
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
  // LOGOUT
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
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredNavigation = useMemo(
    () =>
      navigation.map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      })),
    [searchQuery],
  );

  // ===================================================
  // DASHBOARD STATS
  // ===================================================

  const stats = [
    {
      label: "Registered teams",
      value: summary?.registeredTeams ?? "—",
      detail: "In the current workspace",
      icon: Users,
      color: "lime",
    },
    {
      label: "Matches played",
      value: summary?.matchesPlayed ?? "—",
      detail: summary
        ? `Of ${summary.totalMatches} scheduled`
        : "Waiting for API data",
      icon: CalendarDays,
      color: "blue",
    },
    {
      label: "Goals scored",
      value: summary?.goalsScored ?? "—",
      detail: "From completed matches",
      icon: Trophy,
      color: "lime",
    },
    {
      label: "Competitions",
      value: summary?.totalCompetitions ?? "—",
      detail: "Stored in your database",
      icon: ChartNoAxesCombined,
      color: "blue",
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
  const showDashboardSkeleton = loadingSummary && !summary && !dashboardError;

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (checkingSession) {
    return <DashboardSkeleton section={activeSection} />;
  }

  // ===================================================
  // SESSION ERROR
  // ===================================================

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0d] px-5 text-white">
        <div className="max-w-sm text-center">
          <ShieldCheck size={28} className="mx-auto text-[#b7f56a]" />

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
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-48 -top-48 h-[520px] w-[520px] rounded-full bg-[#b7f56a]/[0.035] blur-[120px]" />
      </div>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      {/* =============================================
          SIDEBAR
      ============================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/[0.065] bg-[#0b0e12] transition-transform duration-300 lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
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

        {/* Sidebar search */}
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

        {/* Sidebar navigation */}
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

        {/* Sidebar bottom */}
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

      {/* =============================================
          MAIN WORKSPACE
      ============================================== */}

      <div className="relative min-h-screen lg:pl-[264px]">
        {/* Header */}
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
                  {activeSectionLabel}
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

              {/* Search */}
              <button
                type="button"
                aria-label="Search workspace"
                onClick={() => setSearchOpen(true)}
                className="rounded-lg p-2 text-[#8b97a8] hover:bg-white/[0.05]"
              >
                <Search size={17} />
              </button>

              {/* Notifications */}
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

              {/* Account menu */}
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

        {/* ===========================================
            SEARCH DIALOG
        ============================================ */}

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
                {filteredNavigation
                  .flatMap((group) => group.items)
                  .map((item) => {
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

                {filteredNavigation.every(
                  (group) => group.items.length === 0,
                ) && (
                  <p className="p-4 text-xs text-[#8b98aa]">
                    No matching sections found.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===========================================
            CONTENT
        ============================================ */}

        <div className="mx-auto w-full max-w-[1720px] px-4 pb-10 pt-7 sm:px-7 sm:pt-9 xl:px-10">
          {/* API error */}
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

          {/* =========================================
              OTHER SECTIONS
          ========================================== */}

          {showDashboardSkeleton ? (
            <div aria-live="polite" className="space-y-5">
              <div className="flex items-center gap-3 rounded-xl border border-[#b7f56a]/10 bg-[#b7f56a]/[0.035] p-4 text-xs text-[#b7f56a]">
                <FootballBall className="h-7 w-7" animate={!reducedMotion} />{" "}
                Preparing your matchday data...
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className={`${panel} p-5`}>
                    <SkeletonLine className="h-9 w-9" />
                    <SkeletonLine className="mt-5 h-3 w-24" />
                    <SkeletonLine className="mt-3 h-9 w-20" />
                  </div>
                ))}
              </div>
              <div className="grid gap-4 2xl:grid-cols-[1.65fr_0.9fr]">
                <div className={`${panel} h-72 p-6`}>
                  <SkeletonLine className="h-6 w-40" />
                  <SkeletonLine className="mt-14 h-10 w-2/3" />
                  <SkeletonLine className="mt-10 h-3 w-3/4" />
                </div>
                <div className={`${panel} h-72 p-6`}>
                  <SkeletonLine className="h-6 w-40" />
                  {Array.from({ length: 3 }, (_, i) => (
                    <SkeletonLine key={i} className="mt-6 h-10 w-full" />
                  ))}
                </div>
              </div>
            </div>
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

              <div className="mt-4 rounded-lg border border-white/[0.07] bg-white/[0.025] px-4 py-2 text-[10px] text-[#8b98aa]">
                Section: {activeSection}
              </div>

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
            <>
              {/* =====================================
                  GREETING
              ====================================== */}

              <motion.section
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-8 flex flex-col justify-between gap-6 2xl:flex-row 2xl:items-end"
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

              {/* Football identity strip: pitch diagram and moving match ball */}
              <div className="relative mb-6 overflow-hidden rounded-2xl border border-[#b7f56a]/[0.14] bg-gradient-to-r from-[#122018] via-[#101a16] to-[#101319] px-5 py-5 sm:px-7">
                <PitchLines className="absolute -right-14 -top-16 h-56 w-[420px] text-[#b7f56a]/[0.09]" />
                <div className="relative z-10 flex items-center justify-between gap-5">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.19em] text-[#b7f56a]">
                      <Radio
                        size={13}
                        className={reducedMotion ? "" : "animate-pulse"}
                      />{" "}
                      The simulation hub
                    </div>
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

              {/* =====================================
                  STATISTICS
              ====================================== */}

              <section className="mb-5">
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
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                        }}
                        className={`${panel} group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-[#b7f56a]/25 hover:shadow-[0_16px_40px_rgba(0,0,0,0.18)]`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                              stat.color === "lime"
                                ? "border-[#b7f56a]/15 bg-[#b7f56a]/10 text-[#b7f56a]"
                                : "border-blue-400/15 bg-blue-400/10 text-blue-300"
                            }`}
                          >
                            <Icon size={17} />
                          </span>

                          <FootballBall
                            className="h-5 w-5 text-[#b7f56a]/25 transition-transform duration-500 group-hover:rotate-45"
                            animate={false}
                          />
                        </div>

                        <p className={`mt-5 text-xs ${muted}`}>{stat.label}</p>

                        <p className="mt-2 text-[31px] font-semibold tracking-tight">
                          {loadingSummary ? "…" : stat.value}
                        </p>

                        <p className="mt-1 text-[10px] text-[#718094]">
                          {stat.detail}
                        </p>

                        {stat.label === "Matches played" && (
                          <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                            <div
                              className="h-full rounded-full bg-blue-400 transition-all"
                              style={{
                                width: `${matchProgress}%`,
                              }}
                            />
                          </div>
                        )}
                      </motion.article>
                    );
                  })}
                </div>
              </section>

              {/* =====================================
                  MAIN DASHBOARD GRID
              ====================================== */}

              <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
                <div className="space-y-4">
                  {/* Competition overview */}
                  <section className="relative overflow-hidden rounded-2xl border border-[#b7f56a]/15 bg-gradient-to-br from-[#121d18] via-[#101713] to-[#101319] p-5 sm:p-7">
                    <PitchLines className="absolute -right-32 top-1/2 h-64 w-[480px] -translate-y-1/2 text-[#b7f56a]/[0.07]" />
                    <FootballBall
                      className="absolute right-8 top-20 hidden h-24 w-24 text-[#b7f56a]/[0.22] md:block"
                      animate={!reducedMotion}
                    />
                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 rounded-lg border border-[#b7f56a]/15 bg-[#b7f56a]/[0.065] px-3 py-2 text-[10px] text-[#bbef86]">
                        <Trophy size={14} />
                        Competition overview
                      </span>

                      <span className="rounded-full border border-[#b7f56a]/10 px-3 py-1.5 text-[9px] uppercase tracking-wider text-[#b7f56a]">
                        {competition ? "Configured" : "Awaiting setup"}
                      </span>
                    </div>

                    <div className="relative z-10 mt-8">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#829a78]">
                        Featured competition
                      </p>

                      <h2 className="mt-3 text-[26px] font-semibold tracking-tight sm:text-[34px]">
                        {competition?.name || "Your next competition"}
                      </h2>

                      <p className="mt-3 text-xs leading-6 text-[#97a79a]">
                        {competition?.season || "No season specified"}
                        {" · "}
                        {summary?.registeredTeams ?? 0} registered teams
                        {" · "}
                        {summary?.totalMatches ?? 0} fixtures
                      </p>
                    </div>

                    <div className="relative z-10 mt-9 flex flex-col justify-between gap-5 border-t border-white/[0.075] pt-5 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] uppercase tracking-wider text-[#718276]">
                          Matchday progress
                        </p>

                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-1.5 max-w-xs flex-1 overflow-hidden rounded-full bg-white/[0.09]">
                            <div
                              className="h-full rounded-full bg-[#b7f56a]"
                              style={{
                                width: `${matchProgress}%`,
                              }}
                            />
                          </div>

                          <span className="text-xs font-semibold">
                            {matchProgress}%
                          </span>
                        </div>

                        <p className="mt-2 text-[10px] text-[#829286]">
                          {summary?.matchesPlayed ?? 0} played out of{" "}
                          {summary?.totalMatches ?? 0} matches
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => selectSection("competitions")}
                        className="flex items-center gap-2 text-xs font-semibold text-[#c7fb8b]"
                      >
                        Open competition
                        <ArrowUpRight size={15} />
                      </button>
                    </div>
                  </section>

                  {/* Matchday overview */}
                  <section className={`${panel} p-5 sm:p-7`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-[#74869f]">
                          Matchday control center
                        </p>

                        <h2 className="mt-2 text-lg font-semibold">
                          Matchday overview
                        </h2>

                        <p className={`mt-1 text-xs ${muted}`}>
                          Real matchday statistics from your database.
                        </p>
                      </div>

                      <span className="rounded-lg border border-[#b7f56a]/15 bg-[#b7f56a]/[0.06] px-3 py-2 text-[9px] text-[#b7f56a]">
                        {summary?.currentMatchday
                          ? `MATCHDAY ${summary.currentMatchday}`
                          : "NOT STARTED"}
                      </span>
                    </div>

                    <div className="mt-7 grid gap-5 sm:grid-cols-[90px_minmax(0,1fr)] sm:items-center">
                      <div className="border-b border-white/[0.07] pb-4 sm:border-b-0 sm:border-r sm:pb-0">
                        <span className="flex items-center gap-3 text-[38px] font-semibold tracking-tight">
                          <CircleDot size={25} className="text-[#b7f56a]/65" />
                          {String(summary?.currentMatchday ?? 0).padStart(
                            2,
                            "0",
                          )}
                        </span>

                        <p className="mt-2 text-[9px] uppercase tracking-wider text-[#748196]">
                          Latest played
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {
                            label: "Fixtures",
                            value: summary?.totalMatches ?? "—",
                          },
                          {
                            label: "Played",
                            value: summary?.matchesPlayed ?? "—",
                          },
                          {
                            label: "Remaining",
                            value: summary
                              ? Math.max(
                                  0,
                                  summary.totalMatches - summary.matchesPlayed,
                                )
                              : "—",
                          },
                        ].map((item) => (
                          <div key={item.label}>
                            <p className="text-[9px] uppercase text-[#758297]">
                              {item.label}
                            </p>

                            <p className="mt-2 text-lg font-semibold">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-4">
                  {/* Upcoming fixtures */}
                  <section className={`${panel} p-5 sm:p-6`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-[#73839a]">
                          Up next
                        </p>

                        <h2 className="mt-2 text-base font-semibold">
                          Upcoming fixtures
                        </h2>
                      </div>

                      <CalendarClock size={19} className="text-[#8391a3]" />
                    </div>

                    {loadingSummary ? (
                      <p className={`py-12 text-xs ${muted}`}>
                        Loading fixtures...
                      </p>
                    ) : summary?.upcomingFixtures.length ? (
                      <div className="mt-4">
                        {summary.upcomingFixtures.map((fixture) => (
                          <div
                            key={fixture.id}
                            className="border-b border-white/[0.065] py-4 last:border-0"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="min-w-0 flex-1 truncate text-xs font-semibold">
                                {fixture.homeTeam}
                              </p>

                              <span className="text-[9px] text-[#586678]">
                                VS
                              </span>

                              <p className="min-w-0 flex-1 truncate text-right text-xs font-semibold">
                                {fixture.awayTeam}
                              </p>
                            </div>

                            <div className="mt-3 flex justify-between text-[10px] text-[#77869a]">
                              <span>Matchday {fixture.matchDay}</span>

                              <span>
                                {fixture.isPlayed ? "Played" : "Scheduled"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center">
                        <CalendarDays
                          size={24}
                          className="mx-auto text-[#7b899b]"
                        />

                        <p className="mt-4 text-xs font-medium">
                          No upcoming fixtures
                        </p>

                        <p className="mt-2 text-[10px] leading-5 text-[#7b899b]">
                          Create fixtures for your competition to see them here.
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => selectSection("fixtures")}
                      className="mt-3 flex w-full items-center justify-end gap-2 text-[10px] font-semibold text-[#b7f56a]"
                    >
                      View fixtures
                      <ArrowUpRight size={14} />
                    </button>
                  </section>

                  {/* Competition journey */}
                  <section className={`${panel} p-5 sm:p-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-[#74849a]">
                          Tournament setup
                        </p>

                        <h2 className="mt-2 text-base font-semibold">
                          Competition journey
                        </h2>
                      </div>

                      <Zap size={19} className="text-[#b7f56a]" />
                    </div>

                    <div className="mt-6 space-y-5">
                      {[
                        {
                          title: "Create a competition",
                          detail: competition
                            ? "A competition exists in your database."
                            : "Create your first competition.",
                          done: Boolean(competition),
                        },
                        {
                          title: "Register teams",
                          detail: `${
                            summary?.registeredTeams ?? 0
                          } teams registered.`,
                          done: Boolean(summary?.registeredTeams),
                        },
                        {
                          title: "Generate fixtures",
                          detail: `${
                            summary?.totalMatches ?? 0
                          } matches scheduled.`,
                          done: Boolean(summary?.totalMatches),
                        },
                        {
                          title: "Simulate matches",
                          detail: `${
                            summary?.matchesPlayed ?? 0
                          } matches completed.`,
                          done: Boolean(summary?.matchesPlayed),
                        },
                      ].map((step) => (
                        <div key={step.title} className="flex gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                              step.done
                                ? "border-[#b7f56a]/15 bg-[#b7f56a]/10 text-[#b7f56a]"
                                : "border-white/[0.09] bg-white/[0.025] text-[#8d9aab]"
                            }`}
                          >
                            {step.done ? (
                              <Check size={16} />
                            ) : (
                              <Clock3 size={16} />
                            )}
                          </span>

                          <div>
                            <p className="text-xs font-semibold">
                              {step.title}
                            </p>

                            <p className="mt-1 text-[10px] leading-4 text-[#7b889a]">
                              {step.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => selectSection("competitions")}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.045] py-3 text-xs font-semibold text-[#c0f58c]"
                    >
                      View competition
                      <ArrowRight size={14} />
                    </button>
                  </section>
                </div>
              </div>
            </>
          )}

          {/* =========================================
              FOOTER
          ========================================== */}

          <footer className="mt-10 flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[10px] text-[#647184] sm:flex-row sm:justify-between">
            <p>FootballSim / Football management workspace</p>

            <p>
              Signed in as <span className="text-[#9ba7b6]">{user.email}</span>
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
