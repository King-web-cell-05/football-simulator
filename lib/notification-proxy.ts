
import { NextRequest, NextResponse } from "next/server";

const apiBase = (
  process.env.FOOTBALLSIM_API_URL ??
  process.env.NEXT_PUBLIC_FOOTBALLSIM_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5295"
).replace(/\/+$/, "");

type NotificationMethod = "GET" | "PATCH" | "DELETE";

export async function notificationProxy(
  request: NextRequest,
  method: NotificationMethod,
  path: string
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
    const response = await fetch(
      `${apiBase}/api/notifications${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    // Handle endpoints that return no response body.
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const raw = await response.text();

    let payload: unknown;

    try {
      payload = raw ? JSON.parse(raw) : {};
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
    console.error("Notifications API error:", error);

    return NextResponse.json(
      { message: "Unable to connect to the backend." },
      { status: 502 }
    );
  }
}
