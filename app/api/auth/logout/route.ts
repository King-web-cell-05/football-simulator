
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    message: "Signed out successfully.",
  });

  response.cookies.set({
    name: "footballsim_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
