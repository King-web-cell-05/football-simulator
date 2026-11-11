
import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

export async function GET(request: NextRequest) {
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

  const params = new URLSearchParams();

  for (const key of [
    "type",
    "days",
    "page",
    "pageSize",
  ]) {
    const value = request.nextUrl.searchParams.get(key);

    if (value !== null) {
      params.set(key, value);
    }
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/admin/activity?${params.toString()}`,
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
      const message =
        response.status === 401
          ? "Your session has expired."
          : response.status === 403
            ? "Administrator access required."
            : response.status === 400
              ? "Invalid activity filters."
              : "Unable to load platform activity.";

      return NextResponse.json(
        { message },
        { status: response.status }
      );
    }

    return NextResponse.json(
      await response.json(),
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
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
