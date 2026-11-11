
"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  LockKeyhole,
  LogOut,
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
  });

  const [profileLoading, setProfileLoading] =
    useState(true);

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
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load profile.");
        }

        const data = await response.json();

        if (cancelled) return;

        const user = data.user ?? data;

        setProfile({
          fullName:
            user.fullName ??
            user.name ??
            user.userName ??
            "",
          email: user.email ?? "",
        });
      } catch {
        if (!cancelled) {
          setMessage(
            "Profile information is unavailable. Check your authentication session."
          );
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function showMessage(text: string) {
    setMessage(text);
  }

  function handleProfileSave() {
    showMessage(
      "Profile editing requires a backend update endpoint. Your changes have not been saved."
    );
  }

  function handlePasswordChange(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      passwords.newPassword !==
      passwords.confirmPassword
    ) {
      showMessage("The new passwords do not match.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      showMessage(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    showMessage(
      "Password changes require a secure backend endpoint. No password has been changed."
    );
  }

  function handleThemeChange(value: ThemePreference) {
    setTheme(value);
    showMessage(
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

    showMessage(
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
            className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-[#b7f56a]/20 bg-[#b7f56a]/[0.06] px-4 py-3 text-sm text-slate-200"
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

                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Email changes require verification.
                  Profile updates will be enabled when
                  the backend update endpoint is ready.
                </p>

                <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
                  <button
                    type="button"
                    onClick={handleProfileSave}
                    disabled={profileLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#b7f56a] px-5 py-3 text-sm font-bold text-[#101510] transition hover:bg-[#c9ff87] disabled:opacity-50"
                  >
                    <Save size={17} />
                    Save changes
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
                      FootballSim uses authenticated
                      sessions. Password updates will
                      require verification of your
                      current password.
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
                    className="inline-flex items-center gap-2 rounded-xl bg-[#b7f56a] px-5 py-3 text-sm font-bold text-[#101510] hover:bg-[#c9ff87]"
                  >
                    <LockKeyhole size={17} />
                    Update password
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
