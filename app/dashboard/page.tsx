
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CalendarClock,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Command,
  Goal,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FootballSimUser = {
  id: string;
  fullName: string;
  email: string;
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
      { label: "Knockout Stage", icon: Swords },
    ],
  },
  {
    heading: "Football Data",
    items: [
      { label: "Teams", icon: ShieldCheck },
      { label: "Fixtures", icon: CalendarDays },
      { label: "Results", icon: ClipboardList },
      { label: "Standings", icon: ChartNoAxesCombined },
      { label: "Statistics", icon: Activity },
    ],
  },
  {
    heading: "System",
    items: [
      { label: "Settings", icon: Settings },
      { label: "Help & Support", icon: CircleHelp },
    ],
  },
];

const previewStats = [
  {
    label: "Registered teams",
    value: "01",
    detail: "Current local setup",
    icon: Users,
    color: "lime",
    progress: 12,
  },
  {
    label: "Matches played",
    value: "—",
    detail: "Awaiting live statistics",
    icon: CalendarDays,
    color: "blue",
    progress: 38,
  },
  {
    label: "Goals recorded",
    value: "—",
    detail: "Awaiting match results",
    icon: Trophy,
    color: "lime",
    progress: 56,
  },
  {
    label: "Matchday",
    value: "01",
    detail: "Competition workspace",
    icon: Activity,
    color: "blue",
    progress: 20,
  },
];

const previewFixtures = [
  {
    home: "Arsenal",
    away: "Opponent to be added",
    homeCode: "ARS",
    awayCode: "TBD",
    matchday: "Matchday 01",
    status: "Fixture pending",
  },
  {
    home: "Home team",
    away: "Away team",
    homeCode: "H",
    awayCode: "A",
    matchday: "Matchday 02",
    status: "Fixture pending",
  },
  {
    home: "Home team",
    away: "Away team",
    homeCode: "H",
    awayCode: "A",
    matchday: "Matchday 03",
    status: "Fixture pending",
  },
];

