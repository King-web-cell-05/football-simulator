
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


const SESSION_COOKIE = "footballsim_session";
const REQUEST_TIMEOUT_MS = 15_000;

function jsonResponse(data: unknown, status: number) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getBackendUrl(): string | null {
  const configured = process.env.FOOTBALLSIM_API_URL;

  if (!configured) return null;

  try {
    const url = new URL(configured);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    ) {
      return null;
    }

    if (
      process.env.NODE_ENV === "production" &&
      url.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(url.hostname)
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export async function GET(): Promise<NextResponse> {
  const token = (await cookies())
    .get(SESSION_COOKIE)?.value;

  if (!token) {
    return jsonResponse(
      { message: "Authentication required. Please sign in." },
      401
    );
  }

  const apiUrl = getBackendUrl();

  if (!apiUrl) {
    return jsonResponse(
      { message: "Backend API is not configured correctly." },
      500
    );
  }

  try {
    const response = await fetch(
      `${apiUrl}/api/admin/competitions/stats`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    if (response.status === 401) {
      return jsonResponse(
        { message: "Your session has expired. Please sign in again." },
        401
      );
    }

    if (response.status === 403) {
      return jsonResponse(
        { message: "Administrator access required." },
        403
      );
    }

    if (!response.ok) {
      return jsonResponse(
        { message: "Unable to retrieve competition statistics." },
        response.status
      );
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonResponse(
        { message: "Unexpected response from the competition service." },
        502
      );
    }

    const data: unknown = await response.json();

    return jsonResponse(data, 200);
  } catch (error) {
    if (
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name)
    ) {
      return jsonResponse(
        { message: "Competition statistics request timed out." },
        504
      );
    }

    console.error(
      "[FootballSim] Admin competition statistics failed:",
      error instanceof Error ? error.name : "Unknown error"
    );

    return jsonResponse(
      { message: "Competition statistics service unavailable." },
      503
    );
  }
}
