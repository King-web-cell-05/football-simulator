"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, CalendarDays, Check, CircleAlert, Loader2, Plus,
  RefreshCw, Search, Shield, Trash2, Trophy, Users,
} from "lucide-react";

type Competition = { id: string; name: string; season: string | null; createdDate: string };
type RegisteredTeam = { competitionId: string; competitionName: string; teamId: string; teamName: string };
type AvailableTeam = { id: string; name: string; isDefault?: boolean; logoUrl: string | null };

type ApiError = { message?: string };

// Use the same backend origin and relative-logo handling as Teams Management.
const API_URL = (
  process.env.NEXT_PUBLIC_FOOTBALLSIM_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5295"
).replace(/\/+$/, "");

function resolveLogoUrl(url: string | null): string | null {
  if (!url?.trim()) return null;
  const value = url.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_URL}${value}`;
  return null;
}

function TeamCrest({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const url = resolveLogoUrl(logoUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#b7f56a]/15 bg-[#171d23]">
      {url && failedUrl !== url ? (
        // External club crests may not be configured in next/image remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`${name} crest`}
          className="h-full w-full object-contain p-1.5"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <Shield size={19} className="text-[#b7f56a]" aria-hidden="true" />
      )}
    </span>
  );
}

async function getJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function messageFrom(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data && typeof (data as ApiError).message === "string") {
    return (data as ApiError).message || fallback;
  }
  return fallback;
}

function parseAvailableTeams(data: unknown): AvailableTeam[] {
  // The existing /api/teams endpoint may return an array or a paginated object.
  const source = Array.isArray(data)
    ? data
    : data && typeof data === "object" && "teams" in data && Array.isArray(data.teams)
      ? data.teams
      : data && typeof data === "object" && "items" in data && Array.isArray(data.items)
        ? data.items
        : null;

  if (!source) throw new Error("The teams API returned an unexpected format.");

  return source
    .filter((team): team is Record<string, unknown> =>
      !!team && typeof team === "object" && typeof team.id === "string" && typeof team.name === "string")
    .map((team) => ({ id: team.id as string, name: team.name as string, isDefault: team.isDefault === true, logoUrl: typeof team.logoUrl === "string" ? team.logoUrl : null }));
}

function parseRegisteredTeams(data: unknown): RegisteredTeam[] {
  if (!Array.isArray(data)) throw new Error("The competition teams API returned an unexpected format.");
  return data.filter((item): item is RegisteredTeam =>
    !!item && typeof item === "object" && typeof item.teamId === "string" && typeof item.teamName === "string");
}

function Skeleton() {
  return (
    <div role="status" aria-label="Loading competition details" className="animate-pulse space-y-5">
      <div className="h-44 rounded-2xl bg-[#101b15]" />
      <div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-[#101319]" />)}</div>
      <div className="h-64 rounded-2xl bg-[#101319]" />
    </div>
  );
}

export default function CompetitionDetails({ competitionId, onBack }: {
  competitionId: string;
  onBack: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [registered, setRegistered] = useState<RegisteredTeam[]>([]);
  const [available, setAvailable] = useState<AvailableTeam[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [registeredQuery, setRegisteredQuery] = useState("");
  const [reload, setReload] = useState(0);

  const refresh = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [competitionResponse, registeredResponse, availableResponse] = await Promise.all([
          fetch("/api/competitions", { credentials: "same-origin", cache: "no-store", signal: controller.signal }),
          fetch(`/api/competition-teams?competitionId=${encodeURIComponent(competitionId)}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal }),
          fetch("/api/teams", { credentials: "same-origin", cache: "no-store", signal: controller.signal }),
        ]);

        const responses = [competitionResponse, registeredResponse, availableResponse];
        if (responses.some((r) => r.status === 401 || r.status === 403)) {
          throw new Error("Your session has expired. Please sign in again.");
        }
        const [competitionData, registeredData, availableData] = await Promise.all(responses.map(getJson));
        const failedIndex = responses.findIndex((r) => !r.ok);
        if (failedIndex !== -1) {
          throw new Error(messageFrom([competitionData, registeredData, availableData][failedIndex], `Unable to load data (HTTP ${responses[failedIndex].status}).`));
        }
        if (!Array.isArray(competitionData)) {
          throw new Error("The competition API returned an unexpected response.");
        }
        const found = competitionData.find((item) => item && typeof item === "object" && item.id === competitionId);
        if (!found || typeof found.name !== "string") {
          throw new Error("This competition was not found.");
        }
        const record = found as Record<string, unknown>;
        const teams = parseRegisteredTeams(registeredData);
        const clubs = parseAvailableTeams(availableData);
        if (!controller.signal.aborted) {
          setCompetition({
            id: competitionId,
            name: record.name as string,
            season: typeof record.season === "string" ? record.season : null,
            createdDate: typeof record.createdDate === "string" ? record.createdDate : "",
          });
          setRegistered(teams);
          setAvailable(clubs);
          setSelected([]);
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load competition details.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [competitionId, reload]);

  const availableById = useMemo(() => new Map(available.map((team) => [team.id, team])), [available]);
  const registeredIds = useMemo(() => new Set(registered.map((team) => team.teamId)), [registered]);
  const candidates = useMemo(() => available.filter((team) => !registeredIds.has(team.id)), [available, registeredIds]);
  const filteredCandidates = useMemo(() => candidates.filter((team) => team.name.toLowerCase().includes(query.trim().toLowerCase())), [candidates, query]);
  const filteredRegistered = useMemo(() => registered.filter((team) => team.teamName.toLowerCase().includes(registeredQuery.trim().toLowerCase())), [registered, registeredQuery]);

  const created = competition?.createdDate && !Number.isNaN(Date.parse(competition.createdDate))
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(competition.createdDate))
    : "Unavailable";

  function toggleSelection(id: string) {
    if (busy || removingId) return;
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setActionError("");
  }

  async function addSelected() {
    if (!selected.length || busy || removingId) return;
    setBusy(true);
    setActionError("");
    setNotice("");
    const successful: string[] = [];
    try {
      // Backend currently supports adding one team per request.
      for (const teamId of selected) {
        const response = await fetch("/api/competition-teams", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ competitionId, teamId }),
        });
        const data = await getJson(response);
        if (!response.ok) throw new Error(messageFrom(data, `Unable to add a club (HTTP ${response.status}).`));
        successful.push(teamId);
      }
      setNotice(`${successful.length} ${successful.length === 1 ? "club" : "clubs"} added successfully.`);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to add clubs.");
    } finally {
      if (successful.length) {
        // Update immediately, then retrieve authoritative data from the backend.
        setSelected((current) => current.filter((id) => !successful.includes(id)));
        try {
          const response = await fetch(`/api/competition-teams?competitionId=${encodeURIComponent(competitionId)}`, { credentials: "same-origin", cache: "no-store" });
          const data = await getJson(response);
          if (!response.ok) throw new Error(messageFrom(data, "Unable to refresh participating clubs."));
          setRegistered(parseRegisteredTeams(data));
        } catch {
          setActionError((current) => `${current ? `${current} ` : ""}Refresh the page to see the latest participating clubs.`);
        }
      }
      setBusy(false);
    }
  }

  async function removeTeam(team: RegisteredTeam) {
    if (busy || removingId) return;
    if (!window.confirm(`Remove ${team.teamName} from ${competition?.name ?? "this competition"}?`)) return;
    setRemovingId(team.teamId);
    setActionError("");
    setNotice("");
    try {
      const params = new URLSearchParams({ competitionId, teamId: team.teamId });
      const response = await fetch(`/api/competition-teams?${params}`, { method: "DELETE", credentials: "same-origin" });
      if (!response.ok) {
        const data = await getJson(response);
        throw new Error(messageFrom(data, `Unable to remove club (HTTP ${response.status}).`));
      }
      setRegistered((current) => current.filter((item) => item.teamId !== team.teamId));
      setNotice(`${team.teamName} removed from this competition.`);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to remove club.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#101319] px-4 py-3 text-xs text-[#b7f56a] hover:bg-[#172019]">
          <ArrowLeft size={16} /> All competitions
        </button>
        <button type="button" onClick={refresh} disabled={loading || busy || !!removingId} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs text-[#b7f56a] disabled:opacity-50">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? <Skeleton /> : error ? (
        <div role="alert" className="rounded-2xl border border-red-400/20 bg-[#101319] p-10 text-center">
          <CircleAlert className="mx-auto text-red-300" size={28} />
          <h2 className="mt-4 font-semibold">Competition unavailable</h2>
          <p className="mt-2 text-sm text-[#8b98aa]">{error}</p>
          <button type="button" onClick={refresh} className="mt-5 rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-bold text-black">Try again</button>
        </div>
      ) : competition && (
        <>
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-[#b7f56a]/20 bg-gradient-to-br from-[#16251a] via-[#111b16] to-[#101319] p-6 sm:p-9">
            <Trophy size={110} className="pointer-events-none absolute -right-4 -top-4 text-[#b7f56a]/10" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7f56a]">FootballSim / Competition center</p>
            <h1 className="relative mt-4 max-w-3xl text-2xl font-semibold tracking-tight sm:text-4xl">{competition.name}</h1>
            <p className="mt-3 text-sm text-[#9dac9e]">{competition.season || "Season not specified"}</p>
            <div className="mt-7 flex items-center gap-2 text-xs text-[#9dac9e]"><CalendarDays size={15} /> Created {created}</div>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.08] bg-[#101319] p-5"><Users size={20} className="text-[#b7f56a]" /><p className="mt-4 text-3xl font-semibold">{registered.length}</p><p className="mt-1 text-xs text-[#8b98aa]">Participating clubs</p></div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#101319] p-5"><Shield size={20} className="text-[#b7f56a]" /><p className="mt-4 text-3xl font-semibold">{available.length}</p><p className="mt-1 text-xs text-[#8b98aa]">Available clubs</p></div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#101319] p-5"><CalendarDays size={20} className="text-[#b7f56a]" /><p className="mt-4 text-lg font-semibold">{created}</p><p className="mt-1 text-xs text-[#8b98aa]">Date created</p></div>
          </div>

          {actionError && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"><CircleAlert size={17} className="mt-0.5 shrink-0" />{actionError}</div>}
          {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-[#b7f56a]/20 bg-[#b7f56a]/10 p-4 text-sm text-[#b7f56a]"><Check size={17} className="mt-0.5 shrink-0" />{notice}</div>}

          <div className="rounded-2xl border border-white/[0.08] bg-[#101319] p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-[#b7f56a]">Club registration</p><h2 className="mt-2 text-xl font-semibold">Add teams to competition</h2><p className="mt-2 text-xs text-[#8b98aa]">Select from your available default and custom clubs.</p></div>
              <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b899b]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search available clubs..." aria-label="Search available clubs" className="h-11 w-full rounded-xl border border-white/10 bg-[#0b0e12] pl-10 pr-3 text-xs outline-none focus:border-[#b7f56a]/40 sm:w-64" /></div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8b98aa]"><span>{candidates.length} clubs available to add · {selected.length} selected</span><button type="button" disabled={!selected.length || busy} onClick={() => setSelected([])} className="text-[#b7f56a] disabled:opacity-40">Clear selection</button></div>
            {filteredCandidates.length ? (
              <div className="mt-4 grid max-h-[370px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCandidates.map((team) => {
                  const checked = selected.includes(team.id);
                  return (
                    <button type="button" key={team.id} disabled={busy || !!removingId} onClick={() => toggleSelection(team.id)} aria-pressed={checked} className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition disabled:opacity-50 ${checked ? "border-[#b7f56a]/50 bg-[#b7f56a]/10" : "border-white/[0.07] bg-[#0b0e12] hover:border-white/20"}`}>
                      <TeamCrest name={team.name} logoUrl={team.logoUrl} />
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium" title={team.name}>{team.name}</span><span className="mt-1 block text-[10px] text-[#8b98aa]">{team.isDefault ? "Default club" : "Available club"}</span></span>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${checked ? "border-[#b7f56a] bg-[#b7f56a] text-black" : "border-white/20 text-[#8b98aa]"}`}>{checked ? <Check size={15} /> : <Plus size={15} />}</span>
                    </button>
                  );
                })}
              </div>
            ) : <div className="py-12 text-center text-sm text-[#8b98aa]">{query ? "No matching available clubs." : "All available clubs have been registered."}</div>}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5"><p className="text-xs text-[#8b98aa]">{selected.length} {selected.length === 1 ? "club" : "clubs"} ready to add</p><button type="button" onClick={() => void addSelected()} disabled={!selected.length || busy || !!removingId} className="inline-flex items-center gap-2 rounded-xl bg-[#b7f56a] px-5 py-3 text-xs font-bold text-black transition hover:bg-[#c8ff89] disabled:cursor-not-allowed disabled:opacity-40">{busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}{busy ? "Registering clubs..." : `Add ${selected.length || "selected"} ${selected.length === 1 ? "club" : "clubs"}`}</button></div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#101319] p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#b7f56a]">Participating clubs</p><h2 className="mt-2 text-xl font-semibold">Registered teams <span className="text-[#b7f56a]">({registered.length})</span></h2><p className="mt-2 text-xs text-[#8b98aa]">Teams currently registered in this competition.</p></div><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b899b]" /><input value={registeredQuery} onChange={(e) => setRegisteredQuery(e.target.value)} placeholder="Search registered clubs..." aria-label="Search registered clubs" className="h-11 w-full rounded-xl border border-white/10 bg-[#0b0e12] pl-10 pr-3 text-xs outline-none focus:border-[#b7f56a]/40 sm:w-60" /></div></div>
            {filteredRegistered.length ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredRegistered.map((team, index) => (
                  <motion.div key={team.teamId} initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 12) * 0.025 }} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0b0e12] p-4">
                    <TeamCrest name={team.teamName} logoUrl={availableById.get(team.teamId)?.logoUrl ?? null} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium" title={team.teamName}>{team.teamName}</span>
                    <button type="button" disabled={busy || !!removingId} onClick={() => void removeTeam(team)} aria-label={`Remove ${team.teamName}`} title={`Remove ${team.teamName}`} className="rounded-lg border border-red-400/15 p-2 text-red-300 transition hover:bg-red-400/10 disabled:opacity-40">{removingId === team.teamId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</button>
                  </motion.div>
                ))}
              </div>
            ) : <div className="py-12 text-center text-sm text-[#8b98aa]">{registeredQuery ? "No matching registered teams." : "No teams have been registered in this competition yet."}</div>}
          </div>
        </>
      )}
    </section>
  );
}