const iconColor: Record<string, string> = {
  lime: "border-[#b7f56a]/15 bg-[#b7f56a]/[0.09] text-[#b7f56a]",
  blue: "border-blue-400/15 bg-blue-400/[0.09] text-blue-300",
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function DashboardPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const [user, setUser] = useState<FootballSimUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [greeting, setGreeting] = useState("Welcome back");
  const [currentDate, setCurrentDate] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
    setCurrentDate(getFormattedDate());

    const token = sessionStorage.getItem("footballsim_access_token");
    const savedUser = sessionStorage.getItem("footballsim_user");

    if (!token || !savedUser) {
      router.replace("/login");
      setCheckingSession(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser) as FootballSimUser;

      if (!parsedUser.id || !parsedUser.fullName || !parsedUser.email) {
        throw new Error("Invalid saved user");
      }

      setUser(parsedUser);
    } catch {
      sessionStorage.removeItem("footballsim_access_token");
      sessionStorage.removeItem("footballsim_user");
      router.replace("/login");
    } finally {
      setCheckingSession(false);
    }
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
        "Competition creation is ready to be connected to your Competition API.",
      );
    } else if (label !== "Dashboard") {
      setNotice(
        `${label} workspace selected. Its live data and actions will be connected to the API next.`,
      );
    }
  }

  function handleSimulateMatchday() {
    setNotice(
      "Matchday simulation is not triggered yet. We will connect this control to your existing simulation endpoint next.",
    );
  }

  if (checkingSession || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070a0e] text-white">
        <div className="flex items-center gap-3 text-sm text-[#9ba6b5]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#b7f56a]" />
          Loading your football workspace...
        </div>
      </main>
    );
  }

  const firstName = user.fullName.trim().split(/\s+/)[0] || "Manager";
  const initials = user.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const filteredNavigation = navigation.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  }));

  return (
    <main className="min-h-screen bg-[#080a0d] text-white">
      {/* Subtle background lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-48 -top-48 h-[520px] w-[520px] rounded-full bg-[#b7f56a]/[0.035] blur-[120px]" />
        <div className="absolute -bottom-64 -left-48 h-[500px] w-[500px] rounded-full bg-blue-400/[0.025] blur-[130px]" />
      </div>

      {/* Mobile overlay */}
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
        {/* Brand */}
        <div className="flex h-[78px] shrink-0 items-center justify-between border-b border-white/[0.06] px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#b7f56a]/30 bg-[#b7f56a]/[0.08] text-[#b7f56a]">
              <Goal size={21} />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#b7f56a] shadow-[0_0_10px_rgba(183,245,106,0.7)]" />
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

        {/* Search shortcut */}
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
            <span className="flex items-center gap-0.5 rounded-md border border-white/[0.09] px-1.5 py-1 text-[9px]">
              <Command size={10} /> K
            </span>
          </button>
        </div>

        {/* Navigation groups */}
        <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-3 pb-5 pt-3">
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
                          className={`group relative flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[12px] font-medium transition ${
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
                              active
                                ? "text-[#b7f56a]"
                                : "text-[#758194] transition group-hover:text-[#b7f56a]"
                            }
                          />

                          <span className="flex-1">{item.label}</span>

                          {active && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#b7f56a] shadow-[0_0_8px_rgba(183,245,106,0.7)]" />
                          )}

                          {item.label === "Create Competition" && !active && (
                            <span className="text-[#586577] opacity-0 transition group-hover:opacity-100">
                              <ArrowRight size={13} />
                            </span>
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

        {/* Sidebar footer */}
        <div className="shrink-0 border-t border-white/[0.06] p-3">
          <div className="mb-3 rounded-xl border border-[#b7f56a]/10 bg-[#b7f56a]/[0.035] p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#b7f56a]/10 text-[#b7f56a]">
                <Sparkles size={14} />
              </span>
              <span className="text-[11px] font-semibold text-[#dce5d2]">
                Your manager workspace
              </span>
            </div>
            <p className="text-[10px] leading-4 text-[#758192]">
              Build competitions, manage clubs and simulate your season.
            </p>
          </div>

          <button
            type="button"
            onClick={() => selectSection("Settings")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-[#98a3b2] transition hover:bg-white/[0.04] hover:text-white"
          >
            <Settings size={15} className="text-[#758194]" />
            Preferences
            <ChevronRight size={14} className="ml-auto text-[#546071]" />
          </button>
        </div>
      </aside>

      {/* Main application */}
      <div className="relative min-h-screen lg:pl-[264px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080a0d]/90 backdrop-blur-xl">
          <div className="flex h-[78px] items-center justify-between gap-3 px-4 sm:px-7 xl:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setMobileNavOpen(true)}
                className="rounded-xl border border-white/[0.08] p-2.5 text-[#9aa5b4] transition hover:bg-white/[0.05] lg:hidden"
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
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b7f56a]/35" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#b7f56a]" />
                </span>
                <span className="text-[10px] font-medium text-[#b7d997]">
                  Workspace ready
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-[#8b97a8] transition hover:bg-white/[0.045] hover:text-white"
              >
                <Search size={16} />
                <span className="hidden sm:inline">Search</span>
              </button>

              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
                className="relative rounded-xl p-2.5 text-[#8793a4] transition hover:bg-white/[0.05] hover:text-white"
              >
                <Bell size={17} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#b7f56a]" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  aria-expanded={accountMenuOpen}
                  className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.035] p-1 transition hover:bg-white/[0.07]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#b7f56a]/20 bg-[#b7f56a]/[0.11] text-[10px] font-bold text-[#c7fa8c]">
                    {initials || "FS"}
                  </span>
                  <ChevronDown
                    size={13}
                    className="mr-1 hidden text-[#788596] sm:block"
                  />
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-white/[0.1] bg-[#10151b] p-2 shadow-2xl">
                    <div className="border-b border-white/[0.07] px-3 py-3">
                      <p className="truncate text-xs font-semibold text-white">
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
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-[#a9b4c1] transition hover:bg-white/[0.05] hover:text-white"
                    >
                      <Settings size={14} /> Account settings
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-red-300 transition hover:bg-red-400/[0.08]"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Notifications popover */}
        {notificationsOpen && (
          <div className="fixed right-5 top-[88px] z-40 w-[min(340px,calc(100vw-40px))] rounded-2xl border border-white/[0.09] bg-[#10151b] p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Notifications</h3>
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setNotificationsOpen(false)}
                className="rounded-lg p-1.5 text-[#8793a4] hover:bg-white/[0.06]"
              >
                <X size={15} />
              </button>
            </div>
            <div className="mt-4 flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#b7f56a]/10 text-[#b7f56a]">
                <ShieldCheck size={16} />
              </span>
              <div>
                <p className="text-xs font-medium text-white">
                  Account connected
                </p>
                <p className="mt-1 text-[10px] leading-4 text-[#8591a1]">
                  Your account is signed in. Match and fixture notifications
                  will appear here when those features are connected.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search overlay */}
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
                  className="rounded-lg border border-white/[0.08] px-2 py-1 text-[10px] text-[#8692a2] hover:bg-white/[0.05]"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto p-2">
                {filteredNavigation.flatMap((group) => group.items).length >
                0 ? (
                  filteredNavigation.flatMap((group) => group.items).map(
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
                          <ArrowRight size={13} className="text-[#667385]" />
                        </button>
                      );
                    },
                  )
                ) : (
                  <p className="px-3 py-8 text-center text-xs text-[#7d8999]">
                    No dashboard sections match your search.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              aria-label="Close search"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="absolute inset-0 -z-10 cursor-default"
            />
          </div>
        )}

        {/* Content */}
        <div className="relative mx-auto w-full max-w-[1720px] px-4 pb-10 pt-7 sm:px-7 sm:pt-9 xl:px-10">
          {activeSection === "Dashboard" ? (
            <>
              {/* Greeting and competition selector */}
              <motion.section
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-7 flex flex-col justify-between gap-6 2xl:flex-row 2xl:items-end"
              >
                <div>
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.17em] text-[#76869c]">
                    {currentDate || "Your workspace"}
                  </p>

                  <h1 className="text-[30px] font-semibold tracking-[-0.055em] text-[#f4f6f8] sm:text-[37px]">
                    {greeting},{" "}
                    <span className="text-[#b7f56a]">{firstName}</span>
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8996a7]">
                    Your competition overview, matchday activity, and
                    tournament progress at a glance.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => selectSection("All Competitions")}
                    className="flex min-w-[230px] items-center gap-3 rounded-xl border border-white/[0.09] bg-[#10151b] px-3.5 py-3 text-left transition hover:border-[#b7f56a]/20"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#b7f56a]/15 bg-[#b7f56a]/[0.09] text-[#b7f56a]">
                      <Trophy size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[9px] text-[#778597]">
                        Active competition
                      </span>
                      <span className="mt-1 block truncate text-xs font-semibold text-[#ecf0f4]">
                        UEFA Champions League 2026
                      </span>
                    </span>
                    <ChevronDown size={14} className="text-[#6b798c]" />
                  </button>

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

              {/* Stat cards */}
              <section className="mb-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#657287]">
                    Competition snapshot
                  </p>
                  <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[9px] text-[#768396]">
                    Preview data
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {previewStats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                      <motion.article
                        key={stat.label}
                        initial={
                          reducedMotion ? false : { opacity: 0, y: 10 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: reducedMotion ? 0 : index * 0.05,
                        }}
                        className="group rounded-2xl border border-white/[0.075] bg-[#101319] p-4 transition hover:border-white/[0.13] hover:bg-[#121720] sm:p-[18px]"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${iconColor[stat.color]}`}
                          >
                            <Icon size={17} />
                          </span>
                          <button
                            type="button"
                            onClick={() => selectSection(
                              stat.label === "Registered teams"
                                ? "Teams"
                                : stat.label === "Matches played"
                                  ? "Results"
                                  : stat.label === "Goals recorded"
                                    ? "Statistics"
                                    : "League Phase",
                            )}
                            aria-label={`Open ${stat.label}`}
                            className="rounded-lg p-1 text-[#566477] transition hover:bg-white/[0.06] hover:text-white"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </div>

                        <p className="mt-5 text-[11px] font-medium tracking-[0.04em] text-[#8b98aa]">
                          {stat.label}
                        </p>

                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-[31px] font-semibold tracking-[-0.055em] text-[#f3f5f7]">
                            {stat.value}
                          </span>
                          <span className="text-[9px] text-[#718094]">
                            {stat.detail}
                          </span>
                        </div>

                        <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                          <div
                            className={`h-full rounded-full ${
                              stat.color === "lime"
                                ? "bg-[#b7f56a]"
                                : "bg-blue-400"
                            }`}
                            style={{ width: `${stat.progress}%` }}
                          />
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </section>

              {/* Main dashboard grid */}
              <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
                <div className="space-y-4">
                  {/* Competition feature */}
                  <motion.section
                    initial={
                      reducedMotion ? false : { opacity: 0, y: 10 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.12 }}
                    className="relative isolate overflow-hidden rounded-2xl border border-[#b7f56a]/15 bg-gradient-to-br from-[#121d18] via-[#101713] to-[#101319] p-5 sm:p-7"
                  >
                    <div className="pointer-events-none absolute -right-14 -top-24 -z-10 h-72 w-72 rounded-full border border-[#b7f56a]/10" />
                    <div className="pointer-events-none absolute -right-1 -top-12 -z-10 h-56 w-56 rounded-full border border-[#b7f56a]/[0.08]" />
                    <div className="pointer-events-none absolute right-20 top-10 -z-10 h-36 w-36 rounded-full border border-[#b7f56a]/[0.08]" />

                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="inline-flex items-center gap-2 rounded-lg border border-[#b7f56a]/15 bg-[#b7f56a]/[0.065] px-3 py-2 text-[10px] font-medium text-[#bbef86]">
                        <Trophy size={13} />
                        Competition overview
                      </div>

                      <div className="flex items-center gap-2 rounded-full border border-[#b7f56a]/10 bg-black/15 px-3 py-1.5 text-[9px] uppercase tracking-[0.09em] text-[#b7f56a]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#b7f56a]" />
                        Workspace ready
                      </div>
                    </div>

                    <div className="mt-8 max-w-2xl">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#829a78]">
                        Your featured competition
                      </p>

                      <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.055em] text-[#f1f6ee] sm:text-[34px]">
                        UEFA Champions League{" "}
                        <span className="text-[#b7f56a]">Simulator</span>
                      </h2>

                      <p className="mt-3 text-xs text-[#97a79a]">
                        2026 season
                        <span className="mx-2 text-[#4f6656]">·</span>
                        Competition workspace
                        <span className="mx-2 text-[#4f6656]">·</span>
                        Custom format
                      </p>
                    </div>

                    <div className="mt-9 flex flex-col justify-between gap-5 border-t border-white/[0.075] pt-5 sm:flex-row sm:items-end">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.17em] text-[#718276]">
                          Competition setup
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#b7f56a]/10 text-[#b7f56a]">
                            <Check size={15} />
                          </span>
                          <span className="text-xs font-medium text-[#d5e1d4]">
                            API and database connected
                          </span>
                        </div>
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

                  {/* Matchday control */}
                  <motion.section
                    initial={
                      reducedMotion ? false : { opacity: 0, y: 10 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.16 }}
                    className="rounded-2xl border border-white/[0.075] bg-[#101319] p-5 sm:p-7"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#74869f]">
                          Matchday control center
                        </p>
                        <h2 className="mt-2 text-lg font-semibold tracking-tight text-[#f0f2f5]">
                          Your next matchday
                        </h2>
                        <p className="mt-1 text-xs text-[#8592a4]">
                          Prepare fixtures before running the simulation.
                        </p>
                      </div>

                      <span className="rounded-lg border border-[#b7f56a]/15 bg-[#b7f56a]/[0.06] px-3 py-1.5 text-[9px] font-medium text-[#b7f56a]">
                        SETUP
                      </span>
                    </div>

                    <div className="mt-7 grid gap-5 sm:grid-cols-[90px_minmax(0,1fr)] sm:items-center">
                      <div className="border-b border-white/[0.07] pb-4 sm:border-b-0 sm:border-r sm:pb-0">
                        <span className="text-[38px] font-semibold leading-none tracking-[-0.065em] text-white">
                          01
                        </span>
                        <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-[#748196]">
                          Matchday
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.1em] text-[#758297]">
                            Fixtures
                          </p>
                          <p className="mt-2 text-lg font-semibold">—</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.1em] text-[#758297]">
                            Played
                          </p>
                          <p className="mt-2 text-lg font-semibold">—</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.1em] text-[#758297]">
                            Status
                          </p>
                          <p className="mt-2 text-xs font-semibold text-[#d8e4d1]">
                            Preparing
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col justify-between gap-4 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center">
                      <p className="max-w-sm text-[10px] leading-5 text-[#788699]">
                        Matchday actions will be enabled when fixtures and
                        simulation results are connected to the backend.
                      </p>

                      <button
                        type="button"
                        onClick={handleSimulateMatchday}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-4 text-xs font-semibold text-[#e1e6ec] transition hover:border-[#b7f56a]/25 hover:bg-[#b7f56a]/[0.055] hover:text-[#cafa99]"
                      >
                        <Zap size={15} />
                        Simulation controls
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.section>

                  {/* Quick actions */}
                  <section className="rounded-2xl border border-white/[0.07] bg-[#0d1117] p-5 sm:p-6">
                    <div className="mb-4">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#75849a]">
                        Quick actions
                      </p>
                      <h2 className="mt-2 text-base font-semibold">
                        Continue managing your football world
                      </h2>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          title: "Create competition",
                          subtitle: "Set up a new tournament",
                          icon: Plus,
                          section: "Create Competition",
                        },
                        {
                          title: "Manage teams",
                          subtitle: "View your registered clubs",
                          icon: Users,
                          section: "Teams",
                        },
                        {
                          title: "View standings",
                          subtitle: "Follow league positions",
                          icon: ChartNoAxesCombined,
                          section: "Standings",
                        },
                      ].map((action) => {
                        const Icon = action.icon;

                        return (
                          <button
                            key={action.title}
                            type="button"
                            onClick={() => selectSection(action.section)}
                            className="flex items-center gap-3 rounded-xl border border-white/[0.065] bg-white/[0.015] p-3.5 text-left transition hover:border-[#b7f56a]/20 hover:bg-white/[0.035]"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#b7f56a]/[0.08] text-[#b7f56a]">
                              <Icon size={17} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[11px] font-semibold text-[#e8edf2]">
                                {action.title}
                              </span>
                              <span className="mt-1 block text-[9px] text-[#758294]">
                                {action.subtitle}
                              </span>
                            </span>
                            <ChevronRight
                              size={13}
                              className="shrink-0 text-[#647083]"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  {/* Upcoming fixtures */}
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

                    <div className="mt-5">
                      {previewFixtures.map((fixture, index) => (
                        <div
                          key={`${fixture.matchday}-${index}`}
                          className={`py-4 ${
                            index !== previewFixtures.length - 1
                              ? "border-b border-white/[0.065]"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[8px] font-bold ${
                                  index === 0
                                    ? "bg-[#b7f56a]/[0.12] text-[#c7fa8b]"
                                    : "bg-white/[0.055] text-[#93a0b1]"
                                }`}
                              >
                                {fixture.homeCode}
                              </span>
                              <span className="truncate text-[10px] font-medium text-[#d9e0e8]">
                                {fixture.home}
                              </span>
                            </div>

                            <span className="shrink-0 px-1 text-[9px] text-[#5f6c7f]">
                              VS
                            </span>

                            <div className="flex min-w-0 items-center justify-end gap-2">
                              <span className="truncate text-right text-[10px] font-medium text-[#d9e0e8]">
                                {fixture.away}
                              </span>
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.055] text-[8px] font-bold text-[#96a3b4]">
                                {fixture.awayCode}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="text-[9px] text-[#77869a]">
                              {fixture.matchday}
                            </span>
                            <span className="flex items-center gap-1.5 text-[9px] text-[#7e8b9d]">
                              <Clock3 size={11} />
                              {fixture.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => selectSection("Fixtures")}
                      className="mt-2 flex w-full items-center justify-end gap-2 rounded-lg px-2 py-2 text-[10px] font-semibold text-[#b7f56a] transition hover:bg-white/[0.03] hover:text-[#d2ff9c]"
                    >
                      View all fixtures
                      <ArrowUpRight size={14} />
                    </button>
                  </section>

                  {/* Tournament journey */}
                  <section className="rounded-2xl border border-white/[0.075] bg-[#101319] p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#74849a]">
                          Tournament journey
                        </p>
                        <h2 className="mt-2 text-base font-semibold">
                          Your competition stages
                        </h2>
                      </div>
                      <Trophy size={18} className="text-[#b7f56a]" />
                    </div>

                    <div className="mt-6 space-y-5">
                      <div className="flex gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#b7f56a]/[0.1] text-[#b7f56a]">
                          <Check size={15} />
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-[#e5ebf0]">
                              Competition created
                            </p>
                            <span className="text-[9px] text-[#b7f56a]">
                              Done
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] leading-4 text-[#7b889a]">
                            Your competition is stored in PostgreSQL.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.025] text-[#8d9aab]">
                          <Users size={15} />
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-[#d6dde5]">
                            Complete the lineup
                          </p>
                          <p className="mt-1 text-[10px] leading-4 text-[#7b889a]">
                            Register the clubs that will compete this season.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.025] text-[#8d9aab]">
                          <CalendarDays size={15} />
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-[#d6dde5]">
                            Generate fixtures
                          </p>
                          <p className="mt-1 text-[10px] leading-4 text-[#7b889a]">
                            Prepare the schedule before simulation begins.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.025] text-[#8d9aab]">
                          <Trophy size={15} />
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-[#d6dde5]">
                            Simulate and track
                          </p>
                          <p className="mt-1 text-[10px] leading-4 text-[#7b889a]">
                            Process results and update the standings.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => selectSection("All Competitions")}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.045] py-3 text-xs font-semibold text-[#c0f58c] transition hover:bg-[#b7f56a]/[0.09]"
                    >
                      Continue setup
                      <ArrowRight size={14} />
                    </button>
                  </section>

                  {/* Connection status */}
                  <section className="rounded-2xl border border-white/[0.07] bg-[#0d1117] p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b7f56a]/10 bg-[#b7f56a]/[0.06] text-[#b7f56a]">
                        <Activity size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-[#e4eaf0]">
                          Local workspace
                        </p>
                        <p className="mt-1 text-[9px] text-[#788699]">
                          ASP.NET Core · PostgreSQL
                        </p>
                      </div>
                      <span className="flex items-center gap-1.5 text-[9px] text-[#b7f56a]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#b7f56a]" />
                        Configured
                      </span>
                    </div>
                  </section>
                </div>
              </div>

              {/* Dashboard notice */}
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
          ) : (
            /* Safe placeholder for sections not yet wired to API endpoints */
            <motion.section
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center text-center"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#b7f56a]/20 bg-[#b7f56a]/[0.07] text-[#b7f56a]">
                <Goal size={30} />
              </span>

              <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b7f56a]">
                FootballSim workspace
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                {activeSection}
              </h1>

              <p className="mt-3 max-w-md text-sm leading-6 text-[#8d9aab]">
                This workspace is part of the FootballSim interface. We&apos;ll
                connect it to your existing ASP.NET Core endpoints so it uses
                real competition, team, fixture, and standings data.
              </p>

              {notice && (
                <p
                  role="status"
                  className="mt-5 rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.05] px-4 py-3 text-xs leading-5 text-[#c3e8a0]"
                >
                  {notice}
                </p>
              )}

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection("Dashboard");
                    setNotice("");
                  }}
                  className="flex h-11 items-center gap-2 rounded-xl bg-[#b7f56a] px-5 text-xs font-bold text-[#11180b] transition hover:bg-[#c9ff87]"
                >
                  <LayoutDashboard size={15} />
                  Back to dashboard
                </button>

                <button
                  type="button"
                  onClick={() => selectSection("Create Competition")}
                  className="flex h-11 items-center gap-2 rounded-xl border border-white/[0.1] px-5 text-xs font-semibold text-[#c9d2dd] transition hover:bg-white/[0.045]"
                >
                  <Plus size={15} />
                  Create competition
                </button>
              </div>
            </motion.section>
          )}

          <footer className="mt-10 flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[9px] text-[#647184] sm:flex-row sm:items-center sm:justify-between">
            <p>
              FootballSim <span className="mx-1.5 text-[#394351]">/</span>{" "}
              Football management workspace
            </p>
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
