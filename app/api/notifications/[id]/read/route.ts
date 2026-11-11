
import { NextRequest } from "next/server";
import { notificationProxy } from "@/lib/notification-proxy";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return Response.json(
      { message: "Invalid notification ID." },
      { status: 400 }
    );
  }

  return notificationProxy(
    request,
    "PATCH",
    `/${id}/read`
  );
}
