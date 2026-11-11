
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";



const SESSION_COOKIE = "footballsim_session";
const REQUEST_TIMEOUT_MS = 15_000;

type RouteContext = {
  params: Promise<{ id: string }>;
};

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      url.hash
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

    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

// GET /api/admin/users/{id}
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id } = await context.params;

  // Validate user ID.
  if (!GUID_REGEX.test(id)) {
    return jsonResponse(
      { message: "Invalid user ID." },
      400
    );
  }

  // Read secure session cookie.
  const token = (await cookies())
    .get(SESSION_COOKIE)?.value;

  if (!token) {
    return jsonResponse(
      {
        message: "Authentication required. Please sign in.",
      },
      401
    );
  }

  // Validate backend configuration.
  const apiUrl = getBackendUrl();

  if (!apiUrl) {
    return jsonResponse(
      { message: "Backend API is not configured correctly." },
      500
    );
  }

  try {
    // Forward request to ASP.NET Core.
    const response = await fetch(
      `${apiUrl}/api/admin/users/${id}`,
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
        { message: "Administrator access is required." },
        403
      );
    }

    if (response.status === 404) {
      return jsonResponse(
        { message: "User not found." },
        404
      );
    }

    if (!response.ok) {
      return jsonResponse(
        { message: "Unable to load user details." },
        response.status
      );
    }

    const contentType =
      response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonResponse(
        { message: "Unexpected response from the user service." },
        502
      );
    }

    let data: unknown;

    try {
      data = await response.json();
    } catch {
      return jsonResponse(
        { message: "Unable to read user details." },
        502
      );
    }

    return jsonResponse(data, 200);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError")
    ) {
      return jsonResponse(
        { message: "The request timed out." },
        504
      );
    }

    console.error(
      "[FootballSim] Admin user details API failed:",
      error instanceof Error ? error.name : "Unknown error"
    );

    return jsonResponse(
      { message: "The user service is currently unavailable." },
      503
    );
  }
}
