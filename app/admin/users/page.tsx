"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  isSuspended: boolean;
  suspendedAtUtc: string | null;
  createdAtUtc: string;
};

type UsersResponse = {
  items: User[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type StatusFilter =
  | "all"
  | "active"
  | "unverified"
  | "suspended";

const PAGE_SIZE = 10;

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getStatus(user: User) {
  if (user.isSuspended) return "Suspended";
  if (!user.isEmailVerified) return "Unverified";
  return "Active";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingAction, setPendingAction] = useState<{
    user: User;
    action: "suspend" | "reactivate";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsers = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (filter !== "all") {
          params.set("status", filter);
        }

        const response = await fetch(
          `/api/admin/users?${params.toString()}`,
          {
            cache: "no-store",
            signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 403
              ? "Administrator access required."
              : "Unable to load users."
          );
        }

        const data =
          (await response.json()) as UsersResponse;

        setUsers(data.items ?? []);
        setTotalCount(data.totalCount ?? 0);
        setTotalPages(
          Math.max(1, data.totalPages ?? 1)
        );
      } catch (err) {
        if (signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [page, search, filter]
  );

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      void loadUsers(controller.signal);
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadUsers, refreshKey]);

  function requestAction(user: User) {
    if (user.role.toLowerCase() === "admin") return;
    setActionError("");
    setNotice("");
    setPendingAction({
      user,
      action: user.isSuspended ? "reactivate" : "suspend",
    });
  }

  async function confirmAction() {
    if (!pendingAction || actionLoading) return;

    const { user, action } = pendingAction;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(user.id)}/${action}`,
        { method: "PATCH", cache: "no-store" }
      );

      const result: unknown = await response.json().catch(() => null);
      const message =
        result && typeof result === "object" && "message" in result &&
        typeof result.message === "string"
          ? result.message
          : null;

      if (!response.ok) {
        throw new Error(
          message ?? (response.status === 401
            ? "Your session has expired. Please sign in again."
            : response.status === 403
              ? "Administrator access required or this account is protected."
              : `Unable to ${action} this account.`)
        );
      }

      setNotice(message ?? `Account ${action === "suspend" ? "suspended" : "reactivated"} successfully.`);
      setPendingAction(null);
      setSelectedUser(null);
      setRefreshKey((previous) => previous + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateFilter(value: StatusFilter) {
    setFilter(value);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
            Administration / Users
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            User Management
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            Monitor registered accounts, verification
            status and access permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setRefreshKey((previous) => previous + 1)
          }
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {notice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-lime-300/20 bg-lime-300/10 px-4 py-3 text-sm text-lime-200">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="rounded-2xl border border-white/10 bg-[#11161D] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                updateSearch(event.target.value)
              }
              placeholder="Search by name or email..."
              aria-label="Search users"
              className="w-full rounded-xl border border-white/10 bg-[#0B1016] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-lime-300/50"
            />
          </div>

          <select
            value={filter}
            onChange={(event) =>
              updateFilter(
                event.target.value as StatusFilter
              )
            }
            aria-label="Filter users by status"
            className="rounded-xl border border-white/10 bg-[#0B1016] px-4 py-3 text-sm text-slate-200 outline-none focus:border-lime-300/50"
          >
            <option value="all">All accounts</option>
            <option value="active">Active</option>
            <option value="unverified">
              Unverified
            </option>
            <option value="suspended">
              Suspended
            </option>
          </select>
        </div>
      </div>

      {/* USER TABLE */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#11161D]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-5">
          <div>
            <h2 className="text-base font-semibold text-white">
              Registered Users
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {totalCount} matching accounts
            </p>
          </div>

          <div className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400">
            Page {page} of {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="border-b border-white/10 bg-white/[0.025]">
              <tr className="text-xs text-slate-500">
                <th className="px-5 py-4 font-medium">
                  User
                </th>
                <th className="px-5 py-4 font-medium">
                  Role
                </th>
                <th className="px-5 py-4 font-medium">
                  Status
                </th>
                <th className="px-5 py-4 font-medium">
                  Registered
                </th>
                <th className="px-5 py-4 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center text-sm text-slate-400"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center text-sm text-red-300"
                  >
                    {error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center text-sm text-slate-400"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-xs font-semibold text-lime-300">
                          {getInitials(user.fullName)}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                          user.role === "Admin"
                            ? "bg-lime-300/10 text-lime-300"
                            : "bg-white/5 text-slate-300"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          user.isSuspended
                            ? "bg-red-400/10 text-red-300"
                            : user.isEmailVerified
                              ? "bg-lime-300/10 text-lime-300"
                              : "bg-amber-300/10 text-amber-300"
                        }`}
                      >
                        {getStatus(user)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-400">
                      {formatDate(user.createdAtUtc)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedUser(user)
                        }
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-lime-300/40 hover:text-lime-300"
                      >
                        View details
                      </button>
                      {user.role.toLowerCase() !== "admin" && (
                        <button
                          type="button"
                          onClick={() => requestAction(user)}
                          className={`ml-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                            user.isSuspended
                              ? "border-lime-300/25 text-lime-300 hover:bg-lime-300/10"
                              : "border-red-300/25 text-red-300 hover:bg-red-300/10"
                          }`}
                        >
                          {user.isSuspended ? "Reactivate" : "Suspend"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <p className="text-xs text-slate-500">
            Showing {users.length} of {totalCount} matching users
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() =>
                setPage((previous) =>
                  Math.max(1, previous - 1)
                )
              }
              className="rounded-lg border border-white/10 p-2 text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-2 text-xs text-slate-400">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() =>
                setPage((previous) =>
                  Math.min(totalPages, previous + 1)
                )
              }
              className="rounded-lg border border-white/10 p-2 text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div
          role="presentation"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedUser(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#11161D] p-6 shadow-2xl"
          >
            <div className="mb-7 flex items-center justify-between">
              <h2
                id="user-details-title"
                className="text-lg font-semibold text-white"
              >
                User Details
              </h2>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Close user details"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-300/10 text-lg font-semibold text-lime-300">
                {getInitials(selectedUser.fullName)}
              </div>

              <div>
                <p className="font-semibold text-white">
                  {selectedUser.fullName}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {selectedUser.email}
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
              {[
                ["User ID", selectedUser.id],
                ["Full Name", selectedUser.fullName],
                ["Email", selectedUser.email],
                ["Role", selectedUser.role],
                ["Status", getStatus(selectedUser)],
                [
                  "Email Verification",
                  selectedUser.isEmailVerified
                    ? "Verified"
                    : "Not verified",
                ],
                [
                  "Registered",
                  formatDate(selectedUser.createdAtUtc),
                ],
                [
                  "Suspended At",
                  selectedUser.suspendedAtUtc
                    ? formatDate(selectedUser.suspendedAtUtc)
                    : "Not suspended",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-wrap justify-between gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-xs text-slate-500">
                    {label}
                  </span>
                  <span className="max-w-[65%] break-all text-right text-xs font-medium text-slate-200">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {selectedUser.role.toLowerCase() !== "admin" && (
              <button
                type="button"
                onClick={() => requestAction(selectedUser)}
                className={`mt-6 w-full rounded-xl border py-3 text-sm font-semibold transition ${
                  selectedUser.isSuspended
                    ? "border-lime-300/30 text-lime-300 hover:bg-lime-300/10"
                    : "border-red-300/30 text-red-300 hover:bg-red-300/10"
                }`}
              >
                {selectedUser.isSuspended ? "Reactivate account" : "Suspend account"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="mt-3 w-full rounded-xl bg-lime-300 py-3 text-sm font-semibold text-black transition hover:bg-lime-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM ACCOUNT ACTION */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setPendingAction(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-account-action"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11161D] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className={`rounded-xl p-3 ${pendingAction.action === "suspend" ? "bg-red-300/10 text-red-300" : "bg-lime-300/10 text-lime-300"}`}>
                {pendingAction.action === "suspend" ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
              </div>
              <h2 id="confirm-account-action" className="text-lg font-semibold text-white">
                {pendingAction.action === "suspend" ? "Suspend account?" : "Reactivate account?"}
              </h2>
            </div>
            <p className="text-sm leading-6 text-slate-400">
              {pendingAction.action === "suspend"
                ? `Suspend ${pendingAction.user.fullName}? Their existing sessions will be invalidated and they will be unable to sign in until reactivated.`
                : `Reactivate ${pendingAction.user.fullName}? They will be able to sign in again, subject to normal account verification requirements.`}
            </p>
            {actionError && (
              <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
                {actionError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setPendingAction(null)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void confirmAction()}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50 ${pendingAction.action === "suspend" ? "bg-red-300 hover:bg-red-200" : "bg-lime-300 hover:bg-lime-200"}`}
              >
                {actionLoading ? "Processing..." : pendingAction.action === "suspend" ? "Confirm suspension" : "Confirm reactivation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
