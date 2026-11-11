
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  RefreshCw,
  Save,
  Server,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type AdminProfile = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  emailVerifiedAtUtc: string | null;
  createdAtUtc: string;
};

type ApiMessage = {
  message?: string;
  user?: AdminProfile;
};

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-lime-300/50";

const panelClass =
  "rounded-2xl border border-white/[0.08] bg-[#101319]";

function Message({
  text,
  success,
}: {
  text: string;
  success: boolean;
}) {
  if (!text) return null;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
        success
          ? "border-lime-300/20 bg-lime-300/[0.06] text-lime-200"
          : "border-red-400/20 bg-red-400/[0.06] text-red-300"
      }`}
    >
      {success ? (
        <CheckCircle2 size={18} className="shrink-0" />
      ) : (
        <AlertCircle size={18} className="shrink-0" />
      )}
      <span>{text}</span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [fullName, setFullName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const loadProfile = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/settings/profile", {
        cache: "no-store",
        signal,
      });

      const data: AdminProfile & ApiMessage = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load profile.");
      }

      if (signal?.aborted) return;

      setProfile(data);
      setFullName(data.fullName);
      setProfileMessage("");
    } catch (error) {
      if (signal?.aborted) return;

      setProfileMessage(
        error instanceof Error ? error.message : "Unable to load profile."
      );
      setProfileSuccess(false);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadProfile(controller.signal);
    return () => controller.abort();
  }, [loadProfile]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !profile) return;

    const name = fullName.trim();

    if (name.length < 2 || name.length > 100) {
      setProfileSuccess(false);
      setProfileMessage("Full name must contain 2–100 characters.");
      return;
    }

    setSaving(true);
    setProfileMessage("");

    try {
      const response = await fetch("/api/admin/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name }),
      });

      const data: ApiMessage = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile.");
      }

      if (data.user) {
        setProfile(data.user);
        setFullName(data.user.fullName);
      }

      setProfileSuccess(true);
      setProfileMessage(data.message || "Profile updated successfully.");
      router.refresh();
    } catch (error) {
      setProfileSuccess(false);
      setProfileMessage(
        error instanceof Error ? error.message : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (changingPassword) return;

    if (newPassword.length < 12 || newPassword.length > 128) {
      setPasswordMessage("New password must contain 12–128 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage("Choose a password different from your current one.");
      return;
    }

    setChangingPassword(true);
    setPasswordMessage("");

    try {
      const response = await fetch("/api/admin/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data: ApiMessage = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to change password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // The server has cleared the HttpOnly session cookie.
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setPasswordMessage(
        error instanceof Error ? error.message : "Unable to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <section className="mx-auto max-w-[1450px] space-y-7 pb-10 text-white">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime-300">
            <Settings2 size={15} />
            Administration / Settings
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Admin <span className="text-lime-300">Settings</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Manage your administrator profile, account security and platform
            information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadProfile()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#101319] px-4 py-3 text-xs font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* PROFILE SUMMARY */}
      <div className={`${panelClass} p-5 sm:p-6`}>
        {loading ? (
          <div className="flex items-center gap-3 py-8 text-slate-400">
            <Loader2 className="animate-spin text-lime-300" size={20} />
            Loading administrator profile...
          </div>
        ) : profile ? (
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-lime-300/20 bg-lime-300/10 text-2xl font-bold text-lime-300">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold">{profile.fullName}</h2>
              <p className="mt-1 break-all text-sm text-slate-400">
                {profile.email}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-lime-300/10 px-3 py-1 text-xs font-semibold text-lime-300">
                  Administrator
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    profile.isEmailVerified
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-amber-400/10 text-amber-300"
                  }`}
                >
                  {profile.isEmailVerified ? "Email Verified" : "Unverified"}
                </span>
              </div>
            </div>

            <div className="text-sm text-slate-400">
              Member since
              <p className="mt-1 font-medium text-white">
                {formatDate(profile.createdAtUtc)}
              </p>
            </div>
          </div>
        ) : (
          <Message
            text={profileMessage || "Profile unavailable."}
            success={false}
          />
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* PROFILE SETTINGS */}
        <div className={`${panelClass} p-5 sm:p-6`}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-lime-300/10 p-3 text-lime-300">
              <UserRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Profile Information</h2>
              <p className="mt-1 text-xs text-slate-400">
                Update your administrator account details.
              </p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="mt-7 space-y-5">
            <div>
              <label htmlFor="admin-name" className="mb-2 block text-xs font-medium text-slate-300">
                Full Name
              </label>
              <input
                id="admin-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={100}
                required
                disabled={!profile || saving}
                className={inputClass}
                placeholder="Administrator name"
              />
            </div>

            <div>
              <label htmlFor="admin-email" className="mb-2 block text-xs font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-3.5 text-slate-500"
                />
                <input
                  id="admin-email"
                  value={profile?.email || ""}
                  readOnly
                  className={`${inputClass} pl-11 opacity-70`}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Email changes require a separate verification process.
              </p>
            </div>

            <Message text={profileMessage} success={profileSuccess} />

            <button
              type="submit"
              disabled={
                saving ||
                !profile ||
                fullName.trim() === profile.fullName
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              Save Changes
            </button>
          </form>
        </div>

        {/* PASSWORD SETTINGS */}
        <div className={`${panelClass} p-5 sm:p-6`}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-lime-300/10 p-3 text-lime-300">
              <LockKeyhole size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Account Security</h2>
              <p className="mt-1 text-xs text-slate-400">
                Change your administrator password securely.
              </p>
            </div>
          </div>

          <form onSubmit={updatePassword} className="mt-7 space-y-5">
            <div>
              <label htmlFor="current-password" className="mb-2 block text-xs font-medium text-slate-300">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className={`${inputClass} pr-12`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  aria-label={showCurrent ? "Hide current password" : "Show current password"}
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-white"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="new-password" className="mb-2 block text-xs font-medium text-slate-300">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={12}
                  maxLength={128}
                  required
                  className={`${inputClass} pr-12`}
                  placeholder="At least 12 characters"
                />
                <button
                  type="button"
                  aria-label={showNew ? "Hide new password" : "Show new password"}
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-white"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-xs font-medium text-slate-300">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputClass}
                placeholder="Confirm new password"
              />
            </div>

            <Message text={passwordMessage} success={false} />

            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-lime-200 disabled:opacity-50"
            >
              {changingPassword ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <KeyRound size={17} />
              )}
              Update Password
            </button>

            <p className="text-xs leading-5 text-slate-500">
              After updating your password, you will be signed out of this
              browser and asked to sign in again.
            </p>
          </form>
        </div>

        {/* ACCOUNT STATUS */}
        <div className={`${panelClass} p-5 sm:p-6`}>
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="text-lime-300" size={22} />
            <h2 className="text-base font-semibold">Account Status</h2>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Account Role</span>
              <span className="font-medium">{profile?.role || "—"}</span>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Email Verification</span>
              <span className={profile?.isEmailVerified ? "text-lime-300" : "text-amber-300"}>
                {profile
                  ? profile.isEmailVerified ? "Verified" : "Pending"
                  : "—"}
              </span>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Verification Date</span>
              <span>{formatDate(profile?.emailVerifiedAtUtc ?? null)}</span>
            </div>
          </div>
        </div>

        {/* PLATFORM INFORMATION */}
        <div className={`${panelClass} p-5 sm:p-6`}>
          <div className="mb-6 flex items-center gap-3">
            <Server className="text-lime-300" size={22} />
            <h2 className="text-base font-semibold">Platform Information</h2>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Application</span>
              <span>FootballSim</span>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Backend</span>
              <span>ASP.NET Core Web API</span>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Database</span>
              <span>PostgreSQL</span>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Frontend</span>
              <span>Next.js</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECURITY NOTICE */}
      <div className="flex items-start gap-3 rounded-2xl border border-lime-300/10 bg-lime-300/[0.04] p-5">
        <Activity size={20} className="mt-0.5 shrink-0 text-lime-300" />
        <div>
          <h3 className="text-sm font-semibold">Security Information</h3>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            Your account is protected by administrator-only API authorization.
            Passwords are stored as hashes, not plaintext. For production,
            add server-side session revocation, security audit logging and
            additional protection against cross-site request forgery.
          </p>
        </div>
      </div>
    </section>
  );
}
