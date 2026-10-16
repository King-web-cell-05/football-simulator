
"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  CirclePlay,
  Clock3,
  Menu,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";

const ACCENT = "#B7F56A";

const teams = [
  {
    position: 1,
    name: "Real Madrid",
    short: "RM",
    color: "#F5F5F5",
    text: "#171717",
    played: 5,
    gd: "+9",
    points: 13,
  },
  {
    position: 2,
    name: "Arsenal",
    short: "ARS",
    color: "#E84B5F",
    text: "#FFFFFF",
    played: 5,
    gd: "+7",
    points: 12,
  },
  {
    position: 3,
    name: "Man. City",
    short: "MCI",
    color: "#79C9F5",
    text: "#10233A",
    played: 5,
    gd: "+5",
    points: 10,
  },
  {
    position: 4,
    name: "Bayern",
    short: "FCB",
    color: "#E83D4F",
    text: "#FFFFFF",
    played: 5,
    gd: "+3",
    points: 9,
  },
];

const features = [
  {
    number: "01",
    icon: Trophy,
    title: "Competition management",
    description:
      "Create tournaments, organize clubs, configure competition formats, and manage every stage from one workspace.",
    tag: "YOUR TOURNAMENT",
  },
  {
    number: "02",
    icon: Target,
    title: "Intelligent fixtures",
    description:
      "Generate fixtures with competition-aware pairing logic and keep every round organized from kickoff to finish.",
    tag: "EVERY MATCH MATTERS",
  },
  {
    number: "03",
    icon: Zap,
    title: "Football simulation",
    description:
      "Run fixtures through your football engine and see how each result changes the course of your competition.",
    tag: "LET THE GAME BEGIN",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Standings and insights",
    description:
      "Follow points, goal difference, results, and qualification positions through clear competition statistics.",
    tag: "KNOW THE NUMBERS",
  },
];

