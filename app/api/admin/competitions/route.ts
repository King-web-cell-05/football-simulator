
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";


const SESSION_COOKIE = "footballsim_session";
const REQUEST_TIMEOUT_MS = 15_000;

function jsonResponse(
  data: unknown,
  status: number
): NextResponse {
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

function getPositiveInteger(
  value: string | null,
  fallback: number,
  maximum: number
): number | null {
  if (value === null) return fallback;

  if (!/^[0-9]+$/.test(value)) return null;

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

// GET /api/admin/competitions
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
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

  const params = request.nextUrl.searchParams;

  const page = getPositiveInteger(
    params.get("page"),
    1,
    1_000_000
  );

  const pageSize = getPositiveInteger(
    params.get("pageSize"),
    10,
    100
  );

  if (page === null || pageSize === null) {
    return jsonResponse(
      {
        message:
          "Invalid pagination parameters. Page and pageSize must be positive integers; pageSize cannot exceed 100.",
      },
      400
    );
  }

  const search = (params.get("search") ?? "").trim();

  if (search.length > 150) {
    return jsonResponse(
      { message: "Search must not exceed 150 characters." },
      400
    );
  }

  const backendParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (search) {
    backendParams.set("search", search);
  }

  try {
    const response = await fetch(
      `${apiUrl}/api/admin/competitions?${backendParams.toString()}`,
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
        {
          message:
            "Your session has expired. Please sign in again.",
        },
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
        { message: "Unable to retrieve competitions." },
        response.status
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
        { message: "Competition service timed out." },
        504
      );
    }

    console.error(
      "[FootballSim] Admin competitions request failed:",
      error instanceof Error ? error.name : "Unknown error"
    );

    return jsonResponse(
      {
        message:
          "The competition service is currently unavailable.",
      },
      503
    );
  }
}
