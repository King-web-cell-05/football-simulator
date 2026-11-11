
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";

// Allow blocking rendering for authenticated routes.
export const instant = false;

async function verifyAdminAccess(): Promise<void> {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    "footballsim_session"
  )?.value;

  // Redirect unauthenticated users.
  if (!token) {
    redirect("/login");
  }

  // Read backend API configuration.
  const apiUrl = process.env.FOOTBALLSIM_API_URL;

  if (!apiUrl) {
    throw new Error(
      "FootballSim backend API is not configured."
    );
  }

  const baseUrl = apiUrl.replace(/\/+$/, "");

  let response: Response;

  try {
    response = await fetch(
      `${baseUrl}/api/admin/dashboard/overview`,
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

  // Invalid or expired authentication token.
  if (response.status === 401) {
    redirect("/login");
  }

  // Authenticated user without admin privileges.
  if (response.status === 403) {
    redirect("/dashboard");
  }

  // Handle unexpected backend errors.
  if (!response.ok) {
    throw new Error(
      `Unable to verify administrator access. Status: ${response.status}`
    );
  }
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Wait for an actual request before rendering.
  // Prevents blocking-prerender errors involving
  // Date.now() and uncached authentication requests.
  await connection();

  // Verify the administrator's session.
  await verifyAdminAccess();

  // Render the existing admin interface.
  return (
    <AdminShell>
      {children}
    </AdminShell>
  );
}
