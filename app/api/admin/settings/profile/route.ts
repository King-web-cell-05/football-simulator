
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { validateCsrfOrigin } from "@/lib/security/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_COOKIE = "footballsim_session";
const REQUEST_TIMEOUT_MS = 15_000;

type HttpMethod = "GET" | "PUT";

type ApiPayload = {
  message?: string;
  [key: string]: unknown;
};

function jsonResponse(
  payload: ApiPayload,
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

    // HTTPS is required for remote production APIs.
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

async function readBackendPayload(
  response: Response
): Promise<ApiPayload> {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return {
      message: response.ok
        ? "Request completed successfully."
        : "The backend returned an unexpected response.",
    };
  }

  try {
    const payload: unknown = await response.json();

    if (
      payload !== null &&
      typeof payload === "object" &&
      !Array.isArray(payload)
    ) {
      return payload as ApiPayload;
    }

    return {
      message: "Unexpected backend response format.",
    };
  } catch {
    return {
      message: "Unable to read the backend response.",
    };
  }
}

async function proxyProfile(
  method: HttpMethod,
  request?: NextRequest
): Promise<NextResponse> {
  // Validate browser origin before accessing
  // the authenticated session.
  if (method === "PUT") {
    if (!request) {
      return jsonResponse(
        { message: "Invalid request." },
        400
      );
    }

    const csrfError = validateCsrfOrigin(request);

    if (csrfError) {
      return csrfError;
    }
  }

  // Read JWT from the server-side HttpOnly cookie.
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return jsonResponse(
      {
        message:
          "Your session has expired. Please sign in again.",
      },
      401
    );
  }

  // Validate the backend configuration.
  const apiUrl = getBackendUrl();

  if (!apiUrl) {
    return jsonResponse(
      {
        message: "Backend API is not configured correctly.",
      },
      500
    );
  }

  let requestBody: string | undefined;

  if (method === "PUT" && request) {
    const contentType =
      request.headers.get("content-type") ?? "";

    if (
      !contentType
        .toLowerCase()
        .startsWith("application/json")
    ) {
      return jsonResponse(
        {
          message:
            "Content-Type must be application/json.",
        },
        415
      );
    }

    try {
      const payload: unknown = await request.json();

      if (
        payload === null ||
        typeof payload !== "object" ||
        Array.isArray(payload)
      ) {
        return jsonResponse(
          {
            message: "A valid JSON object is required.",
          },
          400
        );
      }

      requestBody = JSON.stringify(payload);
    } catch {
      return jsonResponse(
        {
          message: "Invalid JSON request body.",
        },
        400
      );
    }
  }

  try {
    const response = await fetch(
      `${apiUrl}/api/admin/settings/profile`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(requestBody !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body: requestBody,
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    const payload = await readBackendPayload(response);

    // Preserve backend HTTP status codes,
    // including 400, 401, 403 and 500.
    return jsonResponse(payload, response.status);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError")
    ) {
      return jsonResponse(
        {
          message:
            "The backend took too long to respond. Please try again.",
        },
        504
      );
    }

    console.error(
      "[FootballSim] Profile API proxy failed:",
      error instanceof Error ? error.name : "Unknown error"
    );

    return jsonResponse(
      {
        message:
          "Unable to connect to the backend. Please try again.",
      },
      502
    );
  }
}

// ==========================================
// GET ADMIN PROFILE
// ==========================================

export async function GET(): Promise<NextResponse> {
  return proxyProfile("GET");
}

// ==========================================
// UPDATE ADMIN PROFILE
// ==========================================

export async function PUT(
  request: NextRequest
): Promise<NextResponse> {
  return proxyProfile("PUT", request);
}
