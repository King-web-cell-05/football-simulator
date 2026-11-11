
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.FOOTBALLSIM_API_URL;

async function proxyProfile(
  method: "GET" | "PUT",
  request?: NextRequest
) {
  const token = (await cookies()).get("footballsim_session")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Your session has expired. Please sign in again." },
      { status: 401 }
    );
  }

  if (!API_URL) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = method === "PUT"
      ? JSON.stringify(await request!.json())
      : undefined;

    const response = await fetch(
      `${API_URL.replace(/\/+$/, "")}/api/admin/settings/profile`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    const payload = await response.json().catch(() => ({
      message: "Unexpected server response.",
    }));

    return NextResponse.json(payload, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the backend." },
      { status: 502 }
    );
  }
}

export async function GET() {
  return proxyProfile("GET");
}

export async function PUT(request: NextRequest) {
  return proxyProfile("PUT", request);
}
