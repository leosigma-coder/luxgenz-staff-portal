import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/db";

// GET /api/plugin/stats — dashboard overview data (authenticated staff only)
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
