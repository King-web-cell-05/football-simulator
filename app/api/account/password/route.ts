
import { NextRequest, NextResponse } from "next/server";


const apiBase = (
  process.env.FOOTBALLSIM_API_URL ??
  process.env.NEXT_PUBLIC_FOOTBALLSIM_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5295"
).replace(/\/+$/, "");

export async function PUT(request: NextRequest) {
  const token = request.cookies.get(
    "footballsim_session"
  )?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Please sign in to continue." },
      { status: 401 }
    );
  }

  try {
    const body = await request.text();

    const response = await fetch(
      `${apiBase}/api/Account/password`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    const raw = await response.text();

    let payload: unknown;

    try {
      payload = JSON.parse(raw);
    } catch {
      payload = {
        message: response.ok
          ? "Password updated successfully."
          : "Password update failed.",
      };
    }

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch (error) {
    console.error("Password API connection error:", error);

    return NextResponse.json(
      { message: "Unable to connect to the backend." },
      { status: 502 }
    );
  }
}
