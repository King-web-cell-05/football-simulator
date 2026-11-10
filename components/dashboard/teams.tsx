
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowDownAZ,
  ArrowUpRight,
  Check,
  ChevronDown,
  CirclePlus,
  CloudUpload,
  Edit3,
  Globe2,
  ImageIcon,
  LoaderCircle,
  RefreshCw,
  Search,
  Shield,
  SlidersHorizontal,
  Trophy,
  Upload,
  Users,
  X,
} from "lucide-react";

// ======================================================
// TYPES
// ======================================================

type Team = {
  id: string;
  name: string;
  country: string;
  coefficient: number;
  logoUrl: string | null;
};

type TeamForm = {
  name: string;
  country: string;
  coefficient: string;
  logoUrl: string;
};

type SortOption =
  | "coefficient-desc"
  | "coefficient-asc"
  | "name-asc"
  | "name-desc";

const API_URL = (
  process.env.NEXT_PUBLIC_FOOTBALLSIM_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5295"
).replace(/\/$/, "");

const EMPTY_FORM: TeamForm = {
  name: "",
  country: "",
  coefficient: "0",
  logoUrl: "",
};

const inputClass =
  "h-11 w-full rounded-xl border border-white/[0.09] bg-[#0c1015] px-4 text-sm text-white outline-none transition placeholder:text-[#596677] focus:border-[#b7f56a]/50 focus:ring-2 focus:ring-[#b7f56a]/10";

const buttonPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#b7f56a] px-5 text-xs font-bold text-[#080a0d] transition hover:bg-[#caff91] disabled:cursor-not-allowed disabled:opacity-50";

// ======================================================
// HELPERS
// ======================================================

function resolveLogoUrl(url: string | null): string | null {
  if (!url?.trim()) return null;

  const value = url.trim();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return null;
}

function getErrorMessage(
  payload: unknown,
  fallback: string
): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "title" in payload &&
    typeof payload.title === "string"
  ) {
    return payload.title;
  }

  return fallback;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function normalizeTeam(value: unknown): Team | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;

  if (
    typeof item.id !== "string" ||
    typeof item.name !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    country:
      typeof item.country === "string" ? item.country : "",
    coefficient:
      typeof item.coefficient === "number"
        ? item.coefficient
        : 0,
    logoUrl:
      typeof item.logoUrl === "string"
        ? item.logoUrl
        : null,
  };
}

function formatCoefficient(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 2,
  }).format(value);
}

// ======================================================
// TEAM CREST
// ======================================================

