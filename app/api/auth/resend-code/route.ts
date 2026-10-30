
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
      `${apiUrl.replace(/\/+$/, "")}/api/Auth/resend-verification-code`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: body.email,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      },
    );

    const result = await response.json().catch(() => ({}));

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to process the resend request." },
      { status: 503 },
    );
  }
}
