
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateCsrfOrigin } from "@/lib/security/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const SESSION_COOKIE = "footballsim_session";

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(
  data: unknown,
  status: number
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  // 1. CSRF protection.
  const csrfError = validateCsrfOrigin(request);

  if (csrfError) {
    return csrfError;
  }

  // 2. Validate user ID.
  const { id } = await context.params;

  if (!GUID_REGEX.test(id)) {
    return jsonResponse(
      { message: "Invalid user ID." },
      400
    );
  }

  // 3. Authenticate administrator.
  const token = (await cookies())
    .get(SESSION_COOKIE)?.value;

  if (!token) {
    return jsonResponse(
      { message: "Authentication required." },
      401
    );
  }

  // 4. Validate backend configuration.
  const apiUrl = process.env.FOOTBALLSIM_API_URL;

  if (!apiUrl) {
    return jsonResponse(
      { message: "Backend API is not configured." },
      500
    );
  }

  let backendOrigin: string;

  try {
    const url = new URL(apiUrl);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (process.env.NODE_ENV === "production" &&
        url.protocol !== "https:" &&
        !["localhost", "127.0.0.1"].includes(
          url.hostname
        ))
    ) {
      throw new Error("Invalid backend URL");
    }

    backendOrigin = url.toString().replace(/\/+$/, "");
  } catch {
    return jsonResponse(
      { message: "Invalid backend configuration." },
      500
    );
  }

  // 5. Forward reactivation request.
  try {
    const response = await fetch(
      `${backendOrigin}/api/admin/users/${id}/reactivate`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    const payload: unknown = await response
      .json()
      .catch(() => ({
        message: response.ok
          ? "Account reactivated successfully."
          : "Unable to reactivate account.",
      }));

    return jsonResponse(payload, response.status);
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

    return jsonResponse(
      { message: "User service is unavailable." },
      502
    );
  }
}
