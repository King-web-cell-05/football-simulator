
import { NextRequest, NextResponse } from "next/server";


const MAX_NAME_LENGTH = 150;

// ==========================================
// SHARED HELPERS
// ==========================================

function getBackendUrl(): string | null {
  const baseUrl = process.env.FOOTBALLSIM_API_URL;

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/+$/, "")}/api/Competition`;
}

function getToken(request: NextRequest): string | null {
  return request.cookies.get("footballsim_session")?.value ?? null;
}

function getErrorMessage(
  body: unknown,
  fallback: string
): string {
  if (
    body !== null &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string" &&
    body.message.trim()
  ) {
    return body.message;
  }

  return fallback;
}

async function parseJson(
  response: Response
): Promise<unknown> {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json().catch(() => null);
}

// ==========================================
// GET MY COMPETITIONS
// GET /api/competitions
// ==========================================

export async function GET(request: NextRequest) {
  const token = getToken(request);

  if (!token) {
    return NextResponse.json(
      { message: "Please sign in again." },
      { status: 401 }
    );
  }

  const url = getBackendUrl();

  if (!url) {
    return NextResponse.json(
      {
        message:
          "FOOTBALLSIM_API_URL is not configured.",
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: request.signal,
    });

    const body = await parseJson(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          message: getErrorMessage(
            body,
            `Competition API returned HTTP ${response.status}.`
          ),
        },
        { status: response.status }
      );
    }

    if (!Array.isArray(body)) {
      return NextResponse.json(
        {
          message:
            "Competition API returned an unexpected response.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Competition GET proxy failed:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to connect to FootballSim backend.",
      },
      { status: 502 }
    );
  }
}

// ==========================================
// CREATE PRIVATE COMPETITION
// POST /api/competitions
// ==========================================

export async function POST(request: NextRequest) {
  // 1. Authenticate the current user.
  const token = getToken(request);

  if (!token) {
    return NextResponse.json(
      {
        message:
          "Your session has expired. Please sign in again.",
      },
      { status: 401 }
    );
  }

  // 2. Verify backend configuration.
  const url = getBackendUrl();

  if (!url) {
    return NextResponse.json(
      {
        message:
          "FOOTBALLSIM_API_URL is not configured.",
      },
      { status: 500 }
    );
  }

  // 3. Parse and validate the request.
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        message: "Invalid JSON request body.",
      },
      { status: 400 }
    );
  }

  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !("name" in payload) ||
    typeof payload.name !== "string"
  ) {
    return NextResponse.json(
      {
        message: "Competition name is required.",
      },
      { status: 400 }
    );
  }

  const name = payload.name.trim();

  if (!name) {
    return NextResponse.json(
      {
        message: "Competition name cannot be empty.",
      },
      { status: 400 }
    );
  }

  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      {
        message:
          "Competition name must not exceed 150 characters.",
      },
      { status: 400 }
    );
  }

  // 4. Forward the request to ASP.NET Core.
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
      }),
      cache: "no-store",
      signal: request.signal,
    });

    const body = await parseJson(response);

    // 5. Forward backend errors safely.
    if (!response.ok) {
      return NextResponse.json(
        {
          message: getErrorMessage(
            body,
            `Competition creation failed (HTTP ${response.status}).`
          ),
        },
        { status: response.status }
      );
    }

    // 6. Validate the successful response.
    if (
      body === null ||
      typeof body !== "object" ||
      !("id" in body) ||
      typeof body.id !== "string" ||
      !body.id.trim()
    ) {
      return NextResponse.json(
        {
          message:
            "Backend returned an invalid competition response.",
        },
        { status: 502 }
      );
    }

    // 7. Return the created competition.
    return NextResponse.json(body, {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Competition POST proxy failed:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to connect to FootballSim backend. Make sure the API is running.",
      },
      { status: 502 }
    );
  }
}
