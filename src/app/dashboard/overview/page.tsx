"use client";

import { useEffect, useState, useCallback } from "react";

interface ServerStatus {
  online_players: number;
  max_players: number;
  tps: number;
  online_staff: string | null;
  staff_in_modmode: string | null;
  staff_vanished: string | null;
  frozen_players: string | null;
  panic_mode: number;
  chat_enabled: number;
  uptime_seconds: number;
  server_version: string | null;
  last_heartbeat: string;
}

interface DashboardStats {
  totalStaff: number;
  tasksOverdue: number;
  tasksTodo: number;
  tasksInProgress: number;
  tasksDone: number;
  upcomingEvents: number;
  draftUpdates: number;
  draftDocs: number;
  totalPunishments: number;
  activeBans: number;
  openReports: number;
  openCases: number;
  recentLogins: { performed_by: string; created_at: string }[];
  recentActivity: { action: string; target: string; performed_by: string; created_at: string }[];
  recentPluginEvents: { event_type: string; actor: string | null; target: string | null; reason: string | null; created_at: string }[];
  serverStatus: ServerStatus | null;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr + "Z");
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function parseJsonList(val: string | null): string[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "text-emerald-400",
  USER_CREATE: "text-blue-400",
  USER_DELETE: "text-red-400",
  ROLE_CHANGE: "text-amber-400",
  TASK_CREATE: "text-violet-400",
  TASK_UPDATE: "text-indigo-400",
  TASK_DELETE: "text-red-400",
  UPDATE_CREATE: "text-cyan-400",
  EVENT_CREATE: "text-pink-400",
  DOC_CREATE: "text-teal-400",
  PUNISHMENT: "text-red-400",
  REPORT: "text-amber-400",
  MODMODE_ENABLE: "text-violet-400",
  VANISH_ENABLE: "text-slate-400",
  STAFF_JOIN: "text-emerald-400",
  STAFF_LEAVE: "text-slate-500",
  FREEZE: "text-cyan-400",
  PANIC_ENABLE: "text-red-500",
};

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/plugin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-24 text-center text-slate-500">Failed to load dashboard data.</div>
    );
  }

  const ss = stats.serverStatus;
  const onlineStaff = parseJsonList(ss?.online_staff ?? null);
  const modmodeStaff = parseJsonList(ss?.staff_in_modmode ?? null);
  const vanishedStaff = parseJsonList(ss?.staff_vanished ?? null);
  const frozenPlayers = parseJsonList(ss?.frozen_players ?? null);
  const serverOnline = ss && ss.last_heartbeat && (Date.now() - new Date(ss.last_heartbeat + "Z").getTime()) < 120000;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Overview of your staff portal and server</p>
      </div>

      {/* Server Status Banner */}
      <div className={`mb-6 rounded-2xl border p-5 shadow-lg backdrop-blur-sm ${serverOnline ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${serverOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <div>
              <h2 className="font-semibold text-white">
                {serverOnline ? "Server Online" : "Server Offline"}
              </h2>
              {ss && (
                <p className="text-xs text-slate-400">
                  {ss.server_version || "Unknown version"}
                  {serverOnline && ` · Uptime: ${formatUptime(ss.uptime_seconds)}`}
                  {ss.last_heartbeat && ` · Last ping: ${timeAgo(ss.last_heartbeat)}`}
                </p>
              )}
              {!ss && <p className="text-xs text-slate-500">No heartbeat received yet. Configure the plugin to connect.</p>}
            </div>
          </div>
          {serverOnline && ss && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{ss.online_players}<span className="text-slate-500">/{ss.max_players}</span></p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Players</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${ss.tps >= 19 ? "text-emerald-400" : ss.tps >= 15 ? "text-amber-400" : "text-red-400"}`}>{ss.tps.toFixed(1)}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">TPS</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-violet-400">{onlineStaff.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Staff On</p>
              </div>
            </div>
          )}
        </div>

        {/* Server alerts */}
        {ss && (
          <div className="mt-3 flex flex-wrap gap-2">
            {ss.panic_mode === 1 && (
              <span className="rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-400 animate-pulse">🚨 Panic Mode</span>
            )}
            {ss.chat_enabled === 0 && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">Chat Disabled</span>
            )}
            {frozenPlayers.length > 0 && (
              <span className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-cyan-400">❄️ {frozenPlayers.length} Frozen</span>
            )}
            {modmodeStaff.length > 0 && (
              <span className="rounded-full border border-violet-500/40 bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-violet-400">🛡️ {modmodeStaff.length} in ModMode</span>
            )}
            {vanishedStaff.length > 0 && (
              <span className="rounded-full border border-slate-500/40 bg-slate-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-400">👻 {vanishedStaff.length} Vanished</span>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards Grid */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Staff Members" value={stats.totalStaff} icon="👥" color="violet" />
        <StatCard label="Tasks Overdue" value={stats.tasksOverdue} icon="⚠️" color={stats.tasksOverdue > 0 ? "red" : "emerald"} />
        <StatCard label="Upcoming Events" value={stats.upcomingEvents} icon="📅" color="blue" />
        <StatCard label="Open Reports" value={stats.openReports} icon="📋" color={stats.openReports > 0 ? "amber" : "emerald"} />
        <StatCard label="Active Bans" value={stats.activeBans} icon="🔨" color="red" />
        <StatCard label="Open Cases" value={stats.openCases} icon="📁" color={stats.openCases > 0 ? "amber" : "slate"} />
        <StatCard label="Draft Updates" value={stats.draftUpdates} icon="📝" color="amber" />
        <StatCard label="Total Punishments" value={stats.totalPunishments} icon="⚖️" color="slate" />
      </div>

      {/* Tasks Summary */}
      <div className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 shadow-lg backdrop-blur-sm">
        <h3 className="mb-3 font-semibold text-slate-100">Tasks Summary</h3>
        <div className="flex gap-4">
          <TaskBar label="Todo" count={stats.tasksTodo} total={stats.tasksTodo + stats.tasksInProgress + stats.tasksDone} color="bg-slate-500" />
          <TaskBar label="In Progress" count={stats.tasksInProgress} total={stats.tasksTodo + stats.tasksInProgress + stats.tasksDone} color="bg-amber-500" />
          <TaskBar label="Done" count={stats.tasksDone} total={stats.tasksTodo + stats.tasksInProgress + stats.tasksDone} color="bg-emerald-500" />
        </div>
      </div>

      {/* Two Column Feed */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Portal Activity */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 shadow-lg backdrop-blur-sm">
          <h3 className="mb-3 font-semibold text-slate-100">Recent Portal Activity</h3>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-700/20 px-3 py-2">
                  <span className={`mt-0.5 text-xs font-bold uppercase ${ACTION_COLORS[a.action] || "text-slate-400"}`}>
                    {a.action.replace(/_/g, " ")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-300 truncate">
                      <span className="text-white font-medium">{a.performed_by}</span>
                      {a.target && <> → <span className="text-slate-200">{a.target}</span></>}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-600">{timeAgo(a.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Server Events */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 shadow-lg backdrop-blur-sm">
          <h3 className="mb-3 font-semibold text-slate-100">Recent Server Events</h3>
          {stats.recentPluginEvents.length === 0 ? (
            <p className="text-sm text-slate-500">No server events yet. Connect the plugin to start receiving data.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentPluginEvents.map((e, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-700/20 px-3 py-2">
                  <span className={`mt-0.5 text-xs font-bold uppercase ${ACTION_COLORS[e.event_type] || "text-slate-400"}`}>
                    {e.event_type.replace(/_/g, " ")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-300 truncate">
                      {e.actor && <span className="text-white font-medium">{e.actor}</span>}
                      {e.target && <> → <span className="text-slate-200">{e.target}</span></>}
                      {e.reason && <> — <span className="text-slate-400">{e.reason}</span></>}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-600">{timeAgo(e.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Logins */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 shadow-lg backdrop-blur-sm">
          <h3 className="mb-3 font-semibold text-slate-100">Recent Logins</h3>
          {stats.recentLogins.length === 0 ? (
            <p className="text-sm text-slate-500">No logins recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {stats.recentLogins.map((l, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-slate-700/20 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-white">{l.performed_by}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{timeAgo(l.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Online Staff */}
        {serverOnline && onlineStaff.length > 0 && (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 shadow-lg backdrop-blur-sm">
            <h3 className="mb-3 font-semibold text-slate-100">Online Staff ({onlineStaff.length})</h3>
            <div className="flex flex-wrap gap-2">
              {onlineStaff.map((name) => (
                <div key={name} className="flex items-center gap-1.5 rounded-full border border-slate-600/50 bg-slate-700/50 px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-white">{name}</span>
                  {modmodeStaff.includes(name) && <span className="text-[9px] text-violet-400">MM</span>}
                  {vanishedStaff.includes(name) && <span className="text-[9px] text-slate-500">V</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    violet: "border-violet-500/30 bg-violet-500/5",
    red: "border-red-500/30 bg-red-500/5",
    blue: "border-blue-500/30 bg-blue-500/5",
    amber: "border-amber-500/30 bg-amber-500/5",
    emerald: "border-emerald-500/30 bg-emerald-500/5",
    slate: "border-slate-600/50 bg-slate-800/50",
  };
  const textMap: Record<string, string> = {
    violet: "text-violet-400",
    red: "text-red-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    slate: "text-slate-300",
  };
  return (
    <div className={`rounded-2xl border p-4 shadow-lg backdrop-blur-sm ${colorMap[color] || colorMap.slate}`}>
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        <span className={`text-2xl font-bold ${textMap[color] || textMap.slate}`}>{value}</span>
      </div>
      <p className="mt-1 text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}

function TaskBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex-1">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className="text-xs font-bold text-white">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-700">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
