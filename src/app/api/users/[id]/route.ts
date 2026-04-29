import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getUserById,
  updateBio,
  getUserTaskStats,
  getUserEventsAttended,
  getUserAuditLogCount,
  getTasksForUser,
  getAuditLogs,
} from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id);
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const taskStats = await getUserTaskStats(userId);
  const eventsAttended = await getUserEventsAttended(userId);
  const activityCount = await getUserAuditLogCount(user.username);
  const recentTasks = (await getTasksForUser(userId)).slice(0, 5);
  const recentActivity = await getAuditLogs(10, 0, undefined, user.username);

  return NextResponse.json({
    user,
    taskStats,
    eventsAttended,
    activityCount,
    recentTasks,
    recentActivity,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  // Only allow editing own bio, or admin+ can edit anyone's
  if (session.userId !== userId && session.role === "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { bio } = await req.json();
  if (typeof bio !== "string") {
    return NextResponse.json({ error: "Bio must be a string" }, { status: 400 });
  }

  await updateBio(userId, bio);
  return NextResponse.json({ success: true });
}
