
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";



const SESSION_COOKIE = "footballsim_session";
const REQUEST_TIMEOUT_MS = 15_000;

const ALLOWED_STATUSES = new Set([
  "all",
  "active",
  "suspended",
  "unverified",
]);

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

function parsePositiveInteger(
  value: string | null,
  fallback: number,
  maximum: number
): number | null {
  if (value === null || value === "") {
    return fallback;
  }

  if (!/^[0-9]+$/.test(value)) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isSafeInteger(number) ||
    number < 1 ||
    number > maximum
  ) {
    return null;
  }

  return number;
}

function buildUserQuery(
  request: NextRequest
): URLSearchParams | NextResponse {
  const incoming = request.nextUrl.searchParams;
  const params = new URLSearchParams();

  const page = parsePositiveInteger(
    incoming.get("page"),
    1,
    100_000
  );

  if (page === null) {
    return jsonResponse(
      { message: "Invalid page number." },
      400
    );
  }

  const pageSize = parsePositiveInteger(
    incoming.get("pageSize"),
    20,
    100
  );

  if (pageSize === null) {
    return jsonResponse(
      {
        message:
          "Page size must be between 1 and 100.",
      },
      400
    );
  }

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  const search = incoming.get("search");

  if (search !== null) {
    const normalizedSearch = search.trim();

    if (normalizedSearch.length > 100) {
      return jsonResponse(
        {
          message:
            "Search must not exceed 100 characters.",
        },
        400
      );
    }

    if (normalizedSearch) {
      params.set("search", normalizedSearch);
    }
  }

  const status = incoming.get("status");

  if (status !== null && status !== "") {
    const normalizedStatus = status
      .trim()
      .toLowerCase();

    if (!ALLOWED_STATUSES.has(normalizedStatus)) {
      return jsonResponse(
        {
          message: "Invalid user status filter.",
        },
        400
      );
    }

    params.set("status", normalizedStatus);
  }

  return params;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  // ==========================================
  // 1. AUTHENTICATION
  // ==========================================

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

  // ==========================================
  // 2. BACKEND CONFIGURATION
  // ==========================================

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

  // ==========================================
  // 3. QUERY PARAMETER VALIDATION
  // ==========================================

  const queryResult = buildUserQuery(request);

  if (queryResult instanceof NextResponse) {
    return queryResult;
  }

  const query = queryResult.toString();

  const url =
    `${apiUrl}/api/admin/users` +
    (query ? `?${query}` : "");

  // ==========================================
  // 4. REQUEST ASP.NET CORE BACKEND
  // ==========================================

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(
        REQUEST_TIMEOUT_MS
      ),
    });

    // ========================================
    // 5. AUTHENTICATION ERRORS
    // ========================================

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

    // ========================================
    // 6. BACKEND ERROR HANDLING
    // ========================================

    if (!response.ok) {
      return jsonResponse(
        {
          message: "Unable to load users.",
        },
        response.status
      );
    }

    // ========================================
    // 7. VALIDATE RESPONSE FORMAT
    // ========================================

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

    let data: unknown;

    try {
      data = await response.json();
    } catch {
      return jsonResponse(
        {
          message:
            "Unable to read the user service response.",
        },
        502
      );
    }

    // ========================================
    // 8. SUCCESS RESPONSE
    // ========================================

    return jsonResponse(data, 200);
  } catch (error) {
    // ========================================
    // 9. TIMEOUT HANDLING
    // ========================================

    if (
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError")
    ) {
      return jsonResponse(
        {
          message:
            "The user service took too long to respond.",
        },
        504
      );
    }

    console.error(
      "[FootballSim] Admin users API failed:",
      error instanceof Error
        ? error.name
        : "Unknown error"
    );

    return jsonResponse(
      {
        message:
          "The user service is currently unavailable.",
      },
      503
    );
  }
}
