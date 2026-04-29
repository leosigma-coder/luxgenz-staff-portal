import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createTask,
  getAllTasks,
  getTasksForUser,
  updateTaskStatus,
  updateTask,
  deleteTask,
  createNotification,
  createAuditLog,
  getAllUsers,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine");

  const tasks = mine === "true"
    ? await getTasksForUser(session.userId)
    : await getAllTasks();

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "staff") {
    return NextResponse.json(
      { error: "Only admins and the owner can create tasks" },
      { status: 403 }
    );
  }

  const { title, description, priority, assignedTo, dueDate } = await req.json();
  if (!title || !assignedTo) {
    return NextResponse.json(
      { error: "Title and assigned user are required" },
      { status: 400 }
    );
  }

  await createTask(title, description || null, priority || "normal", assignedTo, session.username, dueDate || null);

  const users = await getAllUsers();
  const assignedUser = users.find((u) => u.id === assignedTo);
  if (assignedUser) {
    await createNotification(
      assignedTo,
      "task",
      "New Task Assigned",
      `"${title}" was assigned to you by ${session.username}`,
      "/dashboard/tasks",
      priority === "critical" ? "critical" : "info"
    );
  }

  await createAuditLog("TASK_CREATE", title, session.username, { assignedTo: assignedUser?.username, priority });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, status, title, description, priority, assignedTo, dueDate } = body;

  if (!id) {
    return NextResponse.json({ error: "Task ID required" }, { status: 400 });
  }

  // Status-only update (anyone can update their own task status)
  if (status && !title) {
    await updateTaskStatus(id, status);
    await createAuditLog("TASK_UPDATE", `Task #${id}`, session.username, { status });
    return NextResponse.json({ success: true });
  }

  // Full update (admin+ only)
  if (session.role === "staff") {
    return NextResponse.json({ error: "Only admins can edit tasks" }, { status: 403 });
  }

  if (title) {
    await updateTask(id, title, description || null, priority || "normal", assignedTo, dueDate || null);
    await createAuditLog("TASK_UPDATE", title, session.username, { assignedTo, priority });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "No action" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "staff") {
    return NextResponse.json(
      { error: "Only admins and the owner can delete tasks" },
      { status: 403 }
    );
  }

  const { id } = await req.json();
  await deleteTask(id);
  await createAuditLog("TASK_DELETE", `Task #${id}`, session.username);
  return NextResponse.json({ success: true });
}
