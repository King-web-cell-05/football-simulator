
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.FOOTBALLSIM_API_URL ??
  "http://localhost:5295";

type RouteContext = {
  params: Promise<{
    id: string;
    segments: string[];
  }>;
};

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROUNDS = [
  "playoffs",
  "round-of-16",
  "quarter-finals",
  "semi-finals",
  "final",
] as const;

const ACTIONS = [
  "draw",
  "simulate-first-legs",
  "simulate-second-legs",
  "simulate",
] as const;

function isValidPath(segments: string[], method: "GET" | "POST") {
  if (segments.length === 1) {
    return method === "GET" &&
      (ROUNDS.includes(segments[0] as typeof ROUNDS[number]) ||
        segments[0] === "champion");
  }

  if (segments.length !== 2) return false;

  const [round, action] = segments;

  if (!ROUNDS.includes(round as typeof ROUNDS[number])) {
    return false;
  }

  if (method === "GET") {
    return round !== "final" && action === "winners";
  }

  if (!ACTIONS.includes(action as typeof ACTIONS[number])) {
    return false;
  }

  if (round === "final") {
    return action === "draw" || action === "simulate";
  }

  return action !== "simulate";
}

async function forward(
  request: NextRequest,
  context: RouteContext,
  method: "GET" | "POST"
) {
  const { id, segments } = await context.params;

  if (!GUID_REGEX.test(id)) {
    return NextResponse.json(
      { message: "Invalid competition ID." },
      { status: 400 }
    );
  }

  if (!isValidPath(segments, method)) {
    return NextResponse.json(
      { message: "Invalid knockout endpoint." },
      { status: 404 }
    );
  }

  const token = request.cookies.get(
    "footballsim_session"
  )?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Please sign in again." },
      { status: 401 }
    );
  }

  const path = segments.join("/");
  const url =
    `${API_URL.replace(/\/$/, "")}/api/Knockout/${id}/${path}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const raw = await response.text();

    let result: unknown = null;

    if (raw) {
      try {
        result = JSON.parse(raw);
      } catch {
        result = { message: raw };
      }
    }

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch (error) {
    console.error("Knockout API error:", error);

    return NextResponse.json(
      {
        message:
          "Unable to connect to the FootballSim backend.",
      },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  return forward(request, context, "GET");
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  return forward(request, context, "POST");
}
