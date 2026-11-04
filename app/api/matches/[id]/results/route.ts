
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.FOOTBALLSIM_API_URL ??
  "http://localhost:5295";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  if (!GUID_REGEX.test(id)) {
    return NextResponse.json(
      { message: "Invalid match ID." },
      { status: 400 }
    );
  }

  const token =
    request.cookies.get("footballsim_session")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Please sign in again." },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("homeScore" in body) ||
    !("awayScore" in body)
  ) {
    return NextResponse.json(
      { message: "Both match scores are required." },
      { status: 400 }
    );
  }

  const { homeScore, awayScore } = body;

  if (
    typeof homeScore !== "number" ||
    typeof awayScore !== "number" ||
    !Number.isSafeInteger(homeScore) ||
    !Number.isSafeInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0 ||
    homeScore > 99 ||
    awayScore > 99
  ) {
    return NextResponse.json(
      {
        message:
          "Scores must be whole numbers between 0 and 99.",
      },
      { status: 400 }
    );
  }

  try {
    const url = new URL(
      `${API_URL.replace(/\/$/, "")}/api/Matches/${id}/result`
    );

    url.searchParams.set(
      "homeScore",
      String(homeScore)
    );

    url.searchParams.set(
      "awayScore",
      String(awayScore)
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const result: unknown = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      const message =
        result &&
        typeof result === "object" &&
        "message" in result &&
        typeof result.message === "string"
          ? result.message
          : "Unable to save match result.";

      return NextResponse.json(
        { message },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Save match result error:", error);

    return NextResponse.json(
      {
        message:
          "Unable to connect to FootballSim backend.",
      },
      { status: 502 }
    );
  }
}
