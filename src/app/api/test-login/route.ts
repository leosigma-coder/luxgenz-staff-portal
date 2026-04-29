import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/db";

export async function GET() {
  try {
    console.log("Test login: Starting authentication test");
    const user = await authenticateUser("Luxgenz", "R3bound");
    console.log("Test login: Authentication result:", user ? "User found" : "User not found");
    
    return NextResponse.json({
      success: true,
      userFound: !!user,
      username: user?.username,
      role: user?.role,
    });
  } catch (error) {
    console.error("Test login error:", error);
    return NextResponse.json({
      error: "Authentication test failed",
      details: String(error),
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
