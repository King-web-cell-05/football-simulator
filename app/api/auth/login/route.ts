
import { NextRequest, NextResponse } from "next/server";


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
    return NextResponse.json(
      { message: "Authentication service is not configured." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/Auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: body.email,
          password: body.password,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
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
              : "Unable to sign in."),
          requiresEmailVerification:
            result.requiresEmailVerification ?? false,
        },
        { status: response.status },
      );
    }

    if (
      !result.accessToken ||
      !result.expiresAtUtc ||
      !result.user?.id
    ) {
      return NextResponse.json(
        { message: "Invalid authentication response." },
        { status: 502 },
      );
    }

    const expiresAt = new Date(result.expiresAtUtc);

    if (
      !Number.isFinite(expiresAt.getTime()) ||
      expiresAt.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { message: "Invalid session expiration." },
        { status: 502 },
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
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the authentication server." },
      { status: 503 },
    );
  }
}
