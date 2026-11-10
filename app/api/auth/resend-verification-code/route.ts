
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
    typeof payload.email !== "string" ||
    !/^\S+@\S+\.\S+$/.test(payload.email)
  ) {
    return NextResponse.json(
      { message: "Enter a valid email address." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/api/Auth/resend-verification-code`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: payload.email.trim().toLowerCase(),
        }),
        cache: "no-store",
        signal: request.signal,
      }
    );

    const data = await response.json().catch(() => null);

    return NextResponse.json(
      data ?? {
        message: response.ok
          ? "Request received."
          : "Unable to process the request.",
      },
      { status: response.status }
    );
  } catch (error) {
    console.error("Verification resend proxy failed:", error);

    return NextResponse.json(
      { message: "Unable to connect to the backend." },
      { status: 502 }
    );
  }
}
