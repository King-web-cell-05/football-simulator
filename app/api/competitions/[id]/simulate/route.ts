
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const API_URL =
  process.env.FOOTBALLSIM_API_URL ??
  "http://localhost:5295";

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SimulationRequest = {
  mode: "match" | "matchday" | "all";
  matchId?: string;
  matchday?: number;
};

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  const { id } = await context.params;

  if (!GUID_REGEX.test(id)) {
    return NextResponse.json(
      { message: "Invalid competition ID." },
      { status: 400 },
    );
  }

  const token = request.cookies.get(
    "footballsim_session",
  )?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Please sign in again." },
      { status: 401 },
    );
  }

  let body: SimulationRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  let endpoint: string;

  if (body.mode === "match") {
    if (!body.matchId || !GUID_REGEX.test(body.matchId)) {
      return NextResponse.json(
        { message: "Invalid match ID." },
        { status: 400 },
      );
    }

    endpoint =
      `/api/Simulation/${id}/matches/${body.matchId}/simulate`;
  } else if (body.mode === "matchday") {
    if (
      !Number.isInteger(body.matchday) ||
      !body.matchday ||
      body.matchday < 1
    ) {
      return NextResponse.json(
        { message: "Invalid matchday." },
        { status: 400 },
      );
    }

    endpoint =
      `/api/Simulation/${id}/matchdays/${body.matchday}/simulate`;
  } else if (body.mode === "all") {
    endpoint = `/api/Simulation/${id}/simulate`;
  } else {
    return NextResponse.json(
      { message: "Invalid simulation mode." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/+$/, "")}${endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: request.signal,
      },
    );

    const payload: unknown = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : "Simulation failed.";

      return NextResponse.json(
        { message },
        { status: response.status },
      );
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Simulation proxy error:", error);

    return NextResponse.json(
      {
        message:
          "Unable to connect to FootballSim backend.",
      },
      { status: 502 },
    );
  }
}
