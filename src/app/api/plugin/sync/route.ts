import { NextRequest, NextResponse } from "next/server";
import { upsertServerStatus, upsertMcStaffStats } from "@/lib/db";

const PLUGIN_API_KEY = process.env.PLUGIN_API_KEY || "luxgenz-plugin-key-2024";

function verifyPluginKey(req: NextRequest): boolean {
  const key = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
  return key === PLUGIN_API_KEY;
}

// POST /api/plugin/sync — heartbeat from the Minecraft plugin (every 30s-60s)
export async function POST(req: NextRequest) {
  if (!verifyPluginKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Update server status
    if (body.server) {
      await upsertServerStatus({
        online_players: body.server.online_players ?? 0,
        max_players: body.server.max_players ?? 0,
        tps: body.server.tps ?? 20.0,
        online_staff: body.server.online_staff ? JSON.stringify(body.server.online_staff) : null,
        staff_in_modmode: body.server.staff_in_modmode ? JSON.stringify(body.server.staff_in_modmode) : null,
        staff_vanished: body.server.staff_vanished ? JSON.stringify(body.server.staff_vanished) : null,
        frozen_players: body.server.frozen_players ? JSON.stringify(body.server.frozen_players) : null,
        panic_mode: body.server.panic_mode ? 1 : 0,
        chat_enabled: body.server.chat_enabled !== false ? 1 : 0,
        uptime_seconds: body.server.uptime_seconds ?? 0,
        server_version: body.server.server_version ?? null,
      });
    }

    // Bulk update staff stats
    if (body.staff_stats && Array.isArray(body.staff_stats)) {
      for (const entry of body.staff_stats) {
        if (entry.username) {
          await upsertMcStaffStats(entry.username, {
            mc_uuid: entry.mc_uuid,
            total_punishments: entry.total_punishments,
            warnings_issued: entry.warnings_issued,
            mutes_issued: entry.mutes_issued,
            bans_issued: entry.bans_issued,
            kicks_issued: entry.kicks_issued,
            reports_handled: entry.reports_handled,
            modmode_time_mins: entry.modmode_time_mins,
            playtime_mins: entry.playtime_mins,
            last_online: entry.last_online,
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Plugin sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
