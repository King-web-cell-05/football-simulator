
import { NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function validateCsrfOrigin(
  request: NextRequest
): NextResponse | null {
  if (SAFE_METHODS.has(request.method)) {
    return null;
  }

  const origin = request.headers.get("origin");

  if (!origin) {
    return NextResponse.json(
      { message: "Missing request origin." },
      { status: 403 }
    );
  }

  const allowedOrigins = (
    process.env.CSRF_ALLOWED_ORIGINS ?? ""
  )
    .split(",")
    .map((value) => normalizeOrigin(value.trim()))
    .filter((value): value is string => Boolean(value));

  const requestOrigin = normalizeOrigin(origin);

  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    return NextResponse.json(
      { message: "Request origin is not allowed." },
      { status: 403 }
    );
  }

  return null;
}
