import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, updateLastLogin, createAuditLog } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    await updateLastLogin(user.id);
    await createAuditLog("LOGIN", user.username, user.username);

    const token = await createSession({
      userId: user.id,
      username: user.username,
      role: user.role,
      staffRole: user.staff_role,
    });

    const response = NextResponse.json({
      success: true,
      user: { username: user.username, role: user.role, staffRole: user.staff_role },
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
