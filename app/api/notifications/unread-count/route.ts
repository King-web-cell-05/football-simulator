
import { NextRequest } from "next/server";
import { notificationProxy } from "@/lib/notification-proxy";

export async function GET(request: NextRequest) {
  return notificationProxy(
    request,
    "GET",
    "/unread-count"
  );
}
