
"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  LockKeyhole,
  Monitor,
  Moon,
  Palette,
  Save,
  Settings2,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";

type SettingsTab =
  | "profile"
  | "security"
  | "appearance"
  | "notifications";

type ThemePreference = "dark" | "light" | "system";

type Profile = {
  fullName: string;
  email: string;
  isEmailVerified: boolean;
  createdAtUtc: string | null;
};

const navigation = [
  {
    id: "profile",
    label: "My Profile",
    description: "Personal information",
    icon: UserRound,
  },
  {
    id: "security",
    label: "Security",
    description: "Password and account access",
    icon: ShieldCheck,
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Personalize your workspace",
    icon: Palette,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Manage your alerts",
    icon: Bell,
  },
] as const;

const panelClass =
  "rounded-2xl border border-white/[0.08] bg-[#11151b]";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0b0e13] " +
  "px-4 py-3 text-sm text-white outline-none transition " +
  "placeholder:text-slate-600 focus:border-[#b7f56a]/60";

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <h2 className="text-xl font-semibold text-white">
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        {description}
      </p>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? "bg-[#b7f56a]" : "bg-slate-700"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "left-1 translate-x-5" : "left-1"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>("profile");

  const [profile, setProfile] = useState<Profile>({
    fullName: "",
    email: "",
    isEmailVerified: false,
    createdAtUtc: null,
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const [theme, setTheme] =
    useState<ThemePreference>("dark");

  const [notifications, setNotifications] = useState({
    matchResults: true,
    competitionUpdates: true,
    systemAnnouncements: false,
  });

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await fetch("/api/account/profile", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || "Unable to load your profile.");
        }
        if (controller.signal.aborted) return;
        const name = typeof data.fullName === "string" ? data.fullName : "";
        setProfile({
          fullName: name,
          email: typeof data.email === "string" ? data.email : "",
          isEmailVerified: data.isEmailVerified === true,
          createdAtUtc: data.createdAtUtc ?? null,
        });
        setSavedName(name);
      } catch (error) {
        if (!controller.signal.aborted) {
          notify(error instanceof Error ? error.message : "Unable to load profile.", "error");
        }
      } finally {
        if (!controller.signal.aborted) setProfileLoading(false);
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, []);

  function notify(text: string, type: "success" | "error" | "info" = "info") {
    setMessage(text);
    setMessageType(type);
  }

  async function handleProfileSave() {
    const fullName = profile.fullName.trim();
    if (fullName.length < 2 || fullName.length > 100) {
      notify("Full name must contain between 2 and 100 characters.", "error");
      return;
    }
    if (fullName === savedName) {
      notify("Your profile is already up to date.");
      return;
    }

    setProfileSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Unable to save profile changes.");
      }
      const updated = data.user ?? data;
      const updatedName = updated.fullName ?? fullName;
      setProfile((previous) => ({ ...previous, fullName: updatedName }));
      setSavedName(updatedName);
      notify(data.message || "Profile updated successfully.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to save profile.", "error");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwords.currentPassword) {
      notify("Enter your current password.", "error");
      return;
    }
    if (passwords.newPassword.length < 8) {
      notify("New password must contain at least 8 characters.", "error");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      notify("The new passwords do not match.", "error");
      return;
    }
    if (passwords.currentPassword === passwords.newPassword) {
      notify("Choose a new password different from your current one.", "error");
      return;
    }

    setPasswordSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/password", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const validationErrors = data.errors && typeof data.errors === "object"
          ? Object.values(data.errors).flat().join(" ")
          : null;
        throw new Error(validationErrors || data.message || "Unable to change password.");
      }
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      notify(data.message || "Password updated successfully.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to change password.", "error");
    } finally {
      setPasswordSaving(false);
    }
  }

  function handleThemeChange(value: ThemePreference) {
    setTheme(value);
    notify(
      "Theme preference selected. Global theme switching will be connected to the dashboard layout."
    );
  }

  function updateNotification(
    key: keyof typeof notifications,
    value: boolean
  ) {
    setNotifications((previous) => ({
      ...previous,
      [key]: value,
    }));

    notify(
      "Notification preference updated for this page only. Backend persistence is not yet connected."
    );
  }

  return (
    <div className="min-h-full bg-[#0b0e13] px-4 py-8 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* PAGE HEADER */}

        <div className="mb-9">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#b7f56a]">
            <Settings2 size={15} />
            Workspace preferences
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Settings
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Manage your FootballSim account, security,
            appearance, and notification preferences.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className={`mb-6 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${messageType === "error" ? "border-red-400/25 bg-red-400/10 text-red-200" : messageType === "success" ? "border-[#b7f56a]/30 bg-[#b7f56a]/10 text-[#dcffb9]" : "border-white/15 bg-white/5 text-slate-200"}`}
          >
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
              className="text-slate-400 hover:text-white"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* SETTINGS NAVIGATION */}

          <aside className={`${panelClass} h-fit p-3`}>
            <p className="px-3 pb-3 pt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Account settings
            </p>

            <nav
              aria-label="Settings sections"
              className="space-y-1"
            >
              {navigation.map((item) => {
                const Icon = item.icon;
                const selected = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMessage("");
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      selected
                        ? "bg-[#b7f56a]/10 text-[#b7f56a]"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={19} />

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs opacity-65">
                        {item.description}
                      </span>
                    </span>

                    <ChevronRight size={15} />
                  </button>
                );
              })}
            </nav>

            <div className="mx-3 my-4 border-t border-white/10" />

            <div className="rounded-xl bg-[#b7f56a]/[0.05] p-4">
              <ShieldCheck
                size={20}
                className="text-[#b7f56a]"
              />

              <p className="mt-3 text-sm font-semibold">
                Account protection
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Your account uses authenticated API
                sessions to protect competition data.
              </p>
            </div>
          </aside>

          {/* MAIN CONTENT */}

          <main className={`${panelClass} min-w-0 p-5 sm:p-7`}>
            {/* PROFILE */}

            {activeTab === "profile" && (
              <div>
                <SectionHeading
                  title="Personal information"
                  description="Your FootballSim account details."
                />

                <div className="mb-8 flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#b7f56a]/20 bg-[#b7f56a]/10 text-xl font-bold text-[#b7f56a]">
                    {profile.fullName
                      ? profile.fullName
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "FS"}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {profileLoading
                        ? "Loading profile..."
                        : profile.fullName ||
                          "FootballSim User"}
                    </p>

                    <p className="mt-1 truncate text-sm text-slate-400">
                      {profile.email || "No email available"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Full name
                    </span>

                    <input
                      className={inputClass}
                      value={profile.fullName}
                      onChange={(event) =>
                        setProfile((previous) => ({
                          ...previous,
                          fullName: event.target.value,
                        }))
                      }
                      placeholder="Your full name"
                      disabled={profileLoading}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Email address
                    </span>

                    <input
                      type="email"
                      className={inputClass}
                      value={profile.email}
                      readOnly
                      placeholder="Your email address"
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className={profile.isEmailVerified ? "rounded-full border border-[#b7f56a]/25 bg-[#b7f56a]/10 px-3 py-1 text-[#b7f56a]" : "rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-amber-300"}>
                    {profile.isEmailVerified ? "Email verified" : "Email not verified"}
                  </span>
                  {profile.createdAtUtc && (
                    <span>Member since {new Date(profile.createdAtUtc).toLocaleDateString()}</span>
                  )}
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Your email address is read-only. You can update your full name above.
                </p>

                <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
                  <button
                    type="button"
                    onClick={handleProfileSave}
                    disabled={profileLoading || profileSaving || profile.fullName.trim() === savedName}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#b7f56a] px-5 py-3 text-sm font-bold text-[#101510] transition hover:bg-[#c9ff87] disabled:opacity-50"
                  >
                    <Save size={17} />
                    {profileSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY */}

            {activeTab === "security" && (
              <div>
                <SectionHeading
                  title="Password & security"
                  description="Manage your password and protect your FootballSim account."
                />

                <div className="mb-7 flex items-start gap-3 rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.04] p-4">
                  <LockKeyhole
                    size={19}
                    className="mt-0.5 shrink-0 text-[#b7f56a]"
                  />

                  <div>
                    <p className="text-sm font-semibold">
                      Secure authentication
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Enter your current password to authorize the change.
                      Existing sessions may remain active until they expire.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handlePasswordChange}
                  className="max-w-lg space-y-5"
                >
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Current password
                    </span>

                    <div className="relative">
                      <input
                        type={
                          showCurrentPassword
                            ? "text"
                            : "password"
                        }
                        className={`${inputClass} pr-12`}
                        value={passwords.currentPassword}
                        onChange={(event) =>
                          setPasswords((previous) => ({
                            ...previous,
                            currentPassword:
                              event.target.value,
                          }))
                        }
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword((v) => !v)
                        }
                        aria-label="Toggle current password visibility"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      New password
                    </span>

                    <div className="relative">
                      <input
                        type={
                          showNewPassword ? "text" : "password"
                        }
                        className={`${inputClass} pr-12`}
                        value={passwords.newPassword}
                        onChange={(event) =>
                          setPasswords((previous) => ({
                            ...previous,
                            newPassword:
                              event.target.value,
                          }))
                        }
                        required
                        minLength={8}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowNewPassword((v) => !v)
                        }
                        aria-label="Toggle new password visibility"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showNewPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Confirm new password
                    </span>

                    <input
                      type="password"
                      className={inputClass}
                      value={passwords.confirmPassword}
                      onChange={(event) =>
                        setPasswords((previous) => ({
                          ...previous,
                          confirmPassword:
                            event.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#b7f56a] px-5 py-3 text-sm font-bold text-[#101510] hover:bg-[#c9ff87] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LockKeyhole size={17} />
                    {passwordSaving ? "Updating..." : "Update password"}
                  </button>
                </form>
              </div>
            )}

            {/* APPEARANCE */}

            {activeTab === "appearance" && (
              <div>
                <SectionHeading
                  title="Appearance"
                  description="Choose how FootballSim should look on your device."
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  {(
                    [
                      {
                        id: "dark",
                        label: "Dark",
                        icon: Moon,
                      },
                      {
                        id: "light",
                        label: "Light",
                        icon: Sun,
                      },
                      {
                        id: "system",
                        label: "System",
                        icon: Monitor,
                      },
                    ] as const
                  ).map((option) => {
                    const Icon = option.icon;
                    const selected = theme === option.id;

                    return (
                      <button
                        type="button"
                        key={option.id}
                        onClick={() =>
                          handleThemeChange(option.id)
                        }
                        className={`relative flex flex-col items-center gap-4 rounded-2xl border p-6 transition ${
                          selected
                            ? "border-[#b7f56a] bg-[#b7f56a]/[0.07]"
                            : "border-white/10 bg-white/[0.025] hover:border-white/20"
                        }`}
                      >
                        {selected && (
                          <Check
                            size={17}
                            className="absolute right-3 top-3 text-[#b7f56a]"
                          />
                        )}

                        <Icon
                          size={29}
                          className={
                            selected
                              ? "text-[#b7f56a]"
                              : "text-slate-400"
                          }
                        />

                        <span className="text-sm font-semibold">
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex items-start gap-3">
                    <CircleHelp
                      size={19}
                      className="mt-0.5 text-slate-400"
                    />

                    <p className="text-sm leading-6 text-slate-400">
                      Your selection is currently a
                      preview preference. We'll connect
                      it to the global dashboard theme
                      after the settings backend and
                      layout integration are complete.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}

            {activeTab === "notifications" && (
              <div>
                <SectionHeading
                  title="Notifications"
                  description="Control which FootballSim updates you want to receive."
                />

                <div className="divide-y divide-white/[0.07]">
                  {[
                    {
                      key: "matchResults",
                      title: "Match results",
                      description:
                        "Updates when competition matches are completed.",
                    },
                    {
                      key: "competitionUpdates",
                      title: "Competition updates",
                      description:
                        "Important changes to your competitions.",
                    },
                    {
                      key: "systemAnnouncements",
                      title: "System announcements",
                      description:
                        "Information about new FootballSim features.",
                    },
                  ].map((item) => {
                    const key =
                      item.key as keyof typeof notifications;

                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-5 py-5"
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {item.title}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {item.description}
                          </p>
                        </div>

                        <Toggle
                          checked={notifications[key]}
                          onChange={(value) =>
                            updateNotification(key, value)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
