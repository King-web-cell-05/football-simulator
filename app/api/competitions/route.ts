import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("footballsim_session")?.value;
  if (!token) {
    return NextResponse.json({ message: "Please sign in again." }, { status: 401 });
  }

  const baseUrl = process.env.FOOTBALLSIM_API_URL;
  if (!baseUrl) {
    return NextResponse.json({ message: "FOOTBALLSIM_API_URL is not configured." }, { status: 500 });
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/Competition`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: request.signal,
    });
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : null;
    if (!response.ok) {
      return NextResponse.json(
        { message: (body && typeof body.message === "string" && body.message) || `Competition API returned HTTP ${response.status}.` },
        { status: response.status }
      );
    }
    if (!Array.isArray(body)) {
      return NextResponse.json({ message: "Competition API returned an unexpected response." }, { status: 502 });
    }
    return NextResponse.json(body);
  } catch (error) {
    console.error("Competition proxy failed:", error);
    return NextResponse.json({ message: "Unable to connect to FootballSim backend." }, { status: 502 });
  }
}