
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Shield,
  Activity,
  Settings,
  ChevronLeft,
  X,
  ArrowLeft,
} from "lucide-react";

const navigation = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Competitions",
    href: "/admin/competitions",
    icon: Trophy,
  },
  {
    label: "Platform Activity",
    href: "/admin/activity",
    icon: Activity,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

type AdminSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function AdminSidebar({
  mobileOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-[#0D1117] transition-all duration-300",
          collapsed ? "lg:w-20" : "lg:w-64",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          "w-64",
        ].join(" ")}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link
            href="/admin"
            onClick={onClose}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300 text-black">
              <Shield className="h-5 w-5" />
            </div>

            <div
              className={
                collapsed ? "lg:hidden" : ""
              }
            >
              <p className="truncate text-sm font-bold tracking-tight text-white">
                FootballSim
              </p>
              <p className="text-xs text-slate-400">
                Administration
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <p
            className={[
              "mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500",
              collapsed ? "lg:hidden" : "",
            ].join(" ")}
          >
            Management
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    active
                      ? "bg-lime-300/10 text-lime-300"
                      : "text-slate-400 hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5 shrink-0" />

                  <span
                    className={
                      collapsed ? "lg:hidden" : ""
                    }
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-white/10 p-3">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />

            <span className={collapsed ? "lg:hidden" : ""}>
              Regular Dashboard
            </span>
          </Link>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white lg:flex"
          >
            <ChevronLeft
              className={[
                "h-5 w-5 shrink-0 transition-transform",
                collapsed ? "rotate-180" : "",
              ].join(" ")}
            />

            {!collapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
