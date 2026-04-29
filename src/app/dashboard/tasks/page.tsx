"use client";

import { useEffect, useState, useCallback } from "react";

interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assigned_to: number;
  assigned_username: string;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Session {
  userId: number;
  role: "owner" | "admin" | "staff";
  username: string;
}

interface UserOption {
  id: number;
  username: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  normal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  in_progress: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  done: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

export default function TasksPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [filter, setFilter] = useState<"all" | "mine" | "overdue">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState("");

  const fetchTasks = useCallback(async () => {
    const mine = filter === "mine" ? "?mine=true" : "";
    const res = await fetch(`/api/tasks${mine}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
    }
  }, [filter]);

  useEffect(() => {
    async function load() {
      const [sessRes, usersRes] = await Promise.all([
        fetch("/api/auth/session"),
        fetch("/api/users"),
      ]);
      if (sessRes.ok) {
        const d = await sessRes.json();
        setSession(d.user);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUsers(d.users.map((u: { id: number; username: string }) => ({ id: u.id, username: u.username })));
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (session) fetchTasks();
  }, [session, fetchTasks]);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: newStatus }),
    });
    fetchTasks();
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm("Delete this task?")) return;
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId }),
    });
    setSuccess("Task deleted");
    fetchTasks();
    setTimeout(() => setSuccess(""), 3000);
  };

  if (!session) return null;

  const canCreate = session.role !== "staff";
  const now = new Date().toISOString().split("T")[0];

  let filteredTasks = tasks;
  if (filter === "overdue") {
    filteredTasks = tasks.filter(
      (t) => t.due_date && t.due_date < now && t.status !== "done"
    );
  }
  if (statusFilter !== "all") {
    filteredTasks = filteredTasks.filter((t) => t.status === statusFilter);
  }

  const todoTasks = filteredTasks.filter((t) => t.status === "todo");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in_progress");
  const doneTasks = filteredTasks.filter((t) => t.status === "done");

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tasks</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage and track staff assignments
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500"
          >
            + New Task
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "mine", "overdue"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === f
                ? "bg-violet-600/20 text-violet-400 border border-violet-500/40"
                : "border border-slate-600/50 text-slate-400 hover:bg-slate-700/50"
            }`}
          >
            {f === "all" ? "All Tasks" : f === "mine" ? "My Tasks" : "Overdue"}
          </button>
        ))}
        <div className="h-6 w-px bg-slate-700/50 mx-1" />
        {["all", "todo", "in_progress", "done"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              statusFilter === s
                ? "bg-violet-600/20 text-violet-400 border border-violet-500/40"
                : "border border-slate-600/50 text-slate-400 hover:bg-slate-700/50"
            }`}
          >
            {s === "all" ? "All Status" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Task Columns */}
      <div className="grid gap-4 lg:grid-cols-3">
        <TaskColumn
          title="Todo"
          tasks={todoTasks}
          color="slate"
          session={session}
          canCreate={canCreate}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
        <TaskColumn
          title="In Progress"
          tasks={inProgressTasks}
          color="violet"
          session={session}
          canCreate={canCreate}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
        <TaskColumn
          title="Done"
          tasks={doneTasks}
          color="emerald"
          session={session}
          canCreate={canCreate}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </div>

      {showCreate && (
        <CreateTaskModal
          users={users}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            fetchTasks();
            setShowCreate(false);
            setSuccess("Task created");
            setTimeout(() => setSuccess(""), 3000);
          }}
        />
      )}
    </>
  );
}

function TaskColumn({
  title,
  tasks,
  color,
  session,
  canCreate,
  onStatusChange,
  onDelete,
}: {
  title: string;
  tasks: Task[];
  color: string;
  session: Session;
  canCreate: boolean;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
}) {
  const borderColor =
    color === "violet"
      ? "border-violet-500/30"
      : color === "emerald"
      ? "border-emerald-500/30"
      : "border-slate-600/50";

  const now = new Date().toISOString().split("T")[0];

  return (
    <div className={`rounded-2xl border ${borderColor} bg-slate-800/50 p-4 backdrop-blur-sm`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
        <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-500">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2">
        {tasks.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-600">No tasks</p>
        )}
        {tasks.map((task) => {
          const isOverdue = task.due_date && task.due_date < now && task.status !== "done";
          return (
            <div
              key={task.id}
              className={`rounded-xl border border-slate-700/50 bg-slate-800/80 p-3 transition hover:border-slate-600/50 ${
                isOverdue ? "ring-1 ring-red-500/30" : ""
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-white">{task.title}</h3>
                <span
                  className={`shrink-0 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                    PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal
                  }`}
                >
                  {task.priority}
                </span>
              </div>
              {task.description && (
                <p className="mb-2 text-xs text-slate-500 line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="mb-2 flex items-center gap-2 text-[10px] text-slate-500">
                <span>Assigned to <span className="text-slate-400">{task.assigned_username}</span></span>
                {task.due_date && (
                  <>
                    <span>·</span>
                    <span className={isOverdue ? "text-red-400 font-medium" : ""}>
                      Due {task.due_date}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {task.status !== "todo" && (
                  <button
                    onClick={() =>
                      onStatusChange(
                        task.id,
                        task.status === "done" ? "in_progress" : "todo"
                      )
                    }
                    className="rounded-md border border-slate-600/50 px-2 py-0.5 text-[10px] text-slate-400 transition hover:bg-slate-700/50"
                  >
                    ← {task.status === "done" ? "In Progress" : "Todo"}
                  </button>
                )}
                {task.status !== "done" && (
                  <button
                    onClick={() =>
                      onStatusChange(
                        task.id,
                        task.status === "todo" ? "in_progress" : "done"
                      )
                    }
                    className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400 transition hover:bg-violet-500/20"
                  >
                    {task.status === "todo" ? "Start →" : "Done ✓"}
                  </button>
                )}
                {canCreate && (
                  <button
                    onClick={() => onDelete(task.id)}
                    className="ml-auto rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400 transition hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreateTaskModal({
  users,
  onClose,
  onSuccess,
}: {
  users: UserOption[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [assignedTo, setAssignedTo] = useState<number>(users[0]?.id || 0);
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          priority,
          assignedTo,
          dueDate: dueDate || null,
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
        <h2 className="mb-4 text-xl font-semibold text-slate-100">New Task</h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Task title"
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
              placeholder="Optional description"
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Assign To</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
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
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
