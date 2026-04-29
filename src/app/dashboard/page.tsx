"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface StaffRoleInfo {
  value: string;
  label: string;
  level: string;
  color: string;
}

const STAFF_ROLES: StaffRoleInfo[] = [
  { value: "owner", label: "Owner", level: "owner", color: "amber" },
  { value: "executive", label: "Executive", level: "admin", color: "purple" },
  { value: "management", label: "Management", level: "admin", color: "purple" },
  { value: "staff_management", label: "Staff Management", level: "admin", color: "blue" },
  { value: "developer", label: "Developer", level: "admin", color: "red" },
  { value: "administrator", label: "Administrator", level: "admin", color: "red" },
  { value: "builder", label: "Builder", level: "staff", color: "pink" },
  { value: "sr_mod", label: "Sr Mod", level: "staff", color: "cyan" },
  { value: "mod", label: "Mod", level: "staff", color: "cyan" },
  { value: "jr_mod", label: "Jr Mod", level: "staff", color: "teal" },
  { value: "helper", label: "Helper", level: "staff", color: "green" },
];

function getRoleInfo(staffRole: string): StaffRoleInfo {
  return STAFF_ROLES.find((r) => r.value === staffRole) || STAFF_ROLES[STAFF_ROLES.length - 1];
}

interface User {
  id: number;
  username: string;
  role: "owner" | "admin" | "staff";
  staff_role: string;
  last_password_reset: string | null;
}

interface Session {
  userId: number;
  username: string;
  role: "owner" | "admin" | "staff";
  staffRole: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="ml-1.5 inline-flex items-center rounded p-0.5 text-slate-500 transition hover:text-violet-400"
      title="Copy"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      )}
    </button>
  );
}

