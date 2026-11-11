
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("footballsim_session")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Please sign in again." },
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

  let body: {
    currentPassword?: unknown;
    newPassword?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  if (
    typeof body?.currentPassword !== "string" ||
    typeof body?.newPassword !== "string"
  ) {
    return NextResponse.json(
      { message: "Both password fields are required." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/admin/settings/password`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    const payload = await response.json().catch(() => ({
      message: "Unexpected server response.",
    }));

    const result = NextResponse.json(payload, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });

    if (response.ok) {
      result.cookies.set("footballsim_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }

    return result;
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the backend." },
      { status: 502 }
    );
  }
}
