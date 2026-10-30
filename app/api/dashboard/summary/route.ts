
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


export async function GET() {
  const token = (await cookies()).get(
    "footballsim_session"
  )?.value;

  const apiUrl = process.env.FOOTBALLSIM_API_URL;

  if (!token) {
    return NextResponse.json(
      { message: "Not signed in." },
      { status: 401 }
    );
  }

  if (!apiUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/Dashboard/summary`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    const result = await response
      .json()
      .catch(() => ({
        message: "Unexpected backend response.",
      }));

    return NextResponse.json(result, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "Unable to connect to FootballSim API.",
      },
      { status: 503 }
    );
  }
}
