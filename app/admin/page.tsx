
import Link from "next/link";
import {
  ArrowUpRight,
  ShieldCheck,
  Users,
  Trophy,
  Activity,
  Settings,
} from "lucide-react";

const sections = [
  {
    title: "User Management",
    description:
      "Manage registered users, account verification and suspension.",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Competitions",
    description:
      "Monitor competitions created across the platform.",
    icon: Trophy,
    href: "/admin/competitions",
  },
  {
    title: "Platform Activity",
    description:
      "Review matches, statistics and recent platform activity.",
    icon: Activity,
    href: "/admin/activity",
  },
  {
    title: "Settings",
    description:
      "Configure administrative settings and platform controls.",
    icon: Settings,
    href: "/admin/settings",
  },
];

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="mb-12 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300 text-black">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <div>
          <p className="text-sm font-medium text-lime-300">
            FOOTBALLSIM
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Administration
          </h1>
        </div>
      </div>

      <div className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
          Private workspace
        </p>

        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Platform Control Center
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
          Monitor FootballSim operations, manage accounts,
          oversee competitions and review platform activity
          from one secure workspace.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              key={section.title}
              href={section.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-lime-300/40 hover:bg-white/[0.06]"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-lime-300">
                  <Icon className="h-5 w-5" />
                </div>

                <ArrowUpRight className="h-5 w-5 text-slate-500 transition group-hover:text-lime-300" />
              </div>

              <h3 className="text-lg font-semibold">
                {section.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {section.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-lime-300/15 bg-lime-300/[0.045] p-5">
        <div>
          <p className="font-medium text-white">
            Administrator access verified
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Your session is authorized for FootballSim administration.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Regular dashboard
        </Link>
      </div>
    </main>
  );
}
