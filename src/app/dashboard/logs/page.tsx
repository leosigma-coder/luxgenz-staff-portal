"use client";

import { useEffect, useState, useCallback } from "react";

interface AuditLog {
  id: number;
  action: string;
  target: string | null;
  performed_by: string;
  metadata: string | null;
  created_at: string;
}

interface Session {
  userId: number;
  role: "owner" | "admin" | "staff";
  username: string;
}

const ACTION_COLORS: Record<string, string> = {
  USER_CREATE: "bg-emerald-500/20 text-emerald-400",
  USER_DELETE: "bg-red-500/20 text-red-400",
  ROLE_CHANGE: "bg-amber-500/20 text-amber-400",
  PASSWORD_RESET: "bg-orange-500/20 text-orange-400",
  DOC_CREATE: "bg-blue-500/20 text-blue-400",
  DOC_EDIT: "bg-blue-500/20 text-blue-400",
  DOC_DELETE: "bg-red-500/20 text-red-400",
  DOC_PUBLISH: "bg-emerald-500/20 text-emerald-400",
  EVENT_CREATE: "bg-violet-500/20 text-violet-400",
  EVENT_DELETE: "bg-red-500/20 text-red-400",
  UPDATE_CREATE: "bg-cyan-500/20 text-cyan-400",
  UPDATE_DELETE: "bg-red-500/20 text-red-400",
  UPDATE_PUBLISH: "bg-emerald-500/20 text-emerald-400",
  TASK_CREATE: "bg-indigo-500/20 text-indigo-400",
  TASK_UPDATE: "bg-indigo-500/20 text-indigo-400",
  TASK_DELETE: "bg-red-500/20 text-red-400",
  LOGIN: "bg-slate-500/20 text-slate-400",
};

const ACTION_LABELS: Record<string, string> = {
  USER_CREATE: "User Created",
  USER_DELETE: "User Deleted",
  ROLE_CHANGE: "Role Changed",
  PASSWORD_RESET: "Password Reset",
  DOC_CREATE: "Doc Created",
  DOC_EDIT: "Doc Edited",
  DOC_DELETE: "Doc Deleted",
  DOC_PUBLISH: "Doc Published",
  EVENT_CREATE: "Event Created",
  EVENT_DELETE: "Event Deleted",
  UPDATE_CREATE: "Update Created",
  UPDATE_DELETE: "Update Deleted",
  UPDATE_PUBLISH: "Update Published",
  TASK_CREATE: "Task Created",
  TASK_UPDATE: "Task Updated",
  TASK_DELETE: "Task Deleted",
  LOGIN: "Login",
};

export default function LogsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [filterAction, setFilterAction] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterAction) params.set("action", filterAction);
    if (filterUser) params.set("user", filterUser);
    params.set("page", String(page));
    const res = await fetch(`/api/audit-logs?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      if (data.actions) setActions(data.actions);
      if (data.users) setUsers(data.users);
    }
  }, [filterAction, filterUser, page]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const d = await res.json();
        setSession(d.user);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (session) fetchLogs();
  }, [session, fetchLogs]);

  if (!session) return null;

  if (session.role === "staff") {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-12 text-center backdrop-blur-sm">
        <p className="text-slate-400">Admin access required to view audit logs.</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-400">
          {total} total log entries
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-500"
        >
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a] || a}
            </option>
          ))}
        </select>
        <select
          value={filterUser}
          onChange={(e) => { setFilterUser(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-500"
        >
          <option value="">All Users</option>
          {users.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        {(filterAction || filterUser) && (
          <button
            onClick={() => { setFilterAction(""); setFilterUser(""); setPage(1); }}
            className="rounded-lg border border-slate-600/50 px-3 py-2 text-xs text-slate-400 transition hover:bg-slate-700/50"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Log Table */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 shadow-lg backdrop-blur-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500">No audit logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-left">
                  <th className="px-4 py-3 font-medium text-slate-400">Action</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Target</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Performed By</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Details</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  let meta: Record<string, unknown> | null = null;
                  try {
                    if (log.metadata) meta = JSON.parse(log.metadata);
                  } catch { /* ignore */ }

                  return (
                    <tr key={log.id} className="border-b border-slate-800/50 transition hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ACTION_COLORS[log.action] || "bg-slate-500/20 text-slate-400"}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {log.target || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {log.performed_by}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                        {meta ? Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join(", ") : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at + "Z").toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-600/50 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-slate-700/50 disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-slate-600/50 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-slate-700/50 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
