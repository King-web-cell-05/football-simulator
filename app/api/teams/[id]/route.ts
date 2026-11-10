
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// ==========================================
// FOOTBALLSIM BACKEND CONFIGURATION
// ==========================================

const API_URL = (
  process.env.FOOTBALLSIM_API_URL ??
  "http://localhost:5295"
).replace(/\/$/, "");

// ==========================================
// TYPES
// ==========================================

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type TeamUpdateRequest = {
  name: string;
  country: string;
  coefficient: number;
  logoUrl: string | null;
};

// ==========================================
// AUTHENTICATION
// ==========================================

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();

  return (
    cookieStore.get("footballsim_session")?.value ??
    null
  );
}

// ==========================================
// READ BACKEND RESPONSE
// ==========================================

async function readResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

// ==========================================
// VALIDATE TEAM ID
// ==========================================

function isValidGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

// ==========================================
// GET SINGLE TEAM
// GET /api/teams/{id}
// ==========================================

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!isValidGuid(id)) {
      return NextResponse.json(
        {
          message: "Invalid team ID.",
        },
        { status: 400 }
      );
    }

    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        {
          message: "Unauthorized. Please sign in.",
        },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${API_URL}/api/Teams/${id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await readResponse(response);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("GET team error:", error);

    return NextResponse.json(
      {
        message: "Unable to load team information.",
      },
      { status: 502 }
    );
  }
}

// ==========================================
// UPDATE EXISTING TEAM
// PUT /api/teams/{id}
// ==========================================

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Validate team ID
    if (!isValidGuid(id)) {
      return NextResponse.json(
        {
          message: "Invalid team ID.",
        },
        { status: 400 }
      );
    }

    // Check authentication
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        {
          message: "Unauthorized. Please sign in.",
        },
        { status: 401 }
      );
    }

    // Read request body
    let body: Partial<TeamUpdateRequest>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          message: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    // Validate fields
    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const country =
      typeof body.country === "string"
        ? body.country.trim()
        : "";

    const coefficient = Number(body.coefficient);

    const logoUrl =
      typeof body.logoUrl === "string" &&
      body.logoUrl.trim()
        ? body.logoUrl.trim()
        : null;

    if (!name || !country) {
      return NextResponse.json(
        {
          message: "Team name and country are required.",
        },
        { status: 400 }
      );
    }

    if (name.length > 100 || country.length > 80) {
      return NextResponse.json(
        {
          message: "Team name or country is too long.",
        },
        { status: 400 }
      );
    }

    if (
      body.coefficient === null ||
      body.coefficient === undefined ||
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

    // Validate optional logo URL
    if (logoUrl) {
      const isUploadedLogo =
        /^\/uploads\/team-logos\/[a-zA-Z0-9._-]+$/.test(
          logoUrl
        );

      let isHttpsUrl = false;

      try {
        const parsed = new URL(logoUrl);

        isHttpsUrl =
          parsed.protocol === "https:";
      } catch {
        isHttpsUrl = false;
      }

      if (!isUploadedLogo && !isHttpsUrl) {
        return NextResponse.json(
          {
            message:
              "Logo must be an HTTPS URL or an uploaded team logo path.",
          },
          { status: 400 }
        );
      }
    }

    // Prepare request for ASP.NET Core
    const payload: TeamUpdateRequest = {
      name,
      country,
      coefficient,
      logoUrl,
    };

    // Forward update to backend
    const response = await fetch(
      `${API_URL}/api/Teams/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const data = await readResponse(response);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("PUT team error:", error);

    return NextResponse.json(
      {
        message: "Unable to update team information.",
      },
      { status: 502 }
    );
  }
}
