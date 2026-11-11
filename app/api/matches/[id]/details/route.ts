
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const apiBase = (
  process.env.FOOTBALLSIM_API_URL ??
  process.env.NEXT_PUBLIC_FOOTBALLSIM_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5295"
).replace(/\/+$/, "");

const guidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const token = request.cookies.get(
    "footballsim_session"
  )?.value;

  if (!token) {
    return NextResponse.json(
      {
        message: "Please sign in to view match details.",
      },
      { status: 401 }
    );
  }

  // The folder is [id], so read the "id" parameter.
  const { id: matchId } = await context.params;

  if (!matchId || !guidRegex.test(matchId)) {
    return NextResponse.json(
      {
        message: "Invalid match ID.",
      },
      { status: 400 }
    );
  }

  const url =
    `${apiBase}/api/Matches/` +
    `${encodeURIComponent(matchId)}/details`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const raw = await response.text();

    let payload: unknown;

    try {
      payload = JSON.parse(raw);
    } catch {
      payload = {
        message: response.ok
          ? "Backend returned an invalid JSON response."
          : `Backend request failed with status ${response.status}.`,
      };
    }

    if (!response.ok) {
      console.error("Match details API error:", {
        status: response.status,
        url,
        response: payload,
      });
    }

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      "Match details connection error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Cannot connect to the FootballSim backend. " +
          "Check that the ASP.NET Core API is running " +
          "and the backend URL is correct.",
      },
      { status: 502 }
    );
  }
}
