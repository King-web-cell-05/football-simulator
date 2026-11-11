
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";



export async function GET(request: NextRequest) {
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

  const incoming = request.nextUrl.searchParams;
  const params = new URLSearchParams();

  // Forward only supported query parameters.
  for (const key of [
    "page",
    "pageSize",
    "search",
    "status",
  ]) {
    const value = incoming.get(key);

    if (value !== null) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  const url =
    `${apiUrl.replace(/\/+$/, "")}/api/admin/users` +
    (query ? `?${query}` : "");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (response.status === 401) {
      return NextResponse.json(
        { message: "Session expired." },
        { status: 401 }
      );
    }

    if (response.status === 403) {
      return NextResponse.json(
        { message: "Administrator access required." },
        { status: 403 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unable to load users." },
        { status: 502 }
      );
    }

    const data: unknown = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "User service is unavailable." },
      { status: 503 }
    );
  }
}
