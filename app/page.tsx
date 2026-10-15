"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Crown,
  Gamepad2,
  Goal,
  Menu,
  MousePointer2,
  Play,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";

const teams = [
  { name: "Arsenal", short: "ARS", color: "#EF4444", points: 18, played: 8 },
  {
    name: "Real Madrid",
    short: "RMA",
    color: "#F5C451",
    points: 16,
    played: 8,
  },
  { name: "Man City", short: "MCI", color: "#38BDF8", points: 15, played: 8 },
  { name: "Bayern", short: "BAY", color: "#F87171", points: 14, played: 8 },
];

const features = [
  {
    number: "01",
    icon: Swords,
    title: "Realistic match simulation",
    description:
      "Simulate fixtures and experience football outcomes shaped by team strength, tactics, and match events.",
    tag: "MATCH ENGINE",
  },
  {
    number: "02",
    icon: BarChart3,
    title: "Live league standings",
    description:
      "Follow points, goal difference, wins, and losses with standings that update as matches are completed.",
    tag: "LEAGUE DATA",
  },
  {
    number: "03",
    icon: Users,
    title: "Build your competition",
    description:
      "Manage teams, create competitions, and set up your own football universe from the ground up.",
    tag: "COMPETITION BUILDER",
  },
  {
    number: "04",
    icon: Trophy,
    title: "Track every result",
    description:
      "Keep your fixtures, results, and competition progress organized in one central dashboard.",
    tag: "SEASON TRACKING",
  },
  {
    number: "05",
    icon: CalendarDays,
    title: "Fixture management",
    description:
      "Generate fixtures and keep your competition schedule easy to follow from the first match to the last.",
    tag: "FIXTURE CONTROL",
  },
  {
    number: "06",
    icon: Zap,
    title: "Fast, focused workflow",
    description:
      "Move from setting up a competition to simulating matches without unnecessary steps or clutter.",
    tag: "BUILT FOR SPEED",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your competition",
    description:
      "Start a new football competition and configure it to match your preferred format.",
  },
  {
    number: "02",
    title: "Add your teams",
    description:
      "Choose the teams you want to compete and prepare your tournament structure.",
  },
  {
    number: "03",
    title: "Simulate and follow",
    description:
      "Generate fixtures, simulate matches, and follow the standings as your season develops.",
  },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="FootballSim home"
      className="group inline-flex shrink-0 items-center gap-2.5"
    >
      <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#b7f56a]/25 bg-[#b7f56a]/10 text-[#b7f56a] transition duration-300 group-hover:border-[#b7f56a]/60 group-hover:bg-[#b7f56a]/15">
        <Goal size={23} strokeWidth={1.8} />
        <span className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-[#b7f56a]/15 blur-md" />
      </span>

      <span className="flex flex-col">
        <span className="text-[15px] font-bold tracking-[-0.04em] text-white">
          Football<span className="text-[#b7f56a]">Sim</span>
        </span>
        {!compact && (
          <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.22em] text-[#748092]">
            Your football universe
          </span>
        )}
      </span>
    </Link>
  );
}

