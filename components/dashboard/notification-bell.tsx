"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Bell, CheckCheck, Loader2, RefreshCw, Trash2, Trophy, CalendarDays, Info, X } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAtUtc: string;
  readAtUtc?: string | null;
};
type NotificationResponse = {
  items: Notification[];
  page: number;
  pageSize: number;
  totalCount: number;
  unreadCount: number;
};

function timeLabel(value: string) {
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return "";
  const diff = Math.max(0, Date.now() - time.getTime());
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(time);
}

async function api(path: string, method: "GET" | "PATCH" | "DELETE" = "GET") {
  const response = await fetch(`/api/notifications${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
      ? payload.message : `Notification request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return payload;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const payload = await api("") as NotificationResponse;
      if (!payload || !Array.isArray(payload.items) || typeof payload.unreadCount !== "number") {
        throw new Error("Unexpected notification response.");
      }
      if (!mounted.current) return;
      setItems(payload.items);
      setUnreadCount(payload.unreadCount);
      setTotalCount(payload.totalCount);
      setError("");
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "Unable to load notifications.");
    } finally {
      if (mounted.current && showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh(true);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30_000);
    return () => { mounted.current = false; window.clearInterval(interval); };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const perform = async (path: string, method: "PATCH" | "DELETE", key: string) => {
    if (busyId) return;
    setBusyId(key);
    setError("");
    try {
      await api(path, method);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update notification.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => { setOpen(value => !value); if (!open) void refresh(); }}
        className="relative rounded-lg p-2 text-[#8b97a8] transition hover:bg-white/[0.05] hover:text-white"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#b7f56a] px-1 text-[9px] font-bold text-[#080a0d]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-[-52px] top-12 z-50 w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#10151b] text-white shadow-[0_20px_70px_rgba(0,0,0,0.65)] sm:right-0">
          <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-4 py-4">
            <div>
              <h2 className="text-sm font-semibold">Notifications</h2>
              <p className="mt-1 text-[11px] text-[#8b98aa]">{unreadCount} unread · {totalCount} total</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Refresh notifications" title="Refresh" onClick={() => void refresh(true)} disabled={loading} className="rounded-lg p-2 text-[#9ca9b9] hover:bg-white/[0.06] disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /></button>
              <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="rounded-lg p-2 text-[#9ca9b9] hover:bg-white/[0.06]"><X size={15} /></button>
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="flex justify-end border-b border-white/[0.06] px-4 py-2">
              <button type="button" disabled={busyId !== null} onClick={() => void perform("/read-all", "PATCH", "all")} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#b7f56a] hover:text-[#d0ff9c] disabled:opacity-50"><CheckCheck size={14} /> Mark all as read</button>
            </div>
          )}
          {error && <div role="alert" className="mx-3 mt-3 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/[0.06] p-3 text-[11px] text-red-200"><AlertCircle size={15} className="shrink-0" /><span>{error}</span></div>}
          <div className="max-h-[min(60vh,440px)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-12 text-xs text-[#8b98aa]"><Loader2 size={17} className="animate-spin" /> Loading notifications...</div>
            ) : items.length === 0 ? (
              <div className="px-6 py-12 text-center"><Bell size={28} className="mx-auto text-[#b7f56a]/60" /><h3 className="mt-4 text-sm font-semibold">All caught up</h3><p className="mt-2 text-xs leading-5 text-[#8b98aa]">Your competition and match notifications will appear here.</p></div>
            ) : items.map(item => {
              const Icon = item.type.toLowerCase().includes("match") ? CalendarDays : item.type.toLowerCase().includes("competition") ? Trophy : Info;
              return (
                <article key={item.id} className={`border-b border-white/[0.055] px-4 py-3 last:border-b-0 ${item.isRead ? "" : "bg-[#b7f56a]/[0.035]"}`}>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#b7f56a]/[0.09] text-[#b7f56a]"><Icon size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2"><h3 className="break-words text-xs font-semibold text-[#e9eef5]">{item.title}</h3>{!item.isRead && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b7f56a]" />}</div>
                      <p className="mt-1 break-words text-[11px] leading-5 text-[#9aa7b6]">{item.message}</p>
                      <p className="mt-2 text-[10px] text-[#738195]" title={item.createdAtUtc}>{timeLabel(item.createdAtUtc)}</p>
                      <div className="mt-2 flex items-center gap-3">
                        {!item.isRead && <button type="button" disabled={busyId !== null} onClick={() => void perform(`/${item.id}/read`, "PATCH", item.id)} className="text-[10px] font-semibold text-[#b7f56a] hover:underline disabled:opacity-50">Mark as read</button>}
                        <button type="button" disabled={busyId !== null} onClick={() => void perform(`/${item.id}`, "DELETE", item.id)} className="inline-flex items-center gap-1 text-[10px] text-[#8794a5] hover:text-red-300 disabled:opacity-50"><Trash2 size={12} /> Delete</button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {totalCount > items.length && <p className="border-t border-white/[0.06] px-4 py-3 text-center text-[10px] text-[#8b98aa]">Showing latest {items.length} of {totalCount} notifications</p>}
        </div>
      )}
    </div>
  );
}
