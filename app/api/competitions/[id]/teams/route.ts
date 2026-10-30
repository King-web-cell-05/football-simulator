
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

const guid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  const { id } = await params;

  if (!guid.test(id)) {
    return NextResponse.json(
      { message: "Invalid competition ID." },
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

  const baseUrl = process.env.FOOTBALLSIM_API_URL;

  if (!baseUrl) {
    return NextResponse.json(
      {
        message: "FOOTBALLSIM_API_URL is not configured.",
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/api/CompetitionTeams/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: request.signal,
      }
    );

    const data: unknown = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      const message =
        data &&
        typeof data === "object" &&
        "message" in data &&
        typeof data.message === "string"
          ? data.message
          : `Teams API returned HTTP ${response.status}.`;

      return NextResponse.json(
        { message },
        { status: response.status }
      );
    }

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { message: "Unexpected teams API response." },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Competition teams proxy failed:",
      error
    );

    return NextResponse.json(
      {
        message: "Unable to connect to FootballSim backend.",
      },
      { status: 502 }
    );
  }
}
