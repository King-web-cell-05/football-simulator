
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

// Next.js 16.4.1:
// Allow blocking rendering for authenticated routes.
export const instant = false;

async function verifyAdminAccess() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    "footballsim_session"
  )?.value;

  // No session: redirect to login.
  if (!token) {
    redirect("/login");
  }

  const apiUrl = process.env.FOOTBALLSIM_API_URL;

  if (!apiUrl) {
    throw new Error(
      "FootballSim backend API is not configured."
    );
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/admin/dashboard/overview`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );
  } catch {
    throw new Error(
      "Unable to connect to the FootballSim backend."
    );
  }

  // Expired or invalid session.
  if (response.status === 401) {
    redirect("/login");
  }

  // Authenticated but not an administrator.
  if (response.status === 403) {
    redirect("/dashboard");
  }

  if (!response.ok) {
    throw new Error(
      "Unable to verify administrator access."
    );
  }
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await verifyAdminAccess();

  return <AdminShell>{children}</AdminShell>;
}
