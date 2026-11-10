
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL =
  process.env.FOOTBALLSIM_API_URL ??
  "http://localhost:5295";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("footballsim_session")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/api/Teams`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Failed to fetch teams:", error);

    return NextResponse.json(
      { message: "Unable to connect to the Teams API." },
      { status: 500 }
    );
  }
}