export default function AccountsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
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
    if (session) fetchUsers();
  }, [session, fetchUsers]);

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    setError("");
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setSuccess("Account deleted successfully");
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  if (!session) return null;

  const canCreateAccounts = session.role === "owner" || session.role === "admin";

  const roleBadge = (staffRole: string) => {
    const info = getRoleInfo(staffRole);
    const colorMap: Record<string, string> = {
      amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      red: "bg-red-500/20 text-red-400 border-red-500/30",
      pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      teal: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      green: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorMap[info.color] || colorMap.green}`}
      >
        {info.label}
      </span>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Accounts</h1>
          <p className="mt-1 text-sm text-slate-400">
            {users.length} account{users.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        {canCreateAccounts && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500"
          >
            + Create Account
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 text-left text-sm text-slate-400">
                <th className="px-6 py-3 font-medium">Username</th>
                <th className="px-6 py-3 font-medium">Staff Role</th>
                {session.role === "owner" && (
                  <th className="px-6 py-3 font-medium">Last PW Reset</th>
                )}
                {session.role === "owner" && (
                  <th className="px-6 py-3 font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="transition hover:bg-slate-700/20"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Link href={`/dashboard/users/${user.id}`} className="font-medium text-white transition hover:text-violet-400">
                        {user.username}
                      </Link>
                      <CopyButton text={user.username} />
                    </div>
                  </td>
                  <td className="px-6 py-4">{roleBadge(user.staff_role)}</td>
                  {session.role === "owner" && (
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {user.last_password_reset
                        ? new Date(user.last_password_reset + "Z").toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Never"}
                    </td>
                  )}
                  {session.role === "owner" && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {user.role !== "owner" && (
                          <>
                            <button
                              onClick={() => setShowRoleModal(user)}
                              className="rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400 transition hover:bg-violet-500/20"
                            >
                              Change Role
                            </button>
                            <button
                              onClick={() => setShowResetModal(user)}
                              className="rounded-md border border-slate-600/50 bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-600 hover:text-white"
                            >
                              Reset PW
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <CreateAccountModal
          sessionRole={session.role}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(msg) => {
            fetchUsers();
            setShowCreateModal(false);
            setSuccess(msg || "Account created successfully");
            setTimeout(() => setSuccess(""), 5000);
          }}
        />
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <ResetPasswordModal
          user={showResetModal}
          onClose={() => setShowResetModal(null)}
          onSuccess={(msg) => {
            fetchUsers();
            setShowResetModal(null);
            setSuccess(msg || "Password reset successfully");
            setTimeout(() => setSuccess(""), 5000);
          }}
        />
      )}

      {/* Change Role Modal */}
      {showRoleModal && (
        <ChangeRoleModal
          user={showRoleModal}
          onClose={() => setShowRoleModal(null)}
          onSuccess={() => {
            fetchUsers();
            setShowRoleModal(null);
            setSuccess("Role updated successfully");
            setTimeout(() => setSuccess(""), 3000);
          }}
        />
      )}
    </>
  );
}

function CreateAccountModal({
  sessionRole,
  onClose,
  onSuccess,
}: {
  sessionRole: string;
  onClose: () => void;
  onSuccess: (msg?: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [useGenerated, setUseGenerated] = useState(true);
  const [staffRole, setStaffRole] = useState("helper");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const availableRoles = STAFF_ROLES.filter((r) => {
    if (r.value === "owner") return false;
    if (sessionRole !== "owner" && r.level === "admin") return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password: useGenerated ? undefined : password,
          staffRole,
          useGenerated,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      if (data.tempPassword) {
        setCreatedPassword(data.tempPassword);
      } else {
        onSuccess();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (createdPassword) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl">
          <h2 className="mb-2 text-xl font-semibold text-emerald-400">
            Account Created
          </h2>
          <p className="mb-4 text-sm text-slate-400">
            Copy this temporary password now. It will not be shown again.
          </p>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-3">
            <code className="flex-1 font-mono text-sm text-white">{createdPassword}</code>
            <CopyButton text={createdPassword} />
          </div>
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
            This password cannot be recovered after closing this dialog. The user should change it on first login.
          </div>
          <button
            onClick={() => onSuccess("Account created — password copied")}
            className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Create Account
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Enter username"
              required
            />
          </div>

          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => setUseGenerated(!useGenerated)}
                className="text-xs text-violet-400 hover:text-violet-300 transition"
              >
                {useGenerated ? "Set manually" : "Auto-generate"}
              </button>
            </div>
            {useGenerated ? (
              <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 px-4 py-2.5 text-sm text-slate-400">
                A secure password will be generated automatically
              </div>
            ) : (
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                placeholder="Enter password"
                required={!useGenerated}
              />
            )}
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Staff Role
            </label>
            <select
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value)}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            >
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} ({r.level})
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
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User;
  onClose: () => void;
  onSuccess: (msg?: string) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [useGenerated, setUseGenerated] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          newPassword: useGenerated ? undefined : newPassword,
          generatePassword: useGenerated,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      if (data.tempPassword) {
        setGeneratedPassword(data.tempPassword);
      } else {
        onSuccess();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (generatedPassword) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl">
          <h2 className="mb-2 text-xl font-semibold text-emerald-400">
            Password Reset
          </h2>
          <p className="mb-4 text-sm text-slate-400">
            New password for <span className="text-white font-medium">{user.username}</span>. Copy it now.
          </p>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-3">
            <code className="flex-1 font-mono text-sm text-white">{generatedPassword}</code>
            <CopyButton text={generatedPassword} />
          </div>
          <button
            onClick={() => onSuccess("Password reset — new password copied")}
            className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Reset Password for{" "}
          <span className="text-violet-400">{user.username}</span>
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">New Password</label>
              <button
                type="button"
                onClick={() => setUseGenerated(!useGenerated)}
                className="text-xs text-violet-400 hover:text-violet-300 transition"
              >
                {useGenerated ? "Set manually" : "Auto-generate"}
              </button>
            </div>
            {useGenerated ? (
              <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 px-4 py-2.5 text-sm text-slate-400">
                A secure password will be generated automatically
              </div>
            ) : (
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                placeholder="Enter new password"
                required={!useGenerated}
              />
            )}
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
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangeRoleModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [staffRole, setStaffRole] = useState(user.staff_role);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const availableRoles = STAFF_ROLES.filter((r) => r.value !== "owner");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, staffRole }),
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

  const currentInfo = getRoleInfo(user.staff_role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl">
        <h2 className="mb-2 text-xl font-semibold text-slate-100">
          Change Role for{" "}
          <span className="text-violet-400">{user.username}</span>
        </h2>
        <p className="mb-4 text-sm text-slate-400">
          Current role: <span className="text-white">{currentInfo.label}</span>
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              New Role
            </label>
            <div className="space-y-1 max-h-64 overflow-y-auto rounded-lg border border-slate-600/50 bg-slate-700/30 p-2">
              {availableRoles.map((r) => {
                const colorMap: Record<string, string> = {
                  purple: "text-purple-400",
                  blue: "text-blue-400",
                  red: "text-red-400",
                  pink: "text-pink-400",
                  cyan: "text-cyan-400",
                  teal: "text-teal-400",
                  green: "text-emerald-400",
                };
                const isSelected = staffRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setStaffRole(r.value)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                      isSelected
                        ? "bg-violet-600/20 border border-violet-500/40"
                        : "hover:bg-slate-600/30 border border-transparent"
                    }`}
                  >
                    <span className={`font-medium ${colorMap[r.color] || "text-white"}`}>
                      {r.label}
                    </span>
                    <span className="text-xs text-slate-500 uppercase">
                      {r.level}
                    </span>
                  </button>
                );
              })}
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
              disabled={loading || staffRole === user.staff_role}
              className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
