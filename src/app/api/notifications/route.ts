import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notifications = await getNotifications(session.userId);
  const unreadCount = await getUnreadCount(session.userId);
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, markAll } = await req.json();

  if (markAll) {
    await markAllNotificationsRead(session.userId);
    return NextResponse.json({ success: true });
  }

  if (id) {
    await markNotificationRead(id, session.userId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "No action" }, { status: 400 });
}
