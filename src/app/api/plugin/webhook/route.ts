import { NextRequest, NextResponse } from "next/server";
import {
  createPluginEvent,
  createMcPunishment,
  deactivateMcPunishment,
  createMcReport,
  createMcCase,
  updateMcCase,
  upsertMcStaffStats,
  handleMcReport,
} from "@/lib/db";

const PLUGIN_API_KEY = process.env.PLUGIN_API_KEY || "luxgenz-plugin-key-2024";

function verifyPluginKey(req: NextRequest): boolean {
  const key = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
  return key === PLUGIN_API_KEY;
}

// POST /api/plugin/webhook — receive events from the Minecraft plugin
export async function POST(req: NextRequest) {
  if (!verifyPluginKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type) {
      return NextResponse.json({ error: "Missing event type" }, { status: 400 });
    }

    switch (type) {
      case "PUNISHMENT": {
        const { punishment_type, player, player_uuid, issued_by, reason, duration, expires_at } = data;
        await createMcPunishment(punishment_type, player, issued_by, reason, duration, player_uuid, expires_at);
        await createPluginEvent("PUNISHMENT", issued_by, player, reason, duration, { punishment_type, player_uuid }, data.server);
        break;
      }

      case "UNPUNISHMENT": {
        const { punishment_type, player, issued_by } = data;
        await deactivateMcPunishment(player, punishment_type);
        await createPluginEvent("UNPUNISHMENT", issued_by, player, undefined, undefined, { punishment_type }, data.server);
        break;
      }

      case "REPORT": {
        const { reporter, target, reason, server, world } = data;
        await createMcReport(reporter, target, reason, server, world);
        await createPluginEvent("REPORT", reporter, target, reason, undefined, { server, world }, server);
        break;
      }

      case "REPORT_HANDLED": {
        const { report_id, handled_by } = data;
        await handleMcReport(report_id, handled_by);
        await createPluginEvent("REPORT_HANDLED", handled_by, undefined, undefined, undefined, { report_id }, data.server);
        break;
      }

      case "CASE_CREATE": {
        const { case_id, player, player_uuid, offense, created_by } = data;
        await createMcCase(case_id, player, offense, created_by, player_uuid);
        await createPluginEvent("CASE_CREATE", created_by, player, offense, undefined, { case_id }, data.server);
        break;
      }

      case "CASE_UPDATE": {
        const { case_id, status, assigned_to, notes, evidence } = data;
        await updateMcCase(case_id, { status, assigned_to, notes, evidence });
        await createPluginEvent("CASE_UPDATE", data.updated_by, undefined, undefined, undefined, { case_id, status }, data.server);
        break;
      }

      case "STAFF_STATS": {
        const { username, stats } = data;
        await upsertMcStaffStats(username, stats);
        break;
      }

      case "MODMODE_ENABLE":
      case "MODMODE_DISABLE":
      case "VANISH_ENABLE":
      case "VANISH_DISABLE":
      case "FREEZE":
      case "UNFREEZE":
      case "STAFF_CHAT":
      case "COMMAND_SPY":
      case "SCREENSHARE":
      case "STAFF_JOIN":
      case "STAFF_LEAVE":
      case "PANIC_ENABLE":
      case "PANIC_DISABLE":
      case "CHAT_TOGGLE":
      case "CLEAR_CHAT":
      case "CLEARLAG":
      case "WATCHLIST_ADD":
      case "WATCHLIST_REMOVE":
      case "PLAYER_JOIN":
      case "PLAYER_LEAVE": {
        await createPluginEvent(type, data.actor, data.target, data.reason, data.duration, data.metadata, data.server);
        break;
      }

      default: {
        await createPluginEvent(type, data.actor, data.target, data.reason, data.duration, data.metadata, data.server);
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Plugin webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
