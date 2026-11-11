
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { validateCsrfOrigin } from "@/lib/security/csrf";


const SESSION_COOKIE = "footballsim_session";
const REQUEST_TIMEOUT_MS = 15_000;

type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

function jsonResponse(
  payload: Record<string, unknown>,
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

async function readBackendPayload(
  response: Response
): Promise<Record<string, unknown>> {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      message: response.ok
        ? "Password changed successfully."
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
      return payload as Record<string, unknown>;
    }

    return {
      message: "Unexpected backend response format.",
    };
  } catch {
    return {
      message: response.ok
        ? "Password changed successfully."
        : "Unable to read the backend response.",
    };
  }
}

export async function PUT(
  request: NextRequest
): Promise<NextResponse> {
  // ==========================================
  // 1. CSRF ORIGIN VALIDATION
  // ==========================================

  const csrfError = validateCsrfOrigin(request);

  if (csrfError) {
    return csrfError;
  }

  // ==========================================
  // 2. AUTHENTICATION
  // ==========================================

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

  // ==========================================
  // 3. BACKEND CONFIGURATION
  // ==========================================

  const apiUrl = getBackendUrl();

  if (!apiUrl) {
    return jsonResponse(
      {
        message: "Backend API is not configured correctly.",
      },
      500
    );
  }

  // ==========================================
  // 4. REQUEST CONTENT TYPE
  // ==========================================

  const contentType =
    request.headers.get("content-type") ?? "";

  if (
    !contentType.toLowerCase().startsWith("application/json")
  ) {
    return jsonResponse(
      {
        message: "Content-Type must be application/json.",
      },
      415
    );
  }

  // ==========================================
  // 5. PARSE AND VALIDATE PASSWORDS
  // ==========================================

  let body: ChangePasswordRequest;

  try {
    const payload: unknown = await request.json();

    if (
      payload === null ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return jsonResponse(
        { message: "A valid JSON object is required." },
        400
      );
    }

    const data = payload as Record<string, unknown>;

    if (
      typeof data.currentPassword !== "string" ||
      typeof data.newPassword !== "string"
    ) {
      return jsonResponse(
        {
          message: "Both password fields are required.",
        },
        400
      );
    }

    if (
      data.currentPassword.length === 0 ||
      data.newPassword.length === 0
    ) {
      return jsonResponse(
        {
          message: "Password fields cannot be empty.",
        },
        400
      );
    }

    if (
      data.newPassword.length < 12 ||
      data.newPassword.length > 128
    ) {
      return jsonResponse(
        {
          message:
            "Your new password must contain between 12 and 128 characters.",
        },
        400
      );
    }

    if (data.currentPassword === data.newPassword) {
      return jsonResponse(
        {
          message:
            "Your new password must be different from your current password.",
        },
        400
      );
    }

    body = {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    };
  } catch {
    return jsonResponse(
      {
        message: "Invalid JSON request body.",
      },
      400
    );
  }

  // ==========================================
  // 6. FORWARD REQUEST TO ASP.NET CORE
  // ==========================================

  try {
    const response = await fetch(
      `${apiUrl}/api/admin/settings/password`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    const payload = await readBackendPayload(response);

    const result = jsonResponse(payload, response.status);

    // ==========================================
    // 7. REVOKE BROWSER SESSION
    // ==========================================

    if (response.ok) {
      // The ASP.NET Core backend increments
      // SecurityVersion, invalidating old JWTs.
      //
      // Remove the browser's session cookie
      // so the user must authenticate again.

      result.cookies.set(SESSION_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }

    return result;
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
      "[FootballSim] Password API proxy failed:",
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
