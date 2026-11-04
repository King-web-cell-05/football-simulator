import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const API_URL = process.env.FOOTBALLSIM_API_URL ?? "http://localhost:5295";

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const competitionId = id.trim();

  if (!GUID_REGEX.test(competitionId)) {
    return NextResponse.json(
      { message: "Invalid competition ID." },
      { status: 400 },
    );
  }

  const token = request.cookies.get("footballsim_session")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Please sign in again." },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/Matches/competition/${competitionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: request.signal,
      },
    );

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : "Unable to retrieve fixtures.";

      return NextResponse.json({ message }, { status: response.status });
    }

    if (!Array.isArray(payload)) {
      return NextResponse.json(
        {
          message: "Unexpected fixtures API response.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Fixtures proxy error:", error);

    return NextResponse.json(
      {
        message: "Unable to connect to FootballSim backend.",
      },
      { status: 502 },
    );
  }
}