const steps = [
  {
    number: "01",
    title: "Set up your competition",
    description:
      "Name your tournament, choose a supported format, and define how your competition should run.",
    icon: Trophy,
  },
  {
    number: "02",
    title: "Build your lineup",
    description:
      "Add participating clubs and prepare your teams for the competition ahead.",
    icon: Target,
  },
  {
    number: "03",
    title: "Generate and simulate",
    description:
      "Create fixtures, run matchdays, and follow the results as your table develops.",
    icon: Activity,
  },
  {
    number: "04",
    title: "Follow the final result",
    description:
      "Track the standings, monitor qualification, and complete your tournament journey.",
    icon: Sparkles,
  },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="FootballSim home"
      className="group inline-flex shrink-0 items-center gap-3"
    >
      <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[13px] bg-[#B7F56A] text-[#08090D] shadow-[0_0_28px_rgba(183,245,106,0.08)] transition-transform duration-300 group-hover:rotate-[-5deg]">
        <Trophy size={21} strokeWidth={2.2} />
        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[2.5px] border-[#08090D] bg-white" />
      </span>

      <span className="flex flex-col">
        <span className="text-[19px] font-bold tracking-[-0.9px] text-white">
          Football<span className="text-[#B7F56A]">Sim</span>
        </span>
        {!compact && (
          <span className="mt-[-2px] text-[9px] font-semibold uppercase tracking-[2.2px] text-[#737D8B]">
            Control the game
          </span>
        )}
      </span>
    </Link>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/[0.09] bg-white/[0.035] px-3.5 py-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B7F56A]/40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B7F56A]" />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[1.8px] text-[#B9C1CD]">
        {children}
      </span>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-[#B7F56A]/[0.055] blur-[90px]" />

      <div className="relative overflow-hidden rounded-[20px] border border-white/[0.12] bg-[#0D1016] shadow-[0_35px_110px_rgba(0,0,0,0.52)] sm:rounded-[24px]">
        <div className="flex h-[58px] items-center justify-between border-b border-white/[0.07] px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex shrink-0 gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#FF625B]/85" />
              <span className="h-2 w-2 rounded-full bg-[#FFC44F]/85" />
              <span className="h-2 w-2 rounded-full bg-[#B7F56A]/85" />
            </div>
            <span className="truncate text-[10px] font-medium text-[#8A93A1]">
              FootballSim / Arena
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B7F56A]" />
            <span className="text-[9px] font-semibold tracking-[0.6px] text-[#CFD4DE]">
              PREVIEW
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[1.9px] text-[#818B99]">
                Competition workspace
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.8px] text-white sm:text-[25px]">
                Champions League
              </h3>
              <p className="mt-1.5 text-[11px] text-[#858E9C]">
                2026 / 27 season <span className="mx-1.5 text-[#4D5663]">/</span>{" "}
                League phase
              </p>
            </div>

            <span className="rounded-lg border border-[#B7F56A]/20 bg-[#B7F56A]/[0.08] px-3 py-2 text-[9px] font-bold tracking-[0.7px] text-[#B7F56A]">
              MATCHDAY 06
            </span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2.5">
            {[
              { label: "TEAMS", value: "08", icon: Trophy },
              { label: "PLAYED", value: "20", icon: Activity },
              { label: "GOALS", value: "57", icon: Target },
            ].map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 transition-colors hover:border-white/[0.13] sm:p-4"
                >
                  <Icon size={15} className="mb-3 text-[#B7F56A]/80" />
                  <p className="text-xl font-semibold tracking-[-0.8px] text-white sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[9px] font-semibold tracking-[1.2px] text-[#77818F]">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-white/[0.07] bg-[#11141B] p-3.5 sm:p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  League standings
                </h4>
                <p className="mt-1 text-[10px] text-[#7D8795]">
                  Competition ranking
                </p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold tracking-[0.6px] text-[#B7F56A]">
                SAMPLE TABLE <ArrowUpRight size={12} />
              </span>
            </div>

            <div className="grid grid-cols-[25px_minmax(0,1fr)_35px_35px] gap-2 border-b border-white/[0.07] pb-2 text-[9px] font-semibold tracking-[1px] text-[#727C8A] sm:grid-cols-[30px_minmax(0,1fr)_45px_45px]">
              <span>POS</span>
              <span>CLUB</span>
              <span className="text-center">GD</span>
              <span className="text-right">PTS</span>
            </div>

            <div className="divide-y divide-white/[0.045]">
              {teams.map((team) => (
                <div
                  key={team.name}
                  className="grid grid-cols-[25px_minmax(0,1fr)_35px_35px] items-center gap-2 py-3 sm:grid-cols-[30px_minmax(0,1fr)_45px_45px] sm:py-3.5"
                >
                  <span className="text-xs font-semibold text-[#B7F56A]">
                    {String(team.position).padStart(2, "0")}
                  </span>

                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[8px] font-extrabold"
                      style={{
                        backgroundColor: team.color,
                        color: team.text,
                      }}
                    >
                      {team.short}
                    </span>
                    <span className="truncate text-xs font-medium text-[#E7EAF0]">
                      {team.name}
                    </span>
                  </div>

                  <span className="text-center text-xs tabular-nums text-[#929BA8]">
                    {team.gd}
                  </span>
                  <span className="text-right text-sm font-semibold tabular-nums text-white">
                    {team.points}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B7F56A]" />
              <span className="text-[9px] text-[#818B99]">
                Illustrative standings for interface preview
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#B7F56A]/15 bg-[#B7F56A]/[0.045] p-3.5 sm:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#B7F56A]/10">
                <Zap size={17} className="text-[#B7F56A]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">
                  The next matchday awaits
                </p>
                <p className="mt-1 text-[10px] text-[#8E98A7]">
                  Your competition, your control
                </p>
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#B7F56A] px-3 py-2 text-[9px] font-extrabold tracking-[0.5px] text-[#08090D]">
              SIMULATE <ArrowRight size={12} />
            </span>
          </div>

          <p className="mt-3 text-center text-[9px] text-[#66707E]">
            Illustrative interface · Not live competition data
          </p>
        </div>
      </div>

      <div className="absolute -right-3 top-[17%] hidden items-center gap-2.5 rounded-xl border border-white/10 bg-[#151922]/95 p-3.5 shadow-xl backdrop-blur-xl sm:flex sm:-right-7">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#B7F56A]/10">
          <Activity size={17} className="text-[#B7F56A]" />
        </div>
        <div>
          <p className="text-[10px] text-[#8C95A3]">Competition tools</p>
          <p className="mt-1 text-xs font-semibold text-white">
            One focused workspace
          </p>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-2 hidden items-center gap-2.5 rounded-xl border border-white/10 bg-[#151922]/95 p-3 shadow-xl backdrop-blur-xl sm:flex sm:-left-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#B7F56A]/10">
          <BarChart3 size={16} className="text-[#B7F56A]" />
        </div>
        <div>
          <p className="text-[10px] text-[#8C95A3]">Competition overview</p>
          <p className="mt-0.5 text-xs font-semibold text-white">
            Every point counts
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const motionDuration = shouldReduceMotion ? 0 : 0.6;
  const navItems = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Platform", href: "#platform" },
  ];

  return (
    <main className="min-h-screen overflow-x-clip bg-[#08090D] font-sans text-white selection:bg-[#B7F56A] selection:text-[#08090D]">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08090D]/85 backdrop-blur-2xl">
        <nav
          className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-12"
          aria-label="Main navigation"
        >
          <Brand />

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[12px] font-medium text-[#9CA5B2] transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2.5 text-[12px] font-semibold text-[#C7CDD6] transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-lg bg-[#B7F56A] px-4 py-3 text-[12px] font-bold text-[#08090D] transition-all duration-200 hover:bg-[#CAFF8D] hover:shadow-[0_0_25px_rgba(183,245,106,0.12)]"
            >
              Get started
              <ArrowUpRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] text-white transition-colors hover:bg-white/[0.07] md:hidden"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </nav>

        {menuOpen && (
          <div
            id="mobile-navigation"
            className="border-t border-white/[0.07] bg-[#0C0E13] px-5 py-5 md:hidden"
          >
            <div className="mx-auto flex max-w-[1320px] flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3.5 py-3 text-sm text-[#C2C8D2] transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold transition-colors hover:bg-white/[0.04]"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-[#B7F56A] px-4 py-3 text-center text-sm font-bold text-[#08090D] transition-colors hover:bg-[#CAFF8D]"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-260px] h-[540px] w-[780px] -translate-x-1/2 rounded-full bg-[#B7F56A]/[0.075] blur-[135px]" />
          <div className="absolute right-[-180px] top-[250px] h-[340px] w-[340px] rounded-full bg-[#4B73B8]/[0.055] blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              maskImage: "linear-gradient(to bottom, black 0%, transparent 85%)",
            }}
          />
        </div>

        <div className="mx-auto grid max-w-[1320px] items-center gap-16 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:px-12 lg:pb-28 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionDuration, ease: "easeOut" }}
            className="relative z-10 mx-auto w-full max-w-[600px] lg:mx-0"
          >
            <SectionLabel>Football competition platform</SectionLabel>

            <h1 className="max-w-[700px] text-[clamp(2.8rem,6vw,5.35rem)] font-semibold leading-[1.015] tracking-[-0.075em] text-white">
              Simulate the game.
              <span className="mt-1 block text-[#B7F56A]">
                Own the competition.
              </span>
            </h1>

            <p className="mt-7 max-w-[500px] text-[14px] leading-7 text-[#9AA3B1] sm:text-[15px] sm:leading-8">
              Build tournaments, generate fixtures, simulate matchdays, and
              follow every point on the road to the trophy. Your football
              competition, managed in one place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="group inline-flex min-h-[51px] items-center justify-center gap-2 rounded-xl bg-[#B7F56A] px-6 text-[12px] font-bold text-[#08090D] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#CAFF8D] hover:shadow-[0_10px_35px_rgba(183,245,106,0.13)]"
              >
                Create your competition
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="#platform"
                className="inline-flex min-h-[51px] items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.025] px-5 text-[12px] font-semibold text-[#D9DDE5] transition-colors hover:border-white/20 hover:bg-white/[0.055]"
              >
                <CirclePlay size={17} className="text-[#B7F56A]" />
                Explore the platform
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/[0.08] pt-6">
              {[
                "Competition management",
                "Match simulation",
                "Standings",
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 text-[10px] font-medium text-[#A3ABB8] sm:text-[11px]"
                >
                  <Check size={13} className="shrink-0 text-[#B7F56A]" />
                  {item}
                </span>
              ))}
            </div>

            <Link
              href="#features"
              className="mt-9 hidden w-fit items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.6px] text-[#737D8A] transition-colors hover:text-[#B7F56A] sm:inline-flex"
            >
              Discover what you can do
              <ArrowDownRight size={14} />
            </Link>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : 24,
              scale: shouldReduceMotion ? 1 : 0.985,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.8,
              delay: shouldReduceMotion ? 0 : 0.1,
              ease: "easeOut",
            }}
            className="relative mx-auto w-full max-w-[650px]"
            id="platform"
          >
            <DashboardPreview />
          </motion.div>
        </div>

        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 border-t border-white/[0.07] py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-[1.8px] text-[#737C8A] sm:text-[10px]">
              One platform. Every stage of the game.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[10px] text-[#8E97A5] sm:text-[11px]">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#B7F56A]" />
                Competition control
              </span>
              <span className="inline-flex items-center gap-2">
                <Activity size={14} className="text-[#B7F56A]" />
                Matchday tracking
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 size={14} className="text-[#B7F56A]" />
                Round-by-round progress
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="relative border-t border-white/[0.06] bg-[#0B0D12] py-24 sm:py-28 lg:py-32"
      >
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: motionDuration, ease: "easeOut" }}
            className="mx-auto max-w-[740px] text-center"
          >
            <SectionLabel>Built around the competition</SectionLabel>

            <h2 className="text-3xl font-semibold leading-[1.12] tracking-[-0.06em] text-white sm:text-4xl lg:text-5xl">
              Everything you need.
              <span className="mt-1 block text-[#858E9D]">
                One serious football workspace.
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-[560px] text-sm leading-7 text-[#929BA9] sm:text-[15px]">
              Spend less time managing the process and more time following the
              competition. Keep the essential tools together from setup to
              final standings.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.article
                  key={feature.number}
                  initial={{
                    opacity: 0,
                    y: shouldReduceMotion ? 0 : 18,
                  }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.5,
                    delay: shouldReduceMotion ? 0 : index * 0.07,
                    ease: "easeOut",
                  }}
                  whileHover={
                    shouldReduceMotion ? undefined : { y: -5 }
                  }
                  className="group relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11141B] p-6 transition-colors duration-300 hover:border-[#B7F56A]/25 hover:bg-[#141821] sm:p-7"
                >
                  <span className="absolute right-5 top-5 text-[10px] font-semibold tracking-[1px] text-[#4D5664]">
                    {feature.number}
                  </span>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#B7F56A]/15 bg-[#B7F56A]/[0.07] text-[#B7F56A] transition-colors group-hover:bg-[#B7F56A]/[0.13]">
                    <Icon size={21} strokeWidth={1.7} />
                  </div>

                  <p className="mt-7 text-[9px] font-semibold tracking-[1.7px] text-[#89929F]">
                    {feature.tag}
                  </p>

                  <h3 className="mt-2 text-[17px] font-semibold tracking-[-0.5px] text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-[12px] leading-6 text-[#929BA8] sm:text-[13px]">
                    {feature.description}
                  </p>

                  <div className="mt-auto flex justify-end pt-5">
                    <ArrowUpRight
                      size={17}
                      className="text-[#687281] transition-colors group-hover:text-[#B7F56A]"
                    />
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="relative overflow-hidden py-24 sm:py-28 lg:py-32"
      >
        <div className="pointer-events-none absolute -left-48 top-1/3 h-[400px] w-[400px] rounded-full bg-[#B7F56A]/[0.035] blur-[110px]" />

        <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: motionDuration, ease: "easeOut" }}
              className="lg:sticky lg:top-32 lg:h-fit"
            >
              <SectionLabel>From setup to champion</SectionLabel>

              <h2 className="max-w-[500px] text-3xl font-semibold leading-[1.13] tracking-[-0.06em] text-white sm:text-4xl lg:text-5xl">
                Four steps.
                <span className="mt-1 block text-[#B7F56A]">
                  One competition.
                </span>
              </h2>

              <p className="mt-6 max-w-[430px] text-sm leading-7 text-[#929BA9] sm:text-[15px]">
                FootballSim gives your competition a clear path from the first
                setup to the final table. Organize your teams, run the
                matchdays, and keep track of how the story unfolds.
              </p>

              <Link
                href="/signup"
                className="group mt-8 inline-flex items-center gap-2 text-[12px] font-semibold text-[#B7F56A] transition-colors hover:text-[#D1FFA0]"
              >
                Start your competition
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </motion.div>

            <div className="relative">
              <div className="absolute bottom-10 left-[23px] top-10 w-px bg-gradient-to-b from-[#B7F56A]/50 via-white/10 to-transparent sm:left-[27px]" />

              <div className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <motion.div
                      key={step.number}
                      initial={{
                        opacity: 0,
                        x: shouldReduceMotion ? 0 : 18,
                      }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.5,
                        delay: shouldReduceMotion ? 0 : index * 0.07,
                        ease: "easeOut",
                      }}
                      className="group relative flex gap-4 rounded-2xl border border-white/[0.07] bg-[#0D1016] p-5 transition-colors hover:border-white/[0.13] sm:gap-6 sm:p-7"
                    >
                      <div className="relative z-10 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-[#B7F56A]/20 bg-[#11180E] text-[#B7F56A] sm:h-[54px] sm:w-[54px]">
                        <Icon size={20} strokeWidth={1.7} />
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="mb-2 text-[9px] font-bold uppercase tracking-[1.6px] text-[#737D8B]">
                          STEP {step.number}
                        </div>
                        <h3 className="text-base font-semibold tracking-[-0.3px] text-white sm:text-lg">
                          {step.title}
                        </h3>
                        <p className="mt-2 max-w-[430px] text-[12px] leading-6 text-[#929BA9] sm:text-[13px]">
                          {step.description}
                        </p>
                      </div>

                      <ChevronRight
                        size={18}
                        className="mt-1 shrink-0 text-[#525C69] transition-all group-hover:translate-x-1 group-hover:text-[#B7F56A]"
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-12 lg:pb-28">
        <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-3xl border border-[#B7F56A]/15 bg-[#11170E] px-6 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-16 -top-40 h-[370px] w-[370px] rounded-full bg-[#B7F56A]/[0.09] blur-[90px]" />
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(183,245,106,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(183,245,106,0.16) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
                maskImage:
                  "linear-gradient(110deg, transparent 10%, black 100%)",
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: motionDuration, ease: "easeOut" }}
            className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end"
          >
            <div className="max-w-[650px]">
              <div className="mb-5 inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[2px] text-[#B7F56A] sm:text-[10px]">
                <Sparkles size={14} />
                Your next competition starts here
              </div>

              <h2 className="text-3xl font-semibold leading-[1.12] tracking-[-0.06em] text-white sm:text-4xl lg:text-5xl">
                Ready to take control
                <span className="mt-1 block text-[#B7F56A]">
                  of the beautiful game?
                </span>
              </h2>

              <p className="mt-5 max-w-[500px] text-sm leading-7 text-[#A2AB9A] sm:text-[15px]">
                Bring your teams together, build your tournament, and discover
                where every match takes you.
              </p>
            </div>

            <Link
              href="/signup"
              className="group inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#B7F56A] px-6 text-[12px] font-bold text-[#08090D] transition-all hover:-translate-y-0.5 hover:bg-[#CAFF8D]"
            >
              Get started with FootballSim
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.07] bg-[#08090D]">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-8 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-[350px]">
              <Brand />
              <p className="mt-4 text-[11px] leading-6 text-[#858E9D]">
                A focused workspace for organizing football competitions,
                simulating fixtures, and following the road to the trophy.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="#features"
                className="text-[11px] text-[#929BA8] transition-colors hover:text-white"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-[11px] text-[#929BA8] transition-colors hover:text-white"
              >
                How it works
              </Link>
              <Link
                href="/login"
                className="text-[11px] text-[#929BA8] transition-colors hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-[11px] text-[#929BA8] transition-colors hover:text-white"
              >
                Create account
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/[0.07] py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-[#697382]">
              © {new Date().getFullYear()} FootballSim. Built for the love of
              the game.
            </p>
            <p className="text-[10px] text-[#697382]">
              Independent football simulation platform.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
