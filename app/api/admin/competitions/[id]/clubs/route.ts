
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const { id } = await context.params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id
    )
  ) {
    return NextResponse.json(
      { message: "Invalid competition ID." },
      { status: 400 }
    );
  }

  const token = (await cookies()).get(
    "footballsim_session"
  )?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Your session has expired." },
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

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/admin/competitions/${id}/clubs`,
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

    if (!response.ok) {
      const message =
        response.status === 401
          ? "Your session has expired."
          : response.status === 403
            ? "Administrator access required."
            : response.status === 404
              ? "Competition not found."
              : "Unable to load participating clubs.";

      return NextResponse.json(
        { message },
        { status: response.status }
      );
    }

    const clubs = await response.json();

    return NextResponse.json(clubs, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "Unable to connect to the FootballSim backend.",
      },
      { status: 502 }
    );
  }
}
