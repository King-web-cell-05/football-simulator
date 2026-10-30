
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const apiUrl = process.env.FOOTBALLSIM_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "Authentication service is not configured." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/Auth/verify-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: body.email,
          code: body.code,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );

    const result = await response.json().catch(() => ({}));

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to verify your email right now." },
      { status: 503 },
    );
  }
}
