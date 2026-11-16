
import { NextRequest, NextResponse } from "next/server";


const REGISTER_TIMEOUT_MS = 50_000;

type BackendRegisterResponse = {
  message?: string;
  title?: string;
  requiresEmailVerification?: boolean;
  errors?: Record<string, string[]>;
  user?: {
    id: string;
    fullName: string;
    email: string;
    isEmailVerified?: boolean;
  };
};

export async function POST(request: NextRequest) {
  const apiUrl = process.env.FOOTBALLSIM_API_URL;

  if (!apiUrl) {
    console.error(
      "[Auth Register] Missing FOOTBALLSIM_API_URL"
    );

    return NextResponse.json(
      { message: "Registration service is not configured." },
      { status: 500 }
    );
  }

  let body: {
    fullName?: string;
    email?: string;
    password?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  if (
    typeof body?.fullName !== "string" ||
    typeof body?.email !== "string" ||
    typeof body?.password !== "string" ||
    body.fullName.trim().length < 2 ||
    !body.email.trim() ||
    body.password.length < 8
  ) {
    return NextResponse.json(
      {
        message:
          "Please provide a valid full name, email address, and password of at least 8 characters.",
      },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/Auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          fullName: body.fullName.trim(),
          email: body.email.trim().toLowerCase(),
          password: body.password,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(REGISTER_TIMEOUT_MS),
      }
    );

    const result = (await response.json().catch(() => ({}))) as
      BackendRegisterResponse;

    if (!response.ok && response.status >= 500) {
      console.error(
        "[Auth Register] Backend returned status:",
        response.status
      );
    }

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError");

    console.error(
      "[Auth Register] Backend request failed:",
      timedOut ? "Request timed out" : "Connection failed"
    );

    return NextResponse.json(
      {
        message: timedOut
          ? "The registration server is taking longer than expected. Your account may have been created. Please check your email or try signing in before registering again."
          : "Unable to connect to the registration server. Please wait a moment and try again.",
      },
      { status: 503 }
    );
  }
}
