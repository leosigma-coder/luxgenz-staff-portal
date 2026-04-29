import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAuditLogs, getAuditLogCount, AUDIT_ACTIONS, getAllUsers } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "staff") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || undefined;
  const user = searchParams.get("user") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;
  const offset = (page - 1) * limit;

  const logs = await getAuditLogs(limit, offset, action, user);
  const total = await getAuditLogCount(action, user);
  const allUsers = await getAllUsers();
  const users = allUsers.map((u) => u.username);

  return NextResponse.json({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    actions: AUDIT_ACTIONS,
    users,
  });
}
