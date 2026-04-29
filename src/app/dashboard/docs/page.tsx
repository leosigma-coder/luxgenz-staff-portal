"use client";

import { useEffect, useState, useCallback } from "react";

interface Doc {
  id: number;
  title: string;
  content: string;
  category: string;
  status: string;
  author: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Session {
  userId: number;
  role: "owner" | "admin" | "staff";
  username: string;
}

const DOC_CATEGORIES = [
  { value: "rules", label: "Rules" },
  { value: "commands", label: "Commands" },
  { value: "procedures", label: "Procedures" },
  { value: "guidelines", label: "Staff Guidelines" },
  { value: "general", label: "General" },
];

const CATEGORY_COLORS: Record<string, string> = {
  rules: "bg-red-500/20 text-red-400 border-red-500/30",
  commands: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  procedures: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  guidelines: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  general: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function DocsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editDoc, setEditDoc] = useState<Doc | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [success, setSuccess] = useState("");

  const fetchDocs = useCallback(async () => {
    const res = await fetch("/api/docs");
    if (res.ok) {
      const data = await res.json();
      setDocs(data.docs);
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
    if (session) fetchDocs();
  }, [session, fetchDocs]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this document?")) return;
    const res = await fetch("/api/docs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setSuccess("Document deleted");
      setSelectedDoc(null);
      fetchDocs();
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  if (!session) return null;

  const canEdit = session.role === "owner" || session.role === "admin";

  const filteredDocs =
    filterCategory === "all"
      ? docs
      : docs.filter((d) => d.category === filterCategory);

  if (selectedDoc) {
    return (
      <>
        <button
          onClick={() => setSelectedDoc(null)}
          className="mb-4 flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to docs
        </button>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 shadow-lg backdrop-blur-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CATEGORY_COLORS[selectedDoc.category] || CATEGORY_COLORS.general}`}>
                {DOC_CATEGORIES.find((c) => c.value === selectedDoc.category)?.label || "General"}
              </span>
              <h1 className="mt-2 text-2xl font-bold text-white">{selectedDoc.title}</h1>
              <p className="mt-1 text-xs text-slate-500">
                By {selectedDoc.author}
                {selectedDoc.updated_by && ` · Updated by ${selectedDoc.updated_by}`}
                {" · "}
                {new Date(selectedDoc.updated_at + "Z").toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <button
                  onClick={() => {
                    setEditDoc(selectedDoc);
                    setShowEditor(true);
                  }}
                  className="rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400 transition hover:bg-violet-500/20"
                >
                  Edit
                </button>
              )}
              {session.role === "owner" && (
                <button
                  onClick={() => handleDelete(selectedDoc.id)}
                  className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {selectedDoc.content}
            </div>
          </div>
        </div>

        {showEditor && (
          <DocEditorModal
            doc={editDoc}
            onClose={() => {
              setShowEditor(false);
              setEditDoc(null);
            }}
            onSuccess={() => {
              fetchDocs();
              setShowEditor(false);
              setEditDoc(null);
              setSuccess("Document saved");
              setTimeout(() => setSuccess(""), 3000);
              // refresh the selected doc view
              fetch("/api/docs").then((r) => r.json()).then((data) => {
                const updated = data.docs.find((d: Doc) => d.id === selectedDoc.id);
                if (updated) setSelectedDoc(updated);
              });
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Docs</h1>
          <p className="mt-1 text-sm text-slate-400">
            Internal staff documentation
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditDoc(null);
              setShowEditor(true);
            }}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500"
          >
            + New Document
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            filterCategory === "all"
              ? "bg-violet-600/20 text-violet-400 border border-violet-500/40"
              : "border border-slate-600/50 text-slate-400 hover:bg-slate-700/50"
          }`}
        >
          All
        </button>
        {DOC_CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilterCategory(c.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filterCategory === c.value
                ? "bg-violet-600/20 text-violet-400 border border-violet-500/40"
                : "border border-slate-600/50 text-slate-400 hover:bg-slate-700/50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filteredDocs.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <p className="text-slate-400">No documents yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className="group rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 text-left shadow-lg backdrop-blur-sm transition hover:border-violet-500/30 hover:bg-slate-800/80"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.general}`}>
                  {DOC_CATEGORIES.find((c) => c.value === doc.category)?.label || "General"}
                </span>
                {doc.status === "draft" && (
                  <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                    Draft
                  </span>
                )}
              </div>
              <h3 className="mt-2 font-semibold text-white group-hover:text-violet-300 transition">
                {doc.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                {doc.content.substring(0, 120)}
                {doc.content.length > 120 ? "..." : ""}
              </p>
              <p className="mt-3 text-[10px] text-slate-600">
                {doc.author}
                {" · "}
                {new Date(doc.updated_at + "Z").toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </button>
          ))}
        </div>
      )}

      {showEditor && (
        <DocEditorModal
          doc={editDoc}
          onClose={() => {
            setShowEditor(false);
            setEditDoc(null);
          }}
          onSuccess={() => {
            fetchDocs();
            setShowEditor(false);
            setEditDoc(null);
            setSuccess(editDoc ? "Document updated" : "Document created");
            setTimeout(() => setSuccess(""), 3000);
          }}
        />
      )}
    </>
  );
}

function DocEditorModal({
  doc,
  onClose,
  onSuccess,
}: {
  doc: Doc | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(doc?.title || "");
  const [content, setContent] = useState(doc?.content || "");
  const [category, setCategory] = useState(doc?.category || "general");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveDraft, setSaveDraft] = useState(false);

  const isEdit = !!doc;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const method = isEdit ? "PATCH" : "POST";
      const body = isEdit
        ? { id: doc.id, title, content, category, status: saveDraft ? "draft" : (doc.status === "draft" ? "published" : undefined) }
        : { title, content, category, status: saveDraft ? "draft" : "published" };

      const res = await fetch("/api/docs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          {isEdit ? "Edit Document" : "New Document"}
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
              placeholder="Document title"
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            >
              {DOC_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none font-mono text-sm"
              placeholder="Write your document content here..."
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
              {loading && !saveDraft ? "Saving..." : isEdit ? "Save & Publish" : "Create Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
