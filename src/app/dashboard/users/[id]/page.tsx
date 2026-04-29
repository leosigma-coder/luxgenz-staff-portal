"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  username: string;
  role: string;
  staff_role: string;
  created_by: string | null;
  created_at: string;
  last_password_reset: string | null;
  last_login: string | null;
  bio: string | null;
}

interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
}

interface RecentTask {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
}

interface RecentActivity {
  id: number;
  action: string;
  target: string | null;
  created_at: string;
}

interface Session {
  userId: number;
  role: "owner" | "admin" | "staff";
  username: string;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  executive: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  management: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  staff_management: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  developer: "bg-red-500/20 text-red-400 border-red-500/30",
  administrator: "bg-red-500/20 text-red-400 border-red-500/30",
  builder: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  sr_mod: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  mod: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  jr_mod: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  helper: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  executive: "Executive",
  management: "Management",
  staff_management: "Staff Management",
  developer: "Developer",
  administrator: "Administrator",
  builder: "Builder",
  sr_mod: "Sr Mod",
  mod: "Mod",
  jr_mod: "Jr Mod",
  helper: "Helper",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "text-slate-400",
  in_progress: "text-violet-400",
  done: "text-emerald-400",
};

const ACTION_LABELS: Record<string, string> = {
  USER_CREATE: "Created user",
  USER_DELETE: "Deleted user",
  ROLE_CHANGE: "Changed role",
  PASSWORD_RESET: "Reset password",
  DOC_CREATE: "Created doc",
  DOC_EDIT: "Edited doc",
  DOC_DELETE: "Deleted doc",
  DOC_PUBLISH: "Published doc",
  EVENT_CREATE: "Created event",
  EVENT_DELETE: "Deleted event",
  UPDATE_CREATE: "Posted update",
  UPDATE_DELETE: "Deleted update",
  UPDATE_PUBLISH: "Published update",
  TASK_CREATE: "Created task",
  TASK_UPDATE: "Updated task",
  TASK_DELETE: "Deleted task",
  LOGIN: "Logged in",
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [eventsAttended, setEventsAttended] = useState(0);
  const [activityCount, setActivityCount] = useState(0);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sessRes = await fetch("/api/auth/session");
      if (!sessRes.ok) return;
      const sessData = await sessRes.json();
      setSession(sessData.user);

      const profileRes = await fetch(`/api/users/${params.id}`);
      if (!profileRes.ok) {
        setLoading(false);
        return;
      }
      const data = await profileRes.json();
      setUser(data.user);
      setTaskStats(data.taskStats);
      setEventsAttended(data.eventsAttended);
      setActivityCount(data.activityCount);
      setRecentTasks(data.recentTasks);
      setRecentActivity(data.recentActivity);
      setBio(data.user.bio || "");
      setLoading(false);
    }
    load();
  }, [params.id]);

  const saveBio = async () => {
    await fetch(`/api/users/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio }),
    });
    setUser((prev) => (prev ? { ...prev, bio } : null));
    setEditingBio(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || !session) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-12 text-center backdrop-blur-sm">
        <p className="text-slate-400">User not found.</p>
      </div>
    );
  }

  const canEditBio = session.role !== "staff" || session.userId === user.id;
  const completionRate = taskStats && taskStats.total > 0
    ? Math.round((taskStats.done / taskStats.total) * 100)
    : 0;

  return (
    <>
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back
      </button>

      {/* Profile Header */}
      <div className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl font-bold text-white shadow-lg">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.username}</h1>
              <span className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[user.staff_role] || ROLE_COLORS.helper}`}>
                {ROLE_LABELS[user.staff_role] || user.staff_role}
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            <p>Joined {new Date(user.created_at + "Z").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
            {user.last_login && (
              <p>Last login {new Date(user.last_login + "Z").toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            )}
            {user.created_by && <p>Created by {user.created_by}</p>}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4 border-t border-slate-700/50 pt-4">
          {editingBio ? (
            <div className="flex gap-2">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="flex-1 rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none transition focus:border-violet-500 resize-none"
                placeholder="Write a short bio or notes..."
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={saveBio}
                  className="rounded-md bg-violet-600 px-3 py-1 text-xs text-white transition hover:bg-violet-500"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditingBio(false); setBio(user.bio || ""); }}
                  className="rounded-md border border-slate-600/50 px-3 py-1 text-xs text-slate-400 transition hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-slate-400">
                {user.bio || <span className="italic text-slate-600">No bio set.</span>}
              </p>
              {canEditBio && (
                <button
                  onClick={() => setEditingBio(true)}
                  className="shrink-0 text-xs text-violet-400 transition hover:text-violet-300"
                >
                  Edit
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Tasks" value={taskStats?.total || 0} />
        <StatCard label="Tasks Done" value={taskStats?.done || 0} sub={`${completionRate}%`} />
        <StatCard label="Events Attending" value={eventsAttended} />
        <StatCard label="Activity Log" value={activityCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Recent Tasks</h2>
          {recentTasks.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-600">No tasks assigned</p>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/80 px-3 py-2">
                  <div>
                    <p className="text-sm text-white">{t.title}</p>
                    <p className="text-[10px] text-slate-500">
                      {t.due_date ? `Due ${t.due_date}` : "No due date"}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${STATUS_COLORS[t.status] || "text-slate-400"}`}>
                    {t.status === "in_progress" ? "In Progress" : t.status === "done" ? "Done" : "Todo"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-600">No activity recorded</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/80 px-3 py-2">
                  <p className="text-xs text-slate-400">
                    {ACTION_LABELS[a.action] || a.action}
                    {a.target && <span className="text-slate-500"> · {a.target}</span>}
                  </p>
                  <span className="shrink-0 text-[10px] text-slate-600">
                    {new Date(a.created_at + "Z").toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 backdrop-blur-sm">
      <p className="text-2xl font-bold text-white">
        {value}
        {sub && <span className="ml-1 text-sm font-normal text-slate-500">{sub}</span>}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}
