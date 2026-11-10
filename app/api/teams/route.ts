
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = (
  process.env.FOOTBALLSIM_API_URL ??
  "http://localhost:5295"
).replace(/\/$/, "");

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();

  return (
    cookieStore.get("footballsim_session")?.value ??
    null
  );
}

async function readResponse(response: Response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

// ============================================
// GET ALL TEAMS
// ============================================

export async function GET() {
  try {
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/api/Teams`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await readResponse(response);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("GET teams error:", error);

    return NextResponse.json(
      {
        message: "Unable to connect to the Teams API.",
      },
      { status: 502 }
    );
  }
}

// ============================================
// CREATE A NEW TEAM
// ============================================

export async function POST(request: NextRequest) {
  try {
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const country = String(body.country ?? "").trim();
    const coefficient = Number(body.coefficient);
    const logoUrl = body.logoUrl
      ? String(body.logoUrl).trim()
      : null;

    if (!name || !country) {
      return NextResponse.json(
        {
          message: "Team name and country are required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(coefficient) ||
      coefficient < 0 ||
      coefficient > 200
    ) {
      return NextResponse.json(
        {
          message: "Coefficient must be between 0 and 200.",
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/api/Teams`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        country,
        coefficient,
        logoUrl,
      }),
      cache: "no-store",
    });

    const data = await readResponse(response);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("POST teams error:", error);

    return NextResponse.json(
      {
        message: "Unable to create team.",
      },
      { status: 500 }
    );
  }
}
