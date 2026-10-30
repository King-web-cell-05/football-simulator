
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type JwtClaims = Record<string, unknown>;

function getClaim(
  claims: JwtClaims,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = claims[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

export async function GET() {
  const token = (await cookies()).get(
    "footballsim_session"
  )?.value;

  const apiUrl = process.env.FOOTBALLSIM_API_URL;

  if (!token) {
    return NextResponse.json(
      { message: "Not signed in." },
      { status: 401 }
    );
  }

  if (!apiUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/Dashboard/summary`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      return NextResponse.json(
        { message: "Session expired." },
        { status: 401 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unable to validate session." },
        { status: 502 }
      );
    }

    const payload = token.split(".")[1];

    if (!payload) {
      throw new Error("Invalid token.");
    }

    // Claims are read only after ASP.NET Core
    // successfully validates the JWT.
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as JwtClaims;

    const id = getClaim(
      claims,
      "nameid",
      "sub",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    );

    const fullName = getClaim(
      claims,
      "unique_name",
      "name",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
    );

    const email = getClaim(
      claims,
      "email",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
    );

    if (!id || !fullName || !email) {
      throw new Error("Missing user claims.");
    }

    return NextResponse.json(
      {
        user: {
          id,
          fullName,
          email,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to check your session." },
      { status: 503 }
    );
  }
}
