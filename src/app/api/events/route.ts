import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createEvent,
  getAllEvents,
  deleteEvent,
  setRsvp,
  getRsvpsForEvent,
  createNotificationForAll,
  createAuditLog,
} from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const events = await getAllEvents();
  const eventsWithRsvps = [];
  for (const e of events) {
    eventsWithRsvps.push({ ...e, rsvps: await getRsvpsForEvent(e.id) });
  }
  return NextResponse.json({ events: eventsWithRsvps });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can create events" },
      { status: 403 }
    );
  }

  const { title, description, eventDate, eventTime, eventType } = await req.json();
  if (!title || !description || !eventDate) {
    return NextResponse.json(
      { error: "Title, description, and date are required" },
      { status: 400 }
    );
  }

  await createEvent(title, description, eventDate, eventTime || null, eventType || "general", session.username);
  await createAuditLog("EVENT_CREATE", title, session.username, { eventType, eventDate });
  await createNotificationForAll("event", "New Event", `${title} on ${eventDate}`, "/dashboard/events");
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, status } = await req.json();
  if (!eventId || !status || !["attending", "not_attending"].includes(status)) {
    return NextResponse.json({ error: "Invalid RSVP" }, { status: 400 });
  }

  await setRsvp(eventId, session.userId, status);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can delete events" },
      { status: 403 }
    );
  }

  const { id } = await req.json();
  await deleteEvent(id);
  await createAuditLog("EVENT_DELETE", `Event #${id}`, session.username);
  return NextResponse.json({ success: true });
}
