import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createUpdate, getAllUpdates, deleteUpdate, publishUpdate, createNotificationForAll, createAuditLog } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const updates = await getAllUpdates();
  return NextResponse.json({ updates });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can post updates" },
      { status: 403 }
    );
  }

  const { title, content, category, priority, version, status } = await req.json();
  if (!title || !content) {
    return NextResponse.json(
      { error: "Title and content are required" },
      { status: 400 }
    );
  }

  const isDraft = status === "draft";
  await createUpdate(
    title,
    content,
    category || "general",
    priority || "normal",
    version || null,
    session.username,
    isDraft ? "draft" : "published"
  );
  await createAuditLog("UPDATE_CREATE", title, session.username, { status: isDraft ? "draft" : "published" });
  if (!isDraft) {
    await createNotificationForAll("update", "New Update", title, "/dashboard/updates");
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can publish updates" },
      { status: 403 }
    );
  }

  const { id } = await req.json();
  await publishUpdate(id);
  await createAuditLog("UPDATE_PUBLISH", `Update #${id}`, session.username);
  await createNotificationForAll("update", "New Update", "A new update has been published", "/dashboard/updates");
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can delete updates" },
      { status: 403 }
    );
  }

  const { id } = await req.json();
  await deleteUpdate(id);
  await createAuditLog("UPDATE_DELETE", `Update #${id}`, session.username);
  return NextResponse.json({ success: true });
}
