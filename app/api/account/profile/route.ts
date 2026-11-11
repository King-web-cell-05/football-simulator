
import { NextRequest, NextResponse } from "next/server";


const apiBase = (
  process.env.FOOTBALLSIM_API_URL ??
  process.env.NEXT_PUBLIC_FOOTBALLSIM_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5295"
).replace(/\/+$/, "");

async function forwardRequest(
  request: NextRequest,
  method: "GET" | "PUT"
) {
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
    const body =
      method === "PUT" ? await request.text() : undefined;

    const response = await fetch(
      `${apiBase}/api/Account/profile`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(method === "PUT"
            ? { "Content-Type": "application/json" }
            : {}),
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
          ? "Request completed."
          : "The backend returned an error.",
      };
    }

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch (error) {
    console.error("Account profile API error:", error);

    return NextResponse.json(
      { message: "Unable to connect to the backend." },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  return forwardRequest(request, "GET");
}

export async function PUT(request: NextRequest) {
  return forwardRequest(request, "PUT");
}
