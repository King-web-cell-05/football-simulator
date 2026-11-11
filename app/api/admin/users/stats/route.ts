
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


const SESSION_COOKIE = "footballsim_session";
const REQUEST_TIMEOUT_MS = 15_000;

type UserStats = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  unverifiedUsers: number;
  newUsersLast30Days: number;
};

// ==========================================
// STANDARD JSON RESPONSE
// ==========================================

function jsonResponse(
  payload: unknown,
  status: number
): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// ==========================================
// VALIDATE BACKEND CONFIGURATION
// ==========================================

function getBackendUrl(): string | null {
  const configuredUrl = process.env.FOOTBALLSIM_API_URL;

  if (!configuredUrl) {
    return null;
  }

  try {
    const url = new URL(configuredUrl);

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

// ==========================================
// VALIDATE BACKEND RESPONSE
// ==========================================

function isUserStats(value: unknown): value is UserStats {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  const fields = [
    "totalUsers",
    "activeUsers",
    "suspendedUsers",
    "unverifiedUsers",
    "newUsersLast30Days",
  ];

  return fields.every(
    (field) =>
      typeof data[field] === "number" &&
      Number.isSafeInteger(data[field]) &&
      data[field] >= 0
  );
}

// ==========================================
// GET /api/admin/users/stats
// ==========================================

export async function GET(): Promise<NextResponse> {
  // 1. Authenticate using the HttpOnly cookie.
  const token = (await cookies())
    .get(SESSION_COOKIE)?.value;

  if (!token) {
    return jsonResponse(
      {
        message:
          "Authentication required. Please sign in.",
      },
      401
    );
  }

  // 2. Validate backend URL.
  const apiUrl = getBackendUrl();

  if (!apiUrl) {
    return jsonResponse(
      {
        message:
          "Backend API is not configured correctly.",
      },
      500
    );
  }

  try {
    // 3. Forward request to ASP.NET Core.
    const response = await fetch(
      `${apiUrl}/api/admin/users/stats`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(
          REQUEST_TIMEOUT_MS
        ),
      }
    );

    // 4. Authentication and authorization errors.
    if (response.status === 401) {
      return jsonResponse(
        {
          message:
            "Your session has expired. Please sign in again.",
        },
        401
      );
    }

    if (response.status === 403) {
      return jsonResponse(
        {
          message:
            "Administrator access is required.",
        },
        403
      );
    }

    // 5. Other backend errors.
    if (!response.ok) {
      return jsonResponse(
        {
          message:
            "Unable to retrieve user statistics.",
        },
        response.status
      );
    }

    // 6. Ensure the backend returned JSON.
    const contentType =
      response.headers.get("content-type") ?? "";

    if (
      !contentType
        .toLowerCase()
        .includes("application/json")
    ) {
      return jsonResponse(
        {
          message:
            "Unexpected response from the user service.",
        },
        502
      );
    }

    // 7. Parse and validate the response.
    let data: unknown;

    try {
      data = await response.json();
    } catch {
      return jsonResponse(
        {
          message:
            "Unable to read user statistics.",
        },
        502
      );
    }

    if (!isUserStats(data)) {
      return jsonResponse(
        {
          message:
            "Invalid statistics received from the backend.",
        },
        502
      );
    }

    // 8. Return validated statistics.
    return jsonResponse(data, 200);
  } catch (error) {
    // 9. Handle timeouts.
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError")
    ) {
      return jsonResponse(
        {
          message:
            "The statistics service took too long to respond.",
        },
        504
      );
    }

    console.error(
      "[FootballSim] Admin user statistics API failed:",
      error instanceof Error
        ? error.name
        : "Unknown error"
    );

    return jsonResponse(
      {
        message:
          "The statistics service is currently unavailable.",
      },
      503
    );
  }
}
