
"use client";

import { useState, type ReactNode } from "react";
import { Menu, ShieldCheck } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";

export function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#090C10] text-white">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() =>
          setCollapsed((previous) => !previous)
        }
      />

      <div
        className={[
          "min-h-screen transition-[margin] duration-300",
          collapsed ? "lg:ml-20" : "lg:ml-64",
        ].join(" ")}
      >
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/10 bg-[#090C10]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open admin navigation"
              className="rounded-xl border border-white/10 p-2.5 text-slate-300 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <p className="text-sm font-semibold text-white">
                Administration
              </p>
              <p className="text-xs text-slate-500">
                FootballSim Control Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-lime-300/15 bg-lime-300/5 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-lime-300" />
            <span className="hidden text-xs font-medium text-lime-300 sm:inline">
              Admin Workspace
            </span>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] px-5 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