function SectionLabel({
  children,
  icon: Icon = Sparkles,
}: {
  children: ReactNode;
  icon?: typeof Sparkles;
}) {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-3.5 py-2">
      <Icon size={13} className="text-[#b7f56a]" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#aeb8c7]">
        {children}
      </span>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[590px]">
      <div className="absolute -inset-8 rounded-[40px] bg-[#b7f56a]/[0.06] blur-3xl" />

      <div className="relative overflow-hidden rounded-[22px] border border-white/[0.12] bg-[#0b1016] shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ff6d68]/80" />
              <span className="h-2 w-2 rounded-full bg-[#f3c969]/80" />
              <span className="h-2 w-2 rounded-full bg-[#b7f56a]/80" />
            </div>
            <span className="ml-2 text-[10px] font-medium text-[#778294]">
              FootballSim / Dashboard
            </span>
          </div>

          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
            <Bell size={13} className="text-[#9ba7b7]" />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.17em] text-[#8490a0]">
                Competition overview
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-white sm:text-2xl">
                Champions League
              </h3>
              <p className="mt-1 text-xs text-[#7c8797]">
                2026 season · League phase
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b7f56a]/20 bg-[#b7f56a]/[0.08] px-3 py-1.5 text-[10px] font-semibold text-[#b7f56a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b7f56a]" />
              Competition active
            </span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3">
            {[
              { label: "TEAMS", value: "36", icon: Users },
              { label: "MATCHES", value: "144", icon: Gamepad2 },
              { label: "PLAYED", value: "86", icon: Check },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 sm:p-4"
              >
                <stat.icon size={15} className="text-[#b7f56a]" />
                <p className="mt-3 text-xl font-semibold tracking-[-0.05em] text-white sm:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-[9px] font-medium tracking-[0.12em] text-[#7b8797] sm:text-[10px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07]">
            <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.025] px-3.5 py-3 sm:px-4">
              <span className="text-xs font-semibold text-white">
                League standings
              </span>
              <span className="text-[10px] text-[#7d8999]">Top teams</span>
            </div>

            <div className="px-3.5 sm:px-4">
              <div className="grid grid-cols-[1fr_35px_35px] gap-2 border-b border-white/[0.06] py-2.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#6f7b8b]">
                <span>Club</span>
                <span className="text-center">P</span>
                <span className="text-center">Pts</span>
              </div>

              {teams.map((team, index) => (
                <div
                  key={team.short}
                  className="grid grid-cols-[1fr_35px_35px] items-center gap-2 border-b border-white/[0.045] py-3 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="w-3 text-[10px] text-[#738092]">
                      {index + 1}
                    </span>
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[8px] font-extrabold text-[#0b1016]"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.short}
                    </span>
                    <span className="truncate text-xs font-medium text-[#dce2ea]">
                      {team.name}
                    </span>
                  </div>
                  <span className="text-center text-xs text-[#a0abba]">
                    {team.played}
                  </span>
                  <span className="text-center text-xs font-semibold text-white">
                    {team.points}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.045] p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b7f56a]/10 text-[#b7f56a]">
                <Trophy size={15} />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-white">
                  Your competition. Your rules.
                </p>
                <p className="mt-0.5 text-[10px] text-[#8995a4]">
                  Manage every stage in one place.
                </p>
              </div>
            </div>
            <ArrowUpRight size={16} className="text-[#b7f56a]" />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="absolute -left-3 top-[22%] hidden items-center gap-2.5 rounded-xl border border-white/[0.12] bg-[#111821] px-3.5 py-3 shadow-xl sm:flex md:-left-8"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b7f56a]/10 text-[#b7f56a]">
          <Zap size={16} />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-white">Match engine</p>
          <p className="mt-0.5 text-[9px] text-[#8793a3]">Ready to simulate</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="absolute -right-3 bottom-[18%] hidden items-center gap-2.5 rounded-xl border border-white/[0.12] bg-[#111821] px-3.5 py-3 shadow-xl sm:flex md:-right-7"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3c969]/10 text-[#f3c969]">
          <Crown size={16} />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-white">Season control</p>
          <p className="mt-0.5 text-[9px] text-[#8793a3]">
            Every result matters
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [year, setYear] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const reveal = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.15 },
        transition: { duration: 0.55, ease: "easeOut" as const },
      };

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070a0e] text-white selection:bg-[#b7f56a] selection:text-[#070a0e]">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(183,245,106,0.075),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#070a0e]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Brand />

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-xs font-medium text-[#9ca7b6] transition hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-xs font-medium text-[#9ca7b6] transition hover:text-white"
            >
              How it works
            </Link>
            <Link
              href="#about"
              className="text-xs font-medium text-[#9ca7b6] transition hover:text-white"
            >
              About
            </Link>
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#c4ccd6] transition hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="group inline-flex h-10 items-center gap-2 rounded-lg bg-[#b7f56a] px-4 text-xs font-bold text-[#10150a] transition hover:bg-[#c9ff87]"
            >
              Get started
              <ArrowUpRight
                size={14}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white md:hidden"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/[0.07] bg-[#0a0e13] px-5 py-5 md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1">
              {[
                { label: "Features", href: "#features" },
                { label: "How it works", href: "#how-it-works" },
                { label: "About", href: "#about" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-3 text-sm text-[#b6c0ce] transition hover:bg-white/[0.04] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex h-11 items-center justify-center rounded-lg border border-white/10 text-sm font-semibold text-white"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={closeMenu}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#b7f56a] text-sm font-bold text-[#10150a]"
                >
                  Get started
                  <ArrowRight size={15} />
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <section className="relative z-10 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:px-10 lg:pb-32 lg:pt-28">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="relative z-10 max-w-2xl"
          >
            <SectionLabel icon={Sparkles}>FOOTBALL, REIMAGINED</SectionLabel>

            <h1 className="text-[clamp(2.7rem,7.2vw,5.7rem)] font-semibold leading-[0.99] tracking-[-0.075em] text-white">
              The game is
              <br />
              yours to{" "}
              <span className="relative inline-block text-[#b7f56a]">
                control.
                <svg
                  aria-hidden="true"
                  viewBox="0 0 250 14"
                  fill="none"
                  className="absolute -bottom-2 left-0 w-full"
                >
                  <path
                    d="M3 9C65 2 166 2 247 7"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-sm leading-7 text-[#a0abba] sm:text-base sm:leading-8">
              Create competitions, simulate matches, manage fixtures, and follow
              every result. Build your football universe with one powerful
              simulation experience.
            </p>

            <div className="mt-9 flex flex-col gap-3 min-[420px]:flex-row">
              <Link
                href="/signup"
                className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-[#b7f56a] px-6 text-sm font-bold text-[#10150a] shadow-[0_0_35px_rgba(183,245,106,0.1)] transition hover:-translate-y-0.5 hover:bg-[#c9ff87]"
              >
                Start building
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.025] px-6 text-sm font-semibold text-[#d0d7e0] transition hover:border-white/25 hover:bg-white/[0.06]"
              >
                <Play size={14} className="fill-current" />
                Explore the platform
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[0.08] pt-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#b7f56a]" />
                <span className="text-[11px] text-[#9ba6b5]">
                  Built for football fans
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-[#b7f56a]" />
                <span className="text-[11px] text-[#9ba6b5]">
                  Fast match simulation
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={
              shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 18 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.12, ease: "easeOut" }}
            className="relative"
          >
            <DashboardPreview />
          </motion.div>
        </div>

        <div className="mx-auto mt-20 flex max-w-7xl flex-col items-center justify-between gap-5 border-t border-white/[0.07] pt-7 sm:flex-row">
          <p className="text-center text-[10px] font-medium uppercase tracking-[0.19em] text-[#687586] sm:text-left">
            One platform. Every possibility.
          </p>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 text-[11px] font-medium text-[#9ba6b5] transition hover:text-[#b7f56a]"
          >
            Discover what you can do
            <ArrowDownRight size={14} />
          </Link>
        </div>
      </section>

      <section
        id="features"
        className="relative z-10 scroll-mt-24 border-t border-white/[0.07] px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div {...reveal} className="max-w-2xl">
            <SectionLabel icon={Zap}>MADE FOR THE GAME</SectionLabel>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.06em] text-white sm:text-4xl lg:text-5xl">
              Everything you need.
              <br />
              <span className="text-[#7f8b9b]">Nothing in your way.</span>
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#98a4b3] sm:text-base sm:leading-8">
              From your first competition to the final result, FootballSim
              brings the essential tools together in one focused workspace.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article
                key={feature.number}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.45,
                  delay: shouldReduceMotion ? 0 : (index % 3) * 0.08,
                }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1016]/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-[#b7f56a]/25 hover:bg-[#0e141b] sm:p-7"
              >
                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#b7f56a]/[0.025] blur-2xl transition group-hover:bg-[#b7f56a]/[0.07]" />

                <div className="relative flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.07] text-[#b7f56a] transition group-hover:bg-[#b7f56a]/[0.13]">
                    <feature.icon size={20} strokeWidth={1.7} />
                  </span>
                  <span className="font-mono text-xs text-[#586474]">
                    {feature.number}
                  </span>
                </div>

                <p className="relative mt-7 text-[9px] font-semibold tracking-[0.17em] text-[#82906f]">
                  {feature.tag}
                </p>
                <h3 className="relative mt-2 text-lg font-semibold tracking-[-0.035em] text-white">
                  {feature.title}
                </h3>
                <p className="relative mt-3 text-sm leading-7 text-[#909cac]">
                  {feature.description}
                </p>

                <div className="relative mt-6 flex items-center gap-2 text-xs font-semibold text-[#b7f56a] opacity-0 transition duration-300 group-hover:opacity-100">
                  Explore feature
                  <ArrowRight size={13} />
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative z-10 scroll-mt-24 border-t border-white/[0.07] bg-[#0a0e13] px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28"
      >
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <motion.div {...reveal}>
            <SectionLabel icon={MousePointer2}>SIMPLE BY DESIGN</SectionLabel>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.06em] text-white sm:text-4xl lg:text-5xl">
              From setup
              <br />
              to kick-off.
              <br />
              <span className="text-[#7f8b9b]">Three simple steps.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#98a4b3] sm:text-base sm:leading-8">
              Spend less time organizing your competition and more time
              following the football.
            </p>

            <Link
              href="/signup"
              className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#b7f56a] transition hover:text-[#d2ff9e]"
            >
              Get started today
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>

          <div className="relative">
            <div className="absolute bottom-10 left-[21px] top-10 hidden w-px bg-gradient-to-b from-[#b7f56a]/35 via-white/10 to-transparent sm:block" />

            <div className="space-y-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: 15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.5,
                    delay: shouldReduceMotion ? 0 : index * 0.1,
                  }}
                  className="group relative flex gap-5 rounded-2xl border border-white/[0.07] bg-[#0d1218] p-5 transition hover:border-white/[0.13] sm:gap-6 sm:p-7"
                >
                  <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#b7f56a]/20 bg-[#b7f56a]/[0.08] font-mono text-xs font-semibold text-[#b7f56a]">
                    {step.number}
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-base font-semibold tracking-[-0.025em] text-white sm:text-lg">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[#909cac]">
                      {step.description}
                    </p>
                  </div>

                  <ArrowUpRight
                    size={17}
                    className="mt-1 shrink-0 text-[#667384] transition group-hover:text-[#b7f56a]"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="about"
        className="relative z-10 scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28"
      >
        <motion.div
          {...reveal}
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[26px] border border-white/[0.1] bg-[#0d1319] px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20"
        >
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#b7f56a]/[0.08] blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-[#b7f56a]/[0.035] blur-[90px]" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
            <div className="max-w-2xl">
              <SectionLabel icon={CircleHelp}>WHY FOOTBALLSIM</SectionLabel>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.06em] text-white sm:text-4xl lg:text-5xl">
                Your football ideas
                <br />
                deserve a <span className="text-[#b7f56a]">proper pitch.</span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#98a4b3] sm:text-base sm:leading-8">
                FootballSim is built around one idea: give football fans a
                clear, practical way to create competitions and explore match
                outcomes. Whether you are organizing a tournament or
                experimenting with a league format, the experience stays focused
                on the game.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:max-w-[220px] lg:flex-col">
              {[
                { icon: Trophy, label: "Competition focused" },
                { icon: BarChart3, label: "Results and standings" },
                { icon: Gamepad2, label: "Made for football fans" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-white/[0.09] bg-white/[0.025] px-3.5 py-3 lg:w-full"
                >
                  <item.icon size={16} className="shrink-0 text-[#b7f56a]" />
                  <span className="text-xs font-medium text-[#c0c9d4]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10 lg:pb-28">
        <motion.div
          {...reveal}
          className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-2xl border border-[#b7f56a]/20 bg-[#b7f56a]/[0.055] p-6 sm:p-9 md:flex-row md:items-center lg:p-12"
        >
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b7f56a]">
              <Sparkles size={13} />
              YOUR NEXT SEASON STARTS HERE
            </div>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.06em] text-white sm:text-4xl lg:text-[44px]">
              Ready to take control
              <br className="hidden sm:block" /> of your football world?
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#9ba7b6]">
              Create your competition, set up your teams, and see where the
              season takes you.
            </p>
          </div>

          <Link
            href="/signup"
            className="group inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2.5 rounded-xl bg-[#b7f56a] px-6 text-sm font-bold text-[#10150a] transition hover:-translate-y-0.5 hover:bg-[#c9ff87] sm:w-auto"
          >
            Create your account
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.07] px-5 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Brand compact />
            <span className="hidden h-4 w-px bg-white/10 sm:block" />
            <p className="text-[10px] text-[#697382]">
              © {year ?? 2026} FootballSim. Built for the love of the game.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/login"
              className="text-[11px] text-[#8b97a6] transition hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-[11px] text-[#8b97a6] transition hover:text-white"
            >
              Create account
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-1.5 text-[11px] text-[#8b97a6] transition hover:text-white"
            >
              Back to top
              <ChevronDown size={12} className="rotate-180" />
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
