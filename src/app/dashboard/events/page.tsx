"use client";

import { useEffect, useState, useCallback } from "react";

interface Rsvp {
  user_id: number;
  username: string;
  status: "attending" | "not_attending";
}

interface EventItem {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_time: string | null;
  event_type: string;
  author: string;
  created_at: string;
  rsvps: Rsvp[];
}

interface Session {
  userId: number;
  role: "owner" | "admin" | "staff";
  username: string;
}

const EVENT_TYPES = [
  { value: "general", label: "General" },
  { value: "tournament", label: "Tournament" },
  { value: "meeting", label: "Meeting" },
  { value: "training", label: "Training" },
  { value: "maintenance", label: "Maintenance" },
];

const TYPE_COLORS: Record<string, string> = {
  general: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  tournament: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  meeting: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  training: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  maintenance: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export default function EventsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [success, setSuccess] = useState("");

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/events");
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
    }
  }, []);

  useEffect(() => {
    async function loadSession() {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setSession(data.user);
      }
    }
    loadSession();
  }, []);

  useEffect(() => {
    if (session) fetchEvents();
  }, [session, fetchEvents]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this event?")) return;
    const res = await fetch("/api/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setSuccess("Event deleted");
      fetchEvents();
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleRsvp = async (eventId: number, status: "attending" | "not_attending") => {
    await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, status }),
    });
    fetchEvents();
  };

  if (!session) return null;

  const now = new Date();

  const upcoming = events.filter(
    (e) => new Date(e.event_date) >= new Date(now.toISOString().split("T")[0])
  );
  const past = events.filter(
    (e) => new Date(e.event_date) < new Date(now.toISOString().split("T")[0])
  );

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Events</h1>
          <p className="mt-1 text-sm text-slate-400">
            Upcoming and past events
          </p>
        </div>
        {session.role === "owner" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500"
          >
            + Create Event
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {events.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <p className="text-slate-400">No events scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-violet-400">
                Upcoming
              </h2>
              <div className="space-y-3">
                {upcoming.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    session={session}
                    onDelete={handleDelete}
                    onRsvp={handleRsvp}
                  />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Past
              </h2>
              <div className="space-y-3 opacity-60">
                {past.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    session={session}
                    onDelete={handleDelete}
                    onRsvp={handleRsvp}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchEvents();
            setShowCreateModal(false);
            setSuccess("Event created successfully");
            setTimeout(() => setSuccess(""), 3000);
          }}
        />
      )}
    </>
  );
}

function EventCard({
  event,
  session,
  onDelete,
  onRsvp,
}: {
  event: EventItem;
  session: Session;
  onDelete: (id: number) => void;
  onRsvp: (eventId: number, status: "attending" | "not_attending") => void;
}) {
  const date = new Date(event.event_date + "T00:00:00");
  const monthShort = date.toLocaleDateString(undefined, { month: "short" });
  const day = date.getDate();
  const typeLabel = EVENT_TYPES.find((t) => t.value === event.event_type)?.label || "General";
  const typeColor = TYPE_COLORS[event.event_type] || TYPE_COLORS.general;
  const myRsvp = event.rsvps.find((r) => r.user_id === session.userId);
  const attending = event.rsvps.filter((r) => r.status === "attending");

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 shadow-lg backdrop-blur-sm">
      <div className="flex gap-4">
        {/* Date badge */}
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30">
          <span className="text-[10px] font-semibold uppercase text-violet-400">
            {monthShort}
          </span>
          <span className="text-lg font-bold leading-none text-white">
            {day}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeColor}`}>
                  {typeLabel}
                </span>
              </div>
              <h3 className="font-semibold text-white">{event.title}</h3>
              {event.event_time && (
                <p className="text-xs text-violet-400">{event.event_time}</p>
              )}
            </div>
            {session.role === "owner" && (
              <button
                onClick={() => onDelete(event.id)}
                className="shrink-0 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
              >
                Delete
              </button>
            )}
          </div>
          <p className="mt-1.5 text-sm text-slate-400">{event.description}</p>
          <p className="mt-2 text-xs text-slate-600">Created by {event.author}</p>
        </div>
      </div>

      {/* RSVP Section */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 border-t border-slate-700/30 pt-4">
        <div className="flex gap-2">
          <button
            onClick={() => onRsvp(event.id, "attending")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              myRsvp?.status === "attending"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "border border-slate-600/50 text-slate-400 hover:bg-slate-700/50"
            }`}
          >
            Attending
          </button>
          <button
            onClick={() => onRsvp(event.id, "not_attending")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              myRsvp?.status === "not_attending"
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "border border-slate-600/50 text-slate-400 hover:bg-slate-700/50"
            }`}
          >
            Not Attending
          </button>
        </div>
        {attending.length > 0 && (
          <p className="text-xs text-slate-500">
            {attending.map((r) => r.username).join(", ")} attending
          </p>
        )}
      </div>
    </div>
  );
}

function CreateEventModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventType, setEventType] = useState("general");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          eventDate,
          eventTime: eventTime || null,
          eventType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Create Event
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Event title"
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Event Type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
              placeholder="What's this event about?"
              required
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Date
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 [color-scheme:dark]"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Time (optional)
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-600/50 bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
