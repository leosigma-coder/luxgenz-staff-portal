import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export async function GET() {
  try {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      return NextResponse.json({
        error: "Missing environment variables",
        hasUrl: !!url,
        hasToken: !!authToken,
      });
    }

    const client = createClient({ url, authToken });
    const result = await client.execute("SELECT 1 as test");

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      testResult: result.rows[0],
    });
  } catch (error) {
    return NextResponse.json({
      error: "Database connection failed",
      details: String(error),
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
