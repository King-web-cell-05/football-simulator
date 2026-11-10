
import { NextRequest, NextResponse } from "next/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getBackendUrl() {
  const baseUrl = process.env.FOOTBALLSIM_API_URL;

  return baseUrl
    ? `${baseUrl.replace(/\/+$/, "")}/api/CompetitionTeams`
    : null;
}

function getSession(request: NextRequest) {
  return request.cookies.get("footballsim_session")?.value;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

async function forwardResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(
    data ?? {
      message: response.ok
        ? "Request completed."
        : "Competition teams request failed.",
    },
    { status: response.status }
  );
}

// GET /api/competition-teams?competitionId=...
export async function GET(request: NextRequest) {
  const token = getSession(request);
  if (!token) return errorResponse("Please sign in again.", 401);

  const baseUrl = getBackendUrl();
  if (!baseUrl) return errorResponse("Backend API is not configured.", 500);

  const competitionId =
    request.nextUrl.searchParams.get("competitionId");

  if (!competitionId || !UUID_PATTERN.test(competitionId)) {
    return errorResponse("A valid competition ID is required.", 400);
  }

  try {
    const response = await fetch(
      `${baseUrl}/${competitionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: request.signal,
      }
    );

    return forwardResponse(response);
  } catch (error) {
    console.error("Competition teams GET failed:", error);
    return errorResponse("Unable to connect to the backend.", 502);
  }
}

// POST /api/competition-teams
export async function POST(request: NextRequest) {
  const token = getSession(request);
  if (!token) return errorResponse("Please sign in again.", 401);

  const baseUrl = getBackendUrl();
  if (!baseUrl) return errorResponse("Backend API is not configured.", 500);

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("competitionId" in payload) ||
    !("teamId" in payload) ||
    typeof payload.competitionId !== "string" ||
    typeof payload.teamId !== "string" ||
    !UUID_PATTERN.test(payload.competitionId) ||
    !UUID_PATTERN.test(payload.teamId)
  ) {
    return errorResponse(
      "Valid competition and team IDs are required.",
      400
    );
  }

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        competitionId: payload.competitionId,
        teamId: payload.teamId,
      }),
      cache: "no-store",
      signal: request.signal,
    });

    return forwardResponse(response);
  } catch (error) {
    console.error("Competition teams POST failed:", error);
    return errorResponse("Unable to connect to the backend.", 502);
  }
}

// DELETE /api/competition-teams?competitionId=...&teamId=...
export async function DELETE(request: NextRequest) {
  const token = getSession(request);
  if (!token) return errorResponse("Please sign in again.", 401);

  const baseUrl = getBackendUrl();
  if (!baseUrl) return errorResponse("Backend API is not configured.", 500);

  const competitionId =
    request.nextUrl.searchParams.get("competitionId");
  const teamId =
    request.nextUrl.searchParams.get("teamId");

  if (
    !competitionId ||
    !teamId ||
    !UUID_PATTERN.test(competitionId) ||
    !UUID_PATTERN.test(teamId)
  ) {
    return errorResponse(
      "Valid competition and team IDs are required.",
      400
    );
  }

  const query = new URLSearchParams({ competitionId, teamId });

  try {
    const response = await fetch(`${baseUrl}?${query}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: request.signal,
    });

    return forwardResponse(response);
  } catch (error) {
    console.error("Competition teams DELETE failed:", error);
    return errorResponse("Unable to connect to the backend.", 502);
  }
}
