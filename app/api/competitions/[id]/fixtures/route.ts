
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const API_URL =
  process.env.FOOTBALLSIM_API_URL ??
  "http://localhost:5295";

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getErrorMessage(
  payload: unknown,
  fallback: string,
): string {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  if (
    payload !== null &&
    typeof payload === "object" &&
    "title" in payload &&
    typeof payload.title === "string"
  ) {
    return payload.title;
  }

  return fallback;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const { id } = await context.params;

  const competitionId = id?.trim() ?? "";

  if (!GUID_REGEX.test(competitionId)) {
    return NextResponse.json(
      {
        message: "Invalid competition ID.",
      },
      { status: 400 },
    );
  }

  const token = request.cookies.get(
    "footballsim_session",
  )?.value;

  if (!token) {
    return NextResponse.json(
      {
        message:
          "Your session has expired. Please sign in again.",
      },
      { status: 401 },
    );
  }

  try {
    const baseUrl = API_URL.replace(/\/+$/, "");

    const response = await fetch(
      `${baseUrl}/api/Matches/competition/${competitionId}`,
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

    const payload: unknown = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          message: getErrorMessage(
            payload,
            `Unable to retrieve fixtures. (${response.status})`,
          ),
        },
        { status: response.status },
      );
    }

    if (!Array.isArray(payload)) {
      return NextResponse.json(
        {
          message:
            "Unexpected fixtures response from the backend.",
        },
        { status: 502 },
      );
    }

    const fixtures = [...payload].sort((a, b) => {
      const dayA =
        typeof a?.matchDay === "number"
          ? a.matchDay
          : 0;

      const dayB =
        typeof b?.matchDay === "number"
          ? b.matchDay
          : 0;

      return dayA - dayB;
    });

    return NextResponse.json(fixtures, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (request.signal.aborted) {
      return new NextResponse(null, {
        status: 499,
      });
    }

    console.error(
      "FootballSim fixtures proxy error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to connect to the FootballSim backend. Make sure the ASP.NET Core API is running.",
      },
      { status: 502 },
    );
  }
}
