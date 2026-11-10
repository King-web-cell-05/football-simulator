
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const baseUrl = process.env.FOOTBALLSIM_API_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("email" in payload) ||
    !("code" in payload) ||
    typeof payload.email !== "string" ||
    typeof payload.code !== "string" ||
    !/^\S+@\S+\.\S+$/.test(payload.email) ||
    !/^\d{6}$/.test(payload.code)
  ) {
    return NextResponse.json(
      { message: "Enter a valid email and 6-digit code." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/api/Auth/verify-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: payload.email.trim().toLowerCase(),
          code: payload.code,
        }),
        cache: "no-store",
        signal: request.signal,
      }
    );

    const data = await response.json().catch(() => null);

    return NextResponse.json(
      data ?? {
        message: response.ok
          ? "Email verified successfully."
          : "Unable to verify email.",
      },
      { status: response.status }
    );
  } catch (error) {
    console.error("Email verification proxy failed:", error);

    return NextResponse.json(
      { message: "Unable to verify your email right now." },
      { status: 503 }
    );
  }
}
