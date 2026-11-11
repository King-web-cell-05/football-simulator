
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = (await cookies()).get(
    "footballsim_session"
  )?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized." },
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

  const { searchParams } = request.nextUrl;

  const params = new URLSearchParams();

  for (const key of ["search", "page", "pageSize"]) {
    const value = searchParams.get(key);

    if (value !== null) {
      params.set(key, value);
    }
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/admin/competitions?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            response.status === 403
              ? "Administrator access required."
              : response.status === 401
                ? "Your session has expired."
                : "Unable to load competitions.",
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the backend." },
      { status: 502 }
    );
  }
}
