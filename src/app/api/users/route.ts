import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createUser,
  getAllUsers,
  deleteUser,
  resetPassword,
  updateStaffRole,
  generateTempPassword,
  createNotificationForAll,
  createAuditLog,
  getUserById,
  STAFF_ROLES,
} from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await getAllUsers();

  const users = allUsers.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    staff_role: u.staff_role,
    created_by: u.created_by,
    created_at: u.created_at,
    last_password_reset: u.last_password_reset,
  }));

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { username, staffRole, useGenerated } = body;
  let password = body.password;

  if (!username || !staffRole) {
    return NextResponse.json(
      { error: "Username and role are required" },
      { status: 400 }
    );
  }

  const roleInfo = STAFF_ROLES.find((r) => r.value === staffRole);
  if (!roleInfo || staffRole === "owner") {
    return NextResponse.json(
      { error: "Invalid role selected" },
      { status: 400 }
    );
  }

  if (roleInfo.level === "admin" && session.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can create admin-level accounts" },
      { status: 403 }
    );
  }

  if (session.role === "staff") {
    return NextResponse.json(
      { error: "Staff cannot create accounts" },
      { status: 403 }
    );
  }

  if (useGenerated || !password) {
    password = generateTempPassword();
  }

  const result = await createUser(username, password, staffRole, session.username);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await createAuditLog("USER_CREATE", username, session.username, { staffRole });
  return NextResponse.json({ success: true, tempPassword: password });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can delete accounts" },
      { status: 403 }
    );
  }

  const { userId } = await req.json();
  const targetUser = await getUserById(userId);
  const result = await deleteUser(userId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await createAuditLog("USER_DELETE", targetUser?.username || `User #${userId}`, session.username);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can perform this action" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { userId, newPassword, staffRole, generatePassword } = body;

  if (staffRole) {
    const roleInfo = STAFF_ROLES.find((r) => r.value === staffRole);
    if (!roleInfo || staffRole === "owner") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const targetUser = await getUserById(userId);
    const result = await updateStaffRole(userId, staffRole);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await createAuditLog("ROLE_CHANGE", targetUser?.username || `User #${userId}`, session.username, { newRole: staffRole });
    return NextResponse.json({ success: true });
  }

  if (newPassword || generatePassword) {
    const pw = generatePassword ? generateTempPassword() : newPassword;
    const targetUser = await getUserById(userId);
    const result = await resetPassword(userId, pw);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await createAuditLog("PASSWORD_RESET", targetUser?.username || `User #${userId}`, session.username);
    return NextResponse.json({ success: true, tempPassword: pw });
  }

  return NextResponse.json({ error: "No action specified" }, { status: 400 });
}