function TeamCrest({
  name,
  logoUrl,
  size = "normal",
}: {
  name: string;
  logoUrl: string | null;
  size?: "normal" | "large";
}) {
  const url = resolveLogoUrl(logoUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const isLarge = size === "large";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[#171d23] ${
        isLarge ? "h-20 w-20" : "h-14 w-14"
      }`}
    >
      {url && failedUrl !== url ? (
        // External club crests may be hosted outside Next.js.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`${name} crest`}
          className="h-full w-full object-contain p-2.5"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <Shield
          size={isLarge ? 35 : 25}
          strokeWidth={1.5}
          className="text-[#b7f56a]/60"
        />
      )}
    </div>
  );
}

// ======================================================
// TEAM CARD
// ======================================================

function TeamCard({
  team,
  index,
  onEdit,
}: {
  team: Team;
  index: number;
  onEdit: (team: Team) => void;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index, 12) * 0.025,
      }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.075] bg-[#101319] p-5 transition-colors hover:border-[#b7f56a]/25"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[#b7f56a]/[0.035] blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <TeamCrest
          name={team.name}
          logoUrl={team.logoUrl}
        />

        <button
          type="button"
          onClick={() => onEdit(team)}
          aria-label={`Edit ${team.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-[#8996a7] transition hover:border-[#b7f56a]/25 hover:text-[#b7f56a]"
        >
          <Edit3 size={15} />
        </button>
      </div>

      <div className="relative mt-6">
        <h3
          title={team.name}
          className="truncate text-[15px] font-semibold tracking-tight text-white"
        >
          {team.name}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#8b98aa]">
          <Globe2 size={13} />
          <span className="truncate">
            {team.country || "Country unavailable"}
          </span>
        </div>
      </div>

      <div className="relative mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
        <div>
          <p className="text-[10px] text-[#748194]">
            Club coefficient
          </p>

          <p className="mt-1 text-xl font-semibold tracking-tight text-[#b7f56a]">
            {formatCoefficient(team.coefficient)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onEdit(team)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#a8b5c4] transition hover:text-[#b7f56a]"
        >
          Manage
          <ArrowUpRight size={14} />
        </button>
      </div>
    </motion.article>
  );
}

// ======================================================
// TEAM FORM MODAL
// ======================================================

function TeamModal({
  team,
  onClose,
  onSaved,
}: {
  team: Team | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const isEditing = Boolean(team);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<TeamForm>(() =>
    team
      ? {
          name: team.name,
          country: team.country,
          coefficient: String(team.coefficient),
          logoUrl: team.logoUrl ?? "",
        }
      : { ...EMPTY_FORM }
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadStage, setUploadStage] = useState("");

  // Create and clean up object URLs.
  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  // Close with Escape.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, saving]);

  function updateField(
    key: keyof TeamForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    if (error) setError("");
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please choose a PNG, JPG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("The image must not exceed 2 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setError("");
    event.target.value = "";
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    const name = form.name.trim();
    const country = form.country.trim();
    const coefficient = Number(form.coefficient);
    const logoUrl = form.logoUrl.trim() || null;

    if (!name || !country) {
      setError("Team name and country are required.");
      return;
    }

    if (
      form.coefficient.trim() === "" ||
      !Number.isFinite(coefficient) ||
      coefficient < 0 ||
      coefficient > 200
    ) {
      setError("Coefficient must be between 0 and 200.");
      return;
    }

    if (selectedFile && !team && logoUrl) {
      // Both are supported, but upload takes priority.
    }

    setSaving(true);
    setError("");

    try {
      setUploadStage(
        isEditing ? "Updating team..." : "Creating team..."
      );

      const response = await fetch(
        isEditing
          ? `/api/teams/${team!.id}`
          : "/api/teams",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            name,
            country,
            coefficient,
            logoUrl,
          }),
        }
      );

      const result = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            isEditing
              ? "Unable to update this club."
              : "Unable to create this club."
          )
        );
      }

      const returnedTeam = normalizeTeam(result);

      const savedTeamId =
        team?.id ??
        returnedTeam?.id ??
        (result &&
        typeof result === "object" &&
        "id" in result &&
        typeof result.id === "string"
          ? result.id
          : null);

      if (selectedFile) {
        if (!savedTeamId) {
          throw new Error(
            "The club was saved, but the API did not return its ID. Refresh the teams list before uploading the crest."
          );
        }

        setUploadStage("Uploading club crest...");

        const uploadData = new FormData();
        uploadData.append("file", selectedFile);

        const uploadResponse = await fetch(
          `/api/teams/${savedTeamId}/logo`,
          {
            method: "POST",
            credentials: "same-origin",
            body: uploadData,
          }
        );

        const uploadResult = await parseResponse(uploadResponse);

        if (!uploadResponse.ok) {
          throw new Error(
            getErrorMessage(
              uploadResult,
              "The club was saved, but its crest could not be uploaded."
            )
          );
        }
      }

      setUploadStage("Refreshing clubs...");
      await onSaved();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "An unexpected error occurred."
      );
    } finally {
      setSaving(false);
      setUploadStage("");
    }
  }

  const displayedLogo =
    previewUrl ??
    resolveLogoUrl(form.logoUrl.trim() || null);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? "Edit team" : "Add team"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.1] bg-[#10151b] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b7f56a]">
              FootballSim / Club Registry
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {isEditing ? "Edit football club" : "Register a new club"}
            </h2>

            <p className="mt-1 text-xs text-[#8794a5]">
              {isEditing
                ? "Update club details and crest."
                : "Add a football club to your workspace."}
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-[#8b98aa] hover:bg-white/[0.06] disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-6">
            <div className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-[#0b0f14] p-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-[#171d23]">
                {displayedLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayedLogo}
                    alt="Club crest preview"
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <Shield
                    size={35}
                    className="text-[#b7f56a]/50"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">
                  Club crest
                </p>

                <p className="mt-1 text-[11px] leading-5 text-[#8491a2]">
                  PNG, JPG or WebP. Maximum 2 MB.
                </p>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#b7f56a]/20 bg-[#b7f56a]/[0.06] px-3 py-2 text-[11px] font-semibold text-[#b7f56a] hover:bg-[#b7f56a]/[0.12]"
                >
                  <Upload size={14} />
                  {selectedFile ? "Change image" : "Upload crest"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Select club crest"
                />
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#b7f56a]/15 bg-[#b7f56a]/[0.04] px-3 py-2.5">
                <p className="truncate text-[11px] text-[#b7f56a]">
                  {selectedFile.name}
                </p>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="shrink-0 text-[#8b98aa] hover:text-white"
                  aria-label="Remove selected image"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <div>
              <label
                htmlFor="team-name"
                className="mb-2 block text-xs font-semibold text-[#b8c3cf]"
              >
                Club name
              </label>

              <input
                id="team-name"
                required
                maxLength={100}
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                placeholder="e.g. Real Madrid"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="team-country"
                className="mb-2 block text-xs font-semibold text-[#b8c3cf]"
              >
                Country
              </label>

              <input
                id="team-country"
                required
                maxLength={80}
                value={form.country}
                onChange={(event) =>
                  updateField("country", event.target.value)
                }
                placeholder="e.g. Spain"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="team-coefficient"
                className="mb-2 block text-xs font-semibold text-[#b8c3cf]"
              >
                Club coefficient
              </label>

              <input
                id="team-coefficient"
                required
                type="number"
                min="0"
                max="200"
                step="0.01"
                value={form.coefficient}
                onChange={(event) =>
                  updateField("coefficient", event.target.value)
                }
                placeholder="e.g. 95.5"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="team-logo-url"
                className="mb-2 block text-xs font-semibold text-[#b8c3cf]"
              >
                External logo URL{" "}
                <span className="font-normal text-[#718093]">
                  (optional)
                </span>
              </label>

              <input
                id="team-logo-url"
                type="text"
                value={form.logoUrl}
                onChange={(event) =>
                  updateField("logoUrl", event.target.value)
                }
                placeholder="https://example.com/club.png"
                className={inputClass}
              />

              <p className="mt-2 text-[11px] leading-5 text-[#748194]">
                You can paste a logo URL or upload an image.
                Uploaded images take priority.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-xs leading-5 text-red-200"
              >
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0"
                />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-6 py-4">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-11 rounded-xl border border-white/[0.1] px-5 text-xs font-semibold text-[#aab6c4] hover:bg-white/[0.05] disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className={buttonPrimary}
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                  {uploadStage || "Saving..."}
                </>
              ) : (
                <>
                  <Check size={16} />
                  {isEditing ? "Save changes" : "Create club"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ======================================================
// MAIN TEAMS MANAGEMENT
// ======================================================

export default function Teams() {
  const reducedMotion = useReducedMotion();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [sortBy, setSortBy] =
    useState<SortOption>("coefficient-desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/teams", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const payload = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(payload, "Unable to load clubs.")
        );
      }

      if (!Array.isArray(payload)) {
        throw new Error(
          "Unexpected Teams API response."
        );
      }

      const parsed = payload
        .map(normalizeTeam)
        .filter((team): team is Team => team !== null);

      setTeams(parsed);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load clubs."
      );

      throw cause;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeams().catch(() => undefined);
  }, [loadTeams]);

  const countries = useMemo(() => {
    return [...new Set(teams.map((team) => team.country))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [teams]);

  const filteredTeams = useMemo(() => {
    const term = query.trim().toLowerCase();

    const items = teams.filter((team) => {
      const matchesSearch =
        !term ||
        `${team.name} ${team.country}`
          .toLowerCase()
          .includes(term);

      const matchesCountry =
        country === "all" || team.country === country;

      return matchesSearch && matchesCountry;
    });

    return items.sort((a, b) => {
      switch (sortBy) {
        case "coefficient-asc":
          return a.coefficient - b.coefficient;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return b.coefficient - a.coefficient;
      }
    });
  }, [teams, query, country, sortBy]);

  const averageCoefficient = useMemo(() => {
    if (!teams.length) return 0;

    return (
      teams.reduce(
        (sum, team) => sum + team.coefficient,
        0
      ) / teams.length
    );
  }, [teams]);

  const teamsWithLogos = teams.filter(
    (team) => Boolean(team.logoUrl)
  ).length;

  function openCreateModal() {
    setEditingTeam(null);
    setModalOpen(true);
    setSuccess("");
  }

  function openEditModal(team: Team) {
    setEditingTeam(team);
    setModalOpen(true);
    setSuccess("");
  }

  async function handleSaved() {
    await loadTeams();

    setSuccess(
      editingTeam
        ? "Club information updated successfully."
        : "New football club registered successfully."
    );
  }

  return (
    <section className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b7f56a]">
            <Trophy size={15} />
            FootballSim / Club Registry
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Teams{" "}
            <span className="text-[#b7f56a]">
              Management
            </span>
          </h1>

          <p className="mt-2 text-sm text-[#8b98aa]">
            Register, organize and manage every club in your
            football simulation workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className={buttonPrimary}
        >
          <CirclePlus size={17} />
          Add new team
        </button>
      </div>

      {/* HERO BANNER */}

      <div className="relative overflow-hidden rounded-2xl border border-[#b7f56a]/15 bg-gradient-to-r from-[#142019] via-[#101a16] to-[#101319] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-[#b7f56a]/[0.07]" />

        <div className="pointer-events-none absolute -right-5 -top-8 h-44 w-44 rounded-full border border-[#b7f56a]/[0.07]" />

        <div className="relative max-w-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#b7f56a]">
            The club collection
          </p>

          <h2 className="mt-3 text-xl font-semibold sm:text-2xl">
            Every champion starts with a team.
          </h2>

          <p className="mt-2 text-xs leading-6 text-[#9aaa9c]">
            Build your football database with club identities,
            nationalities, coefficients and official crests.
          </p>
        </div>

        <Shield
          size={115}
          strokeWidth={0.7}
          className="pointer-events-none absolute -bottom-9 right-7 hidden rotate-[-14deg] text-[#b7f56a]/15 sm:block"
        />
      </div>

      {/* STATISTICS */}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Registered clubs",
            value: teams.length,
            icon: Users,
          },
          {
            label: "Countries represented",
            value: countries.length,
            icon: Globe2,
          },
          {
            label: "Average coefficient",
            value: formatCoefficient(averageCoefficient),
            icon: Trophy,
          },
          {
            label: "Clubs with logo URLs",
            value: teamsWithLogos,
            icon: ImageIcon,
          },
        ].map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.article
              key={stat.label}
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, y: 10 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
              }}
              className="rounded-2xl border border-white/[0.075] bg-[#101319] p-5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.06] text-[#b7f56a]">
                <Icon size={19} />
              </span>

              <p className="mt-5 text-xs text-[#8b98aa]">
                {stat.label}
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {loading ? "—" : stat.value}
              </p>
            </motion.article>
          );
        })}
      </div>

      {/* FILTER BAR */}

      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.075] bg-[#101319] p-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#788596]"
          />

          <input
            aria-label="Search teams"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clubs or countries..."
            className={`${inputClass} pl-11`}
          />
        </div>

        <div className="relative lg:w-48">
          <Globe2
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8491a2]"
          />

          <select
            aria-label="Filter by country"
            value={country}
            onChange={(event) =>
              setCountry(event.target.value)
            }
            className={`${inputClass} appearance-none pl-9 pr-8`}
          >
            <option value="all">All countries</option>

            {countries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8491a2]"
          />
        </div>

        <div className="relative lg:w-52">
          <SlidersHorizontal
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8491a2]"
          />

          <select
            aria-label="Sort teams"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as SortOption)
            }
            className={`${inputClass} appearance-none pl-9 pr-8`}
          >
            <option value="coefficient-desc">
              Highest coefficient
            </option>
            <option value="coefficient-asc">
              Lowest coefficient
            </option>
            <option value="name-asc">
              Name: A to Z
            </option>
            <option value="name-desc">
              Name: Z to A
            </option>
          </select>

          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8491a2]"
          />
        </div>

        <button
          type="button"
          onClick={() =>
            void loadTeams().catch(() => undefined)
          }
          disabled={loading}
          aria-label="Refresh teams"
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.09] px-4 text-xs font-semibold text-[#b7f56a] transition hover:bg-[#b7f56a]/[0.06] disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* FEEDBACK */}

      {success && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#b7f56a]/20 bg-[#b7f56a]/[0.06] p-4 text-xs text-[#b7f56a]"
        >
          <span className="flex items-center gap-2">
            <Check size={16} />
            {success}
          </span>

          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={() => setSuccess("")}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-xs text-red-200"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              void loadTeams().catch(() => undefined)
            }
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* RESULTS COUNT */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#8b98aa]">
          {loading
            ? "Loading football clubs..."
            : `Showing ${filteredTeams.length} of ${teams.length} clubs`}
        </p>

        <span className="flex items-center gap-1.5 text-[10px] text-[#728093]">
          <ArrowDownAZ size={14} />
          Club directory
        </span>
      </div>

      {/* TEAMS GRID */}

      {loading && teams.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-2xl border border-white/[0.07] bg-[#101319] p-5"
            >
              <div className="h-14 w-14 rounded-xl bg-white/[0.06]" />
              <div className="mt-7 h-4 w-36 rounded bg-white/[0.06]" />
              <div className="mt-3 h-3 w-24 rounded bg-white/[0.06]" />
              <div className="mt-8 h-8 w-full rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredTeams.map((team, index) => (
            <TeamCard
              key={team.id}
              team={team}
              index={index}
              onEdit={openEditModal}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.075] bg-[#101319] px-6 py-16 text-center">
          <Shield
            size={38}
            className="mx-auto text-[#b7f56a]/70"
          />

          <h3 className="mt-5 text-lg font-semibold">
            {teams.length === 0
              ? "No football clubs registered"
              : "No matching clubs"}
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-[#8b98aa]">
            {teams.length === 0
              ? "Create your first football club to start building your competition database."
              : "Try a different search term or country filter."}
          </p>

          {teams.length === 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className={`${buttonPrimary} mt-6`}
            >
              <CirclePlus size={16} />
              Add your first club
            </button>
          )}
        </div>
      )}

      {/* MODAL */}

      <AnimatePresence>
        {modalOpen && (
          <TeamModal
            key={editingTeam?.id ?? "create"}
            team={editingTeam}
            onClose={() => setModalOpen(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
