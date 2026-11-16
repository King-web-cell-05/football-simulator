
import { NextRequest, NextResponse } from "next/server";


const AUTH_TIMEOUT_MS = 50_000;

type BackendLoginResponse = {
  accessToken?: string;
  expiresAtUtc?: string;
  tokenType?: string;
  message?: string;
  requiresEmailVerification?: boolean;
  user?: {
    id: string;
    fullName: string;
    email: string;
    isEmailVerified: boolean;
  };
};

export async function POST(request: NextRequest) {
  const apiUrl = process.env.FOOTBALLSIM_API_URL;

  if (!apiUrl) {
    console.error("[Auth Login] Missing FOOTBALLSIM_API_URL");

    return NextResponse.json(
      { message: "Authentication service is not configured." },
      { status: 500 }
    );
  }

  let body: { email?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  if (
    typeof body?.email !== "string" ||
    typeof body?.password !== "string" ||
    !body.email.trim() ||
    !body.password
  ) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/Auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: body.email.trim().toLowerCase(),
          password: body.password,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
      }
    );

    const result = (await response.json().catch(() => ({}))) as
      BackendLoginResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            result.message ??
            (response.status === 429
              ? "Too many login attempts. Please try again later."
              : response.status >= 500
                ? "Authentication service is temporarily unavailable. Please try again shortly."
                : "Unable to sign in."),
          requiresEmailVerification:
            result.requiresEmailVerification ?? false,
        },
        { status: response.status }
      );
    }

    if (
      !result.accessToken ||
      !result.expiresAtUtc ||
      !result.user?.id
    ) {
      console.error("[Auth Login] Incomplete backend response");

      return NextResponse.json(
        { message: "Invalid authentication response." },
        { status: 502 }
      );
    }

    const expiresAt = new Date(result.expiresAtUtc);

    if (
      !Number.isFinite(expiresAt.getTime()) ||
      expiresAt.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { message: "Invalid session expiration." },
        { status: 502 }
      );
    }

    const nextResponse = NextResponse.json({
      message: "Login successful.",
      user: result.user,
    });

    nextResponse.cookies.set({
      name: "footballsim_session",
      value: result.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return nextResponse;
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError");

    console.error(
      "[Auth Login] Backend request failed:",
      timedOut ? "Request timed out" : "Connection failed"
    );

    return NextResponse.json(
      {
        message: timedOut
          ? "The authentication server is taking longer than expected to respond. Please wait a moment and try again."
          : "Unable to connect to the authentication server. Please try again shortly.",
      },
      { status: 503 }
    );
  }
}
