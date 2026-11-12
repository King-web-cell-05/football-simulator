
import { NextRequest } from "next/server";
import { notificationProxy } from "@/lib/notification-proxy";

export async function POST(request: NextRequest) {
  return notificationProxy(request, "POST", "/read-all");
}
