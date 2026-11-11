
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


export async function GET() {
  const token = (await cookies()).get(
    "footballsim_session"
  )?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 }
    );
  }

  const apiUrl = process.env.FOOTBALLSIM_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/admin/dashboard/overview`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (response.status === 401) {
      return NextResponse.json(
        { message: "Session expired or invalid." },
        { status: 401 }
      );
    }

    if (response.status === 403) {
      return NextResponse.json(
        { message: "Access denied." },
        { status: 403 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unable to verify administrator access." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        isAdmin: true,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { message: "Administrator verification unavailable." },
      { status: 503 }
    );
  }
}
