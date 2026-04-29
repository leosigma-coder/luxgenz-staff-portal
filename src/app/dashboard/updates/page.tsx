"use client";

import { useEffect, useState, useCallback } from "react";

interface Update {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: string;
  version: string | null;
  status: string;
  author: string;
  created_at: string;
}

const CATEGORIES = [
  { value: "general", label: "General", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  { value: "feature", label: "New Feature", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  { value: "bugfix", label: "Bug Fix", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "improvement", label: "Improvement", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "announcement", label: "Announcement", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "maintenance", label: "Maintenance", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-slate-500" },
  { value: "normal", label: "Normal", color: "text-blue-400" },
  { value: "high", label: "High", color: "text-amber-400" },
  { value: "critical", label: "Critical", color: "text-red-400" },
];

function getCategoryInfo(value: string) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[0];
}

function getPriorityInfo(value: string) {
  return PRIORITIES.find((p) => p.value === value) || PRIORITIES[1];
}

interface Session {
  role: "owner" | "admin" | "staff";
  username: string;
}

export default function UpdatesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [success, setSuccess] = useState("");

  const fetchUpdates = useCallback(async () => {
    const res = await fetch("/api/updates");
    if (res.ok) {
      const data = await res.json();
      setUpdates(data.updates);
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
    if (session) fetchUpdates();
  }, [session, fetchUpdates]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this update?")) return;
    const res = await fetch("/api/updates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setSuccess("Update deleted");
      fetchUpdates();
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handlePublish = async (id: number) => {
    const res = await fetch("/api/updates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setSuccess("Update published");
      fetchUpdates();
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  if (!session) return null;

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Updates</h1>
          <p className="mt-1 text-sm text-slate-400">
            Announcements and changelog
          </p>
        </div>
        {session.role === "owner" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500"
          >
            + Post Update
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* Updates List */}
      {updates.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p className="text-slate-400">No updates posted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <div
              key={update.id}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 shadow-lg backdrop-blur-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getCategoryInfo(update.category).color}`}>
                      {getCategoryInfo(update.category).label}
                    </span>
                    {update.status === "draft" && (
                      <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                        Draft
                      </span>
                    )}
                    {update.priority !== "normal" && (
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${getPriorityInfo(update.priority).color}`}>
                        {getPriorityInfo(update.priority).label} Priority
                      </span>
                    )}
                    {update.version && (
                      <span className="rounded-md bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                        v{update.version}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    {update.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    by {update.author} &middot;{" "}
                    {new Date(update.created_at + "Z").toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {session.role === "owner" && (
                  <div className="flex shrink-0 gap-2">
                    {update.status === "draft" && (
                      <button
                        onClick={() => handlePublish(update.id)}
                        className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(update.id)}
                      className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {update.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create Update Modal */}
      {showCreateModal && (
        <CreateUpdateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchUpdates();
            setShowCreateModal(false);
            setSuccess("Update posted successfully");
            setTimeout(() => setSuccess(""), 3000);
          }}
        />
      )}
    </>
  );
}

function CreateUpdateModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [version, setVersion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveDraft, setSaveDraft] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category, priority, version: version || null, status: saveDraft ? "draft" : "published" }),
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
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Post Update
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
              placeholder="Update title"
              required
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Version <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              placeholder="e.g. 1.0.0"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
              placeholder="Write your update here..."
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-600/50 bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={() => setSaveDraft(true)}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50"
            >
              {loading && saveDraft ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={() => setSaveDraft(false)}
              className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
            >
              {loading && !saveDraft ? "Posting..." : "Post Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
