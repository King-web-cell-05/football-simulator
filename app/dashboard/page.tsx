
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  X,
  Clock3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FootballSimUser = {
  id: string;
  fullName: string;
  email: string;
};

type DashboardFixture = {
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
  upcomingFixtures: DashboardFixture[];
};

type NavItem = {
  label: string;
  icon: LucideIcon;
};

const navigation: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Overview",
    items: [{ label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Competitions",
    items: [
      { label: "All Competitions", icon: Trophy },
      { label: "Create Competition", icon: Plus },
      { label: "League Phase", icon: Activity },
      { label: "Knockout Stage", icon: ArrowRight },
    ],
  },
  {
    heading: "Football Data",
    items: [
      { label: "Teams", icon: Users },
      { label: "Fixtures", icon: CalendarDays },
      { label: "Results", icon: CalendarClock },
      { label: "Standings", icon: ChartNoAxesCombined },
    ],
  },
  {
    heading: "System",
    items: [
      { label: "Settings", icon: Settings },
    ],
  },
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function DashboardPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const [user, setUser] = useState<FootballSimUser | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadDashboard() {
      const token = sessionStorage.getItem("footballsim_access_token");
      const savedUser = sessionStorage.getItem("footballsim_user");

      if (!token || !savedUser) {
        router.replace("/login");
        if (!cancelled) setCheckingSession(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(savedUser) as FootballSimUser;

        if (!parsedUser.id || !parsedUser.fullName || !parsedUser.email) {
          throw new Error("Invalid saved user session.");
        }

        if (!cancelled) setUser(parsedUser);
      } catch {
        sessionStorage.removeItem("footballsim_access_token");
        sessionStorage.removeItem("footballsim_user");
        router.replace("/login");

        if (!cancelled) setCheckingSession(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

      if (!apiUrl) {
        if (!cancelled) {
          setDashboardError(
            "The API address is missing. Check your frontend .env.local file.",
          );
          setCheckingSession(false);
          setLoadingSummary(false);
        }
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/api/Dashboard/summary`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem("footballsim_access_token");
          sessionStorage.removeItem("footballsim_user");
          router.replace("/login");
          return;
        }

        const data = (await response.json().catch(() => null)) as
          | DashboardSummary
          | { message?: string; title?: string }
          | null;

        if (!response.ok) {
          const message =
            data && "message" in data && data.message
              ? data.message
              : data && "title" in data && data.title
                ? data.title
                : `Unable to load dashboard data (HTTP ${response.status}).`;

          throw new Error(message);
        }

        if (
          !data ||
          !("totalCompetitions" in data) ||
          !Array.isArray(data.upcomingFixtures)
        ) {
          throw new Error("The API returned an unexpected dashboard response.");
        }

        if (!cancelled) {
          setSummary(data);
          setDashboardError("");
        }
      } catch (error) {
        if (!cancelled && !controller.signal.aborted) {
          setDashboardError(
            error instanceof Error
              ? error.message
              : "Unable to load dashboard data.",
          );
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
          setLoadingSummary(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [router]);

  function handleSignOut() {
    sessionStorage.removeItem("footballsim_access_token");
    sessionStorage.removeItem("footballsim_user");
    router.replace("/login");
  }

  function selectSection(label: string) {
    setActiveSection(label);
    setMobileNavOpen(false);
    setNotice("");

    if (label === "Create Competition") {
      setNotice(
        "Competition creation is available through your API. The dashboard form is the next feature to connect.",
      );
    } else if (label !== "Dashboard") {
      setNotice(
        `${label} will be connected to the relevant API endpoints next.`,
      );
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0d] text-white">
        <div className="flex items-center gap-3 text-sm text-[#9ba6b5]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#b7f56a]" />
          Checking your session...
        </div>
      </main>
    );
  }

  if (!user) return null;

  const firstName = user.fullName.trim().split(/\s+/)[0] || "Manager";
  const initials = initialsFor(user.fullName) || "FS";
  const competition = summary?.activeCompetition ?? null;

  const stats = [
    {
      label: "Registered teams",
      value: summary ? String(summary.registeredTeams) : "—",
      detail: "In the current workspace",
      icon: Users,
      color: "lime",
    },
    {
      label: "Matches played",
      value: summary ? String(summary.matchesPlayed) : "—",
      detail: summary
        ? `Of ${summary.totalMatches} scheduled`
        : "Waiting for API data",
      icon: CalendarDays,
      color: "blue",
    },
    {
      label: "Goals scored",
      value: summary ? String(summary.goalsScored) : "—",
      detail: "From completed matches",
      icon: Trophy,
      color: "lime",
    },
    {
      label: "Competitions",
      value: summary ? String(summary.totalCompetitions) : "—",
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

  const filteredNavigation = navigation.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  }));

  return (
    <main className="min-h-screen bg-[#080a0d] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-48 -top-48 h-[520px] w-[520px] rounded-full bg-[#b7f56a]/[0.035] blur-[120px]" />
        <div className="absolute -bottom-64 -left-48 h-[500px] w-[500px] rounded-full bg-blue-400/[0.025] blur-[130px]" />
      </div>

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/[0.065] bg-[#0b0e12] transition-transform duration-300 lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[78px] shrink-0 items-center justify-between border-b border-white/[0.06] px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b7f56a]/30 bg-[#b7f56a]/[0.08] text-[#b7f56a]">
              <Goal size={21} />
            </span>
            <span className="text-[17px] font-bold tracking-[-0.04em]">
              Football<span className="text-[#b7f56a]">Sim</span>
            </span>
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-lg p-2 text-[#7e8998] hover:bg-white/[0.05] lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pb-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setSearchOpen(true);
              setMobileNavOpen(false);
            }}
            className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-xs text-[#7e8998] transition hover:border-white/[0.13] hover:bg-white/[0.04]"
          >
            <Search size={15} />
            <span className="flex-1 text-left">Find a workspace</span>
            <span className="rounded-md border border-white/[0.09] px-1.5 py-1 text-[9px]">
              Ctrl K
            </span>
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-5 pt-3">
          {filteredNavigation.map((group) => (
            <div key={group.heading}>
              {group.items.length > 0 && (
                <>
                  <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.19em] text-[#647083]">
                    {group.heading}
                  </p>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = activeSection === item.label;

                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => selectSection(item.label)}
                          className={`relative flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[12px] font-medium transition ${
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
                            className={
                              active ? "text-[#b7f56a]" : "text-[#758194]"
                            }
                          />
                          <span className="flex-1">{item.label}</span>
                          {active && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#b7f56a]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/[0.06] p-3">
          <div className="mb-3 rounded-xl border border-[#b7f56a]/10 bg-[#b7f56a]/[0.035] p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#b7f56a]/10 text-[#b7f56a]">
                <ShieldCheck size={14} />
              </span>
              <span className="text-[11px] font-semibold text-[#dce5d2]">
                Manager workspace
              </span>
            </div>
            <p className="text-[10px] leading-4 text-[#758192]">
              Manage competitions, clubs and seasons in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => selectSection("Settings")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-[#98a3b2] transition hover:bg-white/[0.04] hover:text-white"
          >
            <Settings size={15} className="text-[#758194]" />
            Preferences
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="relative min-h-screen lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080a0d]/90 backdrop-blur-xl">
          <div className="flex h-[78px] items-center justify-between gap-3 px-4 sm:px-7 xl:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setMobileNavOpen(true)}
                className="rounded-xl border border-white/[0.08] p-2.5 text-[#9aa5b4] hover:bg-white/[0.05] lg:hidden"
              >
                <Menu size={18} />
              </button>
              <div className="flex min-w-0 items-center gap-2 text-[11px]">
                <span className="hidden text-[#647083] sm:inline">
                  Workspace
                </span>
                <span className="hidden text-[#414c5b] sm:inline">/</span>
                <span className="truncate font-medium text-[#dfe5ec]">
                  {activeSection}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <div className="hidden items-center gap-2 rounded-full border border-[#b7f56a]/15 bg-[#b7f56a]/[0.045] px-3 py-2 md:flex">
                <span className="h-2 w-2 rounded-full bg-[#b7f56a]" />
                <span className="text-[10px] font-medium text-[#b7d997]">
                  {loadingSummary ? "Refreshing data" : "Dashboard"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search workspace"
                className="rounded-lg p-2 text-[#8b97a8] transition hover:bg-white/[0.045] hover:text-white"
              >
                <Search size={16} />
              </button>

              <div className="relative">
                <button
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative rounded-xl p-2.5 text-[#8793a4] transition hover:bg-white/[0.05] hover:text-white"
                >
                  <Bell size={17} />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-white/[0.09] bg-[#10151b] p-4 shadow-2xl">
                    <p className="text-xs font-semibold">Notifications</p>
                    <p className="mt-2 text-[11px] leading-5 text-[#8793a4]">
                      Fixture and match notifications will appear here when
                      those features are connected.
                    </p>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  aria-expanded={accountMenuOpen}
                  className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.035] p-1 transition hover:bg-white/[0.07]"
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
                        {user.fullName}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-[#7d8999]">
                        {user.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        selectSection("Settings");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-[#a9b4c1] hover:bg-white/[0.05]"
                    >
                      <Settings size={14} /> Account settings
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-red-300 hover:bg-red-400/[0.08]"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {searchOpen && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/65 px-4 pt-[15vh] backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.1] bg-[#10151b] shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/[0.07] px-4">
                <Search size={18} className="text-[#8490a0]" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Find a dashboard section..."
                  className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#677384]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="rounded-lg border border-white/[0.08] px-2 py-1 text-[10px] text-[#8692a2]"
                >
                  Close
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {filteredNavigation.flatMap((group) => group.items).map(
                  (item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          selectSection(item.label);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs text-[#b2bdca] transition hover:bg-white/[0.05] hover:text-white"
                      >
                        <Icon size={16} className="text-[#b7f56a]" />
                        <span className="flex-1">{item.label}</span>
                        <ArrowUpRight size={13} className="text-[#667385]" />
                      </button>
                    )
                  },
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-[1720px] px-4 pb-10 pt-7 sm:px-7 sm:pt-9 xl:px-10">
          {activeSection !== "Dashboard" ? (
            <section className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#b7f56a]/20 bg-[#b7f56a]/[0.07] text-[#b7f56a]">
                <Goal size={30} />
              </span>
              <h1 className="mt-6 text-3xl font-semibold">{activeSection}</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#8d9aab]">
                This workspace will be connected to your existing API
                endpoints next.
              </p>
              <button
                type="button"
                onClick={() => selectSection("Dashboard")}
                className="mt-6 flex h-11 items-center gap-2 rounded-xl bg-[#b7f56a] px-5 text-xs font-bold text-[#11180b] hover:bg-[#c9ff87]"
              >
                <LayoutDashboard size={15} />
                Back to dashboard
              </button>
            </section>
          ) : (
            <>
              {/* Greeting */}
              <motion.section
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-7 flex flex-col justify-between gap-6 2xl:flex-row 2xl:items-end"
              >
                <div>
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.17em] text-[#76869c]">
                    {formatDate()}
                  </p>
                  <h1 className="text-[30px] font-semibold tracking-[-0.055em] text-[#f4f6f8] sm:text-[37px]">
                    {getGreeting()},{" "}
                    <span className="text-[#b7f56a]">{firstName}</span>
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8996a7]">
                    Your competition overview, matchday activity, and
                    tournament progress at a glance.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-[230px] items-center gap-3 rounded-xl border border-white/[0.09] bg-[#10151b] px-3.5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#b7f56a]/15 bg-[#b7f56a]/[0.09] text-[#b7f56a]">
                      <Trophy size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] text-[#778597]">
                        Latest competition
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-[#ecf0f4]">
                        {loadingSummary
                          ? "Loading competition..."
                          : competition?.name ?? "No competition created"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => selectSection("Create Competition")}
                    className="flex h-[52px] items-center justify-center gap-3 rounded-xl bg-[#b7f56a] px-5 text-xs font-bold text-[#11180b] transition hover:bg-[#c9ff87] sm:min-w-[170px]"
                  >
                    <Plus size={16} />
                    Create competition
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </motion.section>

              {/* API error */}
              {dashboardError && (
                <div
                  role="alert"
                  className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 sm:flex-row sm:items-center"
                >
                  <p className="text-xs leading-5 text-red-200">
                    Dashboard data could not be loaded: {dashboardError}
                  </p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="self-start rounded-lg border border-red-300/20 px-3 py-2 text-xs text-red-200 hover:bg-red-400/[0.08] sm:self-auto"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Live statistics */}
              <section className="mb-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#657287]">
                    Live database snapshot
                  </p>
                  <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[9px] text-[#768396]">
                    {loadingSummary ? "Loading" : dashboardError ? "Unavailable" : "API data"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    const colorClass =
                      stat.color === "lime"
                        ? "border-[#b7f56a]/15 bg-[#b7f56a]/[0.09] text-[#b7f56a]"
                        : "border-blue-400/15 bg-blue-400/[0.09] text-blue-300";

                    return (
                      <motion.article
                        key={stat.label}
                        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: reducedMotion ? 0 : index * 0.05,
                        }}
                        className="rounded-2xl border border-white/[0.075] bg-[#101319] p-4 transition hover:border-white/[0.13] hover:bg-[#121720] sm:p-[18px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${colorClass}`}>
                            <Icon size={17} />
                          </span>
                          <Activity size={15} className="text-[#465365]" />
                        </div>
                        <p className="mt-5 text-[11px] font-medium tracking-[0.04em] text-[#8b98aa]">
                          {stat.label}
                        </p>
                        <p className="mt-2 text-[31px] font-semibold tracking-[-0.055em] text-[#f3f5f7]">
                          {loadingSummary ? "…" : stat.value}
                        </p>
                        <p className="mt-1 text-[9px] text-[#718094]">
                          {stat.detail}
                        </p>

                        {stat.label === "Matches played" && (
                          <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                            <div
                              className="h-full rounded-full bg-blue-400 transition-all"
                              style={{ width: `${matchProgress}%` }}
                            />
                          </div>
                        )}
                      </motion.article>
                    );
                  })}
                </div>
              </section>

              {/* Competition and fixtures */}
              <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
                <div className="space-y-4">
                  <motion.section
                    initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.12 }}
                    className="relative isolate overflow-hidden rounded-2xl border border-[#b7f56a]/15 bg-gradient-to-br from-[#121d18] via-[#101713] to-[#101319] p-5 sm:p-7"
                  >
                    <div className="pointer-events-none absolute -right-14 -top-24 -z-10 h-72 w-72 rounded-full border border-[#b7f56a]/10" />
                    <div className="pointer-events-none absolute -right-1 -top-12 -z-10 h-56 w-56 rounded-full border border-[#b7f56a]/[0.08]" />

                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="inline-flex items-center gap-2 rounded-lg border border-[#b7f56a]/15 bg-[#b7f56a]/[0.065] px-3 py-2 text-[10px] font-medium text-[#bbef86]">
                        <Trophy size={13} />
                        Competition overview
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-[#b7f56a]/10 bg-black/15 px-3 py-1.5 text-[9px] uppercase tracking-[0.09em] text-[#b7f56a]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#b7f56a]" />
                        {competition ? "Configured" : "Awaiting setup"}
                      </div>
                    </div>

                    <div className="mt-8 max-w-2xl">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#829a78]">
                        Featured competition
                      </p>
                      <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.055em] text-[#f1f6ee] sm:text-[34px]">
                        {loadingSummary
                          ? "Loading your competition..."
                          : competition?.name ?? "Your next competition"}
                      </h2>
                      <p className="mt-3 text-xs text-[#97a79a]">
                        {competition?.season || "No season specified"}
                        <span className="mx-2 text-[#4f6656]">·</span>
                        {summary?.registeredTeams ?? 0} registered teams
                        <span className="mx-2 text-[#4f6656]">·</span>
                        {summary?.totalMatches ?? 0} fixtures
                      </p>
                    </div>

                    <div className="mt-9 flex flex-col justify-between gap-5 border-t border-white/[0.075] pt-5 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] uppercase tracking-[0.17em] text-[#718276]">
                          Matchday progress
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-1.5 max-w-xs flex-1 overflow-hidden rounded-full bg-white/[0.09]">
                            <div
                              className="h-full rounded-full bg-[#b7f56a] transition-all"
                              style={{ width: `${matchProgress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-[#d5e1d4]">
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
                        onClick={() => selectSection("All Competitions")}
                        className="inline-flex items-center gap-2 self-start text-xs font-semibold text-[#c7fb8b] transition hover:text-white sm:self-auto"
                      >
                        Open competition
                        <ArrowUpRight size={15} />
                      </button>
                    </div>
                  </motion.section>

                  {/* Matchday controls */}
                  <section className="rounded-2xl border border-white/[0.075] bg-[#101319] p-5 sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#74869f]">
                          Matchday control center
                        </p>
                        <h2 className="mt-2 text-lg font-semibold tracking-tight text-[#f0f2f5]">
                          Matchday overview
                        </h2>
                        <p className="mt-1 text-xs text-[#8592a4]">
                          Real matchday statistics from your database.
                        </p>
                      </div>
                      <span className="rounded-lg border border-[#b7f56a]/15 bg-[#b7f56a]/[0.06] px-3 py-1.5 text-[9px] font-medium text-[#b7f56a]">
                        {summary?.currentMatchday
                          ? `MATCHDAY ${summary.currentMatchday}`
                          : "NOT STARTED"}
                      </span>
                    </div>

                    <div className="mt-7 grid gap-5 sm:grid-cols-[90px_minmax(0,1fr)] sm:items-center">
                      <div className="border-b border-white/[0.07] pb-4 sm:border-b-0 sm:border-r sm:pb-0">
                        <span className="text-[38px] font-semibold leading-none tracking-[-0.065em] text-white">
                          {String(summary?.currentMatchday ?? 0).padStart(2, "0")}
                        </span>
                        <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-[#748196]">
                          Latest played
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.1em] text-[#758297]">
                            Fixtures
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {summary?.totalMatches ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.1em] text-[#758297]">
                            Played
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {summary?.matchesPlayed ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.1em] text-[#758297]">
                            Remaining
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {summary
                              ? summary.totalMatches - summary.matchesPlayed
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right-hand fixture panel */}
                <div className="space-y-4">
                  <section className="rounded-2xl border border-white/[0.075] bg-[#101319] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#73839a]">
                          Up next
                        </p>
                        <h2 className="mt-2 text-base font-semibold tracking-tight">
                          Upcoming fixtures
                        </h2>
                      </div>
                      <span className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-2 text-[#8391a3]">
                        <CalendarClock size={16} />
                      </span>
                    </div>

                    {loadingSummary ? (
                      <div className="flex items-center gap-2 py-12 text-xs text-[#8692a2]">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#b7f56a]" />
                        Loading fixtures...
                      </div>
                    ) : summary?.upcomingFixtures.length ? (
                      <div className="mt-4">
                        {summary.upcomingFixtures.map((fixture) => (
                          <div
                            key={fixture.id}
                            className="border-b border-white/[0.065] py-4 last:border-0"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[11px] font-semibold text-[#e0e6ed]">
                                  {fixture.homeTeam}
                                </p>
                              </div>
                              <span className="px-1 text-[9px] text-[#586678]">
                                VS
                              </span>
                              <div className="min-w-0 flex-1 text-right">
                                <p className="truncate text-[11px] font-semibold text-[#e0e6ed]">
                                  {fixture.awayTeam}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <span className="text-[9px] text-[#77869a]">
                                Matchday {fixture.matchDay}
                              </span>
                              <span className="flex items-center gap-1.5 text-[9px] text-[#7e8b9d]">
                                <Clock3 size={11} />
                                {fixture.isPlayed ? "Played" : "Scheduled"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-9 text-center">
                        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-[#7b899b]">
                          <CalendarDays size={20} />
                        </span>
                        <p className="mt-3 text-xs font-medium text-[#cdd5de]">
                          No upcoming fixtures
                        </p>
                        <p className="mt-1 text-[10px] leading-5 text-[#7b899b]">
                          Create fixtures for your competition to see them here.
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => selectSection("Fixtures")}
                      className="mt-2 flex w-full items-center justify-end gap-2 rounded-lg px-2 py-2 text-[10px] font-semibold text-[#b7f56a] transition hover:bg-white/[0.03] hover:text-[#d2ff9c]"
                    >
                      View fixtures
                      <ArrowUpRight size={14} />
                    </button>
                  </section>

                  {/* Setup progress */}
                  <section className="rounded-2xl border border-white/[0.075] bg-[#101319] p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#74849a]">
                          Tournament setup
                        </p>
                        <h2 className="mt-2 text-base font-semibold">
                          Competition journey
                        </h2>
                      </div>
                      <Trophy size={18} className="text-[#b7f56a]" />
                    </div>

                    <div className="mt-6 space-y-5">
                      {[
                        {
                          title: "Create a competition",
                          description: competition
                            ? "A competition exists in your database."
                            : "Create your first competition.",
                          done: Boolean(competition),
                        },
                        {
                          title: "Register teams",
                          description: `${summary?.registeredTeams ?? 0} teams registered.`,
                          done: Boolean(summary?.registeredTeams),
                        },
                        {
                          title: "Generate fixtures",
                          description: `${summary?.totalMatches ?? 0} matches scheduled.`,
                          done: Boolean(summary?.totalMatches),
                        },
                        {
                          title: "Simulate matches",
                          description: `${summary?.matchesPlayed ?? 0} matches completed.`,
                          done: Boolean(summary?.matchesPlayed),
                        },
                      ].map((step) => (
                        <div key={step.title} className="flex gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                              step.done
                                ? "border-[#b7f56a]/15 bg-[#b7f56a]/[0.09] text-[#b7f56a]"
                                : "border-white/[0.09] bg-white/[0.025] text-[#8d9aab]"
                            }`}
                          >
                            {step.done ? <ShieldCheck size={15} /> : <Clock3 size={15} />}
                          </span>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-[#d6dde5]">
                              {step.title}
                            </p>
                            <p className="mt-1 text-[10px] leading-4 text-[#7b889a]">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => selectSection("All Competitions")}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.045] py-3 text-xs font-semibold text-[#c0f58c] transition hover:bg-[#b7f56a]/[0.09]"
                    >
                      View competition
                      <ArrowRight size={14} />
                    </button>
                  </section>
                </div>
              </div>

              {notice && (
                <div
                  role="status"
                  className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.045] px-4 py-3 text-xs text-[#c4e6a4]"
                >
                  <p className="leading-5">{notice}</p>
                  <button
                    type="button"
                    aria-label="Dismiss message"
                    onClick={() => setNotice("")}
                    className="shrink-0 rounded-lg p-1 text-[#b7f56a] hover:bg-white/[0.06]"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </>
          )}

          <footer className="mt-10 flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[9px] text-[#647184] sm:flex-row sm:items-center sm:justify-between">
            <p>FootballSim / Football management workspace</p>
            <p>
              Signed in as{" "}
              <span className="text-[#9ba7b6]">{user.email}</span>
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
